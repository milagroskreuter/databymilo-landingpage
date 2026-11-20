import { getSupabaseAdmin } from "@/lib/supabase";
import { resolveChannel } from "@/lib/marketing/metrics/youtube";
import { saveAccount } from "@/lib/marketing/metrics/store";
import { runSync } from "@/lib/marketing/metrics/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Guarda el canal de YouTube ({ channel: "UC..." | "@usuario" | link }) y lo lee.
export async function POST(request) {
  if (!process.env.YOUTUBE_API_KEY) {
    return Response.json({ error: "Falta configurar YOUTUBE_API_KEY en Vercel" }, { status: 400 });
  }
  try {
    const { channel } = await request.json();
    const ch = await resolveChannel(channel);
    const supabase = getSupabaseAdmin();
    await saveAccount(
      supabase,
      "youtube",
      { external_id: ch.id, handle: ch.snippet?.customUrl || ch.snippet?.title, connected_at: new Date().toISOString() },
      { title: ch.snippet?.title }
    );
    const sync = await runSync(supabase, { networks: ["youtube"], notify: false });
    return Response.json({ ok: true, channel: { id: ch.id, title: ch.snippet?.title }, sync });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}
