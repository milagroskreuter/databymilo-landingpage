"use client";
// Gráficos simples en HTML/SVG, sin librerías. Marcas finas, cuadrícula suave,
// tooltip al pasar el mouse o al enfocar con el teclado.
import { useCallback, useEffect, useRef, useState } from "react";
import { nf, compact, dayLabel, DAY_MS } from "./fmt";

// ─── Tooltip ─────────────────────────────────────────────────────────────────
export function useTip() {
  const wrap = useRef(null);
  const [tip, setTip] = useState(null);
  const show = useCallback((e, lines) => {
    const box = wrap.current?.getBoundingClientRect();
    if (!box) return;
    const target = e.currentTarget.getBoundingClientRect();
    const x = e.clientX ? e.clientX - box.left : target.left - box.left + target.width / 2;
    const y = e.clientY ? e.clientY - box.top : target.top - box.top;
    setTip({ x, y, lines, flip: x > box.width * 0.6 });
  }, []);
  const hide = useCallback(() => setTip(null), []);
  return { wrap, tip, show, hide };
}

export function Tip({ tip }) {
  if (!tip) return null;
  return (
    <div
      className={`mk-metricas-tip${tip.flip ? " flip" : ""}`}
      style={{ left: tip.x, top: tip.y }}
      role="tooltip"
    >
      {tip.lines.map((l, i) => (
        <div key={i} className={l.strong ? "strong" : l.muted ? "muted" : ""}>
          {l.color && <span className="key" style={{ background: l.color }} />}
          {l.text}
        </div>
      ))}
    </div>
  );
}

// ─── Barras horizontales ─────────────────────────────────────────────────────
// rows: [{ key, label, sub?, value, color, tip?: [{text,strong,muted}], href? }]
export function HBars({ rows, format = compact, mark, selected, onToggle, max: maxProp, empty = "Sin datos todavía.", noData = "Sin datos" }) {
  const { wrap, tip, show, hide } = useTip();
  const vals = rows.map((r) => r.value).filter((v) => v != null);
  const max = maxProp ?? Math.max(...vals, mark?.value ?? 0, 0);
  if (!rows.length) return <p className="mk-metricas-muted">{empty}</p>;
  return (
    <div className="mk-metricas-hbars" ref={wrap} role="list">
      {rows.map((r) => {
        const has = r.value != null;
        const pct = has && max ? Math.max(1.5, (r.value / max) * 100) : 0;
        const on = selected?.has?.(r.key);
        const interactive = !!onToggle;
        return (
          <div
            key={r.key}
            role="listitem"
            className={`mk-metricas-hrow${on ? " on" : ""}${interactive ? " click" : ""}${has ? "" : " nodata"}`}
            tabIndex={0}
            onPointerMove={(e) => has && show(e, r.tip || [{ text: nf(r.value), strong: true }, { text: r.label, muted: true }])}
            onPointerLeave={hide}
            onFocus={(e) => has && show(e, r.tip || [{ text: nf(r.value), strong: true }, { text: r.label, muted: true }])}
            onBlur={hide}
            onClick={interactive ? () => onToggle(r.key) : undefined}
            onKeyDown={interactive ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onToggle(r.key)) : undefined}
            aria-pressed={interactive ? !!on : undefined}
          >
            <span className="mk-metricas-hlabel">
              <span className="mk-metricas-hname">{r.label}</span>
              {r.sub && <span className="mk-metricas-hsub">{r.sub}</span>}
            </span>
            <span className="mk-metricas-htrack">
              {has && <span className="mk-metricas-hbar" style={{ width: `${pct}%`, background: r.color }} />}
              {has && mark?.value != null && max > 0 && (
                <span className="mk-metricas-hmark" style={{ left: `${(mark.value / max) * 100}%` }} title={mark.label} />
              )}
            </span>
            <span className="mk-metricas-hval">{has ? format(r.value) : noData}</span>
          </div>
        );
      })}
      <Tip tip={tip} />
    </div>
  );
}

// Marcas del eje con números redondos (1, 2, 5 por una potencia de diez).
function niceTicks(lo, hi, n = 4) {
  const span = hi - lo || Math.abs(hi) || 1;
  const raw = span / n;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const start = Math.floor(lo / step + 1e-9) * step;
  const end = Math.ceil(hi / step - 1e-9) * step;
  const out = [];
  for (let v = start; v <= end + step / 2; v += step) out.push(Number(v.toFixed(10)));
  return out.length > 1 ? out : [start, start + step];
}

