const words = ["DATA", "PERO CUTIE", "SQL", "EXCEL", "PYTHON", "PANDAS", "EN ESPAÑOL", "DESDE 2021"];

function Track() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
      {words.map((w, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: ".22em",
              textTransform: "uppercase",
              color: "var(--cream)",
            }}
          >
            {w}
          </span>
          <span
            style={{
              color: "var(--rosa-200)",
              margin: "0 20px",
              fontSize: 14,
              lineHeight: 1,
            }}
          >
            ✦
          </span>
        </span>
      ))}
    </span>
  );
}

export default function Marquee() {
  return (
    <div
      style={{
        overflow: "hidden",
        background: "var(--vino)",
        padding: "13px 0",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div style={{ display: "flex", width: "max-content", animation: "marquee-scroll 30s linear infinite" }}>
        <Track />
        <Track />
        <Track />
        <Track />
      </div>
    </div>
  );
}
