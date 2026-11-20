import { getSupabaseAdmin } from "@/lib/supabase";
import { METRIC_NETWORKS } from "@/lib/marketing/metrics/config";

export const dynamic = "force-dynamic";

// Meta mensual de seguidores: { network, month: "YYYY-MM", target_followers }.
// Sin target (o 0) se borra la meta.
export async function PUT(request) {
  try {
    const { network, month, target_followers } = await request.json();
    if (!METRIC_NETWORKS.includes(network)) return Response.json({ error: "Red inválida" }, { status: 400 });
    if (!/^\d{4}-\d{2}$/.test(String(month || ""))) return Response.json({ error: "Mes inválido" }, { status: 400 });
    const target = Number(target_followers);
    const supabase = getSupabaseAdmin();
    const key = { network, month: `${month}-01` };

    if (!target || target < 0) {
      const { error } = await supabase.from("mk_metrics_goals").delete().match(key);
      if (error) throw new Error(error.message);
      return Response.json({ ok: true, deleted: true });
    }
    if (!Number.isInteger(target) || target > 100_000_000) {
      return Response.json({ error: "La meta tiene que ser un número entero" }, { status: 400 });
    }
    const { error } = await supabase
      .from("mk_metrics_goals")
      .upsert({ ...key, target_followers: target, updated_at: new Date().toISOString() }, { onConflict: "network,month" });
    if (error) throw new Error(error.message);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
