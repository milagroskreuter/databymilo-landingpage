export default function Footer() {
  return (
    <footer
      style={{
        marginTop: 96,
        background: "var(--vino)",
        color: "var(--cream)",
        padding: "64px 24px 40px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative", zIndex: 2 }}>
        <div
          className="grid-split"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            gap: 48,
            paddingBottom: 36,
            borderBottom: "1px dashed rgba(253,245,236,.3)",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 700,
                fontSize: 40,
                color: "var(--cream)",
                lineHeight: 1,
              }}
            >
              data <span style={{ color: "var(--rosa-200)" }}>·</span> by milo
            </div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--cream)",
                opacity: 0.8,
                marginTop: 18,
                maxWidth: 360,
                lineHeight: 1.65,
              }}
            >
              Educación de datos para mujeres en LATAM hispanohablante. Desde 2021.
            </p>
          </div>
          <div>
            <div className="eyebrow-j" style={{ color: "var(--rosa-200)" }}>
              Biblioteca
            </div>
            {["Cheatsheets", "Plantillas", "Guías", "Glosario"].map((x, i) => (
              <div
                key={i}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  marginTop: 12,
                  color: "var(--cream)",
                  opacity: 0.88,
                }}
              >
                {x}
              </div>
            ))}
          </div>
          <div>
            <div className="eyebrow-j" style={{ color: "var(--rosa-200)" }}>
              Seguime
            </div>
            {["Instagram", "Newsletter", "Email"].map((x, i) => (
              <div
                key={i}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  marginTop: 12,
                  color: "var(--cream)",
                  opacity: 0.88,
                }}
              >
                {x}
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 26,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--cream)", opacity: 0.7 }}>
            © 2026 Data by Milo
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 15,
              color: "var(--rosa-200)",
            }}
          >
            data, pero cutie.
          </div>
        </div>
      </div>
    </footer>
  );
}
