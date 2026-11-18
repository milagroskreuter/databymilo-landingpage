"use client";

import { useState } from "react";
import Reveal from "../primitives/Reveal";
import TypeEyebrow from "../primitives/TypeEyebrow";

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,63}$/;

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const burst = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ox = rect.left + rect.width / 2;
    const oy = rect.top + rect.height / 2;
    const chars = ["✦", "✧", "♥", "✿", "✦", "✧"];
    const colors = ["#d4447a", "#8b1a4a", "#f2b7d1", "#fbe7a8", "#fadbe8"];
    for (let i = 0; i < 44; i++) {
      const el = document.createElement("span");
      el.textContent = chars[Math.floor(Math.random() * chars.length)];
      const angle = (Math.PI * 2 * i) / 44 + Math.random() * 0.4;
      const speed = 90 + Math.random() * 180;
      el.style.cssText = `
        position:fixed;pointer-events:none;z-index:9999;
        font-size:${13+Math.random()*14}px;
        color:${colors[Math.floor(Math.random()*colors.length)]};
        left:${ox}px;top:${oy}px;
        --tx:${Math.cos(angle)*speed}px;--ty:${Math.sin(angle)*speed-70}px;
        --rot:${Math.random()*720-360}deg;
        animation:confetti-fall ${700+Math.random()*600}ms ease-out forwards;
        user-select:none;font-family:serif;
      `;
      document.body.appendChild(el);
      el.addEventListener("animationend", () => el.remove(), { once: true });
    }
  };

  return (
    <section id="newsletter" className="section">
      <div className="section-head">
        <TypeEyebrow className="eyebrow-j">Capítulo 04</TypeEyebrow>
        <div className="rule"></div>
        <div className="pagenum">pág. 32</div>
      </div>

      <Reveal>
        <div className="carta-block">
          {/* Left: text + form */}
          <div>
            <div className="eyebrow-j" style={{ color: "rgba(253,245,236,.65)", marginBottom: 16 }}>
              Un mail · Domingos · 9 AM
            </div>
            <h2
              className="display italic"
              style={{
                color: "var(--cream)",
                fontSize: "clamp(36px, 4.4vw, 56px)",
                margin: "0 0 20px",
                lineHeight: 1.05,
              }}
            >
              La carta<br />del domingo.
            </h2>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: 18,
                color: "var(--cream)",
                opacity: 0.88,
                lineHeight: 1.55,
                margin: "0 0 32px",
                maxWidth: 420,
              }}
            >
              Historias de la corpo que no entran en Instagram, un recurso recién salido, y data lista para usar. 5 minutos. Promesa.
            </p>

            {sent ? (
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: 24,
                  color: "var(--butter)",
                  lineHeight: 1.3,
                }}
              >
                ¡Listo! El primer mail llega el domingo.
              </div>
            ) : (
              <form
                noValidate
                onSubmit={async (e) => {
                  e.preventDefault();
                  const trimmed = email.trim();
                  if (!trimmed) { setError("Escribí tu email para continuar."); return; }
                  if (!EMAIL_RE.test(trimmed)) { setError("Ese email no parece válido."); return; }
                  const submitTarget = e.currentTarget;
                  setLoading(true);
                  setError("");
                  try {
                    const res = await fetch("/api/subscribe", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: trimmed }),
                    });
                    if (!res.ok) throw new Error();
                    burst({ currentTarget: submitTarget });
                    setSent(true);
                  } catch {
                    setError("Ups, algo se enredó. Probá de nuevo.");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <div className="carta-form">
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                    autoComplete="email"
                  />
                  <button type="submit" disabled={loading}>
                    {loading ? "Enviando…" : "Sumame →"}
                  </button>
                </div>
                {error && (
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontSize: 13,
                      color: "var(--rosa-200)",
                      marginTop: 8,
                      lineHeight: 1.4,
                    }}
                  >
                    ✦ {error}
                  </div>
                )}
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 11,
                    color: "rgba(253,245,236,.5)",
                    marginTop: 12,
                  }}
                >
                  Sin spam · cancelá cuando quieras
                </div>
              </form>
            )}
          </div>

          {/* Right: carta preview */}
          <div className="carta-preview">
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 9,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                color: "var(--vino)",
                opacity: 0.6,
                marginBottom: 14,
              }}
            >
              Dom. 9 AM · carta nº 047
            </div>
            <div className="carta-preview-line">
              Hola — esta semana pasó algo raro en la reunión de producto. Te cuento.
            </div>
            <div className="carta-preview-line">
              El modelo de IA que todos están usando en mi equipo tiene un problema que nadie quiere admitir…
            </div>
            <div className="carta-preview-line">
              Y el recurso de esta semana: la plantilla que uso para presentar métricas a mi jefa sin que se duerma.
            </div>
            <div className="carta-sig">— milo</div>
            <div className="carta-stamp">carta nº 047</div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
