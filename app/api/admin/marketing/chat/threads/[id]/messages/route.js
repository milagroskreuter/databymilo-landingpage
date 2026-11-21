import { getSupabaseAdmin } from "@/lib/supabase";
import {
  appendMessage,
  danglingToolResults,
  getThread,
  loadMessages,
  touchThread,
  DEFAULT_TITLE,
} from "@/lib/marketing/chat/history";
import { cancelledResult, isConfigured, runAgent, MISSING_KEY_MESSAGE } from "@/lib/marketing/chat/agent";
import { dateContextText } from "@/lib/marketing/chat/prompt";
import { ndjsonResponse } from "@/lib/marketing/chat/stream";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // una respuesta con varias herramientas puede tardar

const UUID = /^[0-9a-f-]{36}$/i;

// Manda un mensaje de la usuaria y devuelve la respuesta de Claude en streaming (NDJSON).
export async function POST(request, { params }) {
  if (!UUID.test(params.id)) return Response.json({ error: "Id inválido" }, { status: 400 });
  if (!isConfigured()) return Response.json({ error: MISSING_KEY_MESSAGE }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return Response.json({ error: "El mensaje está vacío" }, { status: 400 });
  if (text.length > 8000) return Response.json({ error: "El mensaje es demasiado largo (máximo 8000 caracteres)" }, { status: 400 });

  const sb = getSupabaseAdmin();
  const thread = await getThread(sb, params.id);
  if (!thread) return Response.json({ error: "Conversación no encontrada" }, { status: 404 });

  let rows = await loadMessages(sb, params.id);

  // Un mensaje de sistema tiene que ir seguido de una respuesta del asistente. Si el turno
  // anterior falló antes de que Claude respondiera, se saca ese mensaje de sistema (nada lo
  // usó todavía) y se vuelve a agregar más abajo, después del mensaje nuevo.
  const lastAssistant = rows.map((r) => r.role).lastIndexOf("assistant");
  const orphanSystem = rows.filter((r, i) => i > lastAssistant && r.role === "system").map((r) => r.id);
  if (orphanSystem.length) {
    const { error } = await sb.from("mk_chat_messages").delete().in("id", orphanSystem);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    rows = rows.filter((r) => !orphanSystem.includes(r.id));
  }

  // Si había acciones esperando confirmación y la usuaria escribió otra cosa, se cancelan.
  let prefix = [];
  if (thread.pending) {
    prefix = [...(thread.pending.results || []), ...thread.pending.calls.map((c) => cancelledResult(c.id))];
    await touchThread(sb, params.id, { pending: null });
  } else {
    prefix = danglingToolResults(rows, "La ejecución se interrumpió antes de terminar esta acción. No se aplicó.") || [];
  }
  await appendMessage(sb, params.id, "user", [...prefix, { type: "text", text }]);

  // La fecha va como mensaje de sistema dentro de la conversación (no en el system prompt),
  // y solo cuando cambia el día: así no se rompe el caché del prompt.
  const today = dateContextText();
  const lastSystem = [...rows].reverse().find((r) => r.role === "system");
  if (!lastSystem || lastSystem.content !== today) await appendMessage(sb, params.id, "system", today);

  const isFirst = !rows.some((r) => r.role === "user" && Array.isArray(r.content) && r.content.some((b) => b.type === "text"));
  if (isFirst && thread.title === DEFAULT_TITLE) {
    const title = text.replace(/\s+/g, " ").slice(0, 60) + (text.length > 60 ? "…" : "");
    await touchThread(sb, params.id, { title });
  }

  return ndjsonResponse((emit) => runAgent({ sb, threadId: params.id, emit }));
}
