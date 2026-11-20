import { getSupabaseAdmin } from "@/lib/supabase";
import { period, fetchAll, countBy, localDay, jsonError } from "@/lib/marketing/links/server";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f-]{36}$/i;

// Clicks de los links cortos en el período: por día, link, red, campaña, dispositivo y país.
// Los bots (vistas previas de redes, crawlers) se cuentan aparte y no suman.
export async function GET(request) {
  try {
    const sp = new URL(request.url).searchParams;
    const { days, sinceIso, dayList } = period(sp.get("days"));
    const linkId = UUID_RE.test(sp.get("link") || "") ? sp.get("link") : null;
    const supabase = getSupabaseAdmin();

    const [rows, links] = await Promise.all([
      fetchAll(() => {
        let q = supabase
          .from("mk_links_clicks")
          .select("link_id, slug, clicked_at, via, network, campaign, country, device, is_bot, visitor_hash")
          .gte("clicked_at", sinceIso)
          .order("clicked_at", { ascending: true });
        if (linkId) q = q.eq("link_id", linkId);
        return q;
      }),
      supabase.from("mk_links_links").select("id, slug, title, campaign, network, in_bio"),
    ]);

    const linkById = Object.fromEntries((links.data ?? []).map((l) => [l.id, l]));
    const human = rows.filter((r) => !r.is_bot);
    const bots = rows.length - human.length;

    // Serie diaria con desglose por red
    const byDayMap = Object.fromEntries(dayList.map((d) => [d, { day: d, total: 0, networks: {} }]));
    for (const r of human) {
      const d = byDayMap[localDay(r.clicked_at)];
      if (!d) continue;
      d.total++;
      const net = r.network || "sin-red";
      d.networks[net] = (d.networks[net] || 0) + 1;
    }

    // Por link (con únicos por día)
    const perLink = new Map();
    for (const r of human) {
      const key = r.link_id || `slug:${r.slug}`;
      if (!perLink.has(key)) perLink.set(key, { link_id: r.link_id, slug: r.slug, clicks: 0, uniq: new Set() });
      const p = perLink.get(key);
      p.clicks++;
      if (r.visitor_hash) p.uniq.add(`${localDay(r.clicked_at)}|${r.visitor_hash}`);
    }
    const byLink = [...perLink.values()]
      .map((p) => {
        const l = p.link_id ? linkById[p.link_id] : null;
        return {
          link_id: p.link_id,
          slug: l?.slug || p.slug,
          title: l?.title || `${p.slug} (borrado)`,
          in_bio: !!l?.in_bio,
          campaign: l?.campaign || null,
          clicks: p.clicks,
          unique: p.uniq.size,
        };
      })
      .sort((a, b) => b.clicks - a.clicks);

    const uniqueAll = new Set(human.filter((r) => r.visitor_hash).map((r) => `${localDay(r.clicked_at)}|${r.visitor_hash}`));

    return Response.json({
      days,
      since: dayList[0],
      total: human.length,
      unique: uniqueAll.size,
      bots,
      byDay: Object.values(byDayMap),
      byLink,
      byNetwork: countBy(human, (r) => r.network),
      byCampaign: countBy(human, (r) => r.campaign),
      byVia: countBy(human, (r) => r.via),
      byDevice: countBy(human, (r) => r.device),
      byCountry: countBy(human, (r) => r.country).slice(0, 10),
    });
  } catch (err) {
    return jsonError(err);
  }
}
