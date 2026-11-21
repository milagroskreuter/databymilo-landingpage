// Datos del media kit público: textos editables + números que se actualizan solos.
// Solo servidor. Cada métrica que no tiene datos vuelve como null (la página no la muestra).
import { unstable_cache } from "next/cache";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase";
import { listAllContacts } from "@/lib/resend-contacts";
import { getLists, fetchSubscribers } from "@/lib/lists";
import { dateRange } from "@/lib/vercel-analytics";
import { NETWORKS } from "@/lib/marketing/constants";
import { MEDIA_KIT_KEY, mergeMediaKit } from "./mediaKitDefaults";
import { MEDIA_KIT_TAG } from "./crud";

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? "5d28eac4-182a-4bc6-9a9a-5d2a7028ea89";
const DAY_MS = 86400000;
const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);

// Seguidores por red: última lectura y crecimiento contra ~30 días atrás.
export async function followerStats(supabase) {
  const since = isoDay(Date.now() - 120 * DAY_MS);
  const { data, error } = await supabase
    .from("mk_follower_snapshots")
    .select("network, day, followers")
    .gte("day", since)
    .order("day", { ascending: false })
    .limit(5000);
  if (error) throw new Error(error.message);
  const byNet = {};
  for (const r of data ?? []) (byNet[r.network] ||= []).push(r);
  const out = [];
  for (const net of NETWORKS) {
    const rows = byNet[net.id];
    if (!rows?.length || !(rows[0].followers > 0)) continue;
    const latest = rows[0];
    const target = new Date(`${latest.day}T00:00:00Z`).getTime() - 30 * DAY_MS;
    const old = rows.find((r) => new Date(`${r.day}T00:00:00Z`).getTime() <= target);
    const growth = old && old.followers > 0 ? (latest.followers - old.followers) / old.followers : null;
    out.push({ network: net.id, label: net.label, color: net.color, followers: latest.followers, day: latest.day, growth30: growth });
  }
  return out.sort((a, b) => b.followers - a.followers);
}

// Engagement promedio (interacciones / alcance) de los posts de los últimos 90 días.
export async function engagementStats(supabase) {
  const since = new Date(Date.now() - 90 * DAY_MS).toISOString();
  const { data, error } = await supabase
    .from("mk_post_metrics")
    .select("network, reach, impressions, views, likes, comments, saves, shares, posted_at")
    .gte("posted_at", since)
    .limit(5000);
  if (error) throw new Error(error.message);
  const acc = {};
  for (const p of data ?? []) {
    const base = p.reach || p.impressions || p.views;
    if (!base) continue;
    const inter = (p.likes || 0) + (p.comments || 0) + (p.saves || 0) + (p.shares || 0);
    const a = (acc[p.network] ||= { posts: 0, inter: 0, base: 0, rateSum: 0 });
    a.posts += 1;
    a.inter += inter;
    a.base += base;
    a.rateSum += inter / base;
  }
  const perNetwork = NETWORKS.filter((n) => acc[n.id]?.posts >= 3).map((n) => ({
    network: n.id,
    label: n.label,
    color: n.color,
    posts: acc[n.id].posts,
    rate: acc[n.id].rateSum / acc[n.id].posts, // promedio por post
  }));
  if (!perNetwork.length) return null;
  const posts = perNetwork.reduce((s, n) => s + n.posts, 0);
  const rate = perNetwork.reduce((s, n) => s + n.rate * n.posts, 0) / posts;
  return { rate, posts, perNetwork, days: 90 };
}

// Suscriptoras únicas y activas sumando todas las listas (La carta en Resend + las de Supabase).
export async function newsletterStats(supabase) {
  const lists = await getLists(supabase);
  const emails = new Set();
  let anyOk = false;
  for (const l of lists) {
    try {
      if (l.source === "resend") {
        if (!process.env.RESEND_API_KEY) continue;
        const resend = new Resend(process.env.RESEND_API_KEY);
        const contacts = await listAllContacts(resend, AUDIENCE_ID);
        for (const c of contacts) if (!c.unsubscribed) emails.add(c.email.toLowerCase());
      } else {
        const rows = await fetchSubscribers(supabase, l.slug, { onlyActive: true });
        for (const r of rows) emails.add(r.email.toLowerCase());
      }
      anyOk = true;
    } catch (err) {
      console.error(`media kit: no se pudo contar la lista ${l.slug}:`, err.message);
    }
  }
  return anyOk && emails.size > 0 ? { subscribers: emails.size } : null;
}

