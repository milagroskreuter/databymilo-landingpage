"use client";
import { useState, useEffect } from "react";

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,63}$/;

export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("popup_seen")) return;
    const id = setTimeout(() => setVisible(true), 10000);
    return () => clearTimeout(id);
  }, []);

  const dismiss = () => {
    localStorage.setItem("popup_seen", "1");
    setVisible(false);
  };

  const triggerError = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const submit = async (e) => {
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
      localStorage.setItem("popup_seen", "1");
      setTimeout(dismiss, 2200);
    } catch {
      triggerError("Ups, algo se enredó. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(26,10,16,.45)",
        backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
        animation: "fadeIn 300ms ease",
      }}
    >
      <div style={{
        background: "var(--cream)",
        borderRadius: 16,
        padding: "48px 44px 40px",
        maxWidth: 440,
        width: "100%",
        position: "relative",
        boxShadow: "0 32px 80px rgba(26,10,16,.35)",
        animation: "slideUp 340ms cubic-bezier(.2,.8,.2,1)",
      }}>
        <div className="tape" style={{ top: -10, left: "35%", transform: "rotate(-3deg)" }} />

        <button
          onClick={dismiss}
          aria-label="Cerrar"
          style={{
            position: "absolute", top: 14, right: 16,
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "var(--font-body)", fontSize: 20,
            color: "var(--fg-3)", lineHeight: 1, padding: 4,
          }}
        >×</button>

        {sent ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{
              fontFamily: "var(--font-display)", fontStyle: "italic",
              fontSize: 32, color: "var(--vino)", marginBottom: 10,
            }}>¡Listo! ✦</div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg-2)", margin: 0 }}>
              El primer mail llega el domingo.
            </p>
          </div>
        ) : (
          <>
            <div style={{
              fontFamily: "var(--font-body)", fontSize: 10,
              letterSpacing: ".18em", textTransform: "uppercase",
              color: "var(--vino)", marginBottom: 14,
            }}>Un mail · Domingos · 9 AM</div>

            <h2 style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: "clamp(24px, 5vw, 30px)", color: "var(--ink)",
              margin: "0 0 12px", lineHeight: 1.15,
            }}>
              ¿Te sumás a <em style={{ color: "var(--vino)" }}>la carta</em>?
            </h2>

            <p style={{
              fontFamily: "var(--font-display)", fontStyle: "italic",
              fontSize: 16, color: "var(--fg-2)", lineHeight: 1.55,
              margin: "0 0 28px",
            }}>
              Cada domingo: un recurso nuevo, una historia y data que podés aplicar ese mismo día. Sin spam.
            </p>

            <form noValidate onSubmit={submit}>
              <label style={{
                fontFamily: "var(--font-body)", fontWeight: 700,
                fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase",
                color: "var(--vino)",
              }}>Tu email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                placeholder="vale@datos.com"
                style={{
                  width: "100%", border: "none",
                  borderBottom: `1.5px ${error ? "solid" : "dashed"} ${
                    error ? "var(--rosa)" : "rgba(139,26,74,.4)"
                  }`,
                  background: "transparent", padding: "10px 0",
                  fontFamily: "var(--font-display)", fontStyle: "italic",
                  fontSize: 18, color: "var(--ink)",
                  marginTop: 8, marginBottom: error ? 6 : 22, outline: "none",
                  boxSizing: "border-box",
                  animation: shake ? "input-shake 500ms ease-in-out" : "none",
                }}
              />
              {error && (
                <div style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: 13,
                  color: "var(--rosa)",
                  marginBottom: 14,
                  lineHeight: 1.4,
                }}>
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
              <button
                type="button"
                onClick={dismiss}
                style={{
                  display: "block", width: "100%", marginTop: 12,
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "var(--font-body)", fontSize: 12,
                  color: "var(--fg-3)", textAlign: "center",
                }}
              >
                Ahora no
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
