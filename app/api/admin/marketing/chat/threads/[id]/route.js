import { getSupabaseAdmin } from "@/lib/supabase";
import { getThread, loadMessages, toDisplay } from "@/lib/marketing/chat/history";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(_request, { params }) {
  if (!UUID.test(params.id)) return Response.json({ error: "Id inválido" }, { status: 400 });
  try {
    const sb = getSupabaseAdmin();
    const thread = await getThread(sb, params.id);
    if (!thread) return Response.json({ error: "Conversación no encontrada" }, { status: 404 });
    const rows = await loadMessages(sb, params.id);
    const pending = thread.pending
      ? thread.pending.calls.map(({ id, name, summary, items }) => ({ id, name, summary, items }))
      : null;
    return Response.json({
      thread: { id: thread.id, title: thread.title, updated_at: thread.updated_at },
      items: toDisplay(rows, thread.pending),
      pending,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// Renombrar.
export async function PATCH(request, { params }) {
  if (!UUID.test(params.id)) return Response.json({ error: "Id inválido" }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 120) : "";
  if (!title) return Response.json({ error: "Falta el título" }, { status: 400 });
  const { data, error } = await getSupabaseAdmin()
    .from("mk_chat_threads")
    .update({ title })
    .eq("id", params.id)
    .select("id, title")
    .maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: "Conversación no encontrada" }, { status: 404 });
  return Response.json({ thread: data });
}

// Borrar (los mensajes se borran en cascada).
export async function DELETE(_request, { params }) {
  if (!UUID.test(params.id)) return Response.json({ error: "Id inválido" }, { status: 400 });
  const { error } = await getSupabaseAdmin().from("mk_chat_threads").delete().eq("id", params.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
