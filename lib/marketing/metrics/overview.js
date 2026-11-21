// Todo lo que muestra la pantalla de Métricas, en una sola lectura.
// Nunca devuelve tokens.
import { METRIC_NETWORKS, envStatus, redirectUri } from "./config";
import { addDays, arDay } from "./dates";

export async function loadOverview(supabase, request) {
  const today = arDay();
  const since = addDays(today, -400);
  const postsSince = new Date(Date.now() - 365 * 86400000).toISOString();

  const [accountsR, snapsR, goalsR, postsR, pillarsR, alertsR, importsR] = await Promise.all([
    supabase.from("mk_social_accounts").select("network, handle, external_id, token_expires_at, meta, connected_at, updated_at, access_token"),
    supabase.from("mk_follower_snapshots").select("network, day, followers, extra, source").gte("day", since).order("day"),
    supabase.from("mk_metrics_goals").select("network, month, target_followers").gte("month", addDays(today, -400)),
    supabase
      .from("mk_post_metrics")
      .select(
        "id, network, external_id, content_id, permalink, caption, media_type, posted_at, reach, impressions, views, likes, comments, saves, shares, clicks, extra, source, captured_at, content:mk_content(id, title, format, pillar_id, series_id)"
      )
      .gte("posted_at", postsSince)
      .order("posted_at", { ascending: false })
      .limit(1000),
    supabase.from("mk_pillars").select("id, name, color").order("sort_order"),
    supabase.from("mk_metrics_alerts").select("network, kind, message, first_seen_at"),
    supabase
      .from("mk_metrics_imports")
      .select("id, network, filename, period_start, period_end, total_followers, follower_days, posts, imported_at")
      .order("imported_at", { ascending: false })
      .limit(5),
  ]);

  for (const r of [accountsR, snapsR, goalsR, postsR, pillarsR, alertsR, importsR]) {
    if (r.error) throw new Error(r.error.message);
  }

  const env = envStatus();
  const accByNet = Object.fromEntries((accountsR.data || []).map((a) => [a.network, a]));
  const lastSnap = {};
  for (const s of snapsR.data || []) lastSnap[s.network] = s; // ordenado por día: queda el último

  const accounts = METRIC_NETWORKS.map((network) => {
    const a = accByNet[network];
    const m = a?.meta || {};
    const connected =
      network === "linkedin"
        ? Boolean(importsR.data?.some((i) => i.network === "linkedin") || a?.connected_at)
        : network === "youtube"
          ? Boolean(env.youtube && (a?.external_id || process.env.YOUTUBE_CHANNEL_ID))
          : Boolean(a?.access_token);
    return {
      network,
      configured: network === "instagram" ? true : env[network], // Instagram se conecta pegando un token: no necesita variables
      connected,
      handle: a?.handle || null,
      channel: network === "youtube" ? a?.external_id || process.env.YOUTUBE_CHANNEL_ID || null : null,
      token_expires_at: network === "instagram" || network === "threads" ? a?.token_expires_at || null : null,
      connected_at: a?.connected_at || null,
      last_sync_at: m.last_sync_at || null,
      last_error: m.last_error || null,
      last_error_at: m.last_error_at || null,
      token_refresh_error: m.token_refresh_error || null,
      followers_error: m.followers_error || null,
      last_import_at: m.last_import_at || null,
      login: m.login || null,
      last_snapshot: lastSnap[network] ? { day: lastSnap[network].day, followers: lastSnap[network].followers } : null,
      redirect_uri: network === "instagram" || network === "threads" ? redirectUri(network, request) : null,
    };
  });

  return {
    today,
    env,
    accounts,
    snapshots: snapsR.data || [],
    goals: goalsR.data || [],
    posts: postsR.data || [],
    pillars: pillarsR.data || [],
    alerts: alertsR.data || [],
    imports: importsR.data || [],
  };
}
