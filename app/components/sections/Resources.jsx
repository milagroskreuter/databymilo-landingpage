"use client";

import { useState } from "react";
import Reveal from "../primitives/Reveal";
import TypeEyebrow from "../primitives/TypeEyebrow";
import { resources } from "../../lib/resources";

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
            <p className="section-sub">Seis descargas para empezar. Sin mail, sin pop-up, sin letra chica.</p>
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

      <Reveal delay={200}>
        <div
          style={{
            marginTop: 72,
            padding: 32,
            borderRadius: 14,
            background: "var(--rosa-50)",
            border: "1px dashed rgba(139,26,74,.25)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 20,
              color: "var(--ink)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            ¿Querés un recurso que no está acá?{" "}
            <a
              href="https://www.instagram.com/databymilo"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--vino)", textDecoration: "underline", textUnderlineOffset: 4 }}
            >
              Mandame DM a @databymilo
            </a>{" "}
            y lo escribo.
          </p>
        </div>
      </Reveal>
    </section>
  );
}

function ResourceCard({ type, pages, title, desc, color, index, href }) {
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
        <div style={{
          position: "absolute",
          top: 22,
          right: -30,
          width: 130,
          background: "#8b1a4a",
          color: "#fff",
          fontSize: 8,
          fontFamily: "var(--font-body)",
          fontWeight: 800,
          letterSpacing: ".2em",
          textTransform: "uppercase",
          textAlign: "center",
          padding: "7px 0",
          transform: "rotate(45deg)",
          zIndex: 3,
          boxShadow: "0 2px 8px rgba(0,0,0,.2)",
          pointerEvents: "none",
          overflow: "hidden",
        }}>
          DISPONIBLE
          <span style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,.45) 50%, transparent 100%)",
            animation: "ribbon-shine 2.8s ease-in-out infinite",
          }} />
        </div>
      )}
      <div
        style={{
          background: color,
          padding: "24px 26px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          borderBottom: "1px dashed rgba(139,26,74,.18)",
          borderRadius: "10px 10px 0 0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: "#fff",
            border: "1px solid rgba(139,26,74,.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontWeight: 800,
            fontSize: 20,
            color: "var(--vino)",
          }}
        >
          {String(index).padStart(2, "0")}
        </div>
        <div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 800,
              fontSize: 10,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: "var(--vino)",
            }}
          >
            {type}
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: "var(--fg-3)",
              marginTop: 3,
            }}
          >
            {pages}
          </div>
        </div>
      </div>
      <div
        style={{
          padding: "24px 26px 26px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 22,
            color: "var(--ink)",
            margin: "0 0 12px",
            lineHeight: 1.25,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            lineHeight: 1.6,
            color: "var(--fg-2)",
            margin: "0 0 22px",
            flex: 1,
          }}
        >
          {desc}
        </p>
        {href ? (
          <a
            href={href}
            download
            style={{
              alignSelf: "flex-start",
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: 12,
              padding: "10px 20px",
              borderRadius: 999,
              background: hovered ? "var(--vino)" : "transparent",
              color: hovered ? "#fff" : "var(--vino)",
              border: "1.5px solid var(--vino)",
              cursor: "pointer",
              transition: "all 200ms",
              letterSpacing: ".02em",
              textDecoration: "none",
            }}
          >
            Descargar →
          </a>
        ) : (
          <div
            style={{
              alignSelf: "flex-start",
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: 11,
              padding: "8px 16px",
              borderRadius: 999,
              background: "var(--cream-200)",
              color: "var(--fg-3)",
              border: "1.5px dashed rgba(139,26,74,.25)",
              letterSpacing: ".1em",
              textTransform: "uppercase",
            }}
          >
            Próximamente
          </div>
        )}
      </div>
    </div>
  );
}
