export default function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/assets/logo-monogram.svg" alt="M" style={{ width: 32, height: 32 }} />
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 700,
                fontSize: 20,
                color: "#1a1a1a",
                lineHeight: 1,
              }}
            >
              data by milo
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 10,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                color: "#8b1a4a",
                marginTop: 2,
              }}
            >
              data, pero cutie.
            </div>
          </div>
        </div>
        <nav>
          <a href="#sobre">Sobre</a>
          <a href="#recursos">Recursos</a>
          <a href="#newsletter">Newsletter</a>
          <a href="#ig">Redes</a>
        </nav>
      </div>
    </header>
  );
}
