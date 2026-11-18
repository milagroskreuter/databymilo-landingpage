"use client";
import Link from "next/link";
import { socials } from "../../lib/socials";

const cuaderno = [
  { label: "Recursos", href: "/recursos" },
  { label: "Blog", href: "/blog" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Sobre", href: "/sobre" },
];

const seguime = socials;

export default function Footer() {
  return (
    <footer className="footer-ink" style={{ marginTop: 96, padding: "64px 24px 40px", position: "relative", overflow: "hidden" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative", zIndex: 2 }}>
        <div
          className="footer-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: 48,
            paddingBottom: 36,
            borderBottom: "1px dashed rgba(253,245,236,.18)",
          }}
        >
          {/* Brand col */}
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
              data <span style={{ color: "var(--rosa)" }}>·</span> by milo
            </div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--cream)",
                opacity: 0.72,
                marginTop: 16,
                maxWidth: 320,
                lineHeight: 1.65,
              }}
            >
              Tech, data e IA contado desde adentro de la corpo. Para mujeres en LATAM, desde 2021.
            </p>
          </div>

          {/* Este cuaderno */}
          <div>
            <div className="eyebrow-j" style={{ marginBottom: 16 }}>Este cuaderno</div>
            {cuaderno.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "block",
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  marginBottom: 10,
                  color: "rgba(253,245,236,.82)",
                  textDecoration: "none",
                  transition: "color 150ms",
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Seguime */}
          <div>
            <div className="eyebrow-j" style={{ marginBottom: 16 }}>Seguime</div>
            {seguime.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target={s.external ? "_blank" : undefined}
                rel={s.external ? "noopener noreferrer" : undefined}
                aria-label={`${s.name}: ${s.handle}`}
                style={{
                  display: "block",
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  marginBottom: 10,
                  color: "rgba(253,245,236,.82)",
                  textDecoration: "none",
                  transition: "color 150ms",
                }}
              >
                {s.name}
              </a>
            ))}
          </div>

          {/* Escribime */}
          <div>
            <div className="eyebrow-j" style={{ marginBottom: 16 }}>Escribime</div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(253,245,236,.65)", lineHeight: 1.6, marginBottom: 14 }}>
              Colaboraciones, propuestas y preguntas raras.
            </p>
            <a
              href="mailto:databymilo@gmail.com"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                color: "rgba(253,245,236,.82)",
                textDecoration: "none",
                transition: "color 150ms",
              }}
            >
              databymilo@gmail.com
            </a>
          </div>
        </div>

        {/* Bottom row */}
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
          <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(253,245,236,.5)" }}>
            © 2026 Data by Milo
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 15,
              color: "var(--rosa)",
            }}
          >
            tech, pero cutie.
          </div>
        </div>
      </div>
    </footer>
  );
}
