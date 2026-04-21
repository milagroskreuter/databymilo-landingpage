import Reveal from "../primitives/Reveal";
import TypeEyebrow from "../primitives/TypeEyebrow";

const links = [
  { label: "@databymilo", sub: "Instagram", bg: "var(--rosa)", icon: "IG", href: "https://www.instagram.com/databymilo" },
  { label: "databymilo@gmail.com", sub: "Email", bg: "#2a1520", icon: "@", href: "mailto:databymilo@gmail.com" },
];

export default function Redes() {
  return (
    <section id="ig" className="section">
      <div className="section-head">
        <TypeEyebrow className="eyebrow-j">Capítulo 05</TypeEyebrow>
        <div className="rule"></div>
        <div className="pagenum">pág. 40</div>
      </div>

      <Reveal>
        <h2 className="section-title">
          Donde <em>nos vemos</em>.
        </h2>
        <p className="section-sub">Instagram es la casa principal — los tips del día a día viven allá.</p>
      </Reveal>

      <Reveal delay={100}>
        <div style={{ display: "flex", flexDirection: "row", gap: 14, marginTop: 64, flexWrap: "wrap" }}>
          {links.map((l, i) => (
            <a
              key={i}
              href={l.href}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: l.bg,
                padding: "18px 24px",
                borderRadius: 12,
                textDecoration: "none",
                boxShadow: "0 8px 18px rgba(139,26,74,.16)",
                transition: "transform 200ms",
                flex: "1 1 220px",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  background: "rgba(255,255,255,.14)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--cream)",
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 700,
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                {l.icon}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                    color: "var(--cream)",
                    opacity: 0.75,
                    marginBottom: 3,
                  }}
                >
                  {l.sub}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontWeight: 700,
                    fontSize: 17,
                    color: "var(--cream)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 200,
                  }}
                >
                  {l.label}
                </div>
              </div>
            </a>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
