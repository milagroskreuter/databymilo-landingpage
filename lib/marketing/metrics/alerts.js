// Avisos de problemas de métricas sin repetirlos todos los días.
// Un problema abierto vive en mk_metrics_alerts: se avisa cuando aparece y, si
// sigue abierto, otra vez cada REMIND_DAYS. Al resolverse, se borra la fila.
import { notifyAdmin } from "@/lib/notify";
import { networkLabel } from "@/lib/marketing/constants";

const REMIND_DAYS = 7;

export async function openIssue(supabase, { network, kind, message }) {
  const key = `${network}:${kind}`;
  try {
    const { data: row } = await supabase.from("mk_metrics_alerts").select("*").eq("key", key).maybeSingle();
    const now = new Date();
    const due =
      !row?.last_notified_at ||
      now.getTime() - new Date(row.last_notified_at).getTime() > REMIND_DAYS * 24 * 60 * 60 * 1000;

    await supabase.from("mk_metrics_alerts").upsert(
      {
        key,
        network,
        kind,
        message,
        first_seen_at: row?.first_seen_at || now.toISOString(),
        last_notified_at: due ? now.toISOString() : row.last_notified_at,
      },
      { onConflict: "key" }
    );

    if (due) {
      const label = networkLabel(network);
      await notifyAdmin({
        type: "metrics_issue",
        title: kind === "token" ? `${label}: hay que revisar la conexión` : `${label}: no se pudieron leer las métricas`,
        body: `${message}\n\nRevisalo en Marketing → Métricas de redes.`,
        metadata: { network, kind, link: "/administracion-general/marketing/metricas" },
      });
    }
  } catch (err) {
    console.error("metrics openIssue:", err.message);
  }
}

export async function resolveIssue(supabase, network, kind) {
  try {
    await supabase.from("mk_metrics_alerts").delete().eq("key", `${network}:${kind}`);
  } catch (err) {
    console.error("metrics resolveIssue:", err.message);
  }
}
