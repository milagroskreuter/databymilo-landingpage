"use client";

import { useState } from "react";
import Reveal from "../primitives/Reveal";
import { socials } from "../../lib/socials";

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,63}$/;

export default function CTABlock() {
  const [email, setEmail] = useState("");
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
    const trimmed = email.trim();
    if (!trimmed) {
      triggerError("Escribí tu email para continuar.");
      return;
    }
    if (!EMAIL_RE.test(trimmed)) {
      triggerError("Ese email no parece válido. Revisalo.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
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
    <section className="section cta-block">
      <Reveal>
        <div
          style={{
            background: "var(--vino)",
            borderRadius: 18,
            padding: "48px 44px",
            display: "grid",
            gridTemplateColumns: "1.3fr 1fr",
            gap: 48,
            alignItems: "center",
            boxShadow: "0 16px 40px rgba(139,26,74,.22)",
          }}
          className="cta-grid"
        >
          <div>
            <div className="eyebrow-j" style={{ color: "var(--rosa-200)" }}>
              ¿Te sumás?
            </div>
            <h2
              className="display italic"
              style={{
                color: "var(--cream)",
                fontSize: "clamp(28px, 3.4vw, 40px)",
                margin: "12px 0 14px",
                lineHeight: 1.1,
              }}
            >
              Un mail los domingos <br />con algo útil.
            </h2>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: 16,
                color: "var(--cream)",
                opacity: 0.9,
                margin: "0 0 22px",
                maxWidth: 420,
              }}
            >
              Recursos, historias y data lista para usar. Sin spam.
            </p>

            {sent ? (
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: 22,
                  color: "var(--cream)",
                }}
              >
                ¡Listo! El primer mail llega el domingo.
              </div>
            ) : (
              <form
                noValidate
                onSubmit={onSubmit}
                style={{ display: "flex", flexWrap: "wrap", gap: 10, maxWidth: 460 }}
              >
                <input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  type="email"
                  placeholder="vale@datos.com"
                  aria-label="Tu email"
                  style={{
                    flex: "1 1 220px",
                    border: `1.5px ${error ? "solid" : "none"} ${error ? "var(--rosa)" : "transparent"}`,
                    background: "var(--cream)",
                    padding: "12px 16px",
                    borderRadius: 10,
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: 17,
                    color: "var(--ink)",
                    outline: "none",
                    animation: shake ? "input-shake 500ms ease-in-out" : "none",
                  }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ opacity: loading ? 0.65 : 1 }}
                >
                  {loading ? "Enviando…" : "Sumame →"}
                </button>
                {error && (
                  <div
                    style={{
                      flex: "1 0 100%",
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontSize: 14,
                      color: "var(--rosa-200)",
                      lineHeight: 1.4,
                    }}
                  >
                    ✦ {error}
                  </div>
                )}
              </form>
            )}
          </div>

          <div>
            <div
              className="eyebrow-j"
              style={{ color: "var(--rosa-200)", marginBottom: 16 }}
            >
              Seguime también en
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {socials.map((s) => {
                const Icon = s.Icon;
                return (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${s.name}: ${s.handle}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      background: "rgba(253,245,236,.08)",
                      padding: "12px 16px",
                      borderRadius: 10,
                      textDecoration: "none",
                      border: "1px solid rgba(253,245,236,.14)",
                      transition: "background 180ms",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 999,
                        background: s.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} aria-hidden="true" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: 700,
                          fontSize: 10,
                          letterSpacing: ".14em",
                          textTransform: "uppercase",
                          color: "var(--cream)",
                          opacity: 0.7,
                        }}
                      >
                        {s.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontStyle: "italic",
                          fontWeight: 700,
                          fontSize: 15,
                          color: "var(--cream)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {s.handle}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
