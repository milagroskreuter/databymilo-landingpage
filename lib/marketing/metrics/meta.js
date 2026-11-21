// Instagram (API with Instagram Login) y Threads: OAuth, tokens y lectura de métricas.
// Ambas APIs de Meta funcionan igual:
//   1. authorize → code (válido 1 h; trae "#_" al final que hay que sacar)
//   2. POST oauth/access_token → token corto (1 h)
//   3. GET access_token?grant_type=*_exchange_token → token largo (60 días)
//   4. GET refresh_access_token?grant_type=*_refresh_token → otros 60 días
//      (el token tiene que tener al menos 24 h y no estar vencido)
import {
  IG_GRAPH, FB_GRAPH, IG_SCOPES, THREADS_GRAPH, THREADS_SCOPES, RECENT_POSTS_DAYS, MAX_POSTS_PER_SYNC,
} from "./config";
import { fetchJson, qs, inBatches, toInt } from "./http";
import { DAY_MS } from "./dates";

export const PROVIDERS = {
  instagram: {
    appId: () => process.env.INSTAGRAM_APP_ID,
    appSecret: () => process.env.INSTAGRAM_APP_SECRET,
    authorizeUrl: "https://www.instagram.com/oauth/authorize",
    tokenUrl: "https://api.instagram.com/oauth/access_token",
    exchangeUrl: "https://graph.instagram.com/access_token",
    exchangeGrant: "ig_exchange_token",
    refreshUrl: "https://graph.instagram.com/refresh_access_token",
    refreshGrant: "ig_refresh_token",
    scopes: IG_SCOPES,
  },
  threads: {
    appId: () => process.env.THREADS_APP_ID,
    appSecret: () => process.env.THREADS_APP_SECRET,
    authorizeUrl: "https://threads.com/oauth/authorize",
    tokenUrl: "https://graph.threads.com/oauth/access_token",
    exchangeUrl: "https://graph.threads.com/access_token",
    exchangeGrant: "th_exchange_token",
    refreshUrl: "https://graph.threads.com/refresh_access_token",
    refreshGrant: "th_refresh_token",
    scopes: THREADS_SCOPES,
  },
};

export function authorizeUrl(network, { redirectUri, state }) {
  const p = PROVIDERS[network];
  const params = {
    client_id: p.appId(),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: p.scopes.join(","),
    state,
  };
  if (network === "instagram") params.enable_fb_login = "false";
  return `${p.authorizeUrl}?${qs(params)}`;
}

/** code → token largo. Devuelve { access_token, expires_at, user_id }. */
export async function exchangeCode(network, { code, redirectUri }) {
  const p = PROVIDERS[network];
  const cleanCode = String(code).replace(/#_$/, "");
  const short = await fetchJson(p.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: qs({
      client_id: p.appId(),
      client_secret: p.appSecret(),
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code: cleanCode,
    }),
  });
  // Instagram envuelve la respuesta en { data: [ {...} ] }; Threads no.
  const s = Array.isArray(short?.data) ? short.data[0] : short;
  if (!s?.access_token) throw new Error("Meta no devolvió un token");

  const long = await fetchJson(
    `${p.exchangeUrl}?${qs({ grant_type: p.exchangeGrant, client_secret: p.appSecret(), access_token: s.access_token })}`
  );
  return {
    access_token: long.access_token,
    expires_at: new Date(Date.now() + (Number(long.expires_in) || 60 * 86400) * 1000).toISOString(),
    user_id: s.user_id ? String(s.user_id) : null,
    permissions: s.permissions || null,
  };
}

export async function refreshToken(network, accessToken) {
  const p = PROVIDERS[network];
  const r = await fetchJson(`${p.refreshUrl}?${qs({ grant_type: p.refreshGrant, access_token: accessToken })}`);
  return {
    access_token: r.access_token,
    expires_at: new Date(Date.now() + (Number(r.expires_in) || 60 * 86400) * 1000).toISOString(),
  };
}

/** Valor de una métrica en la respuesta de /insights (formato values o total_value). */
function insightValues(data) {
  const out = {};
  for (const m of data?.data || []) {
    const v = m.total_value?.value ?? m.values?.[0]?.value;
    if (typeof v === "number") out[m.name] = v;
  }
  return out;
}

/** Pide métricas probando listas cada vez más cortas (no todas aplican a cada tipo de publicación). */
async function insightsWithFallback(baseUrl, token, metricSets) {
  for (const metrics of metricSets) {
    try {
      const data = await fetchJson(`${baseUrl}?${qs({ metric: metrics.join(","), access_token: token })}`);
      return insightValues(data);
    } catch {
      // probar la siguiente lista
    }
  }
  return {};
}

function recent(items) {
  const since = Date.now() - RECENT_POSTS_DAYS * DAY_MS;
  return items.filter((m) => m.timestamp && new Date(m.timestamp).getTime() >= since).slice(0, MAX_POSTS_PER_SYNC);
}

// ─── Instagram ───────────────────────────────────────────────────────────────

const IG_MEDIA_TYPE = { VIDEO: "reel", CAROUSEL_ALBUM: "carrusel", IMAGE: "post" };

export async function instagramProfile(token) {
  return fetchJson(`${IG_GRAPH}/me?${qs({ fields: "id,username,followers_count,media_count", access_token: token })}`);
}