// ─── Línea con varias series ────────────────────────────────────────────────
// series: [{ key, label, color, points: [{ day, v }] }]
export function LineChart({ series, format = nf, height = 230, yLabel }) {
  const [width, setWidth] = useState(640);
  const boxRef = useRef(null);
  const { wrap, tip, show, hide } = useTip();
  const [hoverX, setHoverX] = useState(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.max(280, Math.round(el.clientWidth))));
    ro.observe(el);
    setWidth(Math.max(280, Math.round(el.clientWidth)));
    return () => ro.disconnect();
  }, []);

  const drawn = series.filter((s) => s.points.length >= 2);
  const all = drawn.flatMap((s) => s.points);
  if (!drawn.length) return null;

  const t = (d) => new Date(`${d}T12:00:00Z`).getTime();
  const tMin = Math.min(...all.map((p) => t(p.day)));
  const tMax = Math.max(...all.map((p) => t(p.day)));
  const ticks = niceTicks(Math.min(...all.map((p) => p.v)), Math.max(...all.map((p) => p.v)));
  const vMin = ticks[0];
  const vMax = ticks[ticks.length - 1];

  const m = { l: 46, r: 14, t: 12, b: 26 };
  const W = width;
  const H = height;
  const x = (d) => m.l + ((t(d) - tMin) / Math.max(1, tMax - tMin)) * (W - m.l - m.r);
  const y = (v) => m.t + (1 - (v - vMin) / (vMax - vMin)) * (H - m.t - m.b);

  const days = [...new Set(all.map((p) => p.day))].sort();
  const labelDays = [days[0], days[Math.floor((days.length - 1) / 2)], days[days.length - 1]].filter((d, i, a) => a.indexOf(d) === i);

  function onMove(e) {
    const box = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - box.left;
    let best = days[0];
    let bd = Infinity;
    for (const d of days) {
      const dd = Math.abs(x(d) - px);
      if (dd < bd) {
        bd = dd;
        best = d;
      }
    }
    setHoverX(best);
    const lines = [{ text: dayLabel(best), muted: true }];
    for (const s of drawn) {
      const p = s.points.find((q) => q.day === best);
      if (p) lines.push({ text: `${format(p.v)}  ·  ${s.label}`, strong: true, color: s.color });
    }
    show({ clientX: e.clientX, clientY: e.clientY, currentTarget: e.currentTarget }, lines);
  }

  return (
    <div className="mk-metricas-line" ref={(n) => { boxRef.current = n; wrap.current = n; }}>
      <svg width={W} height={H} role="img" aria-label={yLabel || "Gráfico de líneas"} onPointerMove={onMove} onPointerLeave={() => { setHoverX(null); hide(); }}>
        {ticks.map((v, i) => (
          <g key={i}>
            <line x1={m.l} x2={W - m.r} y1={y(v)} y2={y(v)} className="mk-metricas-grid" />
            <text x={m.l - 8} y={y(v) + 4} textAnchor="end" className="mk-metricas-axis">{format(v)}</text>
          </g>
        ))}
        {labelDays.map((d) => (
          <text key={d} x={x(d)} y={H - 6} textAnchor={d === days[0] ? "start" : d === days[days.length - 1] ? "end" : "middle"} className="mk-metricas-axis">
            {dayLabel(d)}
          </text>
        ))}
        {hoverX && <line x1={x(hoverX)} x2={x(hoverX)} y1={m.t} y2={H - m.b} className="mk-metricas-cross" />}
        {drawn.map((s) => (
          <g key={s.key}>
            <path
              d={s.points.map((p, i) => `${i ? "L" : "M"}${x(p.day).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ")}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {(() => {
              const last = s.points[s.points.length - 1];
              return <circle cx={x(last.day)} cy={y(last.v)} r="4.5" fill={s.color} stroke="#fff" strokeWidth="2" />;
            })()}
            {hoverX && s.points.find((p) => p.day === hoverX) && (
              <circle cx={x(hoverX)} cy={y(s.points.find((p) => p.day === hoverX).v)} r="4.5" fill={s.color} stroke="#fff" strokeWidth="2" />
            )}
          </g>
        ))}
      </svg>
      <Tip tip={tip} />
    </div>
  );
}

// ─── Línea chica (para tarjetas) ────────────────────────────────────────────
export function Sparkline({ points, color, width = 120, height = 34 }) {
  if (!points || points.length < 2) return null;
  const vs = points.map((p) => p.v);
  let lo = Math.min(...vs);
  let hi = Math.max(...vs);
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const t = (d) => new Date(`${d}T12:00:00Z`).getTime();
  const t0 = t(points[0].day);
  const t1 = t(points[points.length - 1].day);
  const x = (d) => 3 + ((t(d) - t0) / Math.max(1, t1 - t0)) * (width - 6);
  const y = (v) => 4 + (1 - (v - lo) / (hi - lo)) * (height - 8);
  const last = points[points.length - 1];
  return (
    <svg width={width} height={height} aria-hidden="true">
      <path d={points.map((p, i) => `${i ? "L" : "M"}${x(p.day).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(last.day)} cy={y(last.v)} r="3.5" fill={color} stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

// ─── Leyenda ────────────────────────────────────────────────────────────────
export function Legend({ items }) {
  return (
    <ul className="mk-metricas-legend">
      {items.map((i) => (
        <li key={i.key}>
          <span className="sw" style={{ background: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

export { DAY_MS };
