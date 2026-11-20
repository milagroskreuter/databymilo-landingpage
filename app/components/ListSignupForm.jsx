"use client";
import { useState } from "react";
import { markSubscribed } from "./subscribed";

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,63}$/;

const labelStyle = {
  fontFamily: "var(--font-body)",
  fontWeight: 700,
  fontSize: 10,
  letterSpacing: ".18em",
  textTransform: "uppercase",
  color: "var(--vino)",
};

const underlineInput = (error) => ({
  width: "100%",
  boxSizing: "border-box",
  border: "none",
  borderBottom: `1.5px ${error ? "solid" : "dashed"} ${error ? "var(--rosa)" : "rgba(139,26,74,.4)"}`,
  background: "transparent",
  padding: "10px 0",
  fontFamily: "var(--font-display)",
  fontStyle: "italic",
  fontSize: 18,
  color: "var(--ink)",
  outline: "none",
});

// Tarjeta de suscripción a una lista (cualquiera: Edición Corpo, membresía, etc.).
// Mantiene la estética del sitio: tarjeta rosa con borde punteado, tipografía display en cursiva.
export default function ListSignupForm({
  listSlug,
  eyebrow,
  title,
  subtitle,
  buttonLabel = "Sumame →",
  successText = "¡Listo! Ya estás en la lista ✦",
  maxWidth = "100%",
  askName = false,
  marginTop = 56,
  headingLevel = 2,
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const Heading = `h${headingLevel}`;

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) { setError("Escribí tu email para continuar."); return; }
    if (!EMAIL_RE.test(trimmed)) { setError("Ese email no parece válido."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, name: name.trim(), lists: [listSlug] }),
      });
      if (!res.ok) throw new Error();
      markSubscribed();
      setSent(true);
    } catch {
      setError("Ups, algo se enredó. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside
      style={{
        marginTop,
        padding: "32px 28px",
        borderRadius: 14,
        background: "var(--rosa-50)",
        border: "1px dashed rgba(139,26,74,.3)",
        maxWidth,
      }}
    >
      {eyebrow && <div style={{ ...labelStyle, marginBottom: 10 }}>{eyebrow}</div>}

      {sent ? (
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: 22,
            color: "var(--vino)",
            lineHeight: 1.35,
          }}
        >
          {successText}
        </div>
      ) : (
        <>
          <Heading
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: "clamp(22px, 3vw, 28px)",
              color: "var(--ink)",
              margin: "0 0 8px",
              lineHeight: 1.2,
            }}
          >
            {title}
          </Heading>
          {subtitle && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                color: "var(--fg-2)",
                lineHeight: 1.6,
                margin: "0 0 18px",
              }}
            >
              {subtitle}
            </p>
          )}
          <form noValidate onSubmit={submit}>
            {askName && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>
                  ¿Cómo te llaman?
                  <span style={{ fontWeight: 400, opacity: 0.6, marginLeft: 6 }}>opcional</span>
                </label>
                <input
                  aria-label="Tu nombre (opcional)"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ana, Lu, Mili..."
                  autoComplete="given-name"
                  maxLength={80}
                  style={{ ...underlineInput(false), marginTop: 6 }}
                />
              </div>
            )}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                {askName && <label style={labelStyle}>Tu email</label>}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                  placeholder="tu@email.com"
                  autoComplete="email"
                  aria-label="Tu email"
                  style={{ ...underlineInput(!!error), ...(askName ? { marginTop: 6 } : {}) }}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ opacity: loading ? 0.65 : 1 }}
              >
                {loading ? "Enviando…" : buttonLabel}
              </button>
            </div>
            {error && (
              <div role="alert"
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: 13,
                  color: "var(--rosa)",
                  marginTop: 8,
                }}
              >
                ✦ {error}
              </div>
            )}
          </form>
        </>
      )}
    </aside>
  );
}
