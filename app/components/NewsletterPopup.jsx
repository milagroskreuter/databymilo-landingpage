"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import CorpoCheckbox from "./CorpoCheckbox";

// Páginas donde el popup estorba: quien se acaba de dar de baja, las páginas de
// suscripción a listas (ya son un formulario) y recursos (las landings de venta
// y la biblioteca, que promete "sin pop-up").
const HIDDEN_ON = ["/desuscribirse", "/listas", "/recursos"];

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,63}$/;

export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [corpo, setCorpo] = useState(false);
  const pathname = usePathname();
  const hidden = HIDDEN_ON.some((p) => pathname === p || pathname?.startsWith(p + "/"));
  const dialogRef = useRef(null);
  const firstInputRef = useRef(null);

  // Antes aparecía a los 2 segundos, tapando el formulario del hero. Ahora espera
  // una señal de interés: haber bajado la mitad de la página o 30 s leyendo.
  useEffect(() => {
    if (hidden) return;
    try {
      if (localStorage.getItem("popup_subscribed")) return;
      const last = localStorage.getItem("popup_dismissed_at");
      const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
      if (last && Date.now() - Number(last) < THREE_DAYS) return;
    } catch {}

    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      try {
        if (localStorage.getItem("popup_subscribed")) return;
      } catch {}
      setVisible(true);
    };
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const max = scrollHeight - clientHeight;
      if (max > 0 && scrollTop / max >= 0.5) show();
    };
    const id = setTimeout(show, 30000);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      done = true;
      clearTimeout(id);
      window.removeEventListener("scroll", onScroll);
    };
  }, [hidden, pathname]);

  // Accesibilidad: foco al primer campo, Escape cierra, Tab no se escapa del modal
  // y al cerrar el foco vuelve a donde estaba.
  useEffect(() => {
    if (!visible) return;
    const previous = document.activeElement;
    firstInputRef.current?.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === "Escape") {
        dismiss();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const items = dialogRef.current.querySelectorAll(
        'button:not([disabled]), input, a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (previous && typeof previous.focus === "function") previous.focus({ preventScroll: true });
    };
  }, [visible]);

  const dismiss = () => {
    try { localStorage.setItem("popup_dismissed_at", String(Date.now())); } catch {}
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
        body: JSON.stringify({
          email: trimmed,
          name: name.trim(),
          lists: corpo ? ["carta", "corpo"] : ["carta"],
        }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      try { localStorage.setItem("popup_subscribed", "1"); } catch {}
      setTimeout(dismiss, 2200);
    } catch {
      triggerError("Ups, algo se enredó. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (!visible || hidden) return null;

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
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="newsletter-popup-title"
        style={{
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

            <h2 id="newsletter-popup-title" style={{
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
              <label htmlFor="popup-name" style={{
                fontFamily: "var(--font-body)", fontWeight: 700,
                fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase",
                color: "var(--vino)",
              }}>
                ¿Cómo te llaman?
                <span style={{ fontWeight: 400, opacity: 0.6, marginLeft: 6 }}>opcional</span>
              </label>
              <input
                id="popup-name"
                ref={firstInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ana, Lu, Mili..."
                autoComplete="given-name"
                style={{
                  width: "100%", border: "none",
                  borderBottom: "1.5px dashed rgba(139,26,74,.4)",
                  background: "transparent", padding: "10px 0",
                  fontFamily: "var(--font-display)", fontStyle: "italic",
                  fontSize: 18, color: "var(--ink)",
                  marginTop: 8, marginBottom: 22, outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <label htmlFor="popup-email" style={{
                fontFamily: "var(--font-body)", fontWeight: 700,
                fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase",
                color: "var(--vino)",
              }}>Tu email</label>
              <input
                id="popup-email"
                type="email"
                autoComplete="email"
                aria-invalid={error ? "true" : undefined}
                aria-describedby={error ? "popup-email-error" : undefined}
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
                <div id="popup-email-error" role="alert" style={{
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
              <CorpoCheckbox checked={corpo} onChange={setCorpo} style={{ marginBottom: 20 }} />
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
