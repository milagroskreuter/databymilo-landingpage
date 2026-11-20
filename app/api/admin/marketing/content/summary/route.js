import { getSupabaseAdmin } from "@/lib/supabase";
import { CONTENT_TABLE } from "@/lib/marketing/content";
import { PILLARS_TABLE, pillarBalance } from "@/lib/marketing/content/pillars";
import { arDateKey, arDayStartISO, DAY_MS } from "@/lib/marketing/content/dates";

export const dynamic = "force-dynamic";

// Datos de la página Resumen de Marketing (solo tablas compartidas).
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const now = Date.now();
    const todayStartIso = arDayStartISO(arDateKey(now));
    const todayStart = new Date(todayStartIso).getTime();
    const since = new Date(now - 30 * DAY_MS).toISOString();
    const fields = "id, title, status, network, format, pillar_id, series_id, scheduled_at, score, tags, created_at";

    const [pillars, dated, ideas, ideasCount, overdue] = await Promise.all([
      supabase.from(PILLARS_TABLE).select("*").order("sort_order"),
      supabase.from(CONTENT_TABLE).select(fields).gte("scheduled_at", since).neq("status", "descartado").order("scheduled_at"),
      supabase.from(CONTENT_TABLE).select(fields).eq("status", "idea").order("created_at", { ascending: false }).limit(6),
      supabase.from(CONTENT_TABLE).select("id", { count: "exact", head: true }).eq("status", "idea"),
      // Atrasadas: cualquier fecha anterior a hoy, no solo los últimos 30 días.
      supabase
        .from(CONTENT_TABLE)
        .select(fields)
        .lt("scheduled_at", todayStartIso)
        .not("status", "in", "(publicado,descartado,idea)")
        .order("scheduled_at")
        .limit(50),
    ]);
    const err = pillars.error || dated.error || ideas.error || overdue.error;
    if (err) return Response.json({ error: err.message }, { status: 500 });

    const rows = dated.data || [];
    const t = (p) => new Date(p.scheduled_at).getTime();
    const upcoming = rows.filter((p) => t(p) >= todayStart && p.status !== "publicado").slice(0, 10);
    const weekCount = rows.filter((p) => t(p) >= todayStart && t(p) < now + 7 * DAY_MS).length;
    const publishedLast30 = rows.filter((p) => p.status === "publicado" && t(p) <= now).length;

    return Response.json({
      pillars: pillars.data || [],
      upcoming,
      overdue: overdue.data || [],
      ideas: ideas.data || [],
      ideasCount: ideasCount.count ?? 0,
      weekCount,
      publishedLast30,
      balance: pillarBalance(rows, pillars.data || [], { now }),
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
