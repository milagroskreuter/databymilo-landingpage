"use client";
import { useEffect, useState } from "react";

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

function KpiCard({ label, value, sub, icon }) {
  return (
    <div className="adm-stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="adm-stat-label">{label}</div>
        {icon && <span style={{ fontSize: 18, opacity: .5 }}>{icon}</span>}
      </div>
      <div className="adm-stat-value">{value}</div>
      {sub && <div className="adm-stat-sub">{sub}</div>}
    </div>
  );
}

function BarRow({ label, value, max, color = "var(--adm-primary)", sub }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          fontFamily: "var(--adm-font-body)", fontSize: 12,
          color: "var(--adm-fg-2)", whiteSpace: "nowrap", overflow: "hidden",
          textOverflow: "ellipsis", width: 170, flexShrink: 0,
        }} title={label}>{label || "—"}</div>
        <div style={{ flex: 1, background: "var(--adm-cream-200)", borderRadius: 4, height: 8, overflow: "hidden" }}>
          <div style={{ width: `${w}%`, height: "100%", background: color, borderRadius: 4, transition: "width .6s ease" }} />
        </div>
        <div style={{ fontFamily: "var(--adm-font-body)", fontSize: 12, fontWeight: 700, color: "var(--adm-primary)", width: 44, textAlign: "right", flexShrink: 0 }}>
          {fmt(value)}
        </div>
      </div>
      {sub && <div style={{ fontSize: 10, color: "var(--adm-fg-muted)", fontFamily: "var(--adm-font-body)", marginTop: 2, paddingLeft: 180 }}>{sub}</div>}
    </div>
  );
}

function SparkLine({ data, days }) {
  if (!data?.length) return null;
  // Fill gaps — build a full date array
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
  const vals = slots.map((d) => byDate[d] || 0);
  const maxV = Math.max(...vals, 1);

  const W = 560, H = 80, pad = 4;
  const pts = vals.map((v, i) => {
    const x = pad + (i / (vals.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v / maxV) * (H - pad * 2));
    return `${x},${y}`;
  });
  const poly = `M ${pts.join(" L ")}`;
  const area = `${poly} L ${W - pad},${H - pad} L ${pad},${H - pad} Z`;

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 11, color: "var(--adm-fg-muted)", fontFamily: "var(--adm-font-body)", marginBottom: 6 }}>
        Páginas vistas por día
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 72 }}>
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--adm-primary)" stopOpacity=".25" />
            <stop offset="100%" stopColor="var(--adm-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#sg)" />
        <path d={poly} fill="none" stroke="var(--adm-primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
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

function DonutRow({ data, colors }) {
  if (!data?.length) return <p style={{ color: "var(--adm-fg-muted)", fontSize: 13 }}>Sin datos</p>;
  const total = data.reduce((s, d) => s + (d.pageviews || d.visitors || 0), 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.map((d, i) => {
        const v = d.pageviews || d.visitors || 0;
        const p = total > 0 ? Math.round(v / total * 100) : 0;
        const label = d.deviceType || d.country || d.browserName || d.name || "Otro";
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: colors[i % colors.length], flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--adm-font-body)", fontSize: 12, color: "var(--adm-fg-2)", flex: 1, textTransform: "capitalize" }}>{label}</span>
            <div style={{ width: 80, background: "var(--adm-cream-200)", borderRadius: 4, height: 6, overflow: "hidden", flexShrink: 0 }}>
              <div style={{ width: `${p}%`, height: "100%", background: colors[i % colors.length], borderRadius: 4 }} />
            </div>
            <span style={{ fontFamily: "var(--adm-font-body)", fontSize: 12, fontWeight: 700, color: "var(--adm-primary)", width: 32, textAlign: "right", flexShrink: 0 }}>{p}%</span>
          </div>
        );
      })}
    </div>
  );
}

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

  return (
    <>
      <div className="adm-header">
        <h1>Estadísticas</h1>
        <div style={{ display: "flex", gap: 6 }}>
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setDays(r.value)}
              className={`adm-btn adm-btn-sm ${days === r.value ? "adm-btn-primary" : "adm-btn-secondary"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="adm-content">
        {error?.setup && (
          <div className="adm-alert adm-alert-info">
            <strong>Falta configurar el token de Vercel.</strong>
            <ol style={{ marginTop: 10, paddingLeft: 18, lineHeight: 2, fontSize: 13 }}>
              <li>Andá a <strong>vercel.com/account/tokens</strong></li>
              <li>Creá un token llamado <code style={{ background: "rgba(139,26,74,.1)", padding: "1px 6px", borderRadius: 4 }}>admin-hub</code></li>
              <li>Pasámelo y lo agrego como variable de entorno</li>
            </ol>
          </div>
        )}

        {error && !error.setup && (
          <div className="adm-alert adm-alert-error">Error al cargar datos: {error.error}</div>
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
                <SparkLine data={daily} days={days} />
              </div>
            )}

            {/* Páginas + Referrers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Section title="Páginas más visitadas">
                {pages.length === 0
                  ? <p style={{ color: "var(--adm-fg-muted)", fontSize: 13 }}>Sin datos</p>
                  : pages.map((p, i) => (
                    <BarRow key={i} label={p.requestPath} value={p.pageviews} max={topPage} sub={`${p.visitors} visitante${p.visitors !== 1 ? "s" : ""}`} />
                  ))}
              </Section>
              <Section title="De dónde vienen">
                {refs.length === 0
                  ? <p style={{ color: "var(--adm-fg-muted)", fontSize: 13 }}>Tráfico directo o sin datos</p>
                  : refs.map((r, i) => (
                    <BarRow key={i} label={r.referrerHostname || "Directo"} value={r.pageviews} max={topRef} color="var(--adm-accent)" />
                  ))}
              </Section>
            </div>

            {/* Dispositivos + Browsers + Países */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <Section title="Dispositivos">
                <DonutRow data={devices} colors={DEVICE_COLORS} />
              </Section>
              <Section title="Navegadores">
                <DonutRow data={browsers} colors={BROWSER_COLORS} />
              </Section>
              <Section title="Países top">
                {countries.length === 0
                  ? <p style={{ color: "var(--adm-fg-muted)", fontSize: 13 }}>Sin datos</p>
                  : countries.map((c, i) => (
                    <BarRow key={i} label={c.country || "—"} value={c.pageviews} max={topCountry} color="#b797cf" />
                  ))}
              </Section>
            </div>

            <div style={{
              padding: "10px 14px",
              background: "var(--adm-tinted)",
              borderRadius: "var(--adm-radius)",
              fontSize: 11,
              color: "var(--adm-fg-muted)",
              fontFamily: "var(--adm-font-body)",
              border: "1px solid var(--adm-border)",
            }}>
              Vercel Analytics · {data.since} → {data.until} ·{" "}
              <a
                href="https://vercel.com/milagroskreuters-projects/databymilo-landingpage/analytics"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--adm-primary)", fontWeight: 700 }}
              >
                Ver en Vercel ↗
              </a>
            </div>
          </>
        )}
      </div>
    </>
  );
}
