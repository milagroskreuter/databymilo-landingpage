import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase";
import { listAllContacts } from "@/lib/resend-contacts";
import { dateRange, vaFetch } from "@/lib/vercel-analytics";
import { NETWORKS } from "@/lib/marketing/constants";
import { hostToNetwork, parseSck } from "@/lib/marketing/links/shared";
import { period, fetchAll, localDay, jsonError } from "@/lib/marketing/links/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? "5d28eac4-182a-4bc6-9a9a-5d2a7028ea89";
const PAID = ["approved", "completed"];

/**
 * Embudo del período: publicaciones → clicks en tus links → visitas al sitio →
 * suscriptoras nuevas → ventas. Cada número indica si es atribución directa
 * (se sabe exactamente de dónde vino) o estimada (repartida según las visitas por red).
 */
export async function GET(request) {
  try {
    const sp = new URL(request.url).searchParams;
    const { days, sinceIso, dayList } = period(sp.get("days"), { max: 365, def: 30 });
    const supabase = getSupabaseAdmin();
    const warnings = [];

    const [content, clicks, subsRows, sales, links, lists, visits, carta] = await Promise.all([
      // 1. Publicaciones
      fetchAll(() =>
        supabase.from("mk_content").select("id, network, published_at").eq("status", "publicado").gte("published_at", sinceIso)
      ).catch((e) => (warnings.push(`Publicaciones: ${e.message}`), [])),
      // 2. Clicks
      fetchAll(() =>
        supabase
          .from("mk_links_clicks")
          .select("link_id, slug, clicked_at, network")
          .eq("is_bot", false)
          .gte("clicked_at", sinceIso)
      ).catch((e) => (warnings.push(`Clicks: ${e.message}`), [])),
      // 4. Suscriptoras nuevas en listas de Supabase (compradoras se llena sola: no cuenta)
      fetchAll(() =>
        supabase
          .from("list_subscribers")
          .select("list_slug, email, created_at")
          .neq("list_slug", "compradoras")
          .gte("created_at", sinceIso)
      ).catch((e) => (warnings.push(`Suscriptoras: ${e.message}`), [])),
      // 5. Ventas cobradas y no de prueba
      fetchAll(() =>
        supabase
          .from("sales")
          .select("transaction, status, price, currency, net_amount, net_currency, resource_slug, product_name, approved_at")
          .in("status", PAID)
          .eq("is_test", false)
          .gte("approved_at", sinceIso)
      ).catch((e) => (warnings.push(`Ventas: ${e.message}`), [])),
      supabase.from("mk_links_links").select("id, slug, title, dest_type, list_slug, resource_slug, network, campaign"),
      supabase.from("mail_lists").select("slug, name, source"),
      loadVisits(days).catch((e) => ({ error: e.message })),
      loadCartaNew(sinceIso).catch((e) => ({ error: e.message })),
    ]);

    // ---------- Visitas (Vercel Web Analytics) ----------
    const visitsByNetwork = {};
    let visitsTotal = null;
    let visitsByDay = {};
    let utmBySource = null;
    if (visits?.error) {
      warnings.push(visits.setup ? "Visitas: falta VERCEL_API_TOKEN" : `Visitas: ${visits.error}`);
    } else if (visits) {
      visitsTotal = visits.total;
      for (const r of visits.referrers) {
        const net = hostToNetwork(r.host);
        if (net) visitsByNetwork[net] = (visitsByNetwork[net] || 0) + r.count;
      }
      visitsByDay = visits.byDay;
      utmBySource = visits.utm;
    }

    // ---------- Suscriptoras ----------
    const subsByList = {};
    const subsEmails = new Set();
    const subsByDay = {};
    const addSub = (list, email, createdAt) => {
      subsByList[list] = (subsByList[list] || 0) + 1;
      const e = String(email || "").toLowerCase();
      if (e && !subsEmails.has(e)) {
        subsEmails.add(e);
        const d = localDay(createdAt);
        subsByDay[d] = (subsByDay[d] || 0) + 1;
      }
    };
    for (const s of subsRows) addSub(s.list_slug, s.email, s.created_at);
    if (carta?.error) warnings.push(`La carta (Resend): ${carta.error}`);
    else for (const c of carta) addSub("carta", c.email, c.created_at);
    const subsTotal = subsEmails.size;

    // ---------- Ventas y atribución por sck ----------
    const linkBySlug = Object.fromEntries((links.data ?? []).map((l) => [l.slug, l]));
    const attributed = {}; // transaction → { slug, network }
    if (sales.length > 0) {
      const tx = sales.map((s) => s.transaction);
      for (let i = 0; i < tx.length; i += 200) {
        const { data, error } = await supabase
          .from("hotmart_webhook_log")
          .select("transaction, sck:payload->data->purchase->>sckPaymentLink, origin:payload->data->purchase->origin")
          .in("transaction", tx.slice(i, i + 200));
        if (error) {
          warnings.push(`Atribución de ventas: ${error.message}`);
          break;
        }
        for (const row of data ?? []) {
          const parsed = parseSck(row.sck) || parseSck(row.origin?.sck) || parseSck(row.origin?.src);
          if (parsed) attributed[row.transaction] = parsed;
        }
      }
    }
    const revenue = {};
    const salesByDay = {};
    for (const s of sales) {
      const cur = s.currency || "?";
      revenue[cur] = Math.round(((revenue[cur] || 0) + Number(s.price || 0)) * 100) / 100;
      const d = localDay(s.approved_at);
      salesByDay[d] = (salesByDay[d] || 0) + 1;
    }
    const salesDirectByNetwork = {};
    const salesBySlug = {};
    for (const [t, a] of Object.entries(attributed)) {
      if (!sales.some((s) => s.transaction === t)) continue;
      const net = a.network || linkBySlug[a.slug]?.network || "sin-red";
      salesDirectByNetwork[net] = (salesDirectByNetwork[net] || 0) + 1;
      salesBySlug[a.slug] = (salesBySlug[a.slug] || 0) + 1;
    }
    const salesAttributed = Object.values(salesDirectByNetwork).reduce((a, b) => a + b, 0);
    const salesUnattributed = sales.length - salesAttributed;

    // ---------- Por red ----------
    const pubsByNetwork = {};
    for (const c of content) {
      const n = c.network || "sin-red";
      pubsByNetwork[n] = (pubsByNetwork[n] || 0) + 1;
    }
    const clicksByNetwork = {};
    const clicksBySlug = {};
    const clicksByDay = {};
    for (const c of clicks) {
      const n = c.network || "sin-red";
      clicksByNetwork[n] = (clicksByNetwork[n] || 0) + 1;
      clicksBySlug[c.slug] = (clicksBySlug[c.slug] || 0) + 1;
      const d = localDay(c.clicked_at);
      clicksByDay[d] = (clicksByDay[d] || 0) + 1;
    }

    const netIds = new Set([
      ...NETWORKS.map((n) => n.id),
      ...Object.keys(pubsByNetwork),
      ...Object.keys(clicksByNetwork),
      ...Object.keys(visitsByNetwork),
      ...Object.keys(salesDirectByNetwork),
    ]);
    const share = (net) => (visitsTotal ? (visitsByNetwork[net] || 0) / visitsTotal : null);
    const byNetwork = [...netIds]
      .map((net) => {
        const sh = share(net);
        return {
          network: net,
          publications: pubsByNetwork[net] || 0,
          clicks: clicksByNetwork[net] || 0,
          visits_est: visitsByNetwork[net] ?? 0,
          subs_est: sh == null ? null : Math.round(subsTotal * sh * 10) / 10,
          sales_direct: salesDirectByNetwork[net] || 0,
          sales_est: sh == null ? null : Math.round(salesUnattributed * sh * 10) / 10,
        };
      })
      .filter((r) => r.publications || r.clicks || r.visits_est || r.sales_direct || NETWORKS.some((n) => n.id === r.network && n.id !== "tiktok"))
      .sort((a, b) => b.clicks + b.visits_est - (a.clicks + a.visits_est));

    // ---------- Por link: clicks → suscriptoras de su lista / ventas directas ----------
    const listName = Object.fromEntries((lists.data ?? []).map((l) => [l.slug, l.name]));
    const byLink = (links.data ?? [])
      .map((l) => ({
        slug: l.slug,
        title: l.title,
        dest_type: l.dest_type,
        target: l.list_slug ? listName[l.list_slug] || l.list_slug : l.resource_slug || null,
        clicks: clicksBySlug[l.slug] || 0,
        list_subs: l.dest_type === "list" ? subsByList[l.list_slug] || 0 : null,
        sales_direct: salesBySlug[l.slug] || 0,
      }))
      .filter((l) => l.clicks || l.sales_direct)
      .sort((a, b) => b.clicks - a.clicks);

    const byDay = dayList.map((d) => ({
      day: d,
      clicks: clicksByDay[d] || 0,
      visits: visitsByDay[d] ?? null,
      subs: subsByDay[d] || 0,
      sales: salesByDay[d] || 0,
    }));

    return Response.json({
      days,
      since: dayList[0],
      totals: {
        publications: content.length,
        clicks: clicks.length,
        visits: visitsTotal,
        visits_social: Object.values(visitsByNetwork).reduce((a, b) => a + b, 0),
        subs: subsTotal,
        sales: sales.length,
        sales_attributed: salesAttributed,
        revenue,
      },
      subsByList: Object.entries(subsByList)
        .map(([slug, count]) => ({ slug, name: listName[slug] || slug, count }))
        .sort((a, b) => b.count - a.count),
      utmBySource,
      byNetwork,
      byLink,
      byDay,
      warnings,
    });
  } catch (err) {
    return jsonError(err);
  }
}

