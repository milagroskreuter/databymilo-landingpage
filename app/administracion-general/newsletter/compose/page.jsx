"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import RichEditor, { legacyToHtml } from "./RichEditor";

const DRAFT_KEY = "adm_newsletter_draft_v2";
const TEMPLATES_KEY = "adm_newsletter_templates_v1";

function saveDraft(d) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, savedAt: Date.now() })); } catch {}
}
function loadDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch { return null; }
}
function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}
function loadTemplates() {
  try { return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "[]"); } catch { return []; }
}
function saveTemplatesLocal(tpls) {
  try { localStorage.setItem(TEMPLATES_KEY, JSON.stringify(tpls)); } catch {}
}

const VARS = ["{{nombre}}", "{{apellido}}", "{{email}}"];
const TIPS = [
  "Sujetos de menos de 50 caracteres tienen mejor apertura.",
  "Empezar con 'hola,' en minúscula se siente más personal.",
  "Un solo llamado a la acción por email funciona mejor.",
  "Párrafos cortos — 3 líneas máximo — se leen mejor en móvil.",
];

// ── Email preview component ───────────────────────────────────────────────────

const SOCIALS = [
  { label: "Instagram", handle: "@databymilo", url: "https://www.instagram.com/databymilo" },
  { label: "Pinterest", handle: "@databymilo", url: "https://ar.pinterest.com/databymilo/" },
  { label: "LinkedIn", handle: "milagros kreuter", url: "https://www.linkedin.com/in/milagroskreuter/" },
];

function EmailPreview({ subject, body, headerStyle, compact }) {
  const html = legacyToHtml(body);
  const headerDark = (
    <div style={{ background: "#8b1a4a", padding: compact ? "16px 24px" : "28px 40px", textAlign: "center", borderRadius: "10px 10px 0 0" }}>
      <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: compact ? 10 : 12, letterSpacing: ".18em", textTransform: "uppercase", color: "#f2b7d1", marginBottom: 4 }}>Data by Milo</div>
      <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontWeight: 700, fontSize: compact ? 11 : 14, color: "rgba(253,245,236,.75)", letterSpacing: ".06em" }}>la carta del domingo</div>
    </div>
  );
  const headerLight = (
    <div style={{ background: "linear-gradient(135deg, #fce8f0 0%, #fdf5ec 100%)", padding: compact ? "20px 24px" : "32px 40px", textAlign: "center", borderRadius: "10px 10px 0 0", borderBottom: "1px solid rgba(139,26,74,.12)" }}>
      <div style={{ fontFamily: "Georgia,serif", fontSize: compact ? 9 : 11, letterSpacing: ".2em", textTransform: "uppercase", color: "#8b1a4a", marginBottom: 6, fontWeight: 700 }}>Data by Milo</div>
      <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: compact ? 16 : 28, color: "#8b1a4a", lineHeight: 1.2 }}>La Carta del Domingo</div>
    </div>
  );

  return (
    <div style={{ background: "#fdf5ec", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(139,26,74,.2)", boxShadow: compact ? "0 2px 12px rgba(139,26,74,.08)" : "0 4px 24px rgba(139,26,74,.12)" }}>
      {headerStyle === "claro" ? headerLight : headerDark}
      <div style={{ padding: compact ? "18px 20px" : "36px 40px 28px", background: "#fffcf6" }}>
        {subject && <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: compact ? 12 : 16, fontWeight: 700, color: "#1a0a10", marginBottom: compact ? 12 : 20 }}>{subject}</div>}
        {html ? <div style={compact ? { zoom: 0.8 } : undefined} dangerouslySetInnerHTML={{ __html: html }} /> : <p style={{ color: "#c099a8", fontStyle: "italic", fontSize: compact ? 11 : 13 }}>El contenido va a aparecer acá…</p>}
        <div style={{ borderTop: "1px dashed rgba(139,26,74,.2)", paddingTop: compact ? 12 : 18, marginTop: compact ? 4 : 8 }}>
          <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: compact ? 24 : 34, color: "#8b1a4a", lineHeight: 1 }}>milo</div>
          <div style={{ fontSize: compact ? 10 : 11, color: "#a07080", marginTop: 3, marginBottom: 12 }}>Data by Milo · databymilo.me</div>
          {SOCIALS.map(s => (
            <div key={s.label} style={{ marginBottom: 6 }}>
              <span style={{ fontFamily: "Arial,sans-serif", fontWeight: 700, fontSize: compact ? 8 : 10, letterSpacing: ".14em", textTransform: "uppercase", color: "#a07080" }}>{s.label}</span>
              &nbsp;&nbsp;
              <a href={s.url} target="_blank" rel="noreferrer" style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: compact ? 11 : 14, color: "#8b1a4a", textDecoration: "none" }}>{s.handle}</a>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: "#f5e6d8", padding: compact ? "10px 20px" : "14px 40px", textAlign: "center", fontSize: compact ? 10 : 11, color: "#a07080" }}>
        {!compact && "Recibís este mail porque te suscribiste en databymilo.me."}{!compact && <br />}
        <span style={{ color: "#8b1a4a", textDecoration: "underline", cursor: "default" }}>Cancelar suscripción</span>
      </div>
    </div>
  );
}

