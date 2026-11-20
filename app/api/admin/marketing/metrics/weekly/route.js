import { getSupabaseAdmin } from "@/lib/supabase";
import { buildWeeklySummary, weeklyEmailHtml } from "@/lib/marketing/metrics/weekly";

export const dynamic = "force-dynamic";

// Vista previa del resumen semanal (el mismo HTML que llega por mail), sin enviarlo.
export async function GET() {
  try {
    const summary = await buildWeeklySummary(getSupabaseAdmin());
    const { html } = weeklyEmailHtml(summary);
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
