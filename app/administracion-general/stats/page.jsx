"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

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

function pct(n) {
  if (n == null) return "—";
  return (n * 100).toFixed(1) + "%";
}

function BarRow({ label, value, max, color = "var(--adm-primary)" }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <div style={{
        fontFamily: "var(--adm-font-body)", fontSize: 12,
        color: "var(--adm-fg-2)", whiteSpace: "nowrap", overflow: "hidden",
        textOverflow: "ellipsis", width: 160, flexShrink: 0,
      }} title={label}>{label}</div>
      <div style={{ flex: 1, background: "var(--adm-cream-200)", borderRadius: 4, height: 8, overflow: "hidden" }}>
        <div style={{ width: `${w}%`, height: "100%", background: color, borderRadius: 4, transition: "width .6s ease" }} />
      </div>
      <div style={{ fontFamily: "var(--adm-font-body)", fontSize: 12, fontWeight: 700, color: "var(--adm-primary)", width: 40, textAlign: "right", flexShrink: 0 }}>
        {fmt(value)}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, trend, icon }) {
  const up = trend > 0;
  const trendColor = up ? "#1a7a45" : trend < 0 ? "#b82020" : "var(--adm-fg-muted)";
  return (
    <div className="adm-stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="adm-stat-label">{label}</div>
        {icon && <span style={{ fontSize: 16, opacity: .6 }}>{icon}</span>}
      </div>
      <div className="adm-stat-value">{value}</div>
      {sub && <div className="adm-stat-sub">{sub}</div>}
      {trend != null && (
        <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: trendColor, fontFamily: "var(--adm-font-body)" }}>
          {up ? "▲" : trend < 0 ? "▼" : "●"} {Math.abs(trend).toFixed(1)}% vs período anterior
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="adm-table-wrap" style={{ padding: "20px 22px" }}>
      <div className="adm-section-title" style={{ marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}

function DevicePie({ data }) {
  if (!data?.length) return <p style={{ color: "var(--adm-fg-muted)", fontSize: 13 }}>Sin datos</p>;
  const total = data.reduce((s, d) => s + (d.count || d.value || 0), 0);
  const COLORS = ["var(--adm-primary)", "var(--adm-accent)", "#b797cf", "var(--adm-fg-muted)"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.map((d, i) => {
        const v = d.count || d.value || 0;
        const p = total > 0 ? Math.round(v / total * 100) : 0;
        const label = d.device || d.name || d.label || "Otro";
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--adm-font-body)", fontSize: 12, color: "var(--adm-fg-2)", flex: 1, textTransform: "capitalize" }}>{label}</span>
            <span style={{ fontFamily: "var(--adm-font-body)", fontSize: 12, fontWeight: 700, color: "var(--adm-primary)" }}>{p}%</span>
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
      .then(d => {
        if (d.error) setError(d);
        else setData(d);
      })
      .catch(() => setError({ error: "Error de conexión" }))
      .finally(() => setLoading(false));
  }, [days]);

  const ov = data?.overview;
  const pagesList = data?.pages?.data || data?.pages || [];
  const refList = data?.referrers?.data || data?.referrers || [];
  const deviceList = data?.devices?.data || data?.devices || [];
  const countriesList = data?.countries?.data || data?.countries || [];

  const topPageVal = pagesList[0]?.pageviews || pagesList[0]?.count || 1;
  const topRefVal = refList[0]?.pageviews || refList[0]?.count || 1;
  const topCountryVal = countriesList[0]?.pageviews || countriesList[0]?.count || 1;

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
        {/* Token no configurado */}
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
          <div className="adm-alert adm-alert-error">
            Error al cargar datos: {error.error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: 48, color: "var(--adm-fg-muted)", fontFamily: "var(--adm-font-body)" }}>
            Cargando estadísticas…
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* KPIs */}
            <div className="adm-stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
              <KpiCard
                label="Visitas únicas"
                value={fmt(ov?.uniqueVisitors || ov?.visitors)}
                sub={`últimos ${days} días`}
                icon="\u{1F465}"
              />
              <KpiCard
                label="Páginas vistas"
                value={fmt(ov?.pageviews || ov?.views)}
                sub="total"
                icon="\u{1F4C4}"
              />
              <KpiCard
                label="Vistas por visita"
                value={ov?.pageviews && ov?.uniqueVisitors
                  ? (ov.pageviews / ov.uniqueVisitors).toFixed(1)
                  : "—"}
                sub="promedio"
                icon="\u{1F4C8}"
              />
              <KpiCard
                label="Tiempo promedio"
                value={ov?.avgDuration
                  ? `${Math.round(ov.avgDuration / 1000)}s`
                  : "—"}
                sub="en el sitio"
                icon="⏱"
              />
            </div>

            {/* Páginas y Referrers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Section title="Páginas más visitadas">
                {pagesList.length === 0
                  ? <p style={{ color: "var(--adm-fg-muted)", fontSize: 13 }}>Sin datos</p>
                  : pagesList.map((p, i) => (
                    <BarRow
                      key={i}
                      label={p.page || p.path || p.url || "—"}
                      value={p.pageviews || p.count || 0}
                      max={topPageVal}
                    />
                  ))}
              </Section>

              <Section title="De dónde vienen">
                {refList.length === 0
                  ? <p style={{ color: "var(--adm-fg-muted)", fontSize: 13 }}>Sin datos o tráfico directo</p>
                  : refList.map((r, i) => (
                    <BarRow
                      key={i}
                      label={r.referrer || r.source || r.name || "Directo"}
                      value={r.pageviews || r.count || 0}
                      max={topRefVal}
                      color="var(--adm-accent)"
                    />
                  ))}
              </Section>
            </div>

            {/* Dispositivos y Países */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Section title="Dispositivos">
                <DevicePie data={deviceList} />
              </Section>

              <Section title="Países top">
                {countriesList.length === 0
                  ? <p style={{ color: "var(--adm-fg-muted)", fontSize: 13 }}>Sin datos</p>
                  : countriesList.map((c, i) => (
                    <BarRow
                      key={i}
                      label={`${c.flag || ""} ${c.country || c.name || "—"}`.trim()}
                      value={c.pageviews || c.count || 0}
                      max={topCountryVal}
                      color="#b797cf"
                    />
                  ))}
              </Section>
            </div>

            <div style={{
              padding: "12px 16px",
              background: "var(--adm-tinted)",
              borderRadius: "var(--adm-radius)",
              fontSize: 11,
              color: "var(--adm-fg-muted)",
              fontFamily: "var(--adm-font-body)",
              border: "1px solid var(--adm-border)",
            }}>
              Datos de Vercel Analytics · últimos {days} días ·{" "}
              <a
                href="https://vercel.com/milagroskreuters-projects/databymilo-landingpage/analytics"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--adm-primary)", fontWeight: 700 }}
              >
                Ver dashboard completo en Vercel ↗
              </a>
            </div>
          </>
        )}
      </div>
    </>
  );
}
