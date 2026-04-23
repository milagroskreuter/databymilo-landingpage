"use client";
import Reveal from "../primitives/Reveal";
import TypeEyebrow from "../primitives/TypeEyebrow";
import { socials } from "../../lib/socials";

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
        <p className="section-sub">Instagram es la casa principal: los tips del día a día viven allá.</p>
      </Reveal>

      <Reveal delay={100}>
        <div style={{ display: "flex", flexDirection: "row", gap: 14, marginTop: 64, flexWrap: "wrap" }}>
          {socials.map((s) => {
            const Icon = s.Icon;
            return (
              <a
                key={s.name}
                href={s.href}
                target={s.external ? "_blank" : undefined}
                rel={s.external ? "noopener noreferrer" : undefined}
                aria-label={`${s.name}: ${s.handle}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  background: s.bg,
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
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} aria-hidden="true" />
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
                    {s.name}
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
                    {s.handle}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}
