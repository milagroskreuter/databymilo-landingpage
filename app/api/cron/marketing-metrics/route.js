import { getSupabaseAdmin } from "@/lib/supabase";
import { runSync } from "@/lib/marketing/metrics/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Corre una vez por día (ver vercel.json): renueva los tokens que están por
// vencer, guarda los seguidores del día y actualiza las métricas de las
// publicaciones recientes de Instagram, Threads y YouTube. Si algo falla, avisa
// una vez (y cada 7 días si sigue): ver lib/marketing/metrics/alerts.js.

function authorized(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) return request.headers.get("authorization") === `Bearer ${secret}`;
  // Sin CRON_SECRET se acepta solo la llamada del cron de Vercel.
  return (request.headers.get("user-agent") || "").startsWith("vercel-cron");
}

export async function GET(request) {
  if (!authorized(request)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const result = await runSync(getSupabaseAdmin());
    return Response.json({ ok: true, ...result });
  } catch (err) {
    console.error("marketing-metrics cron error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
