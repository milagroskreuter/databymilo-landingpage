"use client";

import { useState } from "react";
import Link from "next/link";
import CorpoCheckbox from "../CorpoCheckbox";

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,63}$/;

export default function Hero() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [corpo, setCorpo] = useState(false);

  const burst = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ox = rect.left + rect.width / 2;
    const oy = rect.top + rect.height / 2;
    const chars = ["✦", "✧", "♥", "✿", "✦", "✧"];
    const colors = ["#d4447a", "#8b1a4a", "#f2b7d1", "#fbe7a8", "#fadbe8", "#d4447a"];
    for (let i = 0; i < 36; i++) {
      const el = document.createElement("span");
      el.textContent = chars[Math.floor(Math.random() * chars.length)];
      const angle = (Math.PI * 2 * i) / 36 + Math.random() * 0.4;
      const speed = 80 + Math.random() * 160;
      el.style.cssText = `
        position:fixed;pointer-events:none;z-index:9999;
        font-size:${13+Math.random()*12}px;
        color:${colors[Math.floor(Math.random()*colors.length)]};
        left:${ox}px;top:${oy}px;
        --tx:${Math.cos(angle)*speed}px;--ty:${Math.sin(angle)*speed-60}px;
        --rot:${Math.random()*720-360}deg;
        animation:confetti-fall ${700+Math.random()*500}ms ease-out forwards;
        user-select:none;font-family:serif;
      `;
      document.body.appendChild(el);
      el.addEventListener("animationend", () => el.remove(), { once: true });
    }
  };

  const handleSubmit = async (e) => {
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
        body: JSON.stringify({
          email: trimmed,
          lists: corpo ? ["carta", "corpo"] : ["carta"],
        }),
      });
      if (!res.ok) throw new Error();
      burst({ currentTarget: submitTarget });
      setSent(true);
    } catch {
      setError("Ups, algo se enredó. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="section hero-section"
      style={{
        paddingTop: 72,
        paddingBottom: 80,
        borderTop: "none",
        background: "radial-gradient(ellipse at 30% 60%, #fadbe8 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, #e8d9f0 0%, transparent 50%), var(--cream)",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 40px" }}>
      <div className="hero-grid">
        {/* Left: headline + CTAs */}
        <div>
          <div
            className="eyebrow-j"
            style={{ marginBottom: 28 }}
          >
            Entrada Nº 001 · pág. 01
          </div>
          <h1
            className="display"
            style={{
              fontSize: "clamp(44px, 5.8vw, 76px)",
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            la corpo no te lo cuenta,{" "}
            <br />
            <em style={{ fontStyle: "italic", color: "var(--rosa)" }}>pero</em>{" "}
            <span
              style={{
                position: "relative",
                display: "inline",
              }}
            >
              <span style={{ position: "relative", zIndex: 1 }}>yo sí.</span>
              <span
                style={{
                  position: "absolute",
                  left: "-4px",
                  right: "-4px",
                  top: "55%",
                  bottom: "-5%",
                  background: "var(--butter)",
                  zIndex: 0,
                  borderRadius: 3,
                  transform: "skewY(-1.5deg)",
                }}
              />
            </span>
          </h1>

          <p
            className="hero-subtext"
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: "clamp(16px, 1.8vw, 20px)",
              color: "var(--fg-2)",
              lineHeight: 1.6,
              marginTop: 28,
              maxWidth: 500,
            }}
          >
            Tech, data e IA contado desde adentro de la corpo. Para mujeres en LATAM, sin filtro corporativo ni motivacional.
          </p>

          <div className="hero-buttons" style={{ display: "flex", gap: 14, marginTop: 40, flexWrap: "wrap" }}>
            <Link href="/blog" className="btn btn-vino">
              leer el blog →
            </Link>
            <Link href="/sobre" className="btn btn-ghost">
              sobre milo
            </Link>
          </div>
        </div>

        {/* Right: stamp-card newsletter */}
        <div className="stamp-card">
          <div className="stamp-card-badge">★</div>

          {sent ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 28, color: "var(--vino)", lineHeight: 1.2 }}>
                ¡Listo!
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-2)", marginTop: 10, lineHeight: 1.5 }}>
                El primer mail llega el domingo.
              </div>
            </div>
          ) : (
            <>
              <div className="stamp-card-title">Una carta los domingos. Corta y útil.</div>
              <div className="stamp-card-sub">
                Tech, IA y vida en la corpo — sin spam, sin coaches motivacionales. Solo una carta a las 9 AM.
              </div>
              <form onSubmit={handleSubmit} noValidate>
                <input
                  className="stamp-card-input"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                  autoComplete="email"
                />
                <CorpoCheckbox
                  checked={corpo}
                  onChange={setCorpo}
                  style={{ fontSize: 12, marginBottom: 12, textAlign: "left" }}
                />
                {error && (
                  <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 12, color: "var(--rosa)", marginBottom: 8, lineHeight: 1.4 }}>
                    ✦ {error}
                  </div>
                )}
                <button className="stamp-card-btn" type="submit" disabled={loading}>
                  {loading ? "Enviando…" : "Sumame →"}
                </button>
              </form>
              <div className="stamp-card-micro">Sin spam · cancelá cuando quieras</div>
            </>
          )}
        </div>
      </div>
      </div>
    </section>
  );
}