// Visitantes y páginas vistas del sitio en los últimos 30 días (Vercel Web Analytics).
// Se llama con fetch común (no vaFetch, que usa cache: "no-store" y no se lleva bien con
// la caché del media kit); el resultado queda guardado junto con el resto de la página.
const VA_PROJECT_ID = "prj_FCuvSA8k1Yw4jXIsAtHuE6FpB5V8";
const VA_TEAM_ID = "team_RbmJFWA5dPjwZTThOy3Mfl8v";

export async function visitStats() {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) return null;
  const { since, until } = dateRange(30);
  const url = new URL("https://api.vercel.com/v1/query/web-analytics/visits/count");
  url.searchParams.set("projectId", VA_PROJECT_ID);
  url.searchParams.set("teamId", VA_TEAM_ID);
  url.searchParams.set("since", since);
  url.searchParams.set("until", until);
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Vercel Analytics ${res.status}`);
  const d = (await res.json())?.data;
  if (!d?.visitors) return null;
  return { visitors: d.visitors, pageviews: d.pageviews || null, days: 30 };
}

async function settle(fn) {
  try {
    return await fn();
  } catch (err) {
    console.error("media kit:", err.message);
    return null;
  }
}

export async function loadMediaKitConfig(supabase) {
  const { data } = await supabase.from("mk_sponsors_settings").select("value").eq("key", MEDIA_KIT_KEY).maybeSingle();
  return mergeMediaKit(data?.value);
}

/** Todo lo que necesita /media-kit, sin caché. */
export async function buildMediaKitData() {
  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    console.error("media kit:", err.message);
    return { config: mergeMediaKit(null), stats: {}, rates: [], brands: [], generatedAt: new Date().toISOString() };
  }

  const config = (await settle(() => loadMediaKitConfig(supabase))) || mergeMediaKit(null);
  const show = config.show;

  const [followers, engagement, newsletter, visits, rates, deals] = await Promise.all([
    show.followers ? settle(() => followerStats(supabase)) : null,
    show.engagement ? settle(() => engagementStats(supabase)) : null,
    show.newsletter ? settle(() => newsletterStats(supabase)) : null,
    show.visits ? settle(() => visitStats()) : null,
    show.rates
      ? settle(async () => {
          const { data, error } = await supabase
            .from("mk_sponsors_rates")
            .select("id, name, channel, description, price, price_to, currency")
            .eq("public", true)
            .order("sort_order")
            .order("created_at");
          if (error) throw new Error(error.message);
          return data;
        })
      : null,
    show.brands
      ? settle(async () => {
          const { data, error } = await supabase
            .from("mk_sponsors_deals")
            .select("brand, website, logo_url")
            .eq("show_in_media_kit", true)
            .order("closed_on", { ascending: false, nullsFirst: false });
          if (error) throw new Error(error.message);
          return data;
        })
      : null,
  ]);

  const allowed = Array.isArray(config.networks) && config.networks.length ? new Set(config.networks) : null;
  const filterNet = (list) => (allowed ? list.filter((x) => allowed.has(x.network)) : list);

  const fol = followers ? filterNet(followers) : [];
  let eng = engagement;
  if (eng && allowed) {
    const per = filterNet(eng.perNetwork);
    if (!per.length) eng = null;
    else {
      const posts = per.reduce((s, n) => s + n.posts, 0);
      eng = { ...eng, perNetwork: per, posts, rate: per.reduce((s, n) => s + n.rate * n.posts, 0) / posts };
    }
  }

  // Marcas: las de los acuerdos marcados + las cargadas a mano (sin repetir).
  const seen = new Set();
  const brands = [];
  for (const b of [...(deals || []), ...(config.brands_extra || []).map((name) => ({ brand: name }))]) {
    const key = String(b.brand || "").trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    brands.push({ name: String(b.brand).trim(), website: b.website || null, logo: b.logo_url || null });
  }

  return {
    config,
    stats: {
      followers: fol.length ? fol : null,
      totalFollowers: fol.length ? fol.reduce((s, f) => s + f.followers, 0) : null,
      engagement: eng || null,
      newsletter: newsletter || null,
      visits: visits || null,
    },
    rates: rates || [],
    brands,
    generatedAt: new Date().toISOString(),
  };
}

export const MEDIA_KIT_REVALIDATE = 6 * 60 * 60; // 6 horas

/** Igual que buildMediaKitData, pero guardado en caché 6 horas (o hasta que se edite). */
export const getMediaKitData = unstable_cache(buildMediaKitData, ["mk-sponsors-media-kit-v1"], {
  revalidate: MEDIA_KIT_REVALIDATE,
  tags: [MEDIA_KIT_TAG],
});