// ── Panel de plantillas ───────────────────────────────────────────────────────

function TemplatesPanel({ bodyRef, setBody }) {
  const [templates, setTemplates] = useState([]);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setTemplates(loadTemplates()); }, []);

  function saveCurrentAsTemplate() {
    const ed = bodyRef.current;
    if (!ed || !newName.trim()) return;
    const sel = ed.getSelectionHtml() || ed.getHtml();
    if (!sel.trim()) return;
    const tpl = { id: Date.now(), name: newName.trim(), content: sel.trim() };
    const updated = [...templates, tpl];
    setTemplates(updated);
    saveTemplatesLocal(updated);
    setNewName("");
    setSaving(false);
  }

  function insertTemplate(tpl) {
    bodyRef.current?.insertHtml(legacyToHtml(tpl.content));
  }

  function deleteTemplate(id) {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    saveTemplatesLocal(updated);
  }

  return (
    <div style={{ border: "1px solid var(--adm-border)", borderRadius: "var(--adm-radius)", overflow: "hidden", marginBottom: 16 }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--adm-tinted)", border: "none", cursor: "pointer", fontFamily: "var(--adm-font-body)", fontSize: 13, color: "var(--adm-fg)", fontWeight: 600 }}
      >
        <span>📋 Plantillas guardadas {templates.length > 0 && `(${templates.length})`}</span>
        <span style={{ fontSize: 11, color: "var(--adm-fg-muted)" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ padding: "12px 14px", background: "white" }}>
          {templates.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--adm-fg-muted)", fontFamily: "var(--adm-font-body)", margin: "0 0 12px", fontStyle: "italic" }}>
              Todavía no guardaste ninguna plantilla. Seleccioná texto en el editor y guardalo acá.
            </p>
          )}
          {templates.map(tpl => (
            <div key={tpl.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--adm-border)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--adm-font-body)", fontSize: 13, fontWeight: 600, color: "var(--adm-fg)" }}>{tpl.name}</div>
                <div style={{ fontFamily: "var(--adm-font-body)", fontSize: 11, color: "var(--adm-fg-muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 300 }}>{tpl.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 80)}</div>
              </div>
              <button type="button" onClick={() => insertTemplate(tpl)} className="adm-btn adm-btn-sm adm-btn-primary">Insertar</button>
              <button type="button" onClick={() => deleteTemplate(tpl.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--adm-fg-muted)", fontSize: 16, lineHeight: 1, padding: "0 4px" }} title="Eliminar plantilla">×</button>
            </div>
          ))}

          <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
            {!saving ? (
              <button type="button" onClick={() => setSaving(true)} className="adm-btn adm-btn-sm adm-btn-secondary">
                + Guardar selección como plantilla
              </button>
            ) : (
              <>
                <input
                  className="adm-input"
                  style={{ flex: 1, fontSize: 12 }}
                  placeholder="Nombre de la plantilla…"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveCurrentAsTemplate(); if (e.key === "Escape") setSaving(false); }}
                  autoFocus
                />
                <button type="button" onClick={saveCurrentAsTemplate} className="adm-btn adm-btn-sm adm-btn-primary" disabled={!newName.trim()}>Guardar</button>
                <button type="button" onClick={() => setSaving(false)} className="adm-btn adm-btn-sm adm-btn-secondary">Cancelar</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function ComposePage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendAt, setSendAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [tipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));
  const [headerStyle, setHeaderStyle] = useState("oscuro");

  const [sendMode, setSendMode] = useState("all");
  const [contactSearch, setContactSearch] = useState("");
  const [contacts, setContacts] = useState(null);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [subjectB, setSubjectB] = useState("");
  const [showAB, setShowAB] = useState(false);
  const [tagFilter, setTagFilter] = useState("");
  const [availableTags, setAvailableTags] = useState([]);

  const bodyRef = useRef(null);
  const draftTimer = useRef(null);

  useEffect(() => {
    const draft = loadDraft();
    if (draft && (draft.subject || draft.body)) {
      setSubject(draft.subject || "");
      setBody(legacyToHtml(draft.body || ""));
      if (draft.headerStyle) setHeaderStyle(draft.headerStyle);
      setMsg({ type: "info", text: `Borrador restaurado — ${new Date(draft.savedAt).toLocaleString("es-AR", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}` });
    }
  }, []);

  useEffect(() => {
    clearTimeout(draftTimer.current);
    if (!subject && !body) return;
    draftTimer.current = setTimeout(() => {
      saveDraft({ subject, body, headerStyle });
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    }, 1500);
    return () => clearTimeout(draftTimer.current);
  }, [subject, body, headerStyle]);

  useEffect(() => {
    if (sendMode === "search" && !contacts) {
      fetch("/api/admin/newsletter/contacts")
        .then(r => r.json())
        .then(d => setContacts(d.data || []))
        .catch(() => setContacts([]));
    }
  }, [sendMode]);

  useEffect(() => {
    fetch("/api/admin/newsletter/contacts")
      .then(r => r.json())
      .then(d => {
        const all = new Set();
        (d.data || []).forEach(c => (c.tags || []).forEach(t => all.add(t)));
        setAvailableTags([...all].sort());
      })
      .catch(() => {});
  }, []);

  const filteredContacts = (contacts || []).filter(c =>
    !c.unsubscribed && contactSearch &&
    (c.email.toLowerCase().includes(contactSearch.toLowerCase()) ||
      (c.first_name || "").toLowerCase().includes(contactSearch.toLowerCase()))
  );

  const plainText = body.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const readMin = Math.max(1, Math.round(wordCount / 200));
  const subjectLen = subject.length;

  function toggleContact(c) {
    setSelectedContacts(prev =>
      prev.find(x => x.id === c.id) ? prev.filter(x => x.id !== c.id) : [...prev, c]
    );
  }

  async function handleSend(e) {
    e.preventDefault();
    const isAll = sendMode === "all";
    const recipients = isAll ? null : selectedContacts;
    if (!isAll && (!recipients || recipients.length === 0)) {
      setMsg({ type: "error", text: "Seleccioná al menos un destinatario." });
      return;
    }
    const dest = isAll ? "todas las suscriptoras activas" : recipients.length === 1 ? recipients[0].email : `${recipients.length} destinatarias`;
    if (!confirm(`¿Enviar este email a ${dest}${sendAt ? " el " + new Date(sendAt).toLocaleString("es-AR") : " ahora"}?`)) return;

    setLoading(true);
    setMsg(null);

    const payload = { subject, body, headerStyle };
    if (sendAt) payload.sendAt = new Date(sendAt).toISOString();
    if (showAB && subjectB.trim()) payload.subjectB = subjectB.trim();
    if (tagFilter) payload.tagFilter = tagFilter;
    if (!isAll) {
      payload.to = recipients.map(c => ({ email: c.email, firstName: c.first_name || "", lastName: c.last_name || "" }));
    }

    const res = await fetch("/api/admin/newsletter/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      clearDraft();
      setMsg({ type: "success", text: sendAt ? "✦ Email programado" : `✦ Email enviado a ${dest}` });
      setSubject(""); setBody(""); setSendAt(""); setSelectedContacts([]);
    } else {
      setMsg({ type: "error", text: data.error || "Error al enviar" });
    }
    setLoading(false);
  }

  function handleDiscard() {
    if (!confirm("¿Descartar este borrador?")) return;
    clearDraft(); setSubject(""); setBody(""); setSendAt(""); setMsg(null);
  }

  return (
    <>
      <div className="adm-header">
        <div>
          <h1>Escribir newsletter</h1>
          {draftSaved && <span style={{ fontSize: 11, color: "var(--adm-fg-muted)", fontFamily: "var(--adm-font-body)", marginLeft: 8 }}>Borrador guardado ✓</span>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={`adm-btn adm-btn-sm ${previewMode ? "adm-btn-primary" : "adm-btn-secondary"}`} onClick={() => setPreviewMode(v => !v)}>
            {previewMode ? "✎ Editar" : "👁 Vista previa"}
          </button>
          <Link href="/administracion-general/newsletter" className="adm-btn adm-btn-secondary adm-btn-sm">← Volver</Link>
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
              {/* Editor column */}
              <div>
                {/* Destinatarios */}
                <div className="adm-form-group">
                  <label className="adm-label">Para</label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <button type="button" onClick={() => { setSendMode("all"); setSelectedContacts([]); }} className={`adm-btn adm-btn-sm ${sendMode === "all" ? "adm-btn-primary" : "adm-btn-secondary"}`}>Toda la lista activa</button>
                    <button type="button" onClick={() => setSendMode("search")} className={`adm-btn adm-btn-sm ${sendMode === "search" ? "adm-btn-primary" : "adm-btn-secondary"}`}>Contacto específico</button>
                  </div>
                  {sendMode === "search" && (
                    <div>
                      <input className="adm-input" placeholder="Buscar por nombre o email…" value={contactSearch} onChange={e => setContactSearch(e.target.value)} style={{ marginBottom: 6 }} />
                      {filteredContacts.length > 0 && (
                        <div style={{ border: "1px solid var(--adm-border)", borderRadius: "var(--adm-radius)", background: "white", maxHeight: 160, overflowY: "auto" }}>
                          {filteredContacts.slice(0, 8).map(c => {
                            const sel = selectedContacts.find(x => x.id === c.id);
                            return (
                              <div key={c.id} onClick={() => toggleContact(c)} style={{ padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, background: sel ? "rgba(139,26,74,.06)" : "white", borderBottom: "1px solid var(--adm-border)", fontFamily: "var(--adm-font-body)", fontSize: 12 }}>
                                <div style={{ width: 16, height: 16, border: `2px solid ${sel ? "var(--adm-primary)" : "var(--adm-border)"}`, borderRadius: 3, background: sel ? "var(--adm-primary)" : "white", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  {sel && <span style={{ color: "white", fontSize: 10, lineHeight: 1 }}>✓</span>}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600 }}>{c.email}</div>
                                  {(c.first_name || c.last_name) && <div style={{ color: "var(--adm-fg-muted)", fontSize: 11 }}>{[c.first_name, c.last_name].filter(Boolean).join(" ")}</div>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {selectedContacts.length > 0 && (
                        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {selectedContacts.map(c => (
                            <span key={c.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(139,26,74,.1)", border: "1px solid rgba(139,26,74,.2)", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontFamily: "var(--adm-font-body)", color: "var(--adm-primary)" }}>
                              {c.email}
                              <button type="button" onClick={() => toggleContact(c)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--adm-primary)", padding: 0, fontSize: 12, lineHeight: 1 }}>✕</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Asunto */}
                <div className="adm-form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <label className="adm-label" style={{ margin: 0 }}>Asunto</label>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontFamily: "var(--adm-font-body)", color: subjectLen > 60 ? "#b82020" : subjectLen > 40 ? "#c97a00" : "var(--adm-fg-muted)" }}>{subjectLen}/60</span>
                      <button type="button" onClick={() => setShowAB(v => !v)} style={{ fontSize: 10, fontFamily: "var(--adm-font-body)", background: showAB ? "var(--adm-primary)" : "none", color: showAB ? "#fff" : "var(--adm-primary)", border: "1px solid var(--adm-primary)", borderRadius: 4, padding: "1px 8px", cursor: "pointer", fontWeight: 700 }}>A/B</button>
                    </div>
                  </div>
                  <input className="adm-input" value={subject} onChange={e => setSubject(e.target.value)} placeholder="la carta del domingo · 17 nov" required />
                  {showAB && (
                    <div style={{ marginTop: 8 }}>
                      <label className="adm-label" style={{ fontSize: 11, marginBottom: 4 }}>Asunto alternativo (versión B — 50% de la lista)</label>
                      <input className="adm-input" value={subjectB} onChange={e => setSubjectB(e.target.value)} placeholder="otra variante del asunto…" />
                    </div>
                  )}
                </div>

                {/* Header style */}
                <div className="adm-form-group">
                  <label className="adm-label">Estilo del header</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => setHeaderStyle("oscuro")} className={`adm-btn adm-btn-sm ${headerStyle === "oscuro" ? "adm-btn-primary" : "adm-btn-secondary"}`}>Oscuro (actual)</button>
                    <button type="button" onClick={() => setHeaderStyle("claro")} className={`adm-btn adm-btn-sm ${headerStyle === "claro" ? "adm-btn-primary" : "adm-btn-secondary"}`}>Claro (gradiente)</button>
                  </div>
                </div>

                {/* Tag filter */}
                {availableTags.length > 0 && (
                  <div className="adm-form-group">
                    <label className="adm-label">Enviar solo a segmento (opcional)</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      <button type="button" onClick={() => setTagFilter("")} className={`adm-btn adm-btn-sm ${!tagFilter ? "adm-btn-primary" : "adm-btn-secondary"}`}>Todas</button>
                      {availableTags.map(t => (
                        <button key={t} type="button" onClick={() => setTagFilter(t === tagFilter ? "" : t)} className={`adm-btn adm-btn-sm ${tagFilter === t ? "adm-btn-primary" : "adm-btn-secondary"}`}>{t}</button>
                      ))}
                    </div>
                    {tagFilter && <div style={{ fontSize: 11, color: "var(--adm-fg-muted)", marginTop: 4 }}>Solo se enviará a contactos con la etiqueta "{tagFilter}"</div>}
                  </div>
                )}

                {/* Variables row */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 4, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "var(--adm-fg-muted)", fontFamily: "var(--adm-font-body)", marginRight: 4 }}>Variables:</span>
                  {VARS.map(v => (
                    <button key={v} type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => bodyRef.current?.insertHtml(v)}
                      style={{ fontFamily: "var(--adm-font-body)", fontSize: 11, background: "rgba(139,26,74,.08)", border: "1px solid rgba(139,26,74,.2)", borderRadius: 4, padding: "2px 7px", cursor: "pointer", color: "var(--adm-primary)", fontWeight: 600 }}
                    >{v}</button>
                  ))}
                  <div style={{ flex: 1 }} />
                  <span style={{ fontSize: 11, color: "var(--adm-fg-muted)", fontFamily: "var(--adm-font-body)" }}>{wordCount} palabras · ~{readMin} min</span>
                </div>

                {/* Formato toolbar + textarea */}
                <div className="adm-form-group">
                  <RichEditor ref={bodyRef} value={body} onChange={setBody} placeholder="Escribí tu carta acá… seleccioná texto para darle formato." />
                </div>

                {/* Plantillas */}
                <TemplatesPanel bodyRef={bodyRef} setBody={setBody} />

                {/* Tip */}
                <div style={{ padding: "10px 14px", background: "var(--adm-tinted)", borderRadius: "var(--adm-radius)", border: "1px solid var(--adm-border)", fontSize: 12, color: "var(--adm-fg-muted)", fontFamily: "var(--adm-font-body)", marginBottom: 16 }}>
                  💡 {TIPS[tipIndex]}
                </div>

                {/* Programar */}
                <div className="adm-form-group">
                  <label className="adm-label">Programar envío <span style={{ fontWeight: 400, color: "var(--adm-fg-muted)" }}>(opcional)</span></label>
                  <input type="datetime-local" className="adm-input" value={sendAt} onChange={e => setSendAt(e.target.value)} />
                </div>

                {/* Acciones */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="submit" className="adm-btn adm-btn-primary" disabled={loading || !subject || !plainText}>
                    {loading ? "Enviando…" : sendAt ? "✦ Programar envío" : "✦ Enviar ahora"}
                  </button>
                  {(subject || body) && (
                    <button type="button" className="adm-btn adm-btn-secondary" onClick={handleDiscard}>Descartar borrador</button>
                  )}
                  <Link href="/administracion-general/newsletter" className="adm-btn adm-btn-secondary">Cancelar</Link>
                </div>
              </div>

              {/* Preview column */}
              <div>
                <div className="adm-label">Vista previa en vivo</div>
                <EmailPreview subject={subject} body={body} headerStyle={headerStyle} compact={true} />
                {sendMode === "search" && selectedContacts.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 11, color: "var(--adm-fg-muted)", fontFamily: "var(--adm-font-body)", textAlign: "center" }}>
                    Preview con datos de {selectedContacts[0].email}
                  </div>
                )}
              </div>
            </div>
          </form>
        ) : (
          <div>
            <div style={{ maxWidth: 560, margin: "0 auto" }}>
              <EmailPreview subject={subject} body={body} headerStyle={headerStyle} compact={false} />
            </div>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <span style={{ fontSize: 12, color: "var(--adm-fg-muted)", fontFamily: "var(--adm-font-body)" }}>
                {wordCount} palabras · ~{readMin} min de lectura · {subjectLen} caracteres en asunto
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
