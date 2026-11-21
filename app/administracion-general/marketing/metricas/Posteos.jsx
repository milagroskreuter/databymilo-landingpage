"use client";
import { useMemo, useState } from "react";
import { networkLabel } from "@/lib/marketing/constants";
import { nf, compact, shortDate, netColor, MARK_COLOR } from "./fmt";
import { HBars } from "./charts";

const pctFmt = (v) => (v == null ? "—" : `${nf(v, 1)}%`);

export const POST_METRICS = [
  { id: "audience", label: "Alcance", get: (p) => p._audience, fmt: compact, help: "Personas que vieron la publicación (en LinkedIn y YouTube, impresiones o vistas)" },
  { id: "interactions", label: "Interacciones", get: (p) => p._interactions, fmt: nf, help: "Likes, comentarios, guardados y compartidos sumados" },
  { id: "rate", label: "Tasa de interacción", get: (p) => p._rate, fmt: pctFmt, help: "De cada 100 personas que la vieron, cuántas interactuaron" },
  { id: "saves", label: "Guardados", get: (p) => p.saves, fmt: nf, help: "Cuántas personas la guardaron: señal de que sirve" },
  { id: "shares", label: "Compartidos", get: (p) => p.shares, fmt: nf, help: "Cuántas veces la compartieron" },
  { id: "comments", label: "Comentarios", get: (p) => p.comments, fmt: nf, help: "Conversación que generó" },
  { id: "likes", label: "Likes", get: (p) => p.likes, fmt: nf, help: "Me gusta o reacciones" },
];

const LETTERS = ["A", "B", "C", "D"];
const short = (s, n = 70) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : s);

export default function Posteos({ posts, tableSlot }) {
  const [metricId, setMetricId] = useState("audience");
  const [selected, setSelected] = useState([]); // ids, máx. 4
  const [limit, setLimit] = useState(10);
  const metric = POST_METRICS.find((m) => m.id === metricId);

  const avg = (m) => {
    const vs = posts.map(m.get).filter((v) => v != null);
    return vs.length ? vs.reduce((a, v) => a + v, 0) / vs.length : null;
  };

  const ranked = useMemo(
    () => posts.filter((p) => metric.get(p) != null).sort((a, b) => metric.get(b) - metric.get(a)),
    [posts, metric]
  );
  const average = avg(metric);

  const toggle = (id) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(-4)));

  const tipFor = (p) => [
    { text: short(p._title, 90), muted: true },
    { text: `${metric.label}: ${metric.fmt(metric.get(p))}`, strong: true },
    { text: `${networkLabel(p.network)} · ${shortDate(p.posted_at)}`, muted: true },
    ...(average && metric.get(p) != null ? [{ text: `${nf(((metric.get(p) - average) / average) * 100, 0)}% vs. tu promedio (${metric.fmt(average)})`, muted: true }] : []),
  ];

  const rows = ranked.slice(0, limit).map((p) => ({
    key: p.id,
    label: short(p._title, 58),
    sub: `${networkLabel(p.network)} · ${shortDate(p.posted_at)}`,
    value: metric.get(p),
    color: netColor(p.network),
    tip: tipFor(p),
  }));

  const best = ranked[0];
  const chosen = selected.map((id) => posts.find((p) => p.id === id)).filter(Boolean);

  return (
    <section className="adm-card mk-metricas-section">
      <div className="mk-metricas-section-head">
        <div>
          <h2 className="adm-card-title">Comparar publicaciones</h2>
          <p className="mk-metricas-sub">Elegí qué número mirar. Tocá hasta 4 barras para ponerlas lado a lado.</p>
        </div>
      </div>

      <div className="mk-metricas-chips" role="group" aria-label="Número a comparar">
        {POST_METRICS.map((m) => (
          <button key={m.id} className={metricId === m.id ? "on" : ""} onClick={() => setMetricId(m.id)} title={m.help}>
            {m.label}
          </button>
        ))}
      </div>
      <p className="mk-metricas-cmp-hint">{metric.help}.</p>

      {!ranked.length ? (
        <p className="mk-metricas-muted">No hay publicaciones con este dato en el período elegido.</p>
      ) : (
        <>
          {best && average && ranked.length > 1 && (
            <div className="mk-metricas-headline">
              Lo que más rindió en <strong>{metric.label.toLowerCase()}</strong>: «{short(best._title, 80)}» con{" "}
              <strong>{metric.fmt(metric.get(best))}</strong>
              {metric.get(best) > average && ` (${nf(((metric.get(best) - average) / average) * 100, 0)}% más que tu promedio de ${metric.fmt(average)})`}.
            </div>
          )}

          <div className="mk-metricas-rankhead">
            <span>Publicación</span>
            <span>{metric.label} <em>· la marca vertical es tu promedio ({metric.fmt(average)})</em></span>
          </div>
          <HBars
            rows={rows}
            format={metric.fmt}
            mark={average != null ? { value: average, label: `Tu promedio: ${metric.fmt(average)}` } : null}
            selected={new Set(selected)}
            onToggle={toggle}
          />
          {ranked.length > limit && (
            <button className="adm-btn adm-btn-sm adm-btn-secondary mk-metricas-more" onClick={() => setLimit((l) => l + 10)}>
              Mostrar más ({ranked.length - limit})
            </button>
          )}
        </>
      )}

      <div className="mk-metricas-compare">
        {chosen.length === 0 && <p className="mk-metricas-muted">Tocá dos o más publicaciones del ranking para compararlas número por número.</p>}
        {chosen.length === 1 && <p className="mk-metricas-muted">Elegiste una. Tocá otra para compararlas.</p>}
        {chosen.length >= 2 && (
          <>
            <div className="mk-metricas-compare-head">
              <h3>Lado a lado</h3>
              <button className="mk-metricas-link" onClick={() => setSelected([])}>Quitar selección</button>
            </div>
            <ul className="mk-metricas-picked">
              {chosen.map((p, i) => (
                <li key={p.id}>
                  <b>{LETTERS[i]}</b>
                  <span>{short(p._title, 80)}</span>
                  <em>{networkLabel(p.network)} · {shortDate(p.posted_at)}</em>
                </li>
              ))}
            </ul>
            <div className="mk-metricas-cmp-grid">
              {POST_METRICS.map((m) => {
                const vals = chosen.map((p) => m.get(p));
                if (vals.every((v) => v == null)) return null;
                const a = avg(m);
                return (
                  <div key={m.id} className="mk-metricas-cmp">
                    <h3>{m.label}</h3>
                    <HBars
                      rows={chosen.map((p, i) => ({
                        key: p.id,
                        label: LETTERS[i],
                        value: m.get(p),
                        color: MARK_COLOR,
                        tip: [
                          { text: m.fmt(m.get(p)), strong: true },
                          { text: `${LETTERS[i]} · ${short(p._title, 60)}`, muted: true },
                        ],
                      }))}
                      format={m.fmt}
                      mark={a != null ? { value: a, label: `Tu promedio: ${m.fmt(a)}` } : null}
                      max={Math.max(...vals.filter((v) => v != null), a || 0)}
                    />
                  </div>
                );
              })}
            </div>
            <p className="mk-metricas-note">La marca vertical de cada gráfico es el promedio de todas tus publicaciones del período.</p>
          </>
        )}
      </div>

      <details className="mk-metricas-tabledetails">
        <summary>Ver todas las publicaciones en tabla</summary>
        {tableSlot}
      </details>
    </section>
  );
}