export async function instagramPosts(token) {
  const media = await fetchJson(
    `${IG_GRAPH}/me/media?${qs({
      fields: "id,caption,media_type,permalink,timestamp,like_count,comments_count",
      limit: 50,
      access_token: token,
    })}`
  );
  return inBatches(recent(media?.data || []), 5, async (m) => {
    const ins = await insightsWithFallback(`${IG_GRAPH}/${m.id}/insights`, token, [
      ["reach", "views", "likes", "comments", "saved", "shares", "total_interactions"],
      ["reach", "likes", "comments", "saved", "shares"],
      ["reach"],
    ]);
    return {
      external_id: String(m.id),
      permalink: m.permalink || null,
      caption: m.caption ? m.caption.slice(0, 2000) : null,
      media_type: IG_MEDIA_TYPE[m.media_type] || (m.media_type || "").toLowerCase() || null,
      posted_at: m.timestamp || null,
      reach: toInt(ins.reach),
      views: toInt(ins.views),
      likes: toInt(ins.likes ?? m.like_count),
      comments: toInt(ins.comments ?? m.comments_count),
      saves: toInt(ins.saved),
      shares: toInt(ins.shares),
      source: "api",
      extra: { total_interactions: toInt(ins.total_interactions), ig_media_type: m.media_type },
    };
  });
}

// ─── Instagram con Unified login (apps nuevas de Meta) ───────────────────────
// El token se genera en el panel de Meta (Generate token) o con el login unificado.
// Se lee con graph.facebook.com: primero se busca la cuenta de Instagram asignada al token.

/** Perfil + seguidores. Devuelve { id, username, followers_count, media_count }. */
export async function instagramUnifiedProfile(token) {
  let id = null;
  let username = null;
  try {
    const list = await fetchJson(`${FB_GRAPH}/me/assigned_instagram_accounts?${qs({ fields: "id,username", access_token: token })}`);
    const first = list?.data?.[0];
    if (first?.id) {
      id = String(first.id);
      username = first.username || null;
    }
  } catch {
    // el token puede ser de la propia cuenta de Instagram: se prueba /me
  }
  const fields = "id,username,followers_count,media_count";
  const profile = await fetchJson(`${FB_GRAPH}/${id || "me"}?${qs({ fields, access_token: token })}`);
  return { ...profile, id: String(profile.id || id), username: profile.username || username };
}

export async function instagramUnifiedPosts(token, igId) {
  const media = await fetchJson(
    `${FB_GRAPH}/${igId}/media?${qs({
      fields: "id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count",
      limit: 50,
      access_token: token,
    })}`
  );
  return inBatches(recent(media?.data || []), 5, async (m) => {
    const ins = await insightsWithFallback(`${FB_GRAPH}/${m.id}/insights`, token, [
      ["reach", "views", "likes", "comments", "saved", "shares", "total_interactions"],
      ["reach", "likes", "comments", "saved", "shares"],
      ["reach", "saved", "shares"],
      ["reach"],
    ]);
    return {
      external_id: String(m.id),
      permalink: m.permalink || null,
      caption: m.caption ? m.caption.slice(0, 2000) : null,
      media_type:
        m.media_product_type === "REELS" ? "reel" : IG_MEDIA_TYPE[m.media_type] || (m.media_type || "").toLowerCase() || null,
      posted_at: m.timestamp || null,
      reach: toInt(ins.reach),
      views: toInt(ins.views),
      likes: toInt(ins.likes ?? m.like_count),
      comments: toInt(ins.comments ?? m.comments_count),
      saves: toInt(ins.saved),
      shares: toInt(ins.shares),
      source: "api",
      extra: { total_interactions: toInt(ins.total_interactions), ig_media_type: m.media_type },
    };
  });
}

// ─── Threads ─────────────────────────────────────────────────────────────────

const TH_MEDIA_TYPE = { TEXT_POST: "post", IMAGE: "post", VIDEO: "video", CAROUSEL_ALBUM: "carrusel", AUDIO: "post" };

export async function threadsProfile(token) {
  const me = await fetchJson(`${THREADS_GRAPH}/me?${qs({ fields: "id,username", access_token: token })}`);
  let followers = null;
  try {
    const ins = await fetchJson(
      `${THREADS_GRAPH}/${me.id}/threads_insights?${qs({ metric: "followers_count", access_token: token })}`
    );
    followers = insightValues(ins).followers_count ?? null;
  } catch (err) {
    me.followers_error = err.message;
  }
  return { ...me, followers_count: followers };
}

export async function threadsPosts(token) {
  const list = await fetchJson(
    `${THREADS_GRAPH}/me/threads?${qs({ fields: "id,permalink,text,timestamp,media_type", limit: 50, access_token: token })}`
  );
  const items = (list?.data || []).filter((t) => t.media_type !== "REPOST_FACADE");
  return inBatches(recent(items), 5, async (t) => {
    const ins = await insightsWithFallback(`${THREADS_GRAPH}/${t.id}/insights`, token, [
      ["views", "likes", "replies", "reposts", "quotes", "shares"],
      ["views", "likes", "replies", "reposts", "quotes"],
      ["likes", "replies"],
    ]);
    return {
      external_id: String(t.id),
      permalink: t.permalink || null,
      caption: t.text ? t.text.slice(0, 2000) : null,
      media_type: TH_MEDIA_TYPE[t.media_type] || "post",
      posted_at: t.timestamp || null,
      views: toInt(ins.views),
      likes: toInt(ins.likes),
      comments: toInt(ins.replies),
      shares: toInt(ins.shares),
      source: "api",
      extra: { reposts: toInt(ins.reposts), quotes: toInt(ins.quotes), threads_media_type: t.media_type },
    };
  });
}
