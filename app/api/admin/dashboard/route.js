import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase";
import { listAllContacts } from "@/lib/resend-contacts";
import { getLists, fetchSubscribers } from "@/lib/lists";
import { isLive } from "@/lib/corpo";
import { dateRange, vaFetch } from "@/lib/vercel-analytics";

export const dynamic = "force-dynamic";

// Todo lo que muestra el dashboard de inicio, en una sola respuesta.
// Cada bloque se calcula por separado: si uno falla (Resend caído, falta el
// token de Vercel, etc.) vuelve con { error } y el resto se muestra igual.

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? "5d28eac4-182a-4bc6-9a9a-5d2a7028ea89";
const DAY_MS = 24 * 60 * 60 * 1000;
const AR_OFFSET_MS = 3 * 60 * 60 * 1000; // Argentina, UTC-3 (sin horario de verano)
const GROWTH_DAYS = 90;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ms = (iso) => (iso ? new Date(iso).getTime() : null);

/** "YYYY-MM-DD" del día en Argentina para un timestamp. */
function arDayKey(t) {
  return new Date(t - AR_OFFSET_MS).toISOString().slice(0, 10);
}

/** Fin del día (Argentina) de una fecha "YYYY-MM-DD", en ms UTC. */
function arDayEnd(key) {
  return new Date(`${key}T23:59:59.999Z`).getTime() + AR_OFFSET_MS;
}

/** Inicio del mes (Argentina) desplazado `offset` meses, en ISO UTC. */
function monthStartIso(offset = 0) {
  const ar = new Date(Date.now() - AR_OFFSET_MS);
  const d = Date.UTC(ar.getUTCFullYear(), ar.getUTCMonth() + offset, 1);
  return new Date(d + AR_OFFSET_MS).toISOString();
}

const BUYERS_LIST = "compradoras";
const PAID_STATUSES = new Set(["approved", "completed"]);

/** Ingresos del mes: lo que te queda (comisión) si Hotmart lo informó, si no el precio pagado. */
function buildSales(rows) {
  const now = Date.now();
  const thisStart = ms(monthStartIso(0));
  const prevStart = ms(monthStartIso(-1));
  // Mismo tramo del mes pasado (del 1 al día de hoy) para comparar parejo
  const prevSameDay = prevStart + (now - thisStart);

  const amountOf = (s) =>
    s.net_amount != null
      ? { value: Number(s.net_amount), currency: s.net_currency || s.currency || "" }
      : { value: Number(s.price || 0), currency: s.currency || "" };

  const sum = (list) => {
    const byCur = {};
    for (const s of list) {
      const a = amountOf(s);
      byCur[a.currency] = (byCur[a.currency] || 0) + a.value;
    }
    return Object.entries(byCur)
      .map(([currency, value]) => ({ currency, value: Math.round(value * 100) / 100 }))
      // USD primero (es la moneda de tus precios); el resto, de mayor a menor
      .sort((a, b) => (b.currency === "USD") - (a.currency === "USD") || b.value - a.value);
  };

  const paid = rows.filter((s) => PAID_STATUSES.has(s.status) && s.approved_at);
  const inRange = (s, from, to) => {
    const t = ms(s.approved_at);
    return t >= from && t < to;
  };
  const thisMonth = paid.filter((s) => inRange(s, thisStart, now + 1));
  const prevPeriod = paid.filter((s) => inRange(s, prevStart, prevSameDay));
  const prevMonth = paid.filter((s) => inRange(s, prevStart, thisStart));

  const byProduct = {};
  for (const s of thisMonth) {
    const key = s.resource_slug || s.product_name || "Otro";
    const p = (byProduct[key] ||= { key, name: s.product_name || key, slug: s.resource_slug, count: 0, list: [] });
    p.count++;
    p.list.push(s);
  }

  const refunds = rows.filter(
    (s) => (s.status === "refunded" || s.status === "chargeback") && ms(s.updated_at) >= thisStart
  ).length;

  return {
    thisMonth: { count: thisMonth.length, totals: sum(thisMonth) },
    prevPeriod: { count: prevPeriod.length, totals: sum(prevPeriod) },
    prevMonth: { count: prevMonth.length, totals: sum(prevMonth) },
    byProduct: Object.values(byProduct)
      .map(({ list, ...p }) => ({ ...p, totals: sum(list) }))
      .sort((a, b) => b.count - a.count),
    refunds,
    recent: paid.slice(0, 5).map((s) => ({
      transaction: s.transaction,
      product: s.product_name,
      buyer: s.buyer_name ? s.buyer_name.split(" ")[0] : null,
      amount: amountOf(s),
      at: s.approved_at,
    })),
    usesNet: thisMonth.some((s) => s.net_amount != null),
  };
}

