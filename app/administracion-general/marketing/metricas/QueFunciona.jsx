"use client";
import { useMemo, useState } from "react";
import { FORMAT_BY_ID } from "@/lib/marketing/constants";
import { arWeekdayHour } from "@/lib/marketing/metrics/calc";
import { nf, compact, MARK_COLOR } from "./fmt";
import { HBars } from "./charts";

const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const SLOTS = [
  { id: 0, label: "Madrugada (0 a 6 h)", from: 0, to: 6 },
  { id: 1, label: "Mañana temprano (6 a 9 h)", from: 6, to: 9 },
  { id: 2, label: "Media mañana (9 a 12 h)", from: 9, to: 12 },
  { id: 3, label: "Mediodía (12 a 15 h)", from: 12, to: 15 },
  { id: 4, label: "Tarde (15 a 18 h)", from: 15, to: 18 },
  { id: 5, label: "Tardecita (18 a 21 h)", from: 18, to: 21 },
  { id: 6, label: "Noche (21 a 24 h)", from: 21, to: 24 },
];
const CORE_FORMATS = ["reel", "carrusel", "post"];

const METRICS = [
  { id: "interactions", label: "Interacciones", unit: "interacciones por publicación", get: (p) => p._interactions, fmt: (v) => nf(v, 0) },
  { id: "audience", label: "Alcance", unit: "personas alcanzadas por publicación", get: (p) => p._audience, fmt: (v) => compact(Math.round(v)) },
  { id: "rate", label: "Tasa de interacción", unit: "de tasa de interacción", get: (p) => p._rate, fmt: (v) => `${nf(v, 1)}%` },
];

const GRAY = "#cdbfc5";
const GRAY_LIGHT = "#e6dde1";

/** Agrupa publicaciones y promedia la métrica. `keys` fija las filas (y su orden) cuando es una lista cerrada. */
function groupBy(posts, keyFn, metric, keys) {
  const map = new Map();
  for (const p of posts) {
    const k = keyFn(p);
    const v = metric.get(p);
    if (k == null || v == null) continue;
    const g = map.get(k) || { key: k, sum: 0, n: 0 };
    g.sum += v;
    g.n += 1;
    map.set(k, g);
  }
  const rows = (keys ? keys.map((k) => map.get(k) || { key: k, sum: 0, n: 0 }) : [...map.values()]).map((g) => ({ ...g, avg: g.n ? g.sum / g.n : null }));
  return keys ? rows : rows.sort((a, b) => b.avg - a.avg);
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);

function confidence(n) {
  if (n >= 6) return { text: "bastante confiable", cls: "good" };
  if (n >= 3) return { text: "es una pista", cls: "mid" };
  return { text: "muy pocos datos", cls: "low" };
}

