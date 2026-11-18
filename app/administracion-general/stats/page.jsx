"use client";

export default function StatsPage() {
  return (
    <>
      <div className="adm-header">
        <h1>Estadísticas</h1>
      </div>

      <div className="adm-content">
        <div className="adm-alert adm-alert-info" style={{ marginBottom: 24 }}>
          Próximamente: dashboard de analytics propio. Por ahora podés ver tus datos en Google Analytics.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="adm-card">
            <div className="adm-card-title">Google Analytics</div>
            <p style={{ color: "var(--adm-text-muted)", marginBottom: 16, lineHeight: 1.6 }}>
              Tus datos actuales están en Google Analytics. Para acceder directamente desde acá, podés integrar la API de GA4.
            </p>
            <a
              href="https://analytics.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="adm-btn adm-btn-secondary"
            >
              Abrir Google Analytics →
            </a>
          </div>

          <div className="adm-card">
            <div className="adm-card-title">Vercel Analytics</div>
            <p style={{ color: "var(--adm-text-muted)", marginBottom: 16, lineHeight: 1.6 }}>
              Tu sitio ya tiene <code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: 4 }}>@vercel/analytics</code> instalado. Podés ver el tráfico en tu dashboard de Vercel.
            </p>
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="adm-btn adm-btn-secondary"
            >
              Abrir Vercel →
            </a>
          </div>
        </div>

        <div className="adm-card" style={{ marginTop: 20 }}>
          <div className="adm-card-title">Agregar analytics propio</div>
          <p style={{ color: "var(--adm-text-muted)", marginBottom: 12, lineHeight: 1.6 }}>
            Para tener un tracker completamente propio integrado acá, necesitás una base de datos para guardar los eventos. Las opciones más simples son:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            {[
              { name: "Supabase", desc: "PostgreSQL gratis. Fácil de conectar con Next.js.", badge: "Recomendado" },
              { name: "Plausible", desc: "Analytics liviano, privacy-first, con embed.", badge: "Sin código extra" },
              { name: "Umami", desc: "Open-source, self-hosted, con dashboard propio.", badge: "Full control" },
            ].map((opt) => (
              <div key={opt.name} style={{ padding: 16, background: "rgba(139,26,74,0.08)", border: "1px solid var(--adm-border)", borderRadius: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: "var(--adm-text)" }}>{opt.name}</span>
                  <span className="adm-badge adm-badge-primary" style={{ fontSize: 10 }}>{opt.badge}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--adm-text-muted)", lineHeight: 1.5 }}>{opt.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