async function safe(fn) {
  try {
    return await fn();
  } catch (err) {
    console.error("dashboard:", err);
    return { error: err?.message || "Error" };
  }
}

// ─── Newsletter (Resend) ─────────────────────────────────────────────────────
// Resend permite ~2 llamadas por segundo, así que todo va en fila.

async function loadResend() {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const contacts = await listAllContacts(resend, AUDIENCE_ID);

  let newsletter;
  try {
    await sleep(550);
    const { data, error } = await resend.broadcasts.list();
    if (error) throw new Error(error.message);
    const all = data?.data ?? [];
    const now = Date.now();

    const sent = all
      .filter((b) => b.status === "sent")
      .sort((a, b) => ms(b.sent_at || b.created_at) - ms(a.sent_at || a.created_at));
    const scheduled = all
      .filter((b) => b.status === "scheduled" && ms(b.scheduled_at) > now)
      .sort((a, b) => ms(a.scheduled_at) - ms(b.scheduled_at));
    const drafts = all.filter((b) => b.status === "draft").length;

    async function detail(b) {
      if (!b) return null;
      await sleep(550);
      const { data: d } = await resend.broadcasts.get(b.id).catch(() => ({ data: null }));
      return {
        id: b.id,
        subject: d?.subject || b.subject || b.name || "(sin asunto)",
        sentAt: b.sent_at || null,
        scheduledAt: b.scheduled_at || null,
        metrics: d?.metrics ?? null,
      };
    }

    newsletter = {
      last: await detail(sent[0]),
      next: await detail(scheduled[0]),
      scheduledCount: scheduled.length,
      drafts,
    };
  } catch (err) {
    newsletter = { error: err.message };
  }

  return { contacts, newsletter };
}

// ─── Tráfico (Vercel) ────────────────────────────────────────────────────────

async function loadTraffic() {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) return { error: "VERCEL_API_TOKEN no configurado", setup: true };

  const current = dateRange(30);
  const previous = dateRange(30, 30);
  const [now, before, paths] = await Promise.all([
    vaFetch("/visits/count", current, token),
    vaFetch("/visits/count", previous, token).catch(() => null),
    vaFetch("/visits/aggregate", { ...current, by: "requestPath", limit: "100" }, token).catch(() => null),
  ]);

  return {
    visitors: now?.data?.visitors ?? null,
    pageviews: now?.data?.pageviews ?? null,
    prevVisitors: before?.data?.visitors ?? null,
    prevPageviews: before?.data?.pageviews ?? null,
    paths: paths?.data ?? [],
  };
}

// ─── Suscriptoras ────────────────────────────────────────────────────────────

function buildAudience({ lists, rowsBySlug, contacts, cartaUnsubDates, cartaUnsubEvents }) {
  const now = Date.now();
  const d30 = now - 30 * DAY_MS;
  const d60 = now - 60 * DAY_MS;
  const d1 = now - DAY_MS;

  // Normaliza cada lista a [{ email, created, unsub, active }]
  const members = {};
  for (const list of lists) {
    if (list.slug === "carta") {
      members.carta = (contacts ?? []).map((c) => {
        const email = (c.email || "").toLowerCase();
        return {
          email,
          created: ms(c.created_at),
          // Resend no guarda cuándo se dio de baja; se usa el aviso que quedó en el hub.
          unsub: c.unsubscribed ? cartaUnsubDates[email] ?? null : null,
          active: !c.unsubscribed,
          unknownUnsub: c.unsubscribed && !cartaUnsubDates[email],
        };
      });
    } else {
      members[list.slug] = (rowsBySlug[list.slug] ?? []).map((r) => ({
        email: (r.email || "").toLowerCase(),
        created: ms(r.created_at),
        unsub: r.subscribed ? null : ms(r.unsubscribed_at),
        active: !!r.subscribed,
        unknownUnsub: !r.subscribed && !r.unsubscribed_at,
      }));
    }
  }

  const countIn = (arr, from, to) => arr.filter((t) => t != null && t >= from && t < to).length;

  const perList = lists.map((list) => {
    const m = members[list.slug] ?? [];
    const created = m.map((x) => x.created);
    // Bajas: para carta se cuentan los avisos (incluye las bajas desde el link de Resend).
    const unsubs = list.slug === "carta" ? cartaUnsubEvents : m.map((x) => x.unsub);
    return {
      slug: list.slug,
      name: list.name,
      active: m.filter((x) => x.active).length,
      new30: countIn(created, d30, now + 1),
      newPrev30: countIn(created, d60, d30),
      unsub30: countIn(unsubs, d30, now + 1),
      unsubPrev30: countIn(unsubs, d60, d30),
      new24h: countIn(created, d1, now + 1),
      unsub24h: countIn(unsubs, d1, now + 1),
    };
  });

  const sum = (k) => perList.reduce((s, l) => s + l[k], 0);
  const uniqueActive = new Set(
    Object.values(members).flat().filter((x) => x.active).map((x) => x.email)
  ).size;

  // Serie diaria de suscriptoras activas al cierre de cada día.
  const days = [];
  for (let i = GROWTH_DAYS - 1; i >= 0; i--) days.push(arDayKey(now - i * DAY_MS));
  const series = lists.map((list) => {
    const m = (members[list.slug] ?? []).filter((x) => x.created != null && !x.unknownUnsub);
    return {
      slug: list.slug,
      name: list.name,
      values: days.map((key) => {
        const end = arDayEnd(key);
        let n = 0;
        for (const x of m) if (x.created <= end && (x.unsub == null || x.unsub > end)) n++;
        return n;
      }),
    };
  });

  return {
    uniqueActive,
    totals: {
      active: sum("active"),
      new30: sum("new30"),
      unsub30: sum("unsub30"),
      net30: sum("new30") - sum("unsub30"),
      netPrev30: sum("newPrev30") - sum("unsubPrev30"),
      new24h: sum("new24h"),
      unsub24h: sum("unsub24h"),
    },
    lists: perList,
    growth: { days, series },
  };
}

