"use client";

import { useState, useEffect } from "react";
import Reveal from "../primitives/Reveal";
import TypeEyebrow from "../primitives/TypeEyebrow";
import { resources } from "../../lib/resources";

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,63}$/;

export default function Resources() {
  const [previewHref, setPreviewHref] = useState(null);

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
            <ResourceCard {...r} index={i + 1} onPreview={r.href ? () => setPreviewHref(r.href) : null} />
          </Reveal>
        ))}
      </div>

      <Reveal delay={200}>
        <RequestResourceForm />
      </Reveal>

      {previewHref && (
        <PreviewModal href={previewHref} onClose={() => setPreviewHref(null)} />
      )}
    </section>
  );
}

function PreviewModal({ href, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(26,10,16,.6)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
        animation: "fadeIn 220ms ease",
      }}
    >
      <div style={{
        background: "var(--cream)",
        borderRadius: 16,
        width: "min(780px, 100%)",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 40px 100px rgba(26,10,16,.4)",
        overflow: "hidden",
        animation: "slideUp 280ms cubic-bezier(.2,.8,.2,1)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: "1px dashed rgba(139,26,74,.18)",
        }}>
          <div style={{
            fontFamily: "var(--font-body)", fontWeight: 700,
            fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase",
            color: "var(--vino)",
          }}>
            Vista previa
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <a
              href={href}
              download
              className="btn btn-primary"
              style={{ fontSize: 12, padding: "8px 18px" }}
            >
              Descargar →
            </a>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "var(--font-body)", fontSize: 22,
                color: "var(--fg-3)", lineHeight: 1, padding: "0 4px",
              }}
            >×</button>
          </div>
        </div>
        <iframe
          src={href}
          title="Vista previa del recurso"
          style={{ flex: 1, border: "none", minHeight: 500 }}
        />
      </div>
    </div>
  );
}

function RequestResourceForm() {
  const [suggestion, setSuggestion] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const triggerError = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const trimmed = suggestion.trim();
    if (!trimmed || trimmed.length < 5) {
      triggerError("Contame un poco más sobre qué necesitás.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/request-resource", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestion: trimmed }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      triggerError("Ups, algo se enredó. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        marginTop: 72,
        padding: "40px 36px",
        borderRadius: 14,
        background: "var(--rosa-50)",
        border: "1px dashed rgba(139,26,74,.25)",
      }}
    >
      {sent ? (
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: "var(--font-display)", fontStyle: "italic",
            fontSize: 26, color: "var(--vino)", marginBottom: 8,
          }}>
            ¡Anotado! ✦
          </div>
          <p style={{
            fontFamily: "var(--font-display)", fontStyle: "italic",
            fontSize: 17, color: "var(--fg-2)", margin: 0, lineHeight: 1.55,
          }}>
            Lo tengo en cuenta para el próximo recurso.
          </p>
        </div>
      ) : (
        <>
          <p style={{
            fontFamily: "var(--font-display)", fontStyle: "italic",
            fontSize: 20, color: "var(--ink)", margin: "0 0 24px", lineHeight: 1.5,
          }}>
            ¿Querés un recurso que no está acá?
          </p>
          <form noValidate onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <textarea
              value={suggestion}
              onChange={(e) => { setSuggestion(e.target.value); if (error) setError(""); }}
              placeholder="Ej: un cheatsheet de funciones de texto en Excel, una guía de visualización en Python..."
              rows={3}
              style={{
                width: "100%",
                border: `1.5px ${error ? "solid" : "dashed"} ${error ? "var(--rosa)" : "rgba(139,26,74,.35)"}`,
                borderRadius: 10,
                background: "var(--cream)",
                padding: "14px 16px",
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: 17,
                color: "var(--ink)",
                outline: "none",
                resize: "vertical",
                lineHeight: 1.55,
                boxSizing: "border-box",
                animation: shake ? "input-shake 500ms ease-in-out" : "none",
              }}
            />
            {error && (
              <div style={{
                fontFamily: "var(--font-display)", fontStyle: "italic",
                fontSize: 13, color: "var(--rosa)", lineHeight: 1.4,
              }}>
                ✦ {error}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ opacity: loading ? 0.65 : 1 }}
              >
                {loading ? "Enviando…" : "Mandar sugerencia →"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

function ResourceCard({ type, pages, title, desc, color, index, href, onPreview }) {
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
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a
              href={href}
              download
              style={{
                fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12,
                padding: "10px 20px", borderRadius: 999,
                background: hovered ? "var(--vino)" : "transparent",
                color: hovered ? "#fff" : "var(--vino)",
                border: "1.5px solid var(--vino)", cursor: "pointer",
                transition: "all 200ms", letterSpacing: ".02em", textDecoration: "none",
              }}
            >
              Descargar →
            </a>
            {onPreview && (
              <button
                onClick={onPreview}
                style={{
                  fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12,
                  padding: "10px 20px", borderRadius: 999,
                  background: "transparent", color: "var(--fg-2)",
                  border: "1.5px dashed rgba(139,26,74,.3)", cursor: "pointer",
                  transition: "all 200ms", letterSpacing: ".02em",
                }}
              >
                Vista previa
              </button>
            )}
          </div>
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
