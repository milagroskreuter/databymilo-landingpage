"use client";
import { useState } from "react";
import Link from "next/link";

export default function ComposePage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendAt, setSendAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  async function handleSend(e) {
    e.preventDefault();
    if (!confirm("¿Enviar este email a toda la lista?")) return;
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
      setMsg({ type: "success", text: sendAt ? "Email programado ✦" : "Email enviado a toda la lista ✦" });
      setSubject("");
      setBody("");
      setSendAt("");
    } else {
      setMsg({ type: "error", text: data.error || "Error al enviar" });
    }
    setLoading(false);
  }

  // Simple preview
  const previewParas = body
    .split("\n\n")
    .filter(Boolean)
    .map((p, i) => <p key={i} style={{ marginBottom: 16, lineHeight: 1.75, fontSize: 15, color: "#3d1a2a", fontFamily: "Arial, sans-serif" }}>{p}</p>);

  return (
    <>
      <div className="adm-header">
        <div>
          <h1>Escribir newsletter</h1>
        </div>
        <Link href="/administracion-general/newsletter" className="adm-btn adm-btn-secondary adm-btn-sm">
          ← Volver
        </Link>
      </div>

      <div className="adm-content">
        {msg && <div className={`adm-alert adm-alert-${msg.type}`}>{msg.text}</div>}

        <div className="adm-alert adm-alert-info" style={{ marginBottom: 24 }}>
          Escribí el cuerpo del email en párrafos separados por una línea en blanco. Se va a enviar a todas las suscriptoras activas.
        </div>

        <form onSubmit={handleSend}>
          <div className="adm-editor-grid">
            <div>
              <div className="adm-form-group">
                <label className="adm-label">Asunto</label>
                <input
                  className="adm-input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="la carta del domingo · 17 nov"
                  required
                />
              </div>

              <div className="adm-form-group">
                <label className="adm-label">Cuerpo del email</label>
                <textarea
                  className="adm-textarea"
                  style={{ minHeight: 360 }}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={"hola,\n\nesta semana estuvo pasando algo interesante en las corpos...\n\n..."}
                  required
                />
                <div style={{ fontSize: 11, color: "var(--adm-text-muted)", marginTop: 6 }}>
                  Separar párrafos con una línea en blanco. La firma (milo) se agrega automáticamente.
                </div>
              </div>

              <div className="adm-form-group">
                <label className="adm-label">Programar envío (opcional)</label>
                <input
                  type="datetime-local"
                  className="adm-input"
                  value={sendAt}
                  onChange={(e) => setSendAt(e.target.value)}
                />
                <div style={{ fontSize: 11, color: "var(--adm-text-muted)", marginTop: 6 }}>
                  Dejalo vacío para enviar ahora.
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="submit"
                  className="adm-btn adm-btn-primary"
                  disabled={loading || !subject || !body}
                >
                  {loading ? "Enviando…" : sendAt ? "Programar envío" : "Enviar ahora"}
                </button>
                <Link href="/administracion-general/newsletter" className="adm-btn adm-btn-secondary">
                  Cancelar
                </Link>
              </div>
            </div>

            {/* Preview */}
            <div>
              <div className="adm-label">Vista previa</div>
              <div style={{
                background: "#fdf5ec",
                borderRadius: 10,
                overflow: "hidden",
                border: "1px solid rgba(139,26,74,0.3)",
                fontSize: 14,
              }}>
                <div style={{ background: "#8b1a4a", padding: "24px 32px", textAlign: "center" }}>
                  <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#f2b7d1", marginBottom: 6 }}>
                    Data by Milo
                  </div>
                  <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 13, color: "rgba(253,245,236,.7)", letterSpacing: "0.06em" }}>
                    la carta del domingo
                  </div>
                </div>
                <div style={{ padding: "28px 32px", background: "#fffcf6", borderBottom: "1px solid rgba(139,26,74,.1)" }}>
                  <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 13, fontWeight: 700, color: "#1a0a10", marginBottom: 16 }}>
                    {subject || "(asunto)"}
                  </div>
                  {previewParas.length > 0 ? previewParas : (
                    <p style={{ color: "#a07080", fontStyle: "italic", fontSize: 13 }}>El contenido va a aparecer acá…</p>
                  )}
                  <div style={{ borderTop: "1px dashed rgba(139,26,74,.2)", paddingTop: 16, marginTop: 16 }}>
                    <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 28, color: "#8b1a4a", lineHeight: 1 }}>milo</div>
                    <div style={{ fontSize: 11, color: "#a07080", marginTop: 4 }}>Data by Milo · databymilo.me</div>
                  </div>
                </div>
                <div style={{ background: "#f5e6d8", padding: "12px 32px", textAlign: "center", fontSize: 11, color: "#a07080" }}>
                  Cancelar suscripción
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
