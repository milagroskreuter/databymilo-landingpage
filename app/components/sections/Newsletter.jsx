"use client";

import { useState } from "react";
import Reveal from "../primitives/Reveal";
import TypeEyebrow from "../primitives/TypeEyebrow";

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,63}$/;

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const burst = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ox = rect.left + rect.width / 2;
    const oy = rect.top + rect.height / 2;
    const chars = ["✦", "✧", "♥", "✿", "✦", "✧"];
    const colors = ["#d4447a", "#8b1a4a", "#f2b7d1", "#fbe7a8", "#fadbe8", "#d4447a"];
    for (let i = 0; i < 44; i++) {
      const el = document.createElement("span");
      el.textContent = chars[Math.floor(Math.random() * chars.length)];
      const angle = (Math.PI * 2 * i) / 44 + Math.random() * 0.4;
      const speed = 90 + Math.random() * 180;
      el.style.cssText = `
        position:fixed; pointer-events:none; z-index:9999;
        font-size:${13 + Math.random() * 14}px;
        color:${colors[Math.floor(Math.random() * colors.length)]};
        left:${ox}px; top:${oy}px;
        --tx:${Math.cos(angle) * speed}px;
        --ty:${Math.sin(angle) * speed - 70}px;
        --rot:${Math.random() * 720 - 360}deg;
        animation:confetti-fall ${700 + Math.random() * 600}ms ease-out forwards;
        user-select:none; font-family:serif;
      `;
      document.body.appendChild(el);
      el.addEventListener("animationend", () => el.remove(), { once: true });
    }
  };

  const triggerError = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <section id="newsletter" className="section">
      <div className="section-head">
        <TypeEyebrow className="eyebrow-j">Capítulo 04</TypeEyebrow>
        <div className="rule"></div>
        <div className="pagenum">pág. 32</div>
      </div>

      <Reveal>
        <div
          className="grid-split"
          style={{
            background: "var(--vino)",
            borderRadius: 18,
            padding: "64px 56px",
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: 64,
            alignItems: "center",
            boxShadow: "0 20px 48px rgba(139,26,74,.28)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div>
            <div className="eyebrow-j" style={{ color: "var(--rosa-200)" }}>
              Un mail · Domingos · 9 AM
            </div>
            <h2
              className="display italic"
              style={{
                color: "var(--cream)",
                fontSize: "clamp(38px, 4.8vw, 58px)",
                margin: "16px 0 20px",
                lineHeight: 1.05,
              }}
            >
              La carta <br />
              del domingo.
            </h2>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: 19,
                color: "var(--cream)",
                opacity: 0.92,
                lineHeight: 1.55,
                margin: 0,
                maxWidth: 420,
              }}
            >
              Cada domingo: un recurso nuevo, una historia de la semana y data que podés aplicar ese mismo día.
            </p>
          </div>

          <div
            style={{
              background: "var(--cream)",
              borderRadius: 12,
              padding: 36,
              position: "relative",
              boxShadow: "0 10px 24px rgba(0,0,0,.18)",
            }}
          >
            <div className="tape" style={{ top: -10, left: "30%", transform: "rotate(-4deg)" }}></div>
            {sent ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: 28,
                    color: "var(--vino)",
                    lineHeight: 1.2,
                  }}
                >
                  ¡Listo!
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    color: "var(--fg-2)",
                    marginTop: 10,
                    lineHeight: 1.5,
                  }}
                >
                  El primer mail llega el domingo.
                </div>
              </div>
            ) : (
              <form
                noValidate
                onSubmit={async (e) => {
                  e.preventDefault();
                  const trimmed = email.trim();
                  if (!trimmed) {
                    triggerError("Escribí tu email para continuar.");
                    return;
                  }
                  if (!EMAIL_RE.test(trimmed)) {
                    triggerError("Ese email no parece válido. Revisalo.");
                    return;
                  }
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
                    triggerError("Ups, algo se enredó. Probá de nuevo.");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <label
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: ".18em",
                    textTransform: "uppercase",
                    color: "var(--vino)",
                  }}
                >
                  Tu email
                </label>
                <input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  type="email"
                  placeholder="vale@datos.com"
                  style={{
                    width: "100%",
                    border: "none",
                    borderBottom: `1.5px ${error ? "solid" : "dashed"} ${
                      error ? "var(--rosa)" : "rgba(139,26,74,.4)"
                    }`,
                    background: "transparent",
                    padding: "10px 0",
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: 20,
                    color: "var(--ink)",
                    marginTop: 8,
                    marginBottom: error ? 8 : 26,
                    outline: "none",
                    animation: shake ? "input-shake 500ms ease-in-out" : "none",
                  }}
                />
                {error && (
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontSize: 13,
                      color: "var(--rosa)",
                      marginBottom: 16,
                      lineHeight: 1.4,
                    }}
                  >
                    ✦ {error}
                  </div>
                )}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ width: "100%", justifyContent: "center", opacity: loading ? 0.65 : 1 }}
                >
                  {loading ? "Enviando…" : "Sumame →"}
                </button>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 11,
                    color: "var(--fg-3)",
                    textAlign: "center",
                    marginTop: 14,
                  }}
                >
                  Sin spam · cancelá cuando quieras
                </div>
              </form>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
