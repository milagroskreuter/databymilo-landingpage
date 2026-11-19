"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

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

// ── Helpers de edición ────────────────────────────────────────────────────────

function wrapSel(el, before, after, placeholder = "texto") {
  if (!el) return;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const sel = el.value.slice(start, end) || placeholder;
  const wrapped = before + sel + after;
  const newVal = el.value.slice(0, start) + wrapped + el.value.slice(end);
  el.focus();
  el.value = newVal;
  el.setSelectionRange(start + before.length, start + before.length + sel.length);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  return newVal;
}

function insertBlock(el, block) {
  if (!el) return;
  const start = el.selectionStart;
  const before = el.value.slice(0, start);
  const after = el.value.slice(start);
  const pre = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
  const suf = after && !after.startsWith("\n\n") ? (after.startsWith("\n") ? "\n" : "\n\n") : "";
  const newVal = before + pre + block + suf + after;
  el.focus();
  el.value = newVal;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  return newVal;
}

function insertLink(el, setText) {
  if (!el) return;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const sel = el.value.slice(start, end);
  const url = window.prompt("URL del link:", "https://");
  if (!url) return;
  const text = sel || "ver más";
  // If selection spans a whole line or is empty → CTA block
  const isBlock = !sel.trim() || sel.includes("\n");
  if (isBlock) {
    return insertBlock(el, `[cta ${text}](${url})`);
  } else {
    return wrapSel(el, `[`, `](${url})`, text);
  }
}

function insertImage(el) {
  if (!el) return;
  const url = window.prompt("URL de la imagen:", "https://");
  if (!url) return;
  return insertBlock(el, `![](${url})`);
}

// ── Preview rendering ─────────────────────────────────────────────────────────

function inlineJsx(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*")) return <em key={i}>{p.slice(1, -1)}</em>;
    const lm = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (lm) return <a key={i} href={lm[2]} style={{ color: "#8b1a4a" }}>{lm[1]}</a>;
    return p;
  });
}

function PreviewBlock({ block, compact }) {
  const s = compact ? { mb: 12, fs: 12, fsLg: 14, fsH: 15, fsSig: 26 } : { mb: 16, fs: 15, fsLg: 18, fsH: 20, fsSig: 36 };
  switch (block.type) {
    case "quote":
      return <div style={{ borderLeft: "4px solid #d4447a", padding: "10px 14px", background: "#fdf0f6", borderRadius: "0 8px 8px 0", marginBottom: s.mb }}>
        <p style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: s.fsLg, color: "#8b1a4a", margin: 0, lineHeight: 1.5 }}>{inlineJsx(block.text)}</p>
      </div>;
    case "box":
      return <div style={{ background: "#8b1a4a", borderRadius: 10, padding: compact ? "14px 18px" : "22px 28px", textAlign: "center", marginBottom: s.mb }}>
        <p style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: s.fsLg, color: "#fdf5ec", margin: 0, lineHeight: 1.4 }}>{inlineJsx(block.text)}</p>
      </div>;
    case "divider":
      return <hr style={{ border: "none", borderTop: "1px dashed rgba(139,26,74,.2)", margin: `0 0 ${s.mb}px` }} />;
    case "heading":
      return <p style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: s.fsH, color: "#1a0a10", marginBottom: s.mb, lineHeight: 1.3 }}>{inlineJsx(block.text)}</p>;
    case "image":
      return <div style={{ marginBottom: s.mb, textAlign: "center" }}>
        <img src={block.url} alt="" style={{ maxWidth: "100%", borderRadius: 8 }} />
      </div>;
    case "cta":
      return <div style={{ marginBottom: s.mb }}>
        <a href={block.url} style={{ display: "inline-block", padding: compact ? "8px 20px" : "12px 28px", background: "#8b1a4a", color: "#fdf5ec", borderRadius: 999, fontFamily: "Arial,sans-serif", fontSize: s.fs, fontWeight: 700, textDecoration: "none" }}>{block.text} →</a>
      </div>;
    default:
      return <p style={{ fontFamily: "Arial,sans-serif", fontSize: s.fs, color: "#3d1a2a", lineHeight: 1.75, marginBottom: s.mb }}>{inlineJsx(block.text)}</p>;
  }
}

function parseBody(text) {
  return text.split("\n\n").filter(Boolean).map((block, i) => {
    if (block.startsWith("> ")) return { type: "quote", text: block.slice(2), key: i };
    if (block.startsWith("[box]") && block.endsWith("[/box]")) return { type: "box", text: block.slice(5, -6), key: i };
    if (block.trim() === "---") return { type: "divider", key: i };
    if (block.startsWith("# ")) return { type: "heading", text: block.slice(2), key: i };
    if (block.startsWith("![](")) return { type: "image", url: block.slice(4, -1), key: i };
    const ctaM = block.match(/^\[cta (.+?)\]\((.+?)\)$/);
    if (ctaM) return { type: "cta", text: ctaM[1], url: ctaM[2], key: i };
    return { type: "para", text: block, key: i };
  });
}

