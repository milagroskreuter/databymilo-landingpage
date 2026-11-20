"use client";
import { useState } from "react";

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,63}$/;

// Suscripción solo a los avisos de notas nuevas del blog (lista Edición Corpo).
export default function EdicionCorpoForm({ maxWidth = "100%" }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        body: JSON.stringify({ email: trimmed, lists: ["corpo"] }),
      });
      if (!res.ok) throw new Error();
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
        marginTop: 56,
        padding: "32px 28px",
        borderRadius: 14,
        background: "var(--rosa-50)",
        border: "1px dashed rgba(139,26,74,.3)",
        maxWidth,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: ".18em",
          textTransform: "uppercase",
          color: "var(--vino)",
          marginBottom: 10,
        }}
      >
        edición corpo · avisos
      </div>

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
          ¡Listo! Te aviso apenas suba una nota nueva ✦
        </div>
      ) : (
        <>
          <h2
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
            ¿Te aviso cuando suba una nota nueva?
          </h2>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "var(--fg-2)",
              lineHeight: 1.6,
              margin: "0 0 18px",
            }}
          >
            Un mail cortito por cada nota, solo cuando publico. Nada más.
          </p>
          <form noValidate onSubmit={submit}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                placeholder="tu@email.com"
                autoComplete="email"
                aria-label="Tu email"
                style={{
                  flex: "1 1 220px",
                  minWidth: 0,
                  border: "none",
                  borderBottom: `1.5px ${error ? "solid" : "dashed"} ${error ? "var(--rosa)" : "rgba(139,26,74,.4)"}`,
                  background: "transparent",
                  padding: "10px 0",
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: 18,
                  color: "var(--ink)",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ opacity: loading ? 0.65 : 1 }}
              >
                {loading ? "Enviando…" : "Avisame →"}
              </button>
            </div>
            {error && (
              <div
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
