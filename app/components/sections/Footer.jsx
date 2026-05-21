"use client";
import Link from "next/link";
import { FiAtSign } from "react-icons/fi";
import { socials, email } from "../../lib/socials";

const biblioteca = [
  { label: "Recursos", href: "/recursos" },
  { label: "Blog", href: "/blog" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Sobre", href: "/sobre" },
];

export default function Footer() {
  const seguime = [...socials, email];
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
              Tech, data e IA contado desde adentro de la corpo. Para mujeres en LATAM, desde 2021.
            </p>
          </div>
          <div>
            <div className="eyebrow-j" style={{ color: "var(--rosa-200)" }}>
              Este cuaderno
            </div>
            {biblioteca.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "block",
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  marginTop: 12,
                  color: "var(--cream)",
                  opacity: 0.88,
                  textDecoration: "none",
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div>
            <div className="eyebrow-j" style={{ color: "var(--rosa-200)" }}>
              Seguime
            </div>
            {seguime.map((s) => {
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
                    gap: 10,
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    marginTop: 12,
                    color: "var(--cream)",
                    opacity: 0.88,
                    textDecoration: "none",
                    transition: "opacity 180ms",
                  }}
                >
                  <Icon size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
                  <span>{s.name}</span>
                </a>
              );
            })}
            <a
              href="mailto:databymilo@gmail.com"
              aria-label="Colaboraciones & propuestas: databymilo@gmail.com"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                marginTop: 20,
                paddingTop: 16,
                borderTop: "1px dashed rgba(253,245,236,.2)",
                color: "var(--cream)",
                textDecoration: "none",
                transition: "opacity 180ms",
              }}
            >
              <FiAtSign size={16} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                    opacity: 0.7,
                    marginBottom: 3,
                  }}
                >
                  Colaboraciones & propuestas
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    opacity: 0.88,
                  }}
                >
                  databymilo@gmail.com
                </div>
              </div>
            </a>
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
            tech, pero cutie.
          </div>
        </div>
      </div>
    </footer>
  );
}
