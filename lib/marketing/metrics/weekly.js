// Resumen semanal de redes (cron de los lunes): mail a ADMIN_NOTIFY_EMAIL con el
// mismo estilo de los mails del hub + aviso "marketing_weekly" en la campana.
import { Resend } from "resend";
import { ADMIN_NOTIFY_EMAIL, SITE_URL, esc } from "@/lib/notify";
import { networkLabel, NETWORK_BY_ID } from "@/lib/marketing/constants";
import { addDays, arDay, arDayStart, mondayOf, monthOf } from "./dates";
import { interactions, audience } from "./calc";

const FROM = "Data by Milo <hola@databymilo.me>";
const PAGE = `${SITE_URL}/administracion-general/marketing/metricas`;

const nf = (n) => (n == null ? "—" : Number(n).toLocaleString("es-AR"));
const signed = (n) => (n == null ? "—" : `${n > 0 ? "+" : ""}${nf(n)}`);
const shortDate = (iso) =>
  new Date(iso).toLocaleDateString("es-AR", {
    weekday: "short", day: "numeric", month: "short", timeZone: "America/Argentina/Buenos_Aires",
  });
const longDay = (day) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("es-AR", { day: "numeric", month: "long", timeZone: "UTC" });

/** Junta los datos de la semana pasada (lunes a domingo, hora AR) y de esta semana. */
export async function buildWeeklySummary(supabase, now = Date.now()) {
  const thisMonday = mondayOf(arDay(now));
  const lastMonday = addDays(thisMonday, -7);
  const nextMonday = addDays(thisMonday, 7);
  const from = new Date(arDayStart(lastMonday)).toISOString();
  const to = new Date(arDayStart(thisMonday)).toISOString();
  const toNext = new Date(arDayStart(nextMonday)).toISOString();

  const [postsR, publishedR, scheduledR, snapsR, goalsR, importR] = await Promise.all([
    supabase
      .from("mk_post_metrics")
      .select("network, permalink, caption, media_type, posted_at, reach, impressions, views, likes, comments, saves, shares, extra, content_id, content:mk_content(title, format)")
      .gte("posted_at", from)
      .lt("posted_at", to)
      .order("posted_at"),
    supabase
      .from("mk_content")
      .select("id, title, network, format, published_at, permalink")
      .eq("status", "publicado")
      .gte("published_at", from)
      .lt("published_at", to),
    supabase
      .from("mk_content")
      .select("id, title, network, format, status, scheduled_at")
      .gte("scheduled_at", to)
      .lt("scheduled_at", toNext)
      .not("status", "in", "(publicado,descartado)")
      .order("scheduled_at"),
    supabase
      .from("mk_follower_snapshots")
      .select("network, day, followers")
      .gte("day", addDays(lastMonday, -30))
      .order("day"),
    supabase.from("mk_metrics_goals").select("network, target_followers").eq("month", monthOf(arDay(now))),
    supabase.from("mk_metrics_imports").select("imported_at").eq("network", "linkedin").order("imported_at", { ascending: false }).limit(1),
  ]);
  for (const r of [postsR, publishedR, scheduledR, snapsR, goalsR, importR]) if (r.error) throw new Error(r.error.message);

  const posts = (postsR.data || []).map((p) => ({
    network: p.network,
    title: p.content?.title || (p.caption || "").split("\n")[0].slice(0, 80) || "(sin texto)",
    permalink: p.permalink,
    posted_at: p.posted_at,
    audience: audience(p),
    interactions: interactions(p),
  }));
  // Piezas marcadas como publicadas que todavía no tienen métricas (newsletter, blog, etc.)
  const withMetrics = new Set((postsR.data || []).map((p) => p.content_id).filter(Boolean));
  const noMetrics = (publishedR.data || [])
    .filter((c) => !withMetrics.has(c.id))
    .map((c) => ({ network: c.network, title: c.title, permalink: c.permalink, posted_at: c.published_at, audience: null, interactions: null }));
  const published = [...posts, ...noMetrics].sort((a, b) => (a.posted_at < b.posted_at ? -1 : 1));

  // Crecimiento: último dato hasta el domingo vs. último dato antes del lunes pasado.
  const byNet = {};
  for (const s of snapsR.data || []) (byNet[s.network] ||= []).push(s);
  const goals = Object.fromEntries((goalsR.data || []).map((g) => [g.network, g.target_followers]));
  const growth = Object.entries(byNet)
    .map(([network, list]) => {
      const end = [...list].reverse().find((s) => s.day < thisMonday);
      const start = [...list].reverse().find((s) => s.day < lastMonday);
      const latest = list[list.length - 1];
      return {
        network,
        followers: end?.followers ?? null,
        delta: end && start ? end.followers - start.followers : null,
        latest: latest?.followers ?? null,
        goal: goals[network] ?? null,
      };
    })
    .filter((g) => g.followers != null);

  const lastImport = importR.data?.[0]?.imported_at || null;
  const linkedinStaleDays = lastImport ? Math.floor((now - new Date(lastImport).getTime()) / 86400000) : null;

  const totals = {
    posts: published.length,
    audience: posts.reduce((a, p) => a + (p.audience || 0), 0),
    interactions: posts.reduce((a, p) => a + (p.interactions || 0), 0),
  };
  const best = [...posts].filter((p) => p.interactions != null).sort((a, b) => b.interactions - a.interactions)[0] || null;

  return {
    week_start: lastMonday,
    week_end: addDays(thisMonday, -1),
    this_week: thisMonday,
    published,
    totals,
    best,
    growth,
    scheduled: scheduledR.data || [],
    linkedin_last_import: lastImport,
    linkedin_stale_days: linkedinStaleDays,
  };
}

