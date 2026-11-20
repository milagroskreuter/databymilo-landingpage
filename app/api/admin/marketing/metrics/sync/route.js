import { getSupabaseAdmin } from "@/lib/supabase";
import { runSync } from "@/lib/marketing/metrics/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// "Actualizar ahora": lee una red ({ network }) o todas. No manda avisos:
// el error se muestra en pantalla.
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const networks = body?.network ? [String(body.network)] : undefined;
    const result = await runSync(getSupabaseAdmin(), { networks, notify: false });
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
