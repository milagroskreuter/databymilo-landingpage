import { getSupabaseAdmin } from "@/lib/supabase";
import { arDay } from "@/lib/marketing/metrics/dates";
import { upsertSnapshot, upsertPostMetrics, matchContent, saveAccount, postKey } from "@/lib/marketing/metrics/store";

export const dynamic = "force-dynamic";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function intOrNull(v, label) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) throw new Error(`${label} tiene que ser un número entero, sin decimales`);
  return n;
}

function validDay(v, label) {
  if (!DAY_RE.test(String(v || "")) || Number.isNaN(Date.parse(`${v}T12:00:00Z`))) throw new Error(`${label}: fecha inválida`);
  if (String(v) > arDay()) throw new Error(`${label}: la fecha no puede ser futura`);
  return String(v);
}

// Carga a mano de LinkedIn (cuando no se puede exportar el archivo):
// { day?, followers?, posts: [{ url, posted_day, title?, impressions?, likes?, comments?, shares? }] }
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Datos inválidos" }, { status: 400 });
  }

  try {
    const day = validDay(body.day || arDay(), "Fecha de los seguidores");
    const followers = intOrNull(body.followers, "Seguidores");
    const rawPosts = Array.isArray(body.posts) ? body.posts.slice(0, 50) : [];

    const posts = [];
    rawPosts.forEach((p, i) => {
      const n = i + 1;
      const url = String(p?.url || "").trim();
      const impressions = intOrNull(p?.impressions, `Publicación ${n}: impresiones`);
      const likes = intOrNull(p?.likes, `Publicación ${n}: reacciones`);
      const comments = intOrNull(p?.comments, `Publicación ${n}: comentarios`);
      const shares = intOrNull(p?.shares, `Publicación ${n}: compartidos`);
      const empty = !url && !p?.title && [impressions, likes, comments, shares].every((x) => x === null);
      if (empty) return; // fila en blanco
      if (!/^https?:\/\//i.test(url)) throw new Error(`Publicación ${n}: pegá el link de la publicación (empieza con https://)`);
      const posted_day = validDay(p?.posted_day, `Publicación ${n}`);
      const key = postKey(url);
      posts.push({
        external_id: key?.startsWith("li:") ? key.slice(3) : url,
        permalink: url,
        caption: p?.title ? String(p.title).slice(0, 200) : null,
        posted_at: `${posted_day}T12:00:00-03:00`,
        impressions,
        likes,
        comments,
        shares,
        source: "manual",
        extra: { time_unknown: true },
      });
    });

    if (followers === null && !posts.length) {
      return Response.json({ error: "Cargá al menos los seguidores o una publicación" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (followers !== null) {
      await upsertSnapshot(supabase, { network: "linkedin", day, followers, source: "manual", extra: {} });
    }
    const savedPosts = await upsertPostMetrics(supabase, "linkedin", posts);

    const now = new Date().toISOString();
    await saveAccount(supabase, "linkedin", { connected_at: now }, { last_import_at: now, last_sync_at: now, last_error: null });

    let matched = 0;
    try {
      matched = await matchContent(supabase);
    } catch {
      /* el cruce se reintenta en el cron */
    }
    return Response.json({ ok: true, followers: followers !== null ? { day, followers } : null, posts: savedPosts, matched });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}