/** Visitas del período según Vercel Web Analytics: total, por referer, por día y (si el plan lo da) por utm_source. */
async function loadVisits(days) {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) return { error: "VERCEL_API_TOKEN no configurado", setup: true };
  const range = dateRange(days);
  const [count, refs, daily, utm] = await Promise.allSettled([
    vaFetch("/visits/count", range, token),
    vaFetch("/visits/aggregate", { ...range, by: "referrerHostname", limit: "100" }, token),
    vaFetch("/visits/aggregate", { ...range, by: "day", limit: "400" }, token),
    vaFetch("/visits/aggregate", { ...range, by: "utmSource", limit: "50" }, token),
  ]);
  if (count.status !== "fulfilled") throw count.reason;
  const ov = count.value?.data ?? {};
  const val = (r) => r?.visitors ?? r?.pageviews ?? 0;
  const referrers =
    refs.status === "fulfilled"
      ? (refs.value?.data ?? []).map((r) => ({ host: r.referrerHostname ?? r.key ?? "", count: val(r) }))
      : [];
  const byDay = {};
  if (daily.status === "fulfilled") {
    for (const r of daily.value?.data ?? []) {
      const d = String(r.day ?? r.key ?? r.date ?? "").slice(0, 10);
      if (d) byDay[d] = (byDay[d] || 0) + val(r);
    }
  }
  let utmRows = null;
  if (utm.status === "fulfilled" && Array.isArray(utm.value?.data)) {
    utmRows = utm.value.data
      .map((r) => ({ source: r.utmSource ?? r.key, count: val(r) }))
      .filter((r) => typeof r.source === "string" && r.source);
    if (utmRows.length === 0) utmRows = null;
  }
  return { total: ov.visitors ?? ov.pageviews ?? null, referrers, byDay, utm: utmRows };
}

/** Contactos nuevos de La carta (viven en Resend). */
async function loadCartaNew(sinceIso) {
  if (!process.env.RESEND_API_KEY) return { error: "falta RESEND_API_KEY" };
  const resend = new Resend(process.env.RESEND_API_KEY);
  const contacts = await listAllContacts(resend, AUDIENCE_ID);
  const since = new Date(sinceIso).getTime();
  return contacts.filter((c) => !c.unsubscribed && c.created_at && new Date(c.created_at).getTime() >= since);
}
