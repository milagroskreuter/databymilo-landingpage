const words = ["tech", "pero cutie", "data", "IA", "sin filtro", "LATAM", "en español", "desde 2021"];

function Track() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
      {words.map((w, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
          <span className="marquee-track-word">{w}</span>
          <span className="marquee-sep">✦</span>
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
        paddingBlock: 20,
        position: "relative",
        zIndex: 1,
      }}
    >
      <div style={{ display: "flex", width: "max-content", animation: "marquee-scroll 32s linear infinite" }}>
        <Track />
        <Track />
      </div>
    </div>
  );
}
