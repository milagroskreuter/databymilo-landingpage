"use client";
import { useEffect, useState, useRef, useCallback } from "react";

const RANGES = [
  { label: "7 días", value: 7 },
  { label: "30 días", value: 30 },
  { label: "90 días", value: 90 },
];

function fmt(n) {
  if (n == null) return "—";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

// ─── Sparkline con tooltip ────────────────────────────────────────────────────
function SparkLine({ data, days }) {
  const [hover, setHover] = useState(null); // { x, y, date, value }
  const svgRef = useRef(null);

  if (!data?.length) return null;

  const end = new Date();
  const slots = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    slots.push(d.toISOString().slice(0, 10));
  }
  const byDate = {};
  data.forEach((r) => {
    const key = (r.day || r.timestamp || "").slice(0, 10);
    byDate[key] = (byDate[key] || 0) + (r.pageviews || r.visitors || 0);
  });
  const vals = slots.map((d) => ({ date: d, v: byDate[d] || 0 }));
  const maxV = Math.max(...vals.map(x => x.v), 1);

  const W = 800, H = 100, padX = 8, padY = 10;
  const points = vals.map(({ v }, i) => ({
    x: padX + (i / (vals.length - 1)) * (W - padX * 2),
    y: H - padY - ((v / maxV) * (H - padY * 2)),
  }));

  const poly = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${poly} L ${points[points.length - 1].x} ${H - padY} L ${points[0].x} ${H - padY} Z`;

  // X axis ticks — show ~5 labels
  const tickStep = Math.ceil(vals.length / 5);
  const ticks = vals.filter((_, i) => i % tickStep === 0 || i === vals.length - 1);

  function handleMouseMove(e) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width * W;
    // Find closest point
    let best = 0, bestDist = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(p.x - relX);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    const p = points[best];
    setHover({ x: p.x, y: p.y, date: vals[best].date, value: vals[best].v });
  }

  return (
    <div style={{ position: "relative" }}>
      {hover && (
        <div style={{
          position: "absolute",
          left: `${(hover.x / W) * 100}%`,
          top: `${(hover.y / (H + 20)) * 100}%`,
          transform: "translate(-50%, -110%)",
          background: "var(--adm-primary)",
          color: "white",
          borderRadius: 6,
          padding: "4px 10px",
          fontSize: 11,
          fontFamily: "var(--adm-font-body)",
          fontWeight: 700,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          zIndex: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,.2)",
        }}>
          {fmtDate(hover.date)} · {hover.value} vista{hover.value !== 1 ? "s" : ""}
        </div>
      )}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H + 20}`}
        style={{ width: "100%", height: 100, cursor: "crosshair", display: "block" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--adm-primary)" stopOpacity=".3" />
            <stop offset="100%" stopColor="var(--adm-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area */}
        <path d={area} fill="url(#sg)" />
        {/* Line */}
        <path d={poly} fill="none" stroke="var(--adm-primary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {/* X-axis ticks */}
        {ticks.map(({ date }, i) => {
          const idx = vals.findIndex(v => v.date === date);
          const px = padX + (idx / (vals.length - 1)) * (W - padX * 2);
          return (
            <g key={i}>
              <line x1={px} y1={H - padY + 2} x2={px} y2={H - padY + 6} stroke="var(--adm-border)" strokeWidth="1" />
              <text x={px} y={H + 16} textAnchor="middle" fontSize="10" fill="var(--adm-fg-muted)" fontFamily="var(--adm-font-body)">
                {fmtDate(date)}
              </text>
            </g>
          );
        })}

        {/* Hover dot + vertical line */}
        {hover && (() => {
          const idx = vals.findIndex(v => v.date === hover.date);
          const p = points[idx];
          if (!p) return null;
          return (
            <g>
              <line x1={p.x} y1={padY} x2={p.x} y2={H - padY} stroke="var(--adm-primary)" strokeWidth="1" strokeDasharray="3 3" opacity=".5" />
              <circle cx={p.x} cy={p.y} r="5" fill="var(--adm-primary)" />
              <circle cx={p.x} cy={p.y} r="3" fill="white" />
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

// ─── Bar row con tooltip ───────────────────────────────────────────────────────
function BarRow({ label, value, max, color = "var(--adm-primary)", sub, pct }) {
  const [hov, setHov] = useState(false);
  const w = max > 0 ? Math.round((value / max) * 100) : 0;
  const pctStr = pct != null ? `${pct}%` : (max > 0 ? `${Math.round(value / max * 100)}%` : "");

  return (
    <div
      style={{ marginBottom: 8, padding: "4px 6px", borderRadius: 6, background: hov ? "var(--adm-tinted)" : "transparent", transition: "background .15s" }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          fontFamily: "var(--adm-font-body)", fontSize: 12,
          color: "var(--adm-fg-2)", whiteSpace: "nowrap", overflow: "hidden",
          textOverflow: "ellipsis", width: 160, flexShrink: 0,
        }} title={label}>{label || "—"}</div>
        <div style={{ flex: 1, background: "var(--adm-cream-200)", borderRadius: 4, height: 8, overflow: "hidden" }}>
          <div style={{ width: `${w}%`, height: "100%", background: color, borderRadius: 4, transition: "width .5s ease" }} />
        </div>
        <div style={{ fontFamily: "var(--adm-font-body)", fontSize: 12, fontWeight: 700, color: "var(--adm-primary)", width: 36, textAlign: "right", flexShrink: 0 }}>
          {fmt(value)}
        </div>
        {hov && pctStr && (
          <div style={{ fontFamily: "var(--adm-font-body)", fontSize: 11, color: "var(--adm-fg-muted)", width: 32, textAlign: "right", flexShrink: 0 }}>
            {pctStr}
          </div>
        )}
      </div>
      {sub && hov && (
        <div style={{ fontSize: 10, color: "var(--adm-fg-muted)", fontFamily: "var(--adm-font-body)", marginTop: 2, paddingLeft: 170 }}>{sub}</div>
      )}
    </div>
  );
}

// ─── Donut visual ────────────────────────────────────────────────────────────
function DonutChart({ data, colors, valueKey = "pageviews" }) {
  const [hov, setHov] = useState(null);
  if (!data?.length) return <p style={{ color: "var(--adm-fg-muted)", fontSize: 13 }}>Sin datos</p>;

  const total = data.reduce((s, d) => s + (d[valueKey] || d.visitors || 0), 0);
  if (total === 0) return <p style={{ color: "var(--adm-fg-muted)", fontSize: 13 }}>Sin datos</p>;

  // Build SVG donut
  const R = 40, r = 24, cx = 50, cy = 50;
  let startAngle = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const val = d[valueKey] || d.visitors || 0;
    const angle = (val / total) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(startAngle);
    const y1 = cy + R * Math.sin(startAngle);
    startAngle += angle;
    const x2 = cx + R * Math.cos(startAngle);
    const y2 = cy + R * Math.sin(startAngle);
    const ix1 = cx + r * Math.cos(startAngle);
    const iy1 = cy + r * Math.sin(startAngle);
    const ix2 = cx + r * Math.cos(startAngle - angle);
    const iy2 = cy + r * Math.sin(startAngle - angle);
    const large = angle > Math.PI ? 1 : 0;
    const path = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${r} ${r} 0 ${large} 0 ${ix2} ${iy2} Z`;
    const label = d.deviceType || d.country || d.browserName || d.name || "Otro";
    const pct = Math.round(val / total * 100);
    return { path, label, val, pct, color: colors[i % colors.length], i };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      {/* Donut */}
      <svg viewBox="0 0 100 100" style={{ width: 90, height: 90, flexShrink: 0 }}>
        {slices.map((s) => (
          <path
            key={s.i}
            d={s.path}
            fill={s.color}
            opacity={hov === null || hov === s.i ? 1 : .4}
            style={{ cursor: "pointer", transition: "opacity .15s" }}
            onMouseEnter={() => setHov(s.i)}
            onMouseLeave={() => setHov(null)}
          />
        ))}
        {hov !== null && (
          <>
            <text x="50" y="47" textAnchor="middle" fontSize="13" fontWeight="bold" fill="var(--adm-primary)" fontFamily="var(--adm-font-body)">
              {slices[hov].pct}%
            </text>
            <text x="50" y="58" textAnchor="middle" fontSize="7" fill="var(--adm-fg-muted)" fontFamily="var(--adm-font-body)">
              {fmt(slices[hov].val)}
            </text>
          </>
        )}
        {hov === null && (
          <text x="50" y="53" textAnchor="middle" fontSize="8" fill="var(--adm-fg-muted)" fontFamily="var(--adm-font-body)">
            {fmt(total)}
          </text>
        )}
      </svg>

      {/* Legend */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
        {slices.map((s) => (
          <div
            key={s.i}
            style={{ display: "flex", alignItems: "center", gap: 7, cursor: "default", opacity: hov === null || hov === s.i ? 1 : .5, transition: "opacity .15s" }}
            onMouseEnter={() => setHov(s.i)}
            onMouseLeave={() => setHov(null)}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--adm-font-body)", fontSize: 11, color: "var(--adm-fg-2)", flex: 1, textTransform: "capitalize", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={s.label}>{s.label}</span>
            <span style={{ fontFamily: "var(--adm-font-body)", fontSize: 11, fontWeight: 700, color: "var(--adm-primary)", flexShrink: 0 }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, icon }) {
  return (
    <div className="adm-stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="adm-stat-label">{label}</div>
        {icon && <span style={{ fontSize: 18, opacity: .4 }}>{icon}</span>}
      </div>
      <div className="adm-stat-value">{value}</div>
      {sub && <div className="adm-stat-sub">{sub}</div>}
    </div>
  );
}

function Section({ title, children, style }) {
  return (
    <div className="adm-table-wrap" style={{ padding: "18px 20px", ...style }}>
      <div className="adm-section-title" style={{ marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function StatsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/admin/stats?days=${days}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d); else setData(d); })
      .catch(() => setError({ error: "Error de conexión" }))
      .finally(() => setLoading(false));
  }, [days]);

  const ov = data?.overview;
  const pages = data?.pages || [];
  const refs = data?.referrers || [];
  const devices = data?.devices || [];
  const countries = data?.countries || [];
  const browsers = data?.browsers || [];
  const daily = data?.dailyViews || [];

  const topPage = pages[0]?.pageviews || 1;
  const topRef = refs[0]?.pageviews || 1;
  const topCountry = countries[0]?.pageviews || 1;

  const DEVICE_COLORS = ["var(--adm-primary)", "var(--adm-accent)", "#b797cf", "#e8a87c"];
  const BROWSER_COLORS = ["#6b8dd6", "var(--adm-primary)", "#e8a87c", "#6bcfb7", "#b797cf", "var(--adm-fg-muted)"];
  const COUNTRY_COLORS = ["var(--adm-primary)", "var(--adm-accent)", "#b797cf", "#6bcfb7", "#e8a87c", "#6b8dd6", "var(--adm-fg-muted)", "#f4a9c0"];

  return (
    <>
      <div className="adm-header">
        <h1>Estadísticas</h1>
        <div style={{ display: "flex", gap: 6 }}>
          {RANGES.map(r => (
            <button key={r.value} onClick={() => setDays(r.value)}
              className={`adm-btn adm-btn-sm ${days === r.value ? "adm-btn-primary" : "adm-btn-secondary"}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="adm-content">
        {error?.setup && (
          <div className="adm-alert adm-alert-info">
            <strong>Falta configurar el token de Vercel.</strong>
          </div>
        )}
        {error && !error.setup && (
          <div className="adm-alert adm-alert-error">Error al cargar: {error.error}</div>
        )}
        {loading && (
          <div style={{ textAlign: "center", padding: 48, color: "var(--adm-fg-muted)", fontFamily: "var(--adm-font-body)" }}>
            Cargando estadísticas…
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* KPIs */}
            <div className="adm-stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
              <KpiCard label="Visitantes únicos" value={fmt(ov?.visitors)} sub={`últimos ${days} días`} icon="👤" />
              <KpiCard label="Páginas vistas" value={fmt(ov?.pageviews)} sub="total" icon="📄" />
              <KpiCard
                label="Vistas / visita"
                value={ov?.pageviews && ov?.visitors ? (ov.pageviews / ov.visitors).toFixed(1) : "—"}
                sub="promedio"
                icon="📈"
              />
              <KpiCard label="Páginas únicas" value={fmt(pages.filter(p => p.requestPath !== "Others").length)} sub="distintas" icon="🗂" />
            </div>

            {/* Sparkline */}
            {daily.length > 0 && (
              <div className="adm-table-wrap" style={{ padding: "16px 20px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--adm-fg-2)", fontFamily: "var(--adm-font-body)", marginBottom: 10 }}>
                  Páginas vistas por día — pasá el cursor para ver el detalle
                </div>
                <SparkLine data={daily} days={days} />
              </div>
            )}

            {/* Páginas + Referrers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Section title="Páginas más visitadas">
                {pages.length === 0
                  ? <p style={{ color: "var(--adm-fg-muted)", fontSize: 13 }}>Sin datos</p>
                  : pages.map((p, i) => (
                    <BarRow key={i}
                      label={p.requestPath}
                      value={p.pageviews}
                      max={topPage}
                      sub={`${p.visitors} visitante${p.visitors !== 1 ? "s" : ""} únicos`}
                    />
                  ))}
              </Section>
              <Section title="De dónde vienen">
                {refs.length === 0
                  ? <p style={{ color: "var(--adm-fg-muted)", fontSize: 13 }}>Tráfico directo</p>
                  : refs.map((r, i) => (
                    <BarRow key={i}
                      label={r.referrerHostname || "Directo / no rastreado"}
                      value={r.pageviews}
                      max={topRef}
                      color="var(--adm-accent)"
                      sub={`${r.visitors} visitante${r.visitors !== 1 ? "s" : ""}`}
                    />
                  ))}
              </Section>
            </div>

            {/* Dispositivos + Browsers + Países */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <Section title="Dispositivos">
                <DonutChart data={devices} colors={DEVICE_COLORS} />
              </Section>
              <Section title="Navegadores">
                <DonutChart data={browsers} colors={BROWSER_COLORS} />
              </Section>
              <Section title="Países top">
                {countries.length === 0
                  ? <p style={{ color: "var(--adm-fg-muted)", fontSize: 13 }}>Sin datos</p>
                  : <DonutChart data={countries} colors={COUNTRY_COLORS} />}
              </Section>
            </div>

            <div style={{
              padding: "10px 14px",
              background: "var(--adm-tinted)",
              borderRadius: "var(--adm-radius)",
              fontSize: 11, color: "var(--adm-fg-muted)",
              fontFamily: "var(--adm-font-body)",
              border: "1px solid var(--adm-border)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span>Vercel Analytics · {data.since} → {data.until}</span>
              <a href="https://vercel.com/milagroskreuters-projects/databymilo-landingpage/analytics"
                target="_blank" rel="noopener noreferrer"
                style={{ color: "var(--adm-primary)", fontWeight: 700, textDecoration: "none" }}>
                Ver en Vercel ↗
              </a>
            </div>
          </>
        )}
      </div>
    </>
  );
}
