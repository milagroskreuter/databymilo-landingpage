// Espía de competencia: lee cuentas públicas de Instagram (Business o Creator) con
// Business Discovery, usando la misma conexión de Meta que la pantalla de Métricas.
// Solo trae datos públicos: seguidores, posteos, likes y comentarios
// (las vistas, el alcance y los guardados solo los ve la dueña de la cuenta).
import { FB_GRAPH, IG_GRAPH } from "@/lib/marketing/metrics/config";
import { getAccount } from "@/lib/marketing/metrics/store";
import { instagramUnifiedProfile } from "@/lib/marketing/metrics/meta";
import { fetchJson, qs, toInt } from "@/lib/marketing/metrics/http";
import { arDay } from "@/lib/marketing/metrics/dates";

const PAGES = 3; // de a 50 posteos: hasta ~150 publicaciones por cuenta
const PROFILE_FIELDS = "id,username,name,biography,profile_picture_url,followers_count,media_count";
// Si la API no acepta algún campo, se prueba con la lista siguiente.
const MEDIA_FIELD_SETS = [
  "id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count,view_count",
  "id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count",
  "id,caption,media_type,permalink,timestamp,like_count,comments_count",
];

export function cleanUsername(raw) {
  let s = String(raw || "").trim();
  const m = s.match(/instagram\.com\/([^/?#]+)/i);
  if (m) s = m[1];
  return s.replace(/^@/, "").toLowerCase().replace(/[^a-z0-9._]/g, "");
}

export function formatOf(m) {
  if (m.media_product_type === "REELS") return "reel";
  if (m.media_type === "CAROUSEL_ALBUM") return "carrusel";
  if (m.media_type === "VIDEO") return "reel";
  return "post";
}

/** Conexión de Instagram de la usuaria: token, id propio y qué graph usar. */
async function getConnection(supabase) {
  const account = await getAccount(supabase, "instagram");
  if (!account?.access_token) {
    throw new Error("Primero conectá tu Instagram en Métricas de redes: el espía usa esa misma conexión.");
  }
  const unified = account.meta?.login === "unified";
  let igId = account.external_id || account.meta?.ig_user_id || null;
  if (!igId && unified) igId = (await instagramUnifiedProfile(account.access_token)).id;
  if (!igId) throw new Error("No se encontró el id de tu cuenta de Instagram: actualizá Métricas de redes una vez.");
  return { token: account.access_token, igId, graph: unified ? FB_GRAPH : IG_GRAPH };
}

function friendlyError(err, username) {
  const msg = err?.message || String(err);
  if (/cannot be found|does not exist|Invalid user id|not find/i.test(msg) || err?.data?.error?.error_subcode === 2207013) {
    return `No se pudo leer @${username}: tiene que existir y ser una cuenta Business o Creator (las personales no se pueden leer).`;
  }
  if (/permission|scope|OAuthException/i.test(msg) && /business_discovery|permission/i.test(msg)) {
    return `Tu conexión de Instagram no tiene permiso para leer otras cuentas (${msg}).`;
  }
  return msg;
}

async function discover({ token, igId, graph }, username, mediaFields, after) {
  const media = `media${after ? `.after(${after})` : ""}.limit(50){${mediaFields}}`;
  const fields = `business_discovery.username(${username}){${PROFILE_FIELDS},${media}}`;
  const data = await fetchJson(`${graph}/${igId}?${qs({ fields, access_token: token })}`, { timeout: 20000 });
  return data?.business_discovery || null;
}

/** Perfil + publicaciones de una cuenta. */
export async function fetchCompetitor(conn, username) {
  let fieldsIdx = 0;
  let bd = null;
  for (;;) {
    try {
      bd = await discover(conn, username, MEDIA_FIELD_SETS[fieldsIdx]);
      break;
    } catch (err) {
      const badField = err?.code === 100 && /field|nonexisting|Tried accessing/i.test(err.message || "");
      if (badField && fieldsIdx < MEDIA_FIELD_SETS.length - 1) {
        fieldsIdx += 1;
        continue;
      }
      throw err;
    }
  }
  if (!bd) throw new Error("Instagram no devolvió datos");
  const items = [...(bd.media?.data || [])];
  // Business Discovery no siempre manda paging.next: se sigue con el cursor mientras la página venga llena.
  const nextCursor = (m) => ((m?.data?.length || 0) >= 50 ? m?.paging?.cursors?.after || null : null);
  let after = nextCursor(bd.media);
  for (let i = 1; i < PAGES && after; i++) {
    const next = await discover(conn, username, MEDIA_FIELD_SETS[fieldsIdx], after);
    items.push(...(next?.media?.data || []));
    after = nextCursor(next?.media);
  }
  return { profile: bd, media: items };
}

async function saveCompetitor(supabase, competitor, { profile, media }) {
  const now = new Date().toISOString();
  const { error: upErr } = await supabase
    .from("mk_competitors")
    .update({
      display_name: profile.name || null,
      bio: profile.biography || null,
      avatar_url: profile.profile_picture_url || null,
      followers: toInt(profile.followers_count),
      media_count: toInt(profile.media_count),
      last_sync_at: now,
      last_error: null,
      updated_at: now,
    })
    .eq("id", competitor.id);
  if (upErr) throw new Error(upErr.message);

  await supabase.from("mk_competitor_snapshots").upsert(
    { competitor_id: competitor.id, day: arDay(), followers: toInt(profile.followers_count), media_count: toInt(profile.media_count) },
    { onConflict: "competitor_id,day" }
  );

  const rows = media
    .filter((m) => m?.id)
    .map((m) => ({
      competitor_id: competitor.id,
      external_id: String(m.id),
      permalink: m.permalink || null,
      caption: m.caption || null,
      format: formatOf(m),
      posted_at: m.timestamp || null,
      likes: toInt(m.like_count),
      comments: toInt(m.comments_count),
      views: toInt(m.view_count),
      extra: { media_type: m.media_type || null, media_product_type: m.media_product_type || null },
      updated_at: now,
    }));
  if (rows.length) {
    const { error } = await supabase.from("mk_competitor_posts").upsert(rows, { onConflict: "competitor_id,external_id" });
    if (error) throw new Error(error.message);
  }
  return rows.length;
}

/**
 * Actualiza las cuentas de Instagram activas (o solo `ids`).
 * Devuelve [{ id, username, ok, posts?, error? }]. Nunca lanza por una cuenta puntual.
 */
export async function syncCompetitors(supabase, { ids } = {}) {
  let q = supabase.from("mk_competitors").select("*").eq("network", "instagram").eq("active", true);
  if (ids?.length) q = q.in("id", ids);
  const { data: list, error } = await q;
  if (error) throw new Error(error.message);
  if (!list?.length) return [];

  const conn = await getConnection(supabase);
  const results = [];
  for (const c of list) {
    try {
      const data = await fetchCompetitor(conn, c.username);
      const posts = await saveCompetitor(supabase, c, data);
      results.push({ id: c.id, username: c.username, ok: true, posts });
    } catch (err) {
      const message = friendlyError(err, c.username);
      await supabase
        .from("mk_competitors")
        .update({ last_error: message, updated_at: new Date().toISOString() })
        .eq("id", c.id);
      results.push({ id: c.id, username: c.username, ok: false, error: message });
    }
  }
  return results;
}
