import { getSupabaseAdmin } from "@/lib/supabase";
import { listThreads, DEFAULT_TITLE } from "@/lib/marketing/chat/history";
import { isConfigured, MISSING_KEY_MESSAGE } from "@/lib/marketing/chat/agent";

export const dynamic = "force-dynamic";

// Lista de conversaciones + si la API de Claude está configurada.
export async function GET() {
  try {
    const threads = await listThreads(getSupabaseAdmin());
    return Response.json({
      threads,
      configured: isConfigured(),
      configMessage: isConfigured() ? null : MISSING_KEY_MESSAGE,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const title = typeof body.title === "string" && body.title.trim() ? body.title.trim().slice(0, 120) : DEFAULT_TITLE;
    const { data, error } = await getSupabaseAdmin()
      .from("mk_chat_threads")
      .insert({ title })
      .select("id, title, updated_at")
      .single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ thread: data }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
