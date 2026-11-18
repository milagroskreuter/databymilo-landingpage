"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const DRAFT_KEY = "adm_newsletter_draft";

function saveDraft(subject, body) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ subject, body, savedAt: Date.now() })); } catch {}
}
function loadDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch { return null; }
}
function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}

export default function ComposePage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendAt, setSendAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const draftTimer = useRef(null);

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft && (draft.subject || draft.body)) {
      setSubject(draft.subject || "");
      setBody(draft.body || "");
      setMsg({ type: "info", text: `Borrador restaurado — guardado ${new Date(draft.savedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}` });
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    clearTimeout(draftTimer.current);
    if (!subject && !body) return;
    draftTimer.current = setTimeout(() => {
      saveDraft(subject, body);
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    }, 1500);
    return () => clearTimeout(draftTimer.current);
  }, [subject, body]);

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const readMin = Math.max(1, Math.round(wordCount / 200));

  async function handleSend(e) {
    e.preventDefault();
    if (!confirm(`¿Enviar este email a todas las suscriptoras activas${sendAt ? " el " + new Date(sendAt).toLocaleString("es-AR") : " ahora"}?`)) return;
    setLoading(true);
    setMsg(null);

    const payload = { subject, body };
    if (sendAt) payload.sendAt = new Date(sendAt).toISOString();

    const res = await fetch("/api/admin/newsletter/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      clearDraft();
      setMsg({ type: "success", text: sendAt ? "✦ Email programado con éxito" : "✦ Email enviado a toda la lista" });
      setSubject("");
      setBody("");
      setSendAt("");
    } else {
      setMsg({ type: "error", text: data.error || "Error al enviar" });
    }
    setLoading(false);
  }

  function handleDiscard() {
    if (!confirm("¿Descartar este borrador?")) return;
    clearDraft();
    setSubject("");
    setBody("");
    setSendAt("");
    setMsg(null);
  }

  const previewParas = body
    .split("\n\n")
    .filter(Boolean)
    .map((p, i) => (
      <p key={i} style={{ marginBottom: 20, lineHeight: 1.75, fontSize: 15, color: "#3d1a2a", fontFamily: "Arial, sans-serif" }}>{p}</p>
    ));

  return (
    <>
      <div className="adm-header">
        <div>
          <h1>Escribir newsletter</h1>
          {draftSaved && (
            <span style={{ fontSize: 11, color: "var(--adm-fg-muted)", fontFamily: "var(--adm-font-body)", marginLeft: 8 }}>
              Borrador guardado ✓
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            className={`adm-btn adm-btn-sm ${previewMode ? "adm-btn-primary" : "adm-btn-secondary"}`}
            onClick={() => setPreviewMode(v => !v)}
          >
            {previewMode ? "✎ Editar" : "👁 Vista previa"}
          </button>
          <Link href="/administracion-general/newsletter" className="adm-btn adm-btn-secondary adm-btn-sm">
            ← Volver
          </Link>
        </div>
      </div>

      <div className="adm-content">
        {msg && (
          <div className={`adm-alert adm-alert-${msg.type}`} style={{ marginBottom: 20 }}>
            {msg.text}
            <button onClick={() => setMsg(null)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", opacity: .6 }}>✕</button>
          </div>
        )}

        {!previewMode ? (
          <form onSubmit={handleSend}>
            <div className="adm-editor-grid">
              {/* Editor */}
              <div>
                <div className="adm-form-group">
                  <label className="adm-label">Asunto del email</label>
                  <input
                    className="adm-input"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="la carta del domingo · 17 nov"
                    required
                  />
                  <div style={{ fontSize: 11, color: "var(--adm-fg-muted)", marginTop: 4 }}>
                    Tip: sujetos cortos y personales tienen mejor tasa de apertura.
                  </div>
                </div>

                <div className="adm-form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <label className="adm-label" style={{ margin: 0 }}>Cuerpo del email</label>
                    <span style={{ fontSize: 11, color: "var(--adm-fg-muted)", fontFamily: "var(--adm-font-body)" }}>
                      {wordCount} palabras · ~{readMin} min de lectura
                    </span>
                  </div>
                  <textarea
                    className="adm-textarea"
                    style={{ minHeight: 340 }}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={"hola,\n\nesta semana estuvo pasando algo interesante en las corpos...\n\n..."}
                    required
                  />
                  <div style={{ fontSize: 11, color: "var(--adm-fg-muted)", marginTop: 6 }}>
                    Separar párrafos con una línea en blanco. La firma (milo) se agrega automáticamente.
                  </div>
                </div>

                <div className="adm-form-group">
                  <label className="adm-label">Programar envío <span style={{ fontWeight: 400, color: "var(--adm-fg-muted)" }}>(opcional)</span></label>
                  <input
                    type="datetime-local"
                    className="adm-input"
                    value={sendAt}
                    onChange={(e) => setSendAt(e.target.value)}
                  />
                  <div style={{ fontSize: 11, color: "var(--adm-fg-muted)", marginTop: 4 }}>
                    Dejalo vacío para enviar ahora.
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="submit"
                    className="adm-btn adm-btn-primary"
                    disabled={loading || !subject || !body}
                  >
                    {loading ? "Enviando…" : sendAt ? "✦ Programar envío" : "✦ Enviar ahora"}
                  </button>
                  {(subject || body) && (
                    <button type="button" className="adm-btn adm-btn-secondary" onClick={handleDiscard}>
                      Descartar borrador
                    </button>
                  )}
                  <Link href="/administracion-general/newsletter" className="adm-btn adm-btn-secondary">
                    Cancelar
                  </Link>
                </div>
              </div>

              {/* Live preview (compact) */}
              <div>
                <div className="adm-label">Vista previa en vivo</div>
                <div style={{
                  background: "#fdf5ec", borderRadius: 10, overflow: "hidden",
                  border: "1px solid rgba(139,26,74,0.25)", fontSize: 14,
                  boxShadow: "0 2px 12px rgba(139,26,74,.08)",
                }}>
                  <div style={{ background: "#8b1a4a", padding: "20px 28px", textAlign: "center" }}>
                    <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "#f2b7d1", marginBottom: 4 }}>Data by Milo</div>
                    <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 12, color: "rgba(253,245,236,.7)", letterSpacing: ".06em" }}>la carta del domingo</div>
                  </div>
                  <div style={{ padding: "24px 28px", background: "#fffcf6", borderBottom: "1px solid rgba(139,26,74,.08)" }}>
                    <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 13, fontWeight: 700, color: "#1a0a10", marginBottom: 14 }}>
                      {subject || <span style={{ color: "#c099a8", fontWeight: 400 }}>(asunto)</span>}
                    </div>
                    {previewParas.length > 0 ? previewParas : (
                      <p style={{ color: "#c099a8", fontStyle: "italic", fontSize: 13 }}>El contenido va a aparecer acá…</p>
                    )}
                    <div style={{ borderTop: "1px dashed rgba(139,26,74,.2)", paddingTop: 14, marginTop: 14 }}>
                      <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 30, color: "#8b1a4a", lineHeight: 1 }}>milo</div>
                      <div style={{ fontSize: 10, color: "#a07080", marginTop: 3 }}>Data by Milo · databymilo.me</div>
                    </div>
                  </div>
                  <div style={{ background: "#f5e6d8", padding: "10px 28px", textAlign: "center", fontSize: 10, color: "#a07080" }}>
                    Cancelar suscripción
                  </div>
                </div>
              </div>
            </div>
          </form>
        ) : (
          /* Full preview mode */
          <div>
            <div style={{
              maxWidth: 560, margin: "0 auto",
              background: "#fdf5ec", borderRadius: 12, overflow: "hidden",
              border: "1px solid rgba(139,26,74,0.25)",
              boxShadow: "0 4px 24px rgba(139,26,74,.12)",
            }}>
              <div style={{ background: "#8b1a4a", padding: "28px 40px", textAlign: "center" }}>
                <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#f2b7d1", marginBottom: 6 }}>Data by Milo</div>
                <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 13, color: "rgba(253,245,236,.7)", letterSpacing: ".06em" }}>la carta del domingo</div>
              </div>
              <div style={{ padding: "36px 40px 28px", background: "#fffcf6" }}>
                <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 15, fontWeight: 700, color: "#1a0a10", marginBottom: 20 }}>
                  {subject || <span style={{ color: "#c099a8", fontWeight: 400 }}>(asunto)</span>}
                </div>
                {previewParas.length > 0 ? previewParas : (
                  <p style={{ color: "#c099a8", fontStyle: "italic", fontSize: 14 }}>El contenido va a aparecer acá…</p>
                )}
                <div style={{ borderTop: "1px dashed rgba(139,26,74,.2)", paddingTop: 18, marginTop: 18 }}>
                  <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 36, color: "#8b1a4a", lineHeight: 1 }}>milo</div>
                  <div style={{ fontSize: 11, color: "#a07080", marginTop: 4 }}>Data by Milo · databymilo.me</div>
                </div>
              </div>
              <div style={{ background: "#f5e6d8", padding: "14px 40px", textAlign: "center", fontSize: 11, color: "#a07080" }}>
                Recibís este mail porque te suscribiste en databymilo.me.<br />
                <span style={{ color: "#8b1a4a", textDecoration: "underline", cursor: "default" }}>Cancelar suscripción</span>
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <span style={{ fontSize: 12, color: "var(--adm-fg-muted)", fontFamily: "var(--adm-font-body)" }}>
                {wordCount} palabras · ~{readMin} min de lectura
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
