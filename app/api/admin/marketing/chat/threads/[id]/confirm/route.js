import { getSupabaseAdmin } from "@/lib/supabase";
import { appendMessage, getThread } from "@/lib/marketing/chat/history";
import { cancelledResult, isConfigured, runAgent, MISSING_KEY_MESSAGE } from "@/lib/marketing/chat/agent";
import { executeTool } from "@/lib/marketing/chat/tools";
import { ndjsonResponse } from "@/lib/marketing/chat/stream";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const UUID = /^[0-9a-f-]{36}$/i;

// La usuaria confirma o cancela las acciones pendientes y Claude sigue (NDJSON).
// body: { approve: true | false } o { approve: { "<tool_use_id>": true, ... } }
export async function POST(request, { params }) {
  if (!UUID.test(params.id)) return Response.json({ error: "Id inválido" }, { status: 400 });
  if (!isConfigured()) return Response.json({ error: MISSING_KEY_MESSAGE }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const approve = body.approve;
  if (typeof approve !== "boolean" && (typeof approve !== "object" || approve === null)) {
    return Response.json({ error: "Falta indicar qué se confirma" }, { status: 400 });
  }

  const sb = getSupabaseAdmin();
  const thread = await getThread(sb, params.id);
  if (!thread) return Response.json({ error: "Conversación no encontrada" }, { status: 404 });
  if (!thread.pending) return Response.json({ error: "No hay acciones pendientes" }, { status: 409 });

  // Se libera el pendiente antes de ejecutar, para que un doble clic no aplique dos veces.
  const { data: claimed, error } = await sb
    .from("mk_chat_threads")
    .update({ pending: null, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .not("pending", "is", null)
    .select("id");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!claimed?.length) return Response.json({ error: "Estas acciones ya se resolvieron" }, { status: 409 });

  const { calls, results: done = [] } = thread.pending;

  return ndjsonResponse(async (emit) => {
    const results = [...done];
    for (const call of calls) {
      const ok = approve === true || (typeof approve === "object" && approve[call.id] === true);
      if (!ok) {
        results.push(cancelledResult(call.id));
        emit({ type: "tool_done", id: call.id, status: "declined" });
        continue;
      }
      const result = await executeTool(sb, call.id, call.name, call.input);
      emit({ type: "tool_done", id: call.id, status: result.is_error ? "error" : "ok" });
      results.push(result);
    }
    await appendMessage(sb, params.id, "user", results);
    await runAgent({ sb, threadId: params.id, emit });
  });
}