// ─── Próximo domingo (La carta sale los domingos a las 9) ────────────────────

function upcomingSunday() {
  const ar = new Date(Date.now() - AR_OFFSET_MS); // reloj de Argentina leído como UTC
  const dow = ar.getUTCDay();
  const pastSendTime = ar.getUTCHours() >= 9;
  const add = dow === 0 ? (pastSendTime ? 7 : 0) : 7 - dow;
  const sunday = new Date(ar.getTime() + add * DAY_MS);
  return sunday.toISOString().slice(0, 10);
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function GET() {
  const supabase = getSupabaseAdmin();
  const yearAgo = new Date(Date.now() - 365 * DAY_MS).toISOString();

  const [resendData, traffic, db] = await Promise.all([
    safe(loadResend),
    safe(loadTraffic),
    safe(async () => {
      const lists = await getLists(supabase);
      const supabaseLists = lists.filter((l) => l.source !== "resend");
      const rows = await Promise.all(
        supabaseLists.map((l) => fetchSubscribers(supabase, l.slug).catch(() => []))
      );
      const rowsBySlug = Object.fromEntries(supabaseLists.map((l, i) => [l.slug, rows[i]]));

      const [posts, corpoDone, resources, unread, notifs, activity, cartaUnsubs] = await Promise.all([
        supabase
          .from("blog_posts")
          .select("slug, title, published, publish_at, date, created_at, updated_at")
          .order("updated_at", { ascending: false }),
        supabase.from("corpo_post_notifications").select("post_slug"),
        supabase.from("resources").select("slug, title, download_count"),
        supabase.from("admin_notifications").select("id", { count: "exact", head: true }).eq("read", false),
        supabase
          .from("admin_notifications")
          .select("id, type, title, created_at, read")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("activity_log")
          .select("id, action, entity_type, entity_title, created_at")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("admin_notifications")
          .select("created_at, metadata")
          .eq("type", "unsubscribe")
          .eq("metadata->>list", "carta")
          .gte("created_at", yearAgo),
      ]);

      // Ventas de Hotmart desde el inicio del mes pasado (sin las de prueba)
      const sales = await supabase
        .from("sales")
        .select("transaction, status, product_name, resource_slug, buyer_name, price, currency, net_amount, net_currency, approved_at, purchased_at, updated_at")
        .eq("is_test", false)
        .or(`approved_at.gte."${monthStartIso(-1)}",updated_at.gte."${monthStartIso(-1)}"`)
        .order("approved_at", { ascending: false, nullsFirst: false });

      return {
        lists,
        rowsBySlug,
        posts: posts.data ?? [],
        corpoDone: new Set((corpoDone.data ?? []).map((r) => r.post_slug)),
        resources: resources.data ?? [],
        unread: unread.count ?? 0,
        notifs: notifs.data ?? [],
        activity: activity.data ?? [],
        cartaUnsubs: cartaUnsubs.data ?? [],
        sales: sales.error ? null : sales.data ?? [],
        salesError: sales.error?.message ?? null,
      };
    }),
  ]);

  if (db.error) return Response.json({ error: db.error }, { status: 500 });

  const now = Date.now();

  // Suscriptoras
  const cartaUnsubDates = {};
  const cartaUnsubEvents = [];
  const seenUnsub = new Set();
  for (const n of db.cartaUnsubs) {
    const email = (n.metadata?.email || "").toLowerCase();
    const t = ms(n.created_at);
    if (!email) continue;
    if (!cartaUnsubDates[email] || t > cartaUnsubDates[email]) cartaUnsubDates[email] = t;
    // Una baja por mail y por día (el webhook y el link propio pueden avisar las dos veces)
    const key = `${email}|${arDayKey(t)}`;
    if (!seenUnsub.has(key)) {
      seenUnsub.add(key);
      cartaUnsubEvents.push(t);
    }
  }
  const audience = await safe(() =>
    buildAudience({
      // "Compradoras" es una lista de clientas, no de suscriptoras: va en Ventas.
      lists: db.lists.filter(
        (l) => l.slug !== BUYERS_LIST && !(resendData.error && l.slug === "carta")
      ),
      rowsBySlug: db.rowsBySlug,
      contacts: resendData.contacts,
      cartaUnsubDates,
      cartaUnsubEvents,
    })
  );
  if (resendData.error && !audience.error) audience.warning = "No se pudo leer La carta del domingo (Resend).";

  // Contenido
  const titleBySlug = Object.fromEntries(db.posts.map((p) => [p.slug, p.title]));
  const published = db.posts.filter((p) => isLive(p));
  const drafts = db.posts.filter((p) => !p.published && !p.publish_at);
  const scheduledPosts = db.posts
    .filter((p) => !p.published && p.publish_at && ms(p.publish_at) > now)
    .sort((a, b) => ms(a.publish_at) - ms(b.publish_at));
  const corpoPending = published.filter((p) => !db.corpoDone.has(p.slug));

  // Lo que mejor funciona
  let topPosts = null;
  if (!traffic.error) {
    const byPost = {};
    for (const row of traffic.paths ?? []) {
      const m = /^\/blog\/([^/?#]+)/.exec(row.requestPath || "");
      if (!m) continue;
      byPost[m[1]] = (byPost[m[1]] || 0) + (row.pageviews || 0);
    }
    topPosts = Object.entries(byPost)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([slug, pageviews]) => ({ slug, title: titleBySlug[slug] || slug, pageviews }));
  }
  const topResources = [...db.resources]
    .sort((a, b) => (b.download_count || 0) - (a.download_count || 0))
    .slice(0, 3)
    .map((r) => ({ slug: r.slug, title: r.title, downloads: r.download_count || 0 }));
  const totalDownloads = db.resources.reduce((s, r) => s + (r.download_count || 0), 0);

  // Newsletter + recordatorio del domingo
  const newsletter = resendData.error ? { error: resendData.error } : resendData.newsletter;
  const sunday = upcomingSunday();
  const cartaScheduled =
    !newsletter.error &&
    !!newsletter.next?.scheduledAt &&
    ms(newsletter.next.scheduledAt) <= arDayEnd(sunday);

  // Actividad reciente: acciones propias + avisos del hub, mezclados por fecha
  const activity = [
    ...db.activity.map((a) => ({
      id: `a-${a.id}`,
      kind: "activity",
      action: a.action,
      entity: a.entity_type,
      title: a.entity_title,
      at: a.created_at,
    })),
    ...db.notifs.map((n) => ({
      id: `n-${n.id}`,
      kind: "notification",
      type: n.type,
      title: n.title,
      at: n.created_at,
      unread: !n.read,
    })),
  ]
    .sort((a, b) => ms(b.at) - ms(a.at))
    .slice(0, 7);

  return Response.json({
    generatedAt: new Date().toISOString(),
    audience,
    traffic: traffic.error
      ? traffic
      : {
          visitors: traffic.visitors,
          pageviews: traffic.pageviews,
          prevVisitors: traffic.prevVisitors,
          prevPageviews: traffic.prevPageviews,
        },
    content: {
      published: published.length,
      drafts: drafts.map((p) => ({ slug: p.slug, title: p.title, updatedAt: p.updated_at })),
      scheduled: scheduledPosts.map((p) => ({ slug: p.slug, title: p.title, publishAt: p.publish_at })),
      corpoPending: corpoPending.map((p) => ({ slug: p.slug, title: p.title })),
    },
    top: { posts: topPosts, resources: topResources, totalDownloads },
    newsletter: newsletter.error
      ? newsletter
      : { ...newsletter, upcomingSunday: sunday, cartaScheduled },
    sales: db.sales ? buildSales(db.sales) : { error: db.salesError || "No se pudieron leer las ventas" },
    unread: db.unread,
    activity,
  });
}
