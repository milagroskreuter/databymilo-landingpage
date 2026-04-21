export default function Polaroid({
  caption,
  rotation = -4,
  size = 220,
  color = "linear-gradient(135deg,#d4447a,#8b1a4a)",
  label,
  children,
  style,
}) {
  return (
    <div
      className="polaroid"
      style={{
        width: size,
        transform: `rotate(${rotation}deg)`,
        ...style,
      }}
    >
      <div className="photo" style={{ background: color }}>
        {children || (
          <div
            style={{
              textAlign: "center",
              color: "#fdf5ec",
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: size * 0.13,
              lineHeight: 1.1,
            }}
          >
            {label || "milo"}
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontStyle: "normal",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: ".2em",
                marginTop: 6,
                opacity: 0.7,
              }}
            >
              [ FOTO ]
            </div>
          </div>
        )}
      </div>
      {caption && <div className="caption">{caption}</div>}
    </div>
  );
}