// ── Email preview component ───────────────────────────────────────────────────

function EmailPreview({ subject, body, headerStyle, compact }) {
  const blocks = parseBody(body);
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
        {blocks.length > 0 ? blocks.map(b => <PreviewBlock key={b.key} block={b} compact={compact} />) : <p style={{ color: "#c099a8", fontStyle: "italic", fontSize: compact ? 11 : 13 }}>El contenido va a aparecer acá…</p>}
        <div style={{ borderTop: "1px dashed rgba(139,26,74,.2)", paddingTop: compact ? 12 : 18, marginTop: compact ? 4 : 8 }}>
          <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: compact ? 24 : 34, color: "#8b1a4a", lineHeight: 1 }}>milo</div>
          <div style={{ fontSize: compact ? 10 : 11, color: "#a07080", marginTop: 3 }}>Data by Milo · databymilo.me</div>
        </div>
      </div>
      <div style={{ background: "#f5e6d8", padding: compact ? "10px 20px" : "14px 40px", textAlign: "center", fontSize: compact ? 10 : 11, color: "#a07080" }}>
        {!compact && "Recibís este mail porque te suscribiste en databymilo.me."}{!compact && <br />}
        <span style={{ color: "#8b1a4a", textDecoration: "underline", cursor: "default" }}>Cancelar suscripción</span>
      </div>
    </div>
  );
}

// ── Formato toolbar ───────────────────────────────────────────────────────────

const FMT_BTNS = [
  { label: "N", title: "Negrita (seleccioná texto)", action: (el) => wrapSel(el, "**", "**") },
  { label: "I", title: "Itálica (seleccioná texto)", italic: true, action: (el) => wrapSel(el, "*", "*") },
  { label: "sep" },
  { label: "❝", title: 'Cita / pull quote (nuevo párrafo)', action: (el) => insertBlock(el, "> Escribí la cita acá") },
  { label: "▣", title: "Caja destacada (oscura)", action: (el) => insertBlock(el, "[box]Texto en caja destacada[/box]") },
  { label: "—", title: "Divisor / separador", action: (el) => insertBlock(el, "---") },
  { label: "§", title: "Encabezado de sección (# Texto)", action: (el) => insertBlock(el, "# Encabezado de sección") },
  { label: "sep" },
  { label: "🔗", title: "Link / botón CTA (seleccioná texto → link inline; sin selección → botón)", action: (el) => insertLink(el) },
  { label: "🖼", title: "Imagen (pegá la URL)", action: (el) => insertImage(el) },
];

function FormatToolbar({ bodyRef, setBody }) {
  function run(action) {
    const val = action(bodyRef.current);
    if (val !== undefined) setBody(val);
  }
  return (
    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 6, alignItems: "center", padding: "6px 8px", background: "var(--adm-tinted)", border: "1px solid var(--adm-border)", borderRadius: "var(--adm-radius) var(--adm-radius) 0 0", borderBottom: "none" }}>
      {FMT_BTNS.map((btn, i) =>
        btn.label === "sep" ? (
          <div key={i} style={{ width: 1, height: 20, background: "var(--adm-border)", margin: "0 2px" }} />
        ) : (
          <button
            key={i}
            type="button"
            title={btn.title}
            onClick={() => run(btn.action)}
            style={{
              fontFamily: btn.italic ? "Georgia,serif" : "var(--adm-font-body)",
              fontStyle: btn.italic ? "italic" : "normal",
              fontWeight: !btn.italic && btn.label === "N" ? 700 : 400,
              fontSize: 13,
              minWidth: 28,
              height: 28,
              background: "white",
              border: "1px solid var(--adm-border)",
              borderRadius: 4,
              cursor: "pointer",
              color: "var(--adm-fg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 6px",
            }}
          >
            {btn.label}
          </button>
        )
      )}
      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 10, color: "var(--adm-fg-muted)", fontFamily: "var(--adm-font-body)" }}>
        {FMT_BTNS.map(b => b.label !== "sep" ? null : null)}
      </div>
    </div>
  );
}

// ── Cheatsheet de sintaxis ────────────────────────────────────────────────────

