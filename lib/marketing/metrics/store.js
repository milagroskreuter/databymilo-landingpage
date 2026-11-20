// Lectura y escritura de las tablas compartidas de métricas.
import { arDay } from "./dates";

export async function getAccount(supabase, network) {
  const { data, error } = await supabase
    .from("mk_social_accounts")
    .select("*")
    .eq("network", network)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Guarda/actualiza la cuenta. `meta` se mezcla con lo que ya había. */
export async function saveAccount(supabase, network, fields = {}, metaPatch = null) {
  const current = await getAccount(supabase, network);
  const row = {
    network,
    ...fields,
    meta: { ...(current?.meta || {}), ...(fields.meta || {}), ...(metaPatch || {}) },
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("mk_social_accounts").upsert(row, { onConflict: "network" });
  if (error) throw new Error(error.message);
  return { ...(current || {}), ...row };
}

export async function patchAccountMeta(supabase, network, metaPatch) {
  const current = await getAccount(supabase, network);
  if (!current) return null;
  const { error } = await supabase
    .from("mk_social_accounts")
    .update({ meta: { ...(current.meta || {}), ...metaPatch }, updated_at: new Date().toISOString() })
    .eq("network", network);
  if (error) throw new Error(error.message);
  return null;
}

export async function upsertSnapshot(supabase, { network, followers, day = arDay(), extra = {}, source = "api" }) {
  if (followers === null || followers === undefined) return;
  const { error } = await supabase
    .from("mk_follower_snapshots")
    .upsert({ network, day, followers, extra, source }, { onConflict: "network,day" });
  if (error) throw new Error(error.message);
}

/**
 * Inserta o actualiza métricas por publicación (una fila por network+external_id).
 * Los valores nulos no pisan lo que ya estaba guardado.
 */
export async function upsertPostMetrics(supabase, network, posts) {
  if (!posts.length) return 0;
  const ids = posts.map((p) => p.external_id);
  const existing = new Map();
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await supabase
      .from("mk_post_metrics")
      .select("*")
      .eq("network", network)
      .in("external_id", ids.slice(i, i + 200));
    if (error) throw new Error(error.message);
    for (const r of data || []) existing.set(r.external_id, r);
  }

  const now = new Date().toISOString();
  const rows = posts.map((p) => {
    const old = existing.get(p.external_id) || {};
    const merged = { network, external_id: p.external_id, captured_at: now };
    for (const k of [
      "permalink", "caption", "media_type", "posted_at", "reach", "impressions", "views",
      "likes", "comments", "saves", "shares", "clicks", "source",
    ]) {
      merged[k] = p[k] ?? old[k] ?? null;
    }
    merged.source = merged.source || "api";
    merged.content_id = old.content_id ?? null;
    const extra = { ...(old.extra || {}) };
    for (const [k, v] of Object.entries(p.extra || {})) if (v !== null && v !== undefined) extra[k] = v;
    merged.extra = extra;
    return merged;
  });

  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabase
      .from("mk_post_metrics")
      .upsert(rows.slice(i, i + 200), { onConflict: "network,external_id" });
    if (error) throw new Error(error.message);
  }
  return rows.length;
}

// ─── Cruce con mk_content ────────────────────────────────────────────────────

/** Clave estable de una publicación a partir de su link (o null). */
export function postKey(url) {
  if (!url) return null;
  const s = String(url).trim();
  let m;
  if ((m = s.match(/instagram\.com\/(?:[^/]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i))) return `ig:${m[1]}`;
  if ((m = s.match(/threads\.(?:net|com)\/@?[^/]+\/post\/([A-Za-z0-9_-]+)/i))) return `th:${m[1]}`;
  if ((m = s.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i)))
    return `yt:${m[1]}`;
  if ((m = s.match(/urn:li:(?:activity|ugcPost|share):(\d+)/i)) || (m = s.match(/[-:](?:activity|ugcPost|share)[-:](\d{15,})/i)))
    return `li:${m[1]}`;
  try {
    const u = new URL(s);
    return `url:${u.hostname.replace(/^www\./, "").toLowerCase()}${u.pathname.replace(/\/+$/, "")}`;
  } catch {
    return null;
  }
}

/**
 * Completa mk_post_metrics.content_id buscando la pieza de mk_content con el mismo
 * external_id (en la misma red) o el mismo link. Devuelve cuántas se cruzaron.
 */
export async function matchContent(supabase) {
  const { data: posts, error } = await supabase
    .from("mk_post_metrics")
    .select("id, network, external_id, permalink")
    .is("content_id", null)
    .limit(1000);
  if (error) throw new Error(error.message);
  if (!posts?.length) return 0;

  const { data: content, error: cErr } = await supabase
    .from("mk_content")
    .select("id, network, external_id, permalink")
    .or("external_id.not.is.null,permalink.not.is.null")
    .limit(5000);
  if (cErr) throw new Error(cErr.message);

  const byExt = new Map();
  const byKey = new Map();
  for (const c of content || []) {
    if (c.external_id) byExt.set(`${c.network || ""}|${String(c.external_id).trim()}`, c.id);
    const k = postKey(c.permalink) || postKey(c.external_id);
    if (k) byKey.set(k, c.id);
  }

  let matched = 0;
  for (const p of posts) {
    const id =
      byExt.get(`${p.network}|${p.external_id}`) ||
      byKey.get(postKey(p.permalink)) ||
      byKey.get(postKey(p.external_id));
    if (!id) continue;
    const { error: uErr } = await supabase.from("mk_post_metrics").update({ content_id: id }).eq("id", p.id);
    if (!uErr) matched++;
  }
  return matched;
}
