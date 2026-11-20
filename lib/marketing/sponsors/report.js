// Reporte post-campaña de un acuerdo: piezas asociadas, sus métricas y, si el área
// Links está instalada (tablas mk_links_*), los clicks de sus links cortos.

const METRIC_KEYS = ["reach", "impressions", "views", "likes", "comments", "saves", "shares", "clicks"];

// Tabla inexistente: Postgres 42P01 o PostgREST PGRST205 / PGRST200.
function isMissingTable(error) {
  return ["42P01", "PGRST205", "PGRST200", "PGRST106"].includes(error?.code) || /does not exist|schema cache/i.test(error?.message || "");
}

export async function buildDealReport(supabase, dealId) {
  const { data: deal, error } = await supabase.from("mk_sponsors_deals").select("*").eq("id", dealId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!deal) return null;

  const [{ data: links }, { data: slots }] = await Promise.all([
    supabase.from("mk_sponsors_deal_content").select("content_id").eq("deal_id", dealId),
    supabase.from("mk_sponsors_slots").select("*").eq("deal_id", dealId).order("slot_date"),
  ]);

  // Piezas: las vinculadas al acuerdo + las de sus espacios patrocinados.
  const contentIds = [...new Set([...(links || []).map((l) => l.content_id), ...(slots || []).map((s) => s.content_id).filter(Boolean)])];

  let content = [];
  if (contentIds.length) {
    const { data, error: cErr } = await supabase
      .from("mk_content")
      .select("id, title, status, network, format, scheduled_at, published_at, permalink, external_id")
      .in("id", contentIds);
    if (cErr) throw new Error(cErr.message);
    content = data || [];
  }

  // Métricas: por content_id o por (red, id externo).
  const metricsByContent = {};
  if (content.length) {
    const { data: byId } = await supabase.from("mk_post_metrics").select("*").in("content_id", contentIds);
    const extIds = content.filter((c) => c.external_id).map((c) => c.external_id);
    const { data: byExt } = extIds.length
      ? await supabase.from("mk_post_metrics").select("*").in("external_id", extIds)
      : { data: [] };
    for (const m of [...(byId || []), ...(byExt || [])]) {
      const c = content.find((x) => x.id === m.content_id || (x.external_id && x.external_id === m.external_id && x.network === m.network));
      if (!c) continue;
      (metricsByContent[c.id] ||= new Map()).set(m.id, m);
    }
  }

  const pieces = content
    .map((c) => {
      const rows = [...(metricsByContent[c.id]?.values() || [])];
      const metrics = {};
      for (const k of METRIC_KEYS) {
        const vals = rows.map((r) => r[k]).filter((v) => v !== null && v !== undefined);
        metrics[k] = vals.length ? vals.reduce((s, v) => s + v, 0) : null;
      }
      const capturedAt = rows.map((r) => r.captured_at).sort().pop() || null;
      return { ...c, metrics, hasMetrics: rows.length > 0, capturedAt, permalink: c.permalink || rows.find((r) => r.permalink)?.permalink || null };
    })
    .sort((a, b) => String(a.published_at || a.scheduled_at || "").localeCompare(String(b.published_at || b.scheduled_at || "")));

  const totals = {};
  for (const k of METRIC_KEYS) {
    const vals = pieces.map((p) => p.metrics[k]).filter((v) => v !== null);
    totals[k] = vals.length ? vals.reduce((s, v) => s + v, 0) : null;
  }
  const interactions = ["likes", "comments", "saves", "shares"].reduce((s, k) => s + (totals[k] || 0), 0);
  const base = totals.reach || totals.impressions || totals.views;
  totals.interactions = pieces.some((p) => p.hasMetrics) ? interactions : null;
  totals.engagement = base && totals.interactions !== null ? interactions / base : null;

  // Links cortos (área Links). Si las tablas no existen, se omite la sección.
  let shortLinks = null;
  if (contentIds.length) {
    const { data: lk, error: lkErr } = await supabase
      .from("mk_links_links")
      .select("id, slug, title, content_id")
      .in("content_id", contentIds);
    if (lkErr && !isMissingTable(lkErr)) console.error("reporte: links:", lkErr.message);
    if (!lkErr && lk?.length) {
      const { data: clicks, error: clErr } = await supabase
        .from("mk_links_clicks")
        .select("link_id, visitor_hash, is_bot")
        .in("link_id", lk.map((l) => l.id))
        .limit(50000);
      if (!clErr) {
        shortLinks = lk.map((l) => {
          const mine = (clicks || []).filter((c) => c.link_id === l.id && !c.is_bot);
          return {
            ...l,
            clicks: mine.length,
            unique: new Set(mine.map((c) => c.visitor_hash).filter(Boolean)).size || null,
          };
        });
        totals.linkClicks = shortLinks.reduce((s, l) => s + l.clicks, 0);
      }
    }
  }

  return { deal, slots: slots || [], pieces, totals, shortLinks, generatedAt: new Date().toISOString() };
}
