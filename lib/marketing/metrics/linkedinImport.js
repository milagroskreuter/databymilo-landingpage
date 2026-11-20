// Guarda una exportación de LinkedIn ya leída. Subir el mismo archivo (o uno
// que se pisa en fechas) dos veces no duplica nada: seguidores por (red, día) y
// publicaciones por (red, id) se actualizan en el lugar.
import { followerSeries } from "./linkedin";
import { upsertPostMetrics, matchContent, saveAccount } from "./store";

export async function saveLinkedinImport(supabase, parsed, filename) {
  const series = parsed.followers ? followerSeries(parsed.followers) : [];
  const engByDay = new Map(parsed.engagement.map((e) => [e.day, e]));

  // Seguidores por día (+ impresiones/interacciones del día si vinieron).
  const snapshots = series.map((s) => {
    const e = engByDay.get(s.day);
    return {
      network: "linkedin",
      day: s.day,
      followers: s.followers,
      source: "import",
      extra: {
        new_followers: s.new_followers,
        impressions: e?.impressions ?? null,
        engagements: e?.engagements ?? null,
      },
    };
  });
  for (let i = 0; i < snapshots.length; i += 500) {
    const { error } = await supabase
      .from("mk_follower_snapshots")
      .upsert(snapshots.slice(i, i + 500), { onConflict: "network,day" });
    if (error) throw new Error(error.message);
  }

  // Publicaciones. LinkedIn no da la hora: se guarda al mediodía y se marca.
  const posts = parsed.posts.map((p) => ({
    external_id: p.external_id,
    permalink: p.permalink,
    posted_at: p.posted_day ? `${p.posted_day}T12:00:00-03:00` : null,
    impressions: p.impressions ?? null,
    source: "import",
    extra: { engagements: p.engagements ?? null, time_unknown: true },
  }));
  const savedPosts = await upsertPostMetrics(supabase, "linkedin", posts);

  const days = [...series.map((s) => s.day), ...parsed.engagement.map((e) => e.day)].sort();
  const summary = {
    sheets: parsed.sheets,
    discovery: parsed.discovery,
    engagement_days: parsed.engagement.length,
    total_impressions: parsed.engagement.reduce((a, e) => a + (e.impressions || 0), 0) || null,
  };
  const record = {
    network: "linkedin",
    filename: filename ? String(filename).slice(0, 200) : null,
    period_start: days[0] || null,
    period_end: days[days.length - 1] || null,
    total_followers: parsed.followers?.total ?? null,
    follower_days: snapshots.length,
    posts: savedPosts,
    summary,
  };
  const { error } = await supabase.from("mk_metrics_imports").insert(record);
  if (error) throw new Error(error.message);

  await saveAccount(
    supabase,
    "linkedin",
    { connected_at: new Date().toISOString() },
    { last_import_at: new Date().toISOString(), last_sync_at: new Date().toISOString(), last_error: null }
  );

  let matched = 0;
  try {
    matched = await matchContent(supabase);
  } catch {
    /* el cruce se reintenta en el cron */
  }
  return { ...record, matched, warning: parsed.followers && !series.length ? "No encontré el total de seguidores: solo se guardaron publicaciones." : null };
}
