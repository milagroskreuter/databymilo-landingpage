"use client";
import { fmt, fmtDay } from "./util";

/** Agrupa una serie diaria por semana cuando hay muchos días. */
export function bucketize(rows, valueKeys, maxBars = 60) {
  if (rows.length <= maxBars) return rows.map((r) => ({ ...r, label: fmtDay(r.day) }));
  const size = Math.ceil(rows.length / maxBars);
  const out = [];
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    const b = { day: chunk[0].day, label: `${fmtDay(chunk[0].day)}–${fmtDay(chunk[chunk.length - 1].day)}` };
    for (const k of valueKeys) {
      if (k === "networks") {
        b.networks = {};
        for (const c of chunk) for (const [n, v] of Object.entries(c.networks || {})) b.networks[n] = (b.networks[n] || 0) + v;
      } else {
        const vals = chunk.map((c) => c[k]).filter((v) => v != null);
        b[k] = vals.length ? vals.reduce((a, v) => a + v, 0) : null;
      }
    }
    if (valueKeys.includes("networks")) b.total = Object.values(b.networks).reduce((a, v) => a + v, 0);
    out.push(b);
  }
  return out;
}

/** Barras apiladas por red. rows: [{label, total, networks: {red: n}}] */
export function StackedBars({ rows, order, colorOf, labelOf, height = 180 }) {
  const W = 720;
  const H = height;
  const pad = { t: 10, r: 8, b: 22, l: 30 };
  const max = Math.max(1, ...rows.map((r) => r.total || 0));
  const bw = (W - pad.l - pad.r) / Math.max(1, rows.length);
  const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const ticks = [0, Math.round(max / 2), max].filter((v, i, a) => a.indexOf(v) === i);
  const every = Math.ceil(rows.length / 8);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mk-links-a-chart" role="img" aria-label="Clicks por día y red">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="mk-links-a-grid" />
          <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="mk-links-a-axis">
            {t}
          </text>
        </g>
      ))}
      {rows.map((r, i) => {
        let acc = 0;
        const x = pad.l + i * bw + bw * 0.15;
        const w = Math.max(1, bw * 0.7);
        const tip = `${r.label}: ${r.total} clicks${order
          .filter((n) => r.networks?.[n])
          .map((n) => `\n${labelOf(n)}: ${r.networks[n]}`)
          .join("")}`;
        return (
          <g key={r.day}>
            <title>{tip}</title>
            <rect x={pad.l + i * bw} y={pad.t} width={bw} height={H - pad.t - pad.b} fill="transparent" />
            {order.map((n) => {
              const v = r.networks?.[n] || 0;
              if (!v) return null;
              const y1 = y(acc + v);
              const hgt = y(acc) - y1;
              acc += v;
              return <rect key={n} x={x} y={y1} width={w} height={Math.max(0, hgt)} fill={colorOf(n)} rx={1.5} />;
            })}
            {i % every === 0 && (
              <text x={x + w / 2} y={H - 6} textAnchor="middle" className="mk-links-a-axis">
                {r.label.split("–")[0]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Varias series en líneas, cada una normalizada a su propio máximo (para comparar forma, no escala). */
export function MultiLine({ rows, series, height = 170 }) {
  const W = 720;
  const H = height;
  const pad = { t: 12, r: 8, b: 22, l: 8 };
  const x = (i) => pad.l + ((W - pad.l - pad.r) * i) / Math.max(1, rows.length - 1);
  const every = Math.ceil(rows.length / 8);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mk-links-a-chart" role="img" aria-label="Evolución del embudo">
      <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} className="mk-links-a-grid" />
      {series.map((s) => {
        const vals = rows.map((r) => r[s.key]);
        if (vals.every((v) => v == null)) return null;
        const max = Math.max(1, ...vals.map((v) => v || 0));
        const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - (v || 0) / max);
        const d = vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
        return <path key={s.key} d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />;
      })}
      {rows.map((r, i) => (
        <g key={r.day}>
          <title>{`${r.label}\n${series.map((s) => `${s.label}: ${r[s.key] == null ? "—" : fmt(r[s.key])}`).join("\n")}`}</title>
          <rect x={x(i) - 4} y={pad.t} width={8} height={H - pad.t - pad.b} fill="transparent" />
          {i % every === 0 && (
            <text x={x(i)} y={H - 6} textAnchor="middle" className="mk-links-a-axis">
              {r.label.split("–")[0]}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

/** Lista con barras horizontales. items: [{key, label, value, color?, sub?}] */
export function RankList({ items, empty = "Sin datos todavía", onPick }) {
  if (!items.length) return <p className="mk-links-a-muted">{empty}</p>;
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="mk-links-a-rank">
      {items.map((it) => (
        <li key={it.key ?? "null"} onClick={onPick ? () => onPick(it) : undefined} className={onPick ? "is-clickable" : ""}>
          <div className="mk-links-a-rank-top">
            <span className="mk-links-a-rank-label">
              {it.color && <i style={{ background: it.color }} />}
              {it.label}
            </span>
            <span className="mk-links-a-rank-val">
              {fmt(it.value)}
              {it.sub ? <small> {it.sub}</small> : null}
            </span>
          </div>
          <div className="mk-links-a-rank-bar">
            <span style={{ width: `${(it.value / max) * 100}%`, background: it.color || "var(--adm-accent)" }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