// ─── Mail ────────────────────────────────────────────────────────────────────

const H2 = 'style="font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:15px;color:#8b1a4a;margin:22px 0 8px;"';
const TD = 'style="padding:6px 0;border-bottom:1px solid rgba(139,26,74,.08);font-size:13px;color:#3d1a2a;vertical-align:top;"';
const TDR = 'style="padding:6px 0 6px 8px;border-bottom:1px solid rgba(139,26,74,.08);font-size:13px;color:#3d1a2a;text-align:right;white-space:nowrap;vertical-align:top;"';
const MUTED = 'style="font-size:13px;color:#9a8a90;margin:0;"';

function dot(network) {
  const c = NETWORK_BY_ID[network]?.color || "#9a8a90";
  return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c};margin-right:6px;"></span>`;
}

export function weeklyEmailHtml(s) {
  const title = `Tu semana en redes · ${longDay(s.week_start)} al ${longDay(s.week_end)}`;

  const publishedRows = s.published.length
    ? `<table width="100%" cellpadding="0" cellspacing="0">${s.published
        .map(
          (p) => `<tr><td ${TD}>${dot(p.network)}${
            p.permalink ? `<a href="${esc(p.permalink)}" style="color:#3d1a2a;">${esc(p.title)}</a>` : esc(p.title)
          }<br/><span style="font-size:11px;color:#9a8a90;">${esc(networkLabel(p.network))} · ${esc(shortDate(p.posted_at))}</span></td>
          <td ${TDR}>${p.audience != null ? `${nf(p.audience)} alcance` : ""}${
            p.interactions != null ? `<br/><span style="color:#8b1a4a;font-weight:700;">${nf(p.interactions)} interacciones</span>` : p.audience == null ? '<span style="color:#9a8a90;">sin métricas</span>' : ""
          }</td></tr>`
        )
        .join("")}</table>`
    : `<p ${MUTED}>No hay publicaciones registradas la semana pasada.</p>`;

  const growthRows = s.growth.length
    ? `<table width="100%" cellpadding="0" cellspacing="0">${s.growth
        .map((g) => {
          const goal =
            g.goal != null
              ? `<br/><span style="font-size:11px;color:#9a8a90;">Meta del mes: ${nf(g.goal)} (${Math.min(100, Math.round(((g.latest ?? g.followers) / g.goal) * 100))}%)</span>`
              : "";
          const color = g.delta > 0 ? "#17663e" : g.delta < 0 ? "#c0392b" : "#9a8a90";
          return `<tr><td ${TD}>${dot(g.network)}${esc(networkLabel(g.network))}${goal}</td>
            <td ${TDR}>${nf(g.followers)}<br/><span style="color:${color};font-weight:700;">${signed(g.delta)}</span></td></tr>`;
        })
        .join("")}</table>`
    : `<p ${MUTED}>Todavía no hay datos de seguidores.</p>`;

  const scheduledRows = s.scheduled.length
    ? `<table width="100%" cellpadding="0" cellspacing="0">${s.scheduled
        .map(
          (c) => `<tr><td ${TD}>${dot(c.network)}${esc(c.title)}</td><td ${TDR}>${esc(shortDate(c.scheduled_at))}</td></tr>`
        )
        .join("")}</table>`
    : `<p ${MUTED}>No hay nada programado para esta semana. Buen momento para armar el calendario.</p>`;

  const summaryLine = `${s.totals.posts} publicaci${s.totals.posts === 1 ? "ón" : "ones"} · ${nf(s.totals.audience)} de alcance · ${nf(s.totals.interactions)} interacciones`;
  const bestLine = s.best
    ? `<p style="font-size:13px;color:#3d1a2a;margin:8px 0 0;">La que mejor anduvo: <strong>${esc(s.best.title)}</strong> (${esc(networkLabel(s.best.network))}, ${nf(s.best.interactions)} interacciones).</p>`
    : "";
  const linkedinNote =
    s.linkedin_stale_days == null
      ? `<p style="font-size:12px;color:#9a8a90;margin:18px 0 0;">LinkedIn todavía no tiene datos: subí el archivo de estadísticas desde la pantalla de Métricas.</p>`
      : s.linkedin_stale_days >= 14
        ? `<p style="font-size:12px;color:#9a8a90;margin:18px 0 0;">Hace ${s.linkedin_stale_days} días que no importás las estadísticas de LinkedIn.</p>`
        : "";

  return {
    title,
    html: `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#fdf5ec;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf5ec;padding:32px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
        <tr><td style="background:#8b1a4a;border-radius:12px 12px 0 0;padding:18px 28px;">
          <span style="font-family:Georgia,serif;font-style:italic;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#f2b7d1;">Data by Milo · resumen semanal</span>
        </td></tr>
        <tr><td style="background:#fffcf6;border:1px solid rgba(139,26,74,.1);border-top:none;border-radius:0 0 12px 12px;padding:28px;">
          <p style="font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:20px;color:#1a0a10;margin:0 0 6px;line-height:1.3;">${esc(title)}</p>
          <p style="font-size:14px;color:#3d1a2a;margin:0;">${esc(summaryLine)}</p>
          ${bestLine}
          <p ${H2}>Qué publicaste</p>
          ${publishedRows}
          <p ${H2}>Seguidores</p>
          ${growthRows}
          <p ${H2}>Programado para esta semana</p>
          ${scheduledRows}
          ${linkedinNote}
          <div style="margin-top:24px;">
            <a href="${PAGE}" style="display:inline-block;background:#8b1a4a;color:#fdf5ec;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:.04em;padding:11px 24px;border-radius:999px;">Ver las métricas &rarr;</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  };
}

function bellBody(s) {
  const lines = [
    `${s.totals.posts} publicaciones · ${nf(s.totals.audience)} de alcance · ${nf(s.totals.interactions)} interacciones.`,
  ];
  const g = s.growth.filter((x) => x.delta != null).map((x) => `${networkLabel(x.network)} ${signed(x.delta)}`);
  if (g.length) lines.push(`Seguidores: ${g.join(" · ")}.`);
  lines.push(s.scheduled.length ? `Esta semana tenés ${s.scheduled.length} programadas.` : "No hay nada programado para esta semana.");
  return lines.join("\n");
}

/**
 * Manda el resumen de la semana pasada una sola vez (mk_metrics_weekly hace de candado).
 * `force` lo vuelve a mandar aunque ya se haya enviado.
 */
export async function sendWeeklySummary(supabase, { force = false } = {}) {
  const summary = await buildWeeklySummary(supabase);

  if (force) await supabase.from("mk_metrics_weekly").delete().eq("week_start", summary.week_start);
  const { error: claimErr } = await supabase
    .from("mk_metrics_weekly")
    .insert({ week_start: summary.week_start, summary });
  if (claimErr) {
    if (claimErr.code === "23505") return { skipped: "ya se envió el resumen de esta semana", week_start: summary.week_start };
    throw new Error(claimErr.message);
  }

  try {
    const { title, html } = weeklyEmailHtml(summary);
    let emailed = false;
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({ from: FROM, to: ADMIN_NOTIFY_EMAIL, subject: `✦ ${title}`, html });
      if (error) console.error("weekly summary mail:", error);
      else emailed = true;
    }
    const { error: nErr } = await supabase.from("admin_notifications").insert({
      type: "marketing_weekly",
      title: "Resumen semanal de redes",
      body: bellBody(summary),
      metadata: { week_start: summary.week_start, link: "/administracion-general/marketing/metricas" },
    });
    if (nErr) console.error("weekly summary bell:", nErr.message);
    return { ok: true, emailed, week_start: summary.week_start, totals: summary.totals };
  } catch (err) {
    // Liberar el candado para que un reintento pueda mandarlo.
    await supabase.from("mk_metrics_weekly").delete().eq("week_start", summary.week_start);
    throw err;
  }
}
