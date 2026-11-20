import { getSupabaseAdmin } from "@/lib/supabase";
import { METRIC_NETWORKS } from "@/lib/marketing/metrics/config";

export const dynamic = "force-dynamic";

// Desconecta una red: borra el token (y el canal en YouTube). Los datos ya
// guardados (seguidores, publicaciones) se conservan.
export async function POST(request) {
  try {
    const { network } = await request.json();
    if (!METRIC_NETWORKS.includes(network) || network === "linkedin") {
      return Response.json({ error: "Red inválida" }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("mk_social_accounts")
      .update({
        access_token: null,
        token_expires_at: null,
        ...(network === "youtube" ? { external_id: null } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("network", network);
    if (error) throw new Error(error.message);
    await supabase.from("mk_metrics_alerts").delete().eq("network", network);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
