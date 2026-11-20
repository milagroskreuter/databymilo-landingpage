"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { typeMeta, timeAgo } from "./notificationMeta";

const BASE = "/administracion-general";

// Colores de las listas en el gráfico (orden fijo, validados para daltonismo).
// Si hay más de 4 listas, las que sobran se suman en "Otras".
const SERIES_COLORS = ["#b0285f", "#1a85b8", "#c27a1e", "#7a5fd0"];

const ACTION_LABELS = {
  publish: "Publicaste",
  schedule: "Programaste",
  draft: "Guardaste como borrador",
  delete: "Eliminaste",
  duplicate: "Duplicaste",
  restore: "Restauraste",
  update: "Actualizaste",
  create: "Creaste",
};
const ENTITY_LABELS = { post: "la nota", recurso: "el recurso", newsletter: "el newsletter" };

// ─── Utilidades ──────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null) return "—";
  if (Math.abs(n) >= 10000) return (n / 1000).toFixed(1).replace(".0", "") + "k";
  return n.toLocaleString("es-AR");
}

function plural(n, one, many) {
  return `${fmt(n)} ${n === 1 ? one : many}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return "Buenas noches";
  if (h < 13) return "Buen día";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

function shortDate(iso, opts = {}) {
  if (!iso) return "";
  const d = iso.length === 10 ? new Date(iso + "T12:00:00") : new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short", ...opts });
}

function longDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Variación contra el período anterior: { pct, dir } o null si no hay base. */
function delta(current, previous) {
  if (current == null || previous == null) return null;
  if (previous === 0) return current === 0 ? { pct: 0, dir: "flat" } : null;
  const pct = Math.round(((current - previous) / Math.abs(previous)) * 100);
  return { pct, dir: pct > 0 ? "up" : pct < 0 ? "down" : "flat" };
}

// ─── Piezas chicas ───────────────────────────────────────────────────────────

function Skeleton({ h = 16, w = "100%", style }) {
  return <span className="adm-skel" style={{ height: h, width: w, ...style }} aria-hidden="true" />;
}

function Trend({ d, label = "vs. 30 días previos" }) {
  if (!d) return <span className="adm-trend adm-trend-flat">sin datos previos</span>;
  const arrow = d.dir === "up" ? "↑" : d.dir === "down" ? "↓" : "→";
  return (
    <span className={`adm-trend adm-trend-${d.dir}`}>
      {arrow} {d.pct > 0 ? "+" : ""}
      {d.pct}% <span className="adm-trend-label">{label}</span>
    </span>
  );
}

function Card({ title, action, children, className = "" }) {
  return (
    <section className={`adm-card ${className}`}>
      {(title || action) && (
        <header className="adm-card-head">
          {title && <h2 className="adm-card-title">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

function CardError({ children }) {
  return <p className="adm-card-note">{children}</p>;
}

function Kpi({ label, value, sub, trend, loading, href }) {
  const body = (
    <>
      <div className="adm-stat-label">{label}</div>
      {loading ? (
        <>
          <Skeleton h={36} w="60%" style={{ marginBottom: 8 }} />
          <Skeleton h={12} w="80%" />
        </>
      ) : (
        <>
          <div className="adm-stat-value">{value}</div>
          {trend}
          {sub && <div className="adm-stat-sub">{sub}</div>}
        </>
      )}
    </>
  );
  return href ? (
    <Link href={href} className="adm-stat-card adm-stat-link">{body}</Link>
  ) : (
    <div className="adm-stat-card">{body}</div>
  );
}

// ─── Gráfico de crecimiento ──────────────────────────────────────────────────

function niceMax(v) {
  if (v <= 5) return 5;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

function foldSeries(series) {
  if (series.length <= SERIES_COLORS.length) return series;
  const keep = series.slice(0, SERIES_COLORS.length - 1);
  const rest = series.slice(SERIES_COLORS.length - 1);
  return [
    ...keep,
    {
      slug: "_otras",
      name: "Otras listas",
      values: rest[0].values.map((_, i) => rest.reduce((s, r) => s + r.values[i], 0)),
    },
  ];
}

function GrowthChart({ growth }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState(null);
  const [showTable, setShowTable] = useState(false);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const days = growth?.days ?? [];
  const series = foldSeries(growth?.series ?? []).map((s, i) => ({ ...s, color: SERIES_COLORS[i] }));
  const n = days.length;

  const narrow = width < 520;
  const H = 230;
  const pad = { top: 14, right: narrow ? 14 : 132, bottom: 26, left: 36 };
  const innerW = Math.max(width - pad.left - pad.right, 10);
  const innerH = H - pad.top - pad.bottom;
  const maxV = niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
  const ticks = [0, maxV / 2, maxV];

  const x = (i) => pad.left + (n <= 1 ? 0 : (i / (n - 1)) * innerW);
  const y = (v) => pad.top + innerH - (v / maxV) * innerH;

  // Etiquetas directas al final de cada línea, separadas para que no se pisen.
  const endLabels = series
    .map((s) => ({ ...s, last: s.values[n - 1] ?? 0, ly: y(s.values[n - 1] ?? 0) }))
    .sort((a, b) => a.ly - b.ly);
  for (let i = 1; i < endLabels.length; i++) {
    if (endLabels[i].ly - endLabels[i - 1].ly < 16) endLabels[i].ly = endLabels[i - 1].ly + 16;
  }

  const xTicks = n > 0 ? [0, Math.round((n - 1) / 3), Math.round(((n - 1) * 2) / 3), n - 1] : [];

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = Math.round(((px - pad.left) / innerW) * (n - 1));
    setHover(i >= 0 && i < n ? i : null);
  }

  // Tabla accesible: un valor por semana
  const weekly = [];
  for (let i = n - 1; i >= 0; i -= 7) weekly.unshift(i);

  return (
    <div>
      <div className="adm-legend">
        {series.map((s) => (
          <span key={s.slug} className="adm-legend-item">
            <span className="adm-legend-swatch" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>

      <div ref={wrapRef} className="adm-chart-wrap">
        {width > 0 && n > 0 && (
          <svg
            width={width}
            height={H}
            role="img"
            aria-label={`Suscriptoras activas por lista en los últimos ${n} días`}
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.left} x2={pad.left + innerW} y1={y(t)} y2={y(t)} className="adm-chart-grid" />
                <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" className="adm-chart-axis">
                  {fmt(t)}
                </text>
              </g>
            ))}
            {xTicks.map((i, k) => (
              <text
                key={i}
                x={x(i)}
                y={H - 6}
                textAnchor={k === 0 ? "start" : k === xTicks.length - 1 ? "end" : "middle"}
                className="adm-chart-axis"
              >
                {shortDate(days[i])}
              </text>
            ))}

            {series.map((s) => (
              <path
                key={s.slug}
                d={s.values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("")}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}

            {!narrow &&
              endLabels.map((s) => (
                <g key={s.slug}>
                  <circle cx={x(n - 1)} cy={y(s.last)} r="4" fill={s.color} stroke="#fff" strokeWidth="2" />
                  <text x={x(n - 1) + 10} y={s.ly + 4} className="adm-chart-label">
                    <tspan className="adm-chart-label-value">{fmt(s.last)}</tspan> {s.name}
                  </text>
                </g>
              ))}

            {hover != null && (
              <g pointerEvents="none">
                <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + innerH} className="adm-chart-cross" />
                {series.map((s) => (
                  <circle key={s.slug} cx={x(hover)} cy={y(s.values[hover])} r="4.5" fill={s.color} stroke="#fff" strokeWidth="2" />
                ))}
              </g>
            )}
          </svg>
        )}

        {hover != null && (
          <div
            className="adm-chart-tip"
            style={{
              left: Math.min(Math.max(x(hover) - 80, 0), Math.max(width - 170, 0)),
              top: 0,
            }}
          >
            <div className="adm-chart-tip-date">{shortDate(days[hover], { weekday: "short" })}</div>
            {series.map((s) => (
              <div key={s.slug} className="adm-chart-tip-row">
                <span className="adm-legend-swatch" style={{ background: s.color }} />
                <span className="adm-chart-tip-name">{s.name}</span>
                <strong>{fmt(s.values[hover])}</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      <button type="button" className="adm-link-btn" onClick={() => setShowTable((v) => !v)}>
        {showTable ? "Ocultar tabla" : "Ver como tabla"}
      </button>
      {showTable && (
        <div className="adm-table-wrap adm-dash-table">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Semana</th>
                {series.map((s) => <th key={s.slug}>{s.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {weekly.map((i) => (
                <tr key={i}>
                  <td>{shortDate(days[i])}</td>
                  {series.map((s) => <td key={s.slug}>{fmt(s.values[i])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Bloques ─────────────────────────────────────────────────────────────────

function Summary({ data }) {
  const parts = [];
  const t = data.audience?.totals;
  if (t) {
    if (t.new24h === 0 && t.unsub24h === 0) parts.push("Sin movimientos en las listas desde ayer.");
    else {
      const bits = [];
      if (t.new24h) bits.push(plural(t.new24h, "suscripción nueva", "suscripciones nuevas"));
      if (t.unsub24h) bits.push(plural(t.unsub24h, "baja", "bajas"));
      parts.push(`Desde ayer: ${bits.join(" y ")}.`);
    }
  }
  const nl = data.newsletter;
  if (nl && !nl.error) {
    if (nl.next?.scheduledAt) parts.push(`El próximo envío sale el ${longDateTime(nl.next.scheduledAt)}.`);
    else parts.push("No hay ningún newsletter programado.");
  }
  if (data.unread) parts.push(`Tenés ${plural(data.unread, "notificación sin leer", "notificaciones sin leer")}.`);
  return <p className="adm-dash-summary">{parts.join(" ")}</p>;
}

function NewsletterCard({ nl }) {
  if (!nl) return null;
  if (nl.error) return <CardError>No se pudo leer Resend: {nl.error}</CardError>;
  const m = nl.last?.metrics;
  return (
    <div className="adm-nl">
      <div className="adm-nl-block">
        <div className="adm-mini-label">Próximo envío</div>
        {nl.next ? (
          <>
            <div className="adm-nl-subject">{nl.next.subject}</div>
            <div className="adm-nl-when">{longDateTime(nl.next.scheduledAt)}</div>
            {nl.scheduledCount > 1 && (
              <div className="adm-nl-when">+{nl.scheduledCount - 1} más programados</div>
            )}
          </>
        ) : (
          <>
            <div className="adm-nl-empty">Nada programado todavía</div>
            <Link href={`${BASE}/newsletter/compose`} className="adm-btn adm-btn-primary adm-btn-sm adm-nl-cta">
              Escribir la carta
            </Link>
          </>
        )}
      </div>
      <div className="adm-nl-block">
        <div className="adm-mini-label">Último enviado</div>
        {nl.last ? (
          <>
            <div className="adm-nl-subject">{nl.last.subject}</div>
            <div className="adm-nl-when">{nl.last.sentAt ? shortDate(nl.last.sentAt, { year: "numeric" }) : ""}</div>
            {m && (m.opens != null || m.clicks != null) ? (
              <div className="adm-nl-metrics">
                {m.opens != null && <span><strong>{fmt(m.opens)}</strong> aperturas</span>}
                {m.clicks != null && <span><strong>{fmt(m.clicks)}</strong> clics</span>}
                {m.unsubscribes != null && <span><strong>{fmt(m.unsubscribes)}</strong> bajas</span>}
              </div>
            ) : (
              <div className="adm-nl-when">Resend no informa aperturas para este envío.</div>
            )}
          </>
        ) : (
          <div className="adm-nl-empty">Todavía no hay envíos</div>
        )}
      </div>
    </div>
  );
}

function PendingCard({ data }) {
  const [links, setLinks] = useState(null); // null | "loading" | { broken, total } | { error }

  async function checkLinks() {
    setLinks("loading");
    try {
      const res = await fetch("/api/admin/blog/check-links");
      const d = await res.json();
      setLinks(res.ok ? d : { error: d.error || "No se pudo revisar" });
    } catch {
      setLinks({ error: "No se pudo revisar" });
    }
  }

  const items = [];
  const nl = data.newsletter;
  if (nl && !nl.error && !nl.cartaScheduled) {
    items.push({
      key: "carta",
      tone: "warn",
      text: `La carta del domingo ${shortDate(nl.upcomingSunday)} todavía no está programada`,
      href: `${BASE}/newsletter/compose`,
      cta: "Escribir",
    });
  }
  if (nl?.drafts) {
    items.push({
      key: "nl-drafts",
      text: `${plural(nl.drafts, "borrador", "borradores")} de newsletter sin enviar`,
      href: `${BASE}/newsletter`,
      cta: "Ver",
    });
  }
  for (const p of data.content.corpoPending) {
    items.push({
      key: `corpo-${p.slug}`,
      tone: "warn",
      text: `"${p.title}" todavía no se avisó a Edición Corpo`,
      href: `${BASE}/blog/${p.slug}`,
      cta: "Abrir",
    });
  }
  for (const p of data.content.drafts.slice(0, 4)) {
    items.push({
      key: `draft-${p.slug}`,
      text: `Borrador: "${p.title}"`,
      sub: p.updatedAt ? `editado ${timeAgo(p.updatedAt)}` : null,
      href: `${BASE}/blog/${p.slug}`,
      cta: "Seguir",
    });
  }
  if (data.content.drafts.length > 4) {
    items.push({
      key: "more-drafts",
      text: `y ${plural(data.content.drafts.length - 4, "borrador más", "borradores más")}`,
      href: `${BASE}/blog`,
      cta: "Ver todos",
    });
  }
  if (data.unread) {
    items.push({
      key: "unread",
      text: plural(data.unread, "notificación sin leer", "notificaciones sin leer"),
      href: `${BASE}/notificaciones`,
      cta: "Leer",
    });
  }
  if (links && links !== "loading" && links.broken?.length) {
    const posts = new Set(links.broken.map((l) => l.post_title));
    items.push({
      key: "links",
      tone: "warn",
      text: `${plural(links.broken.length, "link roto", "links rotos")} en ${plural(posts.size, "nota", "notas")}`,
      sub: [...posts].slice(0, 2).join(" · "),
      href: `${BASE}/blog`,
      cta: "Ver",
    });
  }

  return (
    <>
      {items.length === 0 ? (
        <p className="adm-card-note adm-all-done">✓ Todo al día. No hay nada pendiente.</p>
      ) : (
        <ul className="adm-todo">
          {items.map((it) => (
            <li key={it.key} className={`adm-todo-item ${it.tone === "warn" ? "warn" : ""}`}>
              <span className="adm-todo-mark" aria-hidden="true">{it.tone === "warn" ? "!" : "•"}</span>
              <span className="adm-todo-txt">
                {it.text}
                {it.sub && <span className="adm-todo-sub">{it.sub}</span>}
              </span>
              <Link href={it.href} className="adm-todo-cta">{it.cta} →</Link>
            </li>
          ))}
        </ul>
      )}

      {data.content.scheduled.length > 0 && (
        <div className="adm-todo-foot">
          <div className="adm-mini-label">Notas programadas</div>
          {data.content.scheduled.slice(0, 3).map((p) => (
            <Link key={p.slug} href={`${BASE}/blog/${p.slug}`} className="adm-sched-row">
              <span>{p.title}</span>
              <span className="adm-sched-date">{shortDate(p.publishAt)}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="adm-todo-foot adm-links-check">
        {links === "loading" ? (
          <span className="adm-card-note">Revisando links del blog… puede tardar unos segundos.</span>
        ) : links?.error ? (
          <span className="adm-card-note">{links.error}</span>
        ) : links ? (
          links.broken.length === 0 && (
            <span className="adm-card-note">✓ Los {fmt(links.checkedUrls)} links del blog funcionan.</span>
          )
        ) : (
          <button type="button" className="adm-link-btn" onClick={checkLinks}>
            Revisar links rotos del blog
          </button>
        )}
      </div>
    </>
  );
}

function RankList({ rows, unit }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ol className="adm-rank">
      {rows.map((r, i) => (
        <li key={r.key} className="adm-rank-row">
          <span className="adm-rank-pos">{i + 1}</span>
          <span className="adm-rank-main">
            <Link href={r.href} className="adm-rank-title">{r.title}</Link>
            <span className="adm-rank-bar">
              <span style={{ width: `${(r.value / max) * 100}%` }} />
            </span>
          </span>
          <span className="adm-rank-val">
            {fmt(r.value)} <span>{unit}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function TopCard({ data, trafficError }) {
  const { posts, resources } = data.top;
  return (
    <>
      <div className="adm-mini-label">Notas más leídas · 30 días</div>
      {trafficError ? (
        <CardError>
          {data.traffic?.setup ? "Falta configurar VERCEL_API_TOKEN para ver visitas." : "No se pudieron leer las visitas."}
        </CardError>
      ) : posts?.length ? (
        <RankList
          unit="vistas"
          rows={posts.map((p) => ({ key: p.slug, title: p.title, value: p.pageviews, href: `${BASE}/blog/${p.slug}` }))}
        />
      ) : (
        <CardError>Todavía no hay visitas a notas en este período.</CardError>
      )}

      <div className="adm-mini-label" style={{ marginTop: 18 }}>Recursos más descargados</div>
      {resources.length > 0 && resources[0].downloads > 0 ? (
        <RankList
          unit="descargas"
          rows={resources.map((r) => ({ key: r.slug, title: r.title, value: r.downloads, href: `${BASE}/recursos/${r.slug}` }))}
        />
      ) : (
        <CardError>Todavía no hay descargas registradas.</CardError>
      )}
    </>
  );
}

function ActivityCard({ items }) {
  if (!items.length) return <CardError>Todavía no hay actividad.</CardError>;
  return (
    <ul className="adm-feed">
      {items.map((it) => {
        let icon, color, text;
        if (it.kind === "notification") {
          const meta = typeMeta(it.type);
          icon = meta.icon;
          color = meta.color;
          text = it.title;
        } else {
          icon = "✎";
          color = "#8b1a4a";
          const verb = ACTION_LABELS[it.action] || it.action;
          text = `${verb} ${ENTITY_LABELS[it.entity] || ""} "${it.title || ""}"`.replace(/\s+/g, " ");
        }
        return (
          <li key={it.id} className={`adm-feed-item ${it.unread ? "unread" : ""}`}>
            <span className="adm-feed-ico" style={{ color, background: color + "14" }} aria-hidden="true">{icon}</span>
            <span className="adm-feed-txt">
              <span className="adm-feed-title">{text}</span>
              <span className="adm-feed-time">{timeAgo(it.at)}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function fmtMoney(t) {
  if (!t) return "—";
  const v = t.value.toLocaleString("es-AR", { maximumFractionDigits: 2 });
  return t.currency ? `${t.currency} ${v}` : v;
}

/** Varias monedas: "USD 45 · BRL 120". */
function fmtTotals(totals) {
  if (!totals?.length) return "—";
  return totals.map(fmtMoney).join(" · ");
}

function SalesCard({ sales }) {
  if (!sales) return null;
  if (sales.error) return <CardError>No se pudieron leer las ventas: {sales.error}</CardError>;
  const { thisMonth, byProduct, recent, refunds } = sales;
  if (!thisMonth.count && !recent.length) {
    return (
      <div className="adm-sales-empty">
        <p className="adm-card-note">
          Todavía no hay ventas registradas. Cada compra en Hotmart va a aparecer acá sola,
          con su notificación en la campanita.
        </p>
        <p className="adm-card-note">Las compradoras se suman solas a la lista <strong>Compradoras</strong>.</p>
      </div>
    );
  }
  return (
    <div className="adm-sales">
      <div>
        <div className="adm-mini-label">Por ebook · este mes</div>
        {byProduct.length ? (
          <RankList
            unit="ventas"
            rows={byProduct.map((p) => ({
              key: p.key,
              title: `${p.name} · ${fmtTotals(p.totals)}`,
              value: p.count,
              href: p.slug ? `${BASE}/recursos/${p.slug}` : `${BASE}/recursos`,
            }))}
          />
        ) : (
          <CardError>Sin ventas este mes todavía.</CardError>
        )}
        {refunds > 0 && (
          <p className="adm-card-note" style={{ marginTop: 10 }}>
            ↩ {plural(refunds, "reembolso", "reembolsos")} este mes.
          </p>
        )}
      </div>
      <div>
        <div className="adm-mini-label">Últimas ventas</div>
        <ul className="adm-feed">
          {recent.map((s) => (
            <li key={s.transaction} className="adm-feed-item">
              <span className="adm-feed-ico" style={{ color: "#17663e", background: "#17663e14" }} aria-hidden="true">$</span>
              <span className="adm-feed-txt">
                <span className="adm-feed-title">
                  <strong>{fmtMoney(s.amount)}</strong> · {s.product || "Producto"}
                  {s.buyer ? ` · ${s.buyer}` : ""}
                </span>
                <span className="adm-feed-time">{timeAgo(s.at)}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Página ──────────────────────────────────────────────────────────────────

const SHORTCUTS = [
  { href: `${BASE}/newsletter/compose`, label: "Escribir newsletter", icon: "✦" },
  { href: `${BASE}/blog/new`, label: "Nueva nota", icon: "✎" },
  { href: `${BASE}/recursos/new`, label: "Nuevo recurso", icon: "⬡" },
  { href: `${BASE}/listas`, label: "Listas", icon: "☰" },
  { href: `${BASE}/stats`, label: "Estadísticas", icon: "▲" },
];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || `Error ${res.status}`);
      setData(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // refresca el "actualizado hace…" cada minuto
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, [load]);

  const aud = data?.audience;
  const audOk = aud && !aud.error;
  const traffic = data?.traffic;
  const trafficOk = traffic && !traffic.error;
  const first = loading && !data;
  const sales = data?.sales;
  const salesOk = sales && !sales.error;

  return (
    <>
      <div className="adm-header">
        <div>
          <h1>{greeting()}</h1>
          <div className="adm-dash-date">
            {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>
        <div className="adm-dash-refresh">
          {data && <span>Actualizado {timeAgo(data.generatedAt)}</span>}
          <button type="button" className="adm-btn adm-btn-secondary adm-btn-sm" onClick={load} disabled={loading}>
            {loading ? "Cargando…" : "↺ Actualizar"}
          </button>
        </div>
      </div>

      <div className="adm-content">
        {error && <div className="adm-alert adm-alert-error">No se pudo cargar el dashboard: {error}</div>}

        {first ? <Skeleton h={18} w="70%" /> : data && <Summary data={data} />}

        {/* Números principales */}
        <div className="adm-stats-grid adm-dash-kpis">
          <Kpi
            loading={first}
            label="Ingresos del mes"
            value={salesOk ? (sales.thisMonth.totals[0] ? fmtMoney(sales.thisMonth.totals[0]) : "0") : "—"}
            trend={
              salesOk &&
              sales.thisMonth.totals.length <= 1 &&
              sales.prevPeriod.totals.length <= 1 && (
                <Trend
                  d={delta(sales.thisMonth.totals[0]?.value ?? 0, sales.prevPeriod.totals[0]?.value ?? 0)}
                  label="vs. mismo tramo del mes pasado"
                />
              )
            }
            sub={
              salesOk
                ? [
                    plural(sales.thisMonth.count, "venta", "ventas"),
                    sales.thisMonth.totals.length > 1 ? `+ ${fmtTotals(sales.thisMonth.totals.slice(1))}` : null,
                    sales.usesNet ? "lo que te queda después de Hotmart" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : sales?.error && "No disponible"
            }
          />
          <Kpi
            loading={first}
            label="Suscriptoras"
            href={`${BASE}/newsletter`}
            value={audOk ? fmt(aud.uniqueActive) : "—"}
            sub={
              audOk
                ? aud.lists.filter((l) => l.active > 0 || l.slug === "carta" || l.slug === "corpo")
                    .map((l) => `${l.name}: ${fmt(l.active)}`)
                    .join(" · ")
                : aud?.error
            }
          />
          <Kpi
            loading={first}
            label="Crecimiento neto · 30 días"
            value={audOk ? `${aud.totals.net30 > 0 ? "+" : ""}${fmt(aud.totals.net30)}` : "—"}
            trend={audOk && <Trend d={delta(aud.totals.net30, aud.totals.netPrev30)} />}
            sub={audOk ? `${fmt(aud.totals.new30)} altas · ${fmt(aud.totals.unsub30)} bajas` : null}
          />
          <Kpi
            loading={first}
            label="Visitas · 30 días"
            href={`${BASE}/stats`}
            value={trafficOk ? fmt(traffic.visitors) : "—"}
            trend={trafficOk && <Trend d={delta(traffic.visitors, traffic.prevVisitors)} />}
            sub={
              trafficOk
                ? `${fmt(traffic.pageviews)} páginas vistas`
                : traffic?.setup
                  ? "Falta VERCEL_API_TOKEN"
                  : traffic?.error && "No disponible"
            }
          />
          <Kpi
            loading={first}
            label="Descargas de recursos"
            href={`${BASE}/recursos`}
            value={data ? fmt(data.top.totalDownloads) : "—"}
            sub={data?.top.resources[0]?.downloads ? `La más bajada: ${data.top.resources[0].title}` : "en total"}
          />
        </div>

        {/* Ventas */}
        <Card
          title="Ventas"
          action={
            salesOk && sales.prevMonth.count > 0 ? (
              <span className="adm-card-hint">Mes pasado: {fmtTotals(sales.prevMonth.totals)}</span>
            ) : null
          }
        >
          {first ? <SkeletonList /> : <SalesCard sales={sales} />}
        </Card>

        {/* Crecimiento + newsletter */}
        <div className="adm-dash-row adm-dash-row-main">
          <Card title="Crecimiento de las listas" action={<span className="adm-card-hint">últimos 90 días</span>}>
            {first ? (
              <Skeleton h={230} />
            ) : audOk ? (
              <>
                {aud.warning && <CardError>{aud.warning}</CardError>}
                <GrowthChart growth={aud.growth} />
              </>
            ) : (
              <CardError>No se pudieron leer las listas{aud?.error ? `: ${aud.error}` : "."}</CardError>
            )}
          </Card>

          <Card
            title="Newsletter"
            action={<Link href={`${BASE}/newsletter`} className="adm-card-link">Ver todo →</Link>}
          >
            {first ? (
              <>
                <Skeleton h={14} w="40%" style={{ marginBottom: 10 }} />
                <Skeleton h={20} style={{ marginBottom: 24 }} />
                <Skeleton h={14} w="40%" style={{ marginBottom: 10 }} />
                <Skeleton h={20} />
              </>
            ) : (
              <NewsletterCard nl={data?.newsletter} />
            )}
          </Card>
        </div>

        {/* Pendientes + top + actividad */}
        <div className="adm-dash-row adm-dash-row-3">
          <Card title="Pendientes">
            {first ? <SkeletonList /> : data && <PendingCard data={data} />}
          </Card>
          <Card title="Lo que mejor funciona">
            {first ? <SkeletonList /> : data && <TopCard data={data} trafficError={!trafficOk} />}
          </Card>
          <Card
            title="Actividad reciente"
            action={<Link href={`${BASE}/actividad`} className="adm-card-link">Ver log →</Link>}
          >
            {first ? <SkeletonList /> : data && <ActivityCard items={data.activity} />}
          </Card>
        </div>

        {/* Accesos rápidos */}
        <nav className="adm-shortcuts" aria-label="Accesos rápidos">
          {SHORTCUTS.map((s) => (
            <Link key={s.href} href={s.href} className="adm-shortcut">
              <span className="adm-shortcut-icon" aria-hidden="true">{s.icon}</span>
              {s.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}

function SkeletonList() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[90, 75, 85, 60].map((w, i) => <Skeleton key={i} h={14} w={`${w}%`} />)}
    </div>
  );
}
