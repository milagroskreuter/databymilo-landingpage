"use client";
import Link from "next/link";
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
              Educación de datos para mujeres en LATAM hispanohablante. Desde 2021.
            </p>
          </div>
          <div>
            <div className="eyebrow-j" style={{ color: "var(--rosa-200)" }}>
              El cuaderno
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
                  aria-label={`${s.name} — ${s.handle}`}
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