export default function QueFunciona({ posts, pillars }) {
  const [metricId, setMetricId] = useState("interactions");
  const metric = METRICS.find((m) => m.id === metricId);
  const pillarById = Object.fromEntries(pillars.map((p) => [p.id, p]));
  const timed = posts.filter((p) => !p.extra?.time_unknown);

  const vals = posts.map(metric.get).filter((v) => v != null);
  const overall = vals.length ? vals.reduce((a, v) => a + v, 0) / vals.length : null;

  const dims = useMemo(() => {
    const present = (keyFn) => [...new Set(posts.map(keyFn).filter((k) => k != null))];
    return [
      {
        id: "format",
        title: "Formato",
        question: "¿Qué tipo de publicación rinde más?",
        rows: groupBy(posts, (p) => p._format, metric).map((r) => ({ ...r, label: FORMAT_BY_ID[r.key]?.label || r.key })),
        untested: CORE_FORMATS.filter((f) => !present((p) => p._format).includes(f)).map((f) => FORMAT_BY_ID[f]?.label || f),
        advice: (r) => `Hacé más ${lower(r.label)}`,
      },
      {
        id: "day",
        title: "Día de la semana",
        question: "¿Qué día conviene publicar?",
        rows: groupBy(posts, (p) => (p.posted_at ? arWeekdayHour(p.posted_at).weekday : null), metric, [0, 1, 2, 3, 4, 5, 6]).map((r) => ({ ...r, label: WEEKDAYS[r.key] })),
        untested: null,
        advice: (r) => `Los ${lower(r.label)} fueron tu mejor día`,
      },
      {
        id: "slot",
        title: "Horario (hora de Argentina)",
        question: "¿A qué hora conviene publicar?",
        rows: groupBy(
          timed,
          (p) => {
            if (!p.posted_at) return null;
            const h = arWeekdayHour(p.posted_at).hour;
            return SLOTS.find((s) => h >= s.from && h < s.to)?.id ?? null;
          },
          metric,
          SLOTS.map((s) => s.id)
        ).map((r) => ({ ...r, label: SLOTS[r.key].label })),
        untested: null,
        advice: (r) => `Tu mejor franja fue ${lower(r.label)}`,
        note: timed.length < posts.length ? "LinkedIn no informa la hora, por eso no entra acá." : null,
      },
      {
        id: "pillar",
        title: "Pilar de contenido",
        question: "¿De qué tema rinde más?",
        rows: groupBy(posts, (p) => p._pillar?.id, metric).map((r) => ({ ...r, label: pillarById[r.key]?.name || "—", color: pillarById[r.key]?.color })),
        untested: pillars.filter((pl) => !posts.some((p) => p._pillar?.id === pl.id)).map((pl) => pl.name),
        advice: (r) => `El pilar ${r.label} es el que más rinde`,
        note: posts.some((p) => !p._pillar) ? `${posts.filter((p) => !p._pillar).length} publicaciones no tienen pilar. Para incluirlas, pegá su link en la pieza del calendario.` : null,
      },
      {
        id: "network",
        title: "Red",
        question: "¿En qué red rinde más cada publicación?",
        rows: groupBy(posts, (p) => p.network, metric).map((r) => ({ ...r, label: r.key.charAt(0).toUpperCase() + r.key.slice(1) })),
        untested: null,
        advice: (r) => `${r.label} te rinde más por publicación`,
        note: "Cada red mide distinto (alcance, impresiones o vistas): tomalo como una referencia.",
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, metricId, pillars]);

  // Conclusiones: sólo se comparan opciones con 2 o más publicaciones.
  // Sólo se recomienda si la mejor opción supera tu promedio y a la segunda por una diferencia que se note (5% o más).
  const verdicts = dims.map((d) => {
    const eligible = d.rows.filter((r) => r.n >= 2 && r.avg != null).sort((a, b) => b.avg - a.avg);
    if (eligible.length < 2) return { dim: d, best: null, eligibleCount: eligible.length, flat: false };
    const [best, second] = eligible;
    const clear = overall != null && best.avg >= overall * 1.05 && best.avg >= second.avg * 1.05;
    return { dim: d, best: clear ? best : null, eligibleCount: eligible.length, flat: !clear };
  });
  const concluded = verdicts.filter((v) => v.best);

  return (
    <section className="adm-card mk-metricas-section">
      <div className="mk-metricas-section-head">
        <div>
          <h2 className="adm-card-title">Qué funciona</h2>
          <p className="mk-metricas-sub">Qué formato, día y horario te dan mejores resultados, para decidir qué publicar y cuándo.</p>
        </div>
      </div>

      {posts.length < 4 ? (
        <div className="mk-metricas-empty">
          <strong>Todavía hay pocas publicaciones para sacar conclusiones.</strong>
          <span>
            Con {posts.length} publicaci{posts.length === 1 ? "ón" : "ones"} con métricas en este período no alcanza. Con unas 8 o 10, empiezo a decirte qué
            formato, día y horario te funcionan mejor.
          </span>
        </div>
      ) : (
        <>
          <div className="mk-metricas-chips" role="group" aria-label="Qué querés mejorar">
            <span className="mk-metricas-filterlabel">Qué querés mejorar</span>
            {METRICS.map((m) => (
              <button key={m.id} className={metricId === m.id ? "on" : ""} onClick={() => setMetricId(m.id)}>
                {m.label}
              </button>
            ))}
          </div>

          <div className="mk-metricas-verdicts">
            <h3>Lo que veo en tus datos</h3>
            {concluded.length === 0 ? (
              <p className="mk-metricas-muted">
                {verdicts.some((v) => v.flat)
                  ? "Por ahora ninguna opción se destaca claramente: tus publicaciones rinden parecido."
                  : "Todavía no puedo recomendarte nada con seguridad: necesito al menos 2 publicaciones en 2 opciones distintas (por ejemplo, 2 reels y 2 carruseles) para compararlas."}
              </p>
            ) : (
              <ul>
                {concluded.map(({ dim, best }) => {
                  const conf = confidence(best.n);
                  const over = overall ? ((best.avg - overall) / overall) * 100 : null;
                  return (
                    <li key={dim.id}>
                      <div className="mk-metricas-verdict-main">
                        <strong>{dim.advice(best)}.</strong>{" "}
                        <span>
                          Promedió {metric.fmt(best.avg)} {metric.unit}
                          {over != null && over > 5 && `, ${nf(over, 0)}% más que tu promedio general (${metric.fmt(overall)})`}.
                        </span>
                      </div>
                      <span className={`mk-metricas-conf ${conf.cls}`} title={`Se basa en ${plural(best.n, "publicación", "publicaciones")}`}>
                        {conf.text} · {plural(best.n, "publicación", "publicaciones")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            {verdicts.some((v) => v.flat) && (
              <p className="mk-metricas-untested">
                <strong>Sin diferencias claras todavía en:</strong>{" "}
                {verdicts.filter((v) => v.flat).map((v) => lower(v.dim.title)).join(", ")}. Las opciones rinden parecido: probá variar antes de decidir.
              </p>
            )}
            {verdicts.some((v) => v.dim.untested?.length) && (
              <p className="mk-metricas-untested">
                <strong>Todavía no probaste:</strong>{" "}
                {verdicts
                  .filter((v) => v.dim.untested?.length)
                  .map((v) => `${lower(v.dim.title)}: ${v.dim.untested.join(", ")}`)
                  .join(" · ")}
                . Probar algo nuevo es la forma de descubrir qué te rinde más.
              </p>
            )}
          </div>

          <div className="mk-metricas-dims">
            {verdicts.map(({ dim, best, eligibleCount, flat }) => {
              const rows = dim.rows
                .filter((r) => dim.id === "day" || dim.id === "slot" || r.n > 0)
                .map((r) => {
                  const isBest = best && r.key === best.key;
                  return {
                    key: String(r.key),
                    label: r.label,
                    sub: r.n ? plural(r.n, "publicación", "publicaciones") + (r.n === 1 ? " · poco para concluir" : "") : "Nunca probado",
                    value: r.avg,
                    color: isBest ? MARK_COLOR : r.n < 2 ? GRAY_LIGHT : GRAY,
                    tip: [
                      { text: r.avg != null ? metric.fmt(r.avg) : "Sin publicaciones", strong: true },
                      { text: `${dim.title}: ${r.label}`, muted: true },
                      ...(r.n ? [{ text: `Promedio de ${plural(r.n, "publicación", "publicaciones")}`, muted: true }] : []),
                    ],
                  };
                });
              return (
                <div key={dim.id} className="mk-metricas-dim">
                  <h3>{dim.question}</h3>
                  <p className="mk-metricas-cmp-hint">
                    {best ? (
                      <>
                        Mejor: <strong>{best.label}</strong>
                      </>
                    ) : flat ? (
                      "Sin diferencia clara: rinden parecido."
                    ) : eligibleCount < 2 ? (
                      "Sin conclusión todavía: faltan publicaciones para comparar."
                    ) : null}
                  </p>
                  <HBars
                    rows={rows}
                    format={metric.fmt}
                    mark={overall != null ? { value: overall, label: `Tu promedio: ${metric.fmt(overall)}` } : null}
                    noData="Sin datos"
                    empty="Todavía no hay datos para esto."
                  />
                  {dim.note && <p className="mk-metricas-note">{dim.note}</p>}
                </div>
              );
            })}
          </div>

          <p className="mk-metricas-note">
            La barra oscura es la mejor opción. La marca vertical es tu promedio general. Las barras claras tienen una sola publicación: no cuentan para las
            conclusiones. Cuantas más publicaciones, más confiable el resultado.
          </p>
        </>
      )}
    </section>
  );
}