function SyntaxCheat() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 6 }}>
      <button type="button" onClick={() => setOpen(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--adm-primary)", fontFamily: "var(--adm-font-body)", padding: 0 }}>
        {open ? "▲ Ocultar atajos de formato" : "▼ Ver atajos de formato"}
      </button>
      {open && (
        <div style={{ marginTop: 8, padding: "10px 14px", background: "var(--adm-tinted)", border: "1px solid var(--adm-border)", borderRadius: "var(--adm-radius)", fontSize: 11, color: "var(--adm-fg-muted)", fontFamily: "var(--adm-font-body)", lineHeight: 1.9 }}>
          <code style={{ background: "rgba(139,26,74,.08)", padding: "1px 4px", borderRadius: 3 }}>**texto**</code> → negrita &nbsp;|&nbsp;
          <code style={{ background: "rgba(139,26,74,.08)", padding: "1px 4px", borderRadius: 3 }}>*texto*</code> → itálica<br />
          <code style={{ background: "rgba(139,26,74,.08)", padding: "1px 4px", borderRadius: 3 }}>&gt; cita</code> → pull quote rosado &nbsp;|&nbsp;
          <code style={{ background: "rgba(139,26,74,.08)", padding: "1px 4px", borderRadius: 3 }}>[box]texto[/box]</code> → caja oscura<br />
          <code style={{ background: "rgba(139,26,74,.08)", padding: "1px 4px", borderRadius: 3 }}>---</code> → divisor &nbsp;|&nbsp;
          <code style={{ background: "rgba(139,26,74,.08)", padding: "1px 4px", borderRadius: 3 }}># Encabezado</code> → título de sección<br />
          <code style={{ background: "rgba(139,26,74,.08)", padding: "1px 4px", borderRadius: 3 }}>[texto](url)</code> → link inline &nbsp;|&nbsp;
          <code style={{ background: "rgba(139,26,74,.08)", padding: "1px 4px", borderRadius: 3 }}>[cta texto](url)</code> → botón CTA<br />
          <code style={{ background: "rgba(139,26,74,.08)", padding: "1px 4px", borderRadius: 3 }}>![](url)</code> → imagen<br />
          <span style={{ opacity: .7 }}>Separar bloques con una línea en blanco.</span>
        </div>
      )}
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
    const el = bodyRef.current;
    if (!el || !newName.trim()) return;
    const sel = el.value.slice(el.selectionStart, el.selectionEnd) || el.value;
    if (!sel.trim()) return;
    const tpl = { id: Date.now(), name: newName.trim(), content: sel.trim() };
    const updated = [...templates, tpl];
    setTemplates(updated);
    saveTemplatesLocal(updated);
    setNewName("");
    setSaving(false);
  }

  function insertTemplate(tpl) {
    const val = insertBlock(bodyRef.current, tpl.content);
    if (val !== undefined) setBody(val);
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
                <div style={{ fontFamily: "var(--adm-font-body)", fontSize: 11, color: "var(--adm-fg-muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 300 }}>{tpl.content.slice(0, 80)}{tpl.content.length > 80 ? "…" : ""}</div>
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
      setBody(draft.body || "");
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

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
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
                      onClick={() => {
                        const el = bodyRef.current;
                        if (!el) return;
                        const start = el.selectionStart;
                        const newVal = el.value.slice(0, start) + v + el.value.slice(start);
                        el.focus(); el.value = newVal;
                        el.setSelectionRange(start + v.length, start + v.length);
                        el.dispatchEvent(new Event("input", { bubbles: true }));
                        setBody(newVal);
                      }}
                      style={{ fontFamily: "var(--adm-font-body)", fontSize: 11, background: "rgba(139,26,74,.08)", border: "1px solid rgba(139,26,74,.2)", borderRadius: 4, padding: "2px 7px", cursor: "pointer", color: "var(--adm-primary)", fontWeight: 600 }}
                    >{v}</button>
                  ))}
                  <div style={{ flex: 1 }} />
                  <span style={{ fontSize: 11, color: "var(--adm-fg-muted)", fontFamily: "var(--adm-font-body)" }}>{wordCount} palabras · ~{readMin} min</span>
                </div>

                {/* Formato toolbar + textarea */}
                <div className="adm-form-group">
                  <FormatToolbar bodyRef={bodyRef} setBody={setBody} />
                  <textarea
                    ref={bodyRef}
                    className="adm-textarea"
                    style={{ minHeight: 300, borderRadius: "0 0 var(--adm-radius) var(--adm-radius)", borderTop: "none" }}
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder={"# hola {{nombre}},\n\nesta semana estuvo pasando algo interesante en las corpos...\n\n> la frase que te quedó dando vueltas\n\n---\n\n[cta leer más](https://databymilo.me/blog)"}
                    required
                  />
                  <SyntaxCheat />
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
                  <button type="submit" className="adm-btn adm-btn-primary" disabled={loading || !subject || !body}>
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
