"use client";

import { useState } from "react";
import Link from "next/link";
import Reveal from "../primitives/Reveal";
import TypeEyebrow from "../primitives/TypeEyebrow";
import { resources, paidResources } from "../../lib/resources";


export default function Resources() {
  return (
    <section id="recursos" className="section">
      <div className="section-head">
        <TypeEyebrow className="eyebrow-j">Capítulo 02</TypeEyebrow>
        <div className="rule"></div>
        <div className="pagenum">pág. 20</div>
      </div>

      <Reveal>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 className="section-title">
              La <em>biblioteca</em>.
            </h2>
            <p className="section-sub">Tres descargas para empezar. Sin mail, sin pop-up, sin letra chica.</p>
          </div>
          <span className="stamp">guardá esto</span>
        </div>
      </Reveal>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 24,
          marginTop: 64,
        }}
      >
        {resources.map((r, i) => (
          <Reveal key={i} delay={i * 60}>
            <ResourceCard {...r} index={i + 1} />
          </Reveal>
        ))}
      </div>

      <PaidSection products={paidResources} />

    </section>
  );
}

function PaidSection({ products }) {
  return (
    <div style={{ marginTop: 80 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 20, marginBottom: 40,
      }}>
        <div style={{ flex: 1, height: 1, background: "rgba(139,26,74,.2)" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <span className="eyebrow-j" style={{ letterSpacing: ".22em" }}>✦ Destacados</span>
          <span style={{
            fontFamily: "var(--font-display)", fontStyle: "italic",
            fontSize: 13, color: "var(--fg-3)",
          }}>recursos de pago</span>
        </div>
        <div style={{ flex: 1, height: 1, background: "rgba(139,26,74,.2)" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {products.map((p, i) => (
          <Reveal key={i} delay={80}>
            <PaidResourceCard {...p} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function PaidResourceCard({ type, pages, title, desc, price, priceNote, slug, badge, bullets }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="paid-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fffcf6",
        borderRadius: 12,
        border: "1px solid rgba(139,26,74,.12)",
        boxShadow: hovered ? "0 24px 56px rgba(139,26,74,.18)" : "0 8px 32px rgba(139,26,74,.1)",
        overflow: "hidden",
        transition: "box-shadow 300ms ease",
        borderTop: "4px solid var(--vino)",
      }}
    >
      <div className="paid-card-grid" style={{
        padding: "32px 36px 36px",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 40,
        alignItems: "start",
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20, alignItems: "center" }}>
            <span style={{
              fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 10,
              letterSpacing: ".18em", textTransform: "uppercase",
              background: "var(--vino)", color: "#fff",
              padding: "5px 12px", borderRadius: 999,
            }}>
              ✦ {badge}
            </span>
            <span style={{
              fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 10,
              letterSpacing: ".14em", textTransform: "uppercase",
              color: "var(--vino)", background: "var(--rosa-50)",
              padding: "5px 12px", borderRadius: 999,
              border: "1px solid rgba(139,26,74,.15)",
            }}>
              {type} · {pages}
            </span>
          </div>

          <h3 style={{
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "clamp(20px, 2.5vw, 28px)", lineHeight: 1.2,
            color: "var(--ink)", margin: "0 0 14px",
          }}>
            {title}
          </h3>

          <p style={{
            fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.7,
            color: "var(--fg-2)", margin: "0 0 24px", maxWidth: 600,
          }}>
            {desc}
          </p>

          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 8 }}>
            {bullets.map((b, i) => (
              <li key={i} style={{
                fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg-2)",
                display: "flex", alignItems: "flex-start", gap: 10,
              }}>
                <span style={{ color: "var(--vino)", fontWeight: 800, flexShrink: 0, marginTop: 1 }}>✓</span>
                {b}
              </li>
            ))}
          </ul>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
            <Link
              href={`/recursos/${slug}`}
              style={{
                fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14,
                padding: "13px 28px", borderRadius: 999,
                background: hovered ? "var(--vino)" : "var(--rosa)",
                color: "#fff",
                transition: "background 220ms",
                textDecoration: "none", display: "inline-block",
                boxShadow: "0 6px 16px rgba(139,26,74,.28)",
                letterSpacing: ".02em",
              }}
            >
              ¡QUIERO MI GUÍA!
            </Link>
            <span style={{
              fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-3)",
              letterSpacing: ".02em",
            }}>
              Descarga inmediata · Garantía 7 días sin preguntas
            </span>
          </div>
        </div>

        <div className="paid-card-img-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <img
            className="paid-card-img"
            src="/mockup-guia.png"
            alt="Mockup de la guía en laptop y tablet"
            style={{
              width: 220,
              borderRadius: 12,
              boxShadow: "0 12px 32px rgba(139,26,74,.22)",
              display: "block",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ResourceCard({ type, pages, title, desc, color, index, href, slug }) {
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const onMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x, y });
  };
  const onMouseLeave = () => { setHovered(false); setTilt({ x: 0, y: 0 }); };

  const transform = hovered
    ? `perspective(700px) rotateY(${tilt.x * 10}deg) rotateX(${-tilt.y * 10}deg) translateY(-6px) scale(1.02)`
    : "perspective(700px) rotateY(0deg) rotateX(0deg)";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
      style={{
        background: "#fffcf6",
        borderRadius: 10,
        boxShadow: hovered ? "0 24px 48px rgba(139,26,74,.22)" : "0 8px 24px rgba(139,26,74,.1)",
        transform,
        transition: hovered ? "box-shadow 260ms, transform 80ms" : "all 400ms cubic-bezier(.2,.8,.2,1)",
        overflow: "hidden",
        border: "1px solid rgba(139,26,74,.08)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {href && (
        <div className="resource-ribbon" style={{
          position: "absolute", top: 22, right: -30, width: 130,
          background: "#8b1a4a", color: "#fff", fontSize: 8,
          fontFamily: "var(--font-body)", fontWeight: 800,
          letterSpacing: ".2em", textTransform: "uppercase",
          textAlign: "center", padding: "7px 0",
          transform: "rotate(45deg)", zIndex: 3,
          boxShadow: "0 2px 8px rgba(0,0,0,.2)",
          pointerEvents: "none", overflow: "hidden",
        }}>
          DISPONIBLE
          <span style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,.45) 50%, transparent 100%)",
            animation: "ribbon-shine 2.8s ease-in-out infinite",
          }} />
        </div>
      )}
      <div style={{
        background: color, padding: "24px 26px",
        display: "flex", alignItems: "center", gap: 16,
        borderBottom: "1px dashed rgba(139,26,74,.18)",
        borderRadius: "10px 10px 0 0", overflow: "hidden",
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 10,
          background: "#fff", border: "1px solid rgba(139,26,74,.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)", fontStyle: "italic",
          fontWeight: 800, fontSize: 20, color: "var(--vino)",
        }}>
          {String(index).padStart(2, "0")}
        </div>
        <div>
          <div style={{
            fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 10,
            letterSpacing: ".14em", textTransform: "uppercase", color: "var(--vino)",
          }}>
            {type}
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--fg-3)", marginTop: 3 }}>
            {pages}
          </div>
        </div>
      </div>
      <div style={{ padding: "24px 26px 26px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22,
          color: "var(--ink)", margin: "0 0 12px", lineHeight: 1.25,
        }}>
          {title}
        </h3>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.6,
          color: "var(--fg-2)", margin: "0 0 22px", flex: 1,
        }}>
          {desc}
        </p>
        {href ? (
          <Link
            href={`/recursos/${slug}`}
            style={{
              fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12,
              padding: "10px 20px", borderRadius: 999,
              background: hovered ? "var(--vino)" : "transparent",
              color: hovered ? "#fff" : "var(--vino)",
              border: "1.5px solid var(--vino)",
              transition: "all 200ms", letterSpacing: ".02em", textDecoration: "none",
              display: "inline-block",
            }}
          >
            Ver recurso →
          </Link>
        ) : (
          <div style={{
            alignSelf: "flex-start", fontFamily: "var(--font-body)", fontWeight: 700,
            fontSize: 11, padding: "8px 16px", borderRadius: 999,
            background: "var(--cream-200)", color: "var(--fg-3)",
            border: "1.5px dashed rgba(139,26,74,.25)",
            letterSpacing: ".1em", textTransform: "uppercase",
          }}>
            Próximamente
          </div>
        )}
      </div>
    </div>
  );
}
