import { getSupabaseAdmin } from "@/lib/supabase";
import { sendWeeklySummary } from "@/lib/marketing/metrics/weekly";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Corre los lunes (ver vercel.json): manda el resumen de la semana pasada por
// mail y deja un aviso en la campana. Nunca lo manda dos veces la misma semana.

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
    const result = await sendWeeklySummary(getSupabaseAdmin());
    return Response.json(result);
  } catch (err) {
    console.error("marketing-weekly cron error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
