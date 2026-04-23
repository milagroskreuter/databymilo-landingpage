export const metadata = {
  title: "Portfolio",
  description: "Portfolio de Data by Milo — próximamente.",
  robots: { index: false, follow: true },
};

export default function PortfolioPage() {
  return (
    <main>
      <div className="journal">
        <section
          className="section"
          style={{
            minHeight: "70vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-caveat)",
              color: "var(--vino)",
              fontSize: 28,
              transform: "rotate(-2deg)",
            }}
          >
            ✦ próximamente ✦
          </div>
          <h1
            className="section-title"
            style={{ maxWidth: 720, margin: 0 }}
          >
            Portfolio <em>en construcción</em>
          </h1>
          <p
            className="section-sub"
            style={{ maxWidth: 560, margin: 0 }}
          >
            Estoy armando este espacio con mis proyectos favoritos de análisis
            de datos. Volvé en unos días — va a valer la pena.
          </p>
          <a href="/" className="btn btn-primary" style={{ marginTop: 12 }}>
            ← Volver al inicio
          </a>
        </section>
      </div>
    </main>
  );
}
