"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "../AdminToast";

// ── Simple markdown preview ───────────────────────────────────────────────────
function renderPreview(md) {
  if (!md) return "";
  return md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^---$/gm, "<hr/>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .split(/\n{2,}/)
    .map((b) => /^<(h[123]|ul|blockquote|hr)/.test(b) ? b : `<p>${b.replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
}

// ── Toolbar button ────────────────────────────────────────────────────────────
function ToolbarBtn({ label, title, onClick }) {
  return (
    <button type="button" title={title} onClick={onClick} style={{
      background:"none", border:"1px solid var(--adm-border)", borderRadius:6,
      padding:"4px 8px", fontSize:12, fontWeight:700, cursor:"pointer",
      color:"var(--adm-fg-2)", fontFamily:"var(--adm-font-body)",
      lineHeight:1.4, minWidth:32, textAlign:"center", transition:"background 120ms, color 120ms",
    }}
    onMouseEnter={(e)=>{e.currentTarget.style.background="var(--adm-primary)";e.currentTarget.style.color="#fff";}}
    onMouseLeave={(e)=>{e.currentTarget.style.background="none";e.currentTarget.style.color="var(--adm-fg-2)";}}>
      {label}
    </button>
  );
}

function insertMarkdown(ref, before, after="", placeholder="") {
  const el = ref.current; if (!el) return;
  const start = el.selectionStart, end = el.selectionEnd;
  const sel = el.value.slice(start, end) || placeholder;
  const newVal = el.value.slice(0, start) + before + sel + after + el.value.slice(end);
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,"value").set;
  setter.call(el, newVal);
  el.dispatchEvent(new Event("input",{bubbles:true}));
  el.focus(); el.selectionStart = start + before.length; el.selectionEnd = start + before.length + sel.length;
}
function insertLine(ref, prefix) {
  const el = ref.current; if (!el) return;
  const start = el.selectionStart;
  const lineStart = el.value.lastIndexOf("\n", start-1) + 1;
  const newVal = el.value.slice(0, lineStart) + prefix + el.value.slice(lineStart);
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,"value").set;
  setter.call(el, newVal);
  el.dispatchEvent(new Event("input",{bubbles:true}));
  el.focus(); el.selectionStart = lineStart + prefix.length; el.selectionEnd = lineStart + prefix.length;
}

// ── Tags input ────────────────────────────────────────────────────────────────
function TagsInput({ tags, onChange, allTags }) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const suggestions = allTags.filter(t => t.toLowerCase().includes(input.toLowerCase()) && !tags.includes(t) && input.length > 0);

  function addTag(tag) {
    const clean = tag.trim().toLowerCase();
    if (clean && !tags.includes(clean)) onChange([...tags, clean]);
    setInput(""); setOpen(false); inputRef.current?.focus();
  }
  function removeTag(tag) { onChange(tags.filter(t => t !== tag)); }
  function handleKey(e) {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) { e.preventDefault(); addTag(input); }
    if (e.key === "Backspace" && !input && tags.length) onChange(tags.slice(0,-1));
    if (e.key === "Escape") setOpen(false);
  }

  return (
    <div style={{ position:"relative" }}>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, alignItems:"center", border:"1px solid var(--adm-border)", borderRadius:8, padding:"6px 10px", background:"var(--adm-bg)", minHeight:40, cursor:"text" }} onClick={() => inputRef.current?.focus()}>
        {tags.map(t => (
          <span key={t} style={{ display:"inline-flex", alignItems:"center", gap:4, background:"var(--adm-tinted)", border:"1px solid var(--adm-border)", borderRadius:20, padding:"2px 10px", fontSize:12, color:"var(--adm-primary)", fontWeight:700, fontFamily:"var(--adm-font-body)" }}>
            #{t}
            <button type="button" onClick={e=>{e.stopPropagation();removeTag(t);}} style={{ background:"none",border:"none",cursor:"pointer",padding:0,lineHeight:1,color:"var(--adm-fg-muted)",fontSize:13 }}>×</button>
          </span>
        ))}
        <input ref={inputRef} value={input} onChange={e=>{setInput(e.target.value);setOpen(true);}} onKeyDown={handleKey} onFocus={()=>setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),150)} placeholder={tags.length===0?"Escribí una etiqueta y Enter…":""} style={{ border:"none",outline:"none",background:"transparent",fontSize:13,fontFamily:"var(--adm-font-body)",color:"var(--adm-fg)",minWidth:120,flex:1 }} />
      </div>
      {open && suggestions.length > 0 && (
        <div style={{ position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"var(--adm-surface)",border:"1px solid var(--adm-border)",borderRadius:8,zIndex:50,boxShadow:"0 4px 16px rgba(0,0,0,.12)",overflow:"hidden" }}>
          {suggestions.map(s => (
            <button key={s} type="button" onMouseDown={e=>{e.preventDefault();addTag(s);}} style={{ display:"block",width:"100%",textAlign:"left",padding:"8px 14px",background:"none",border:"none",cursor:"pointer",fontSize:13,fontFamily:"var(--adm-font-body)",color:"var(--adm-fg)",borderBottom:"1px solid var(--adm-border)" }} onMouseEnter={e=>e.currentTarget.style.background="var(--adm-tinted)"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
              <span style={{color:"var(--adm-fg-muted)",fontSize:11}}>#</span>{s}
            </button>
          ))}
        </div>
      )}
      {allTags.filter(t => !tags.includes(t)).length > 0 && (
        <div style={{ display:"flex",flexWrap:"wrap",gap:4,marginTop:8 }}>
          {allTags.filter(t => !tags.includes(t)).map(t => (
            <button key={t} type="button" onClick={()=>addTag(t)} style={{ background:"none",border:"1px dashed var(--adm-border)",borderRadius:20,padding:"2px 10px",fontSize:11,cursor:"pointer",color:"var(--adm-fg-muted)",fontFamily:"var(--adm-font-body)",transition:"all 120ms" }} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--adm-primary)";e.currentTarget.style.color="var(--adm-primary)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--adm-border)";e.currentTarget.style.color="var(--adm-fg-muted)";}}>
              + #{t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Scheduling panel ──────────────────────────────────────────────────────────
function localToISO(localDT) {
  if (!localDT) return null;
  return new Date(localDT).toISOString();
}
function isoToLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = n => String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function StatusPicker({ mode, setMode, publishAt, setPublishAt }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ display:"flex", gap:8 }}>
        {[
          { key:"published", label:"✓ Publicada", color:"#1a7a4a" },
          { key:"scheduled", label:"⏰ Programar", color:"#7c3aed" },
          { key:"draft",     label:"✎ Borrador",  color:"#888" },
        ].map(opt => (
          <button key={opt.key} type="button" onClick={()=>setMode(opt.key)} style={{
            border:`1.5px solid ${mode===opt.key ? opt.color : "var(--adm-border)"}`,
            background: mode===opt.key ? opt.color : "none",
            color: mode===opt.key ? "#fff" : "var(--adm-fg-2)",
            borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:700,
            cursor:"pointer", fontFamily:"var(--adm-font-body)", transition:"all 120ms",
          }}>
            {opt.label}
          </button>
        ))}
      </div>
      {mode === "scheduled" && (
        <div>
          <input
            type="datetime-local"
            className="adm-input"
            style={{ maxWidth:260, fontSize:13 }}
            value={isoToLocal(publishAt)}
            min={new Date().toISOString().slice(0,16)}
            onChange={e => setPublishAt(localToISO(e.target.value))}
          />
          {publishAt && new Date(publishAt) > new Date() && (
            <div style={{ fontSize:11, color:"#7c3aed", marginTop:4, fontWeight:600 }}>
              Se publicará el {new Date(publishAt).toLocaleString("es-AR", { dateStyle:"long", timeStyle:"short" })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── SEO Checker ──────────────────────────────────────────────────────────────
function SeoBar({ value, min, max, label }) {
  const len = (value || "").length;
  const ok = len >= min && len <= max;
  const warn = len > 0 && (len < min * 0.6 || len > max * 1.2);
  const color = len === 0 ? "var(--adm-border)" : ok ? "#1a7a4a" : warn ? "#c97a00" : "#b82020";
  const pct = Math.min(100, Math.round((len / max) * 100));
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "var(--adm-font-body)", color: "var(--adm-fg-muted)", marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ color }}>{len} / {min}–{max} caracteres {ok ? "✓" : len > 0 ? "·" : ""}</span>
      </div>
      <div style={{ height: 4, background: "var(--adm-border)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 300ms, background 300ms" }} />
      </div>
    </div>
  );
}

// ── Main editor form ──────────────────────────────────────────────────────────
export default function BlogEditorForm({ initial, submitLabel, onSubmit, slug, backHref }) {
  const router = useRouter();
  const toast = useToast();
  const contentRef = useRef(null);
  const formRef = useRef(null);
  const autoSaveTimer = useRef(null);
  const [preview, setPreview] = useState(false);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState(null);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [restoredBanner, setRestoredBanner] = useState(null);

  function initMode(init) {
    if (!init) return "published";
    if (init.publish_at && new Date(init.publish_at) > new Date()) return "scheduled";
    if (!init.published) return "draft";
    return "published";
  }

  const [mode, setMode] = useState(() => initMode(initial));
  const [publishAt, setPublishAt] = useState(initial?.publish_at || null);
  const [form, setForm] = useState({
    title: "", date: new Date().toISOString().split("T")[0],
    excerpt: "", tags: [], content: "",
    ...initial,
  });

  // Load all tags
  useEffect(() => {
    fetch("/api/admin/blog").then(r=>r.json()).then(d => {
      const tags = new Set();
      (d.posts||[]).forEach(p=>(p.tags||[]).forEach(t=>tags.add(t)));
      setAllTags([...tags].sort());
    }).catch(()=>{});
  }, []);

  // Restore autosave on new posts
  useEffect(() => {
    if (initial?.title || initial?.content) return;
    const key = `blog_autosave_${slug || "new"}`;
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "null");
      if (saved?.form && (saved.form.title || saved.form.content)) {
        setRestoredBanner({ savedAt: saved.savedAt, data: saved });
      }
    } catch {}
  }, []);

  // Autosave every 30s
  useEffect(() => {
    if (!form.title && !form.content) return;
    setDirty(true);
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      const key = `blog_autosave_${slug || "new"}`;
      try {
        localStorage.setItem(key, JSON.stringify({ form, mode, publishAt, savedAt: Date.now() }));
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2000);
      } catch {}
    }, 30000);
    return () => clearTimeout(autoSaveTimer.current);
  }, [form, mode, publishAt]);

  // Unsaved changes warning
  useEffect(() => {
    function warn(e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === "s") {
        e.preventDefault();
        if (!loading && form.title.trim()) formRef.current?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }
      if (mod && e.key === "p") { e.preventDefault(); setPreview(v => !v); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loading, form.title]);

  function update(key, val) { setForm(f => ({ ...f, [key]: val })); }

  function applyRestore(data) {
    setForm(f => ({ ...f, ...data.form }));
    if (data.mode) setMode(data.mode);
    if (data.publishAt) setPublishAt(data.publishAt);
    setRestoredBanner(null);
  }

  async function loadVersions() {
    if (!slug) return;
    setVersionsLoading(true);
    const res = await fetch(`/api/admin/blog/versions/${slug}`);
    if (res.ok) { const d = await res.json(); setVersions(d.versions || []); }
    setVersionsLoading(false);
  }

  async function handleRestore(versionId) {
    if (!confirm("¿Restaurar esta versión? Los cambios sin guardar se perderán.")) return;
    const res = await fetch(`/api/admin/blog/versions/${slug}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version_id: versionId }),
    });
    if (res.ok) {
      const d = await res.json();
      setForm(f => ({ ...f, title: d.post.title, content: d.post.content, excerpt: d.post.excerpt, tags: d.post.tags || [] }));
      toast({ type: "success", text: "Versión restaurada ✓" });
      setShowVersions(false);
      setDirty(false);
    } else {
      toast({ type: "error", text: "Error al restaurar" });
    }
  }

  const toolbar = [
    { label:"H2", title:"Título de sección (Ctrl+Shift+H)", action:()=>insertLine(contentRef,"## ") },
    { label:"H3", title:"Subtítulo", action:()=>insertLine(contentRef,"### ") },
    { label:"B",  title:"Negrita",   action:()=>insertMarkdown(contentRef,"**","**","texto en negrita") },
    { label:"I",  title:"Cursiva",   action:()=>insertMarkdown(contentRef,"*","*","texto en cursiva") },
    { label:"❝",  title:"Cita",      action:()=>insertLine(contentRef,"> ") },
    { label:"• —",title:"Lista",     action:()=>insertLine(contentRef,"- ") },
    { label:"[ ]",title:"Link",      action:()=>insertMarkdown(contentRef,"[","](url)","texto del link") },
    { label:"`·`",title:"Código",    action:()=>insertMarkdown(contentRef,"`","`","código") },
    { label:"—",  title:"Separador", action:()=>{ const el=contentRef.current; if(!el) return; const v=el.value.slice(0,el.selectionStart)+"\n\n---\n\n"+el.value.slice(el.selectionStart); const s=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,"value").set; s.call(el,v); el.dispatchEvent(new Event("input",{bubbles:true})); el.focus(); }},
  ];

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        published: mode === "published",
        publish_at: mode === "scheduled" ? publishAt : null,
      };
      await onSubmit(payload);
      // Clear autosave on success
      try { localStorage.removeItem(`blog_autosave_${slug || "new"}`); } catch {}
      setDirty(false);
      if (mode === "scheduled" && publishAt) {
        toast({ type:"success", text:`Programada para el ${new Date(publishAt).toLocaleString("es-AR",{dateStyle:"medium",timeStyle:"short"})} ⏰` });
      } else if (mode === "published") {
        toast({ type:"success", text:"Entrada publicada ✓" });
      } else {
        toast({ type:"success", text:"Borrador guardado ✓" });
      }
    } catch (err) {
      toast({ type:"error", text: err.message || "Error al guardar" });
    }
    setLoading(false);
  }

  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(1, Math.ceil(wordCount/200));

  return (
    <>
      <div className="adm-header">
        <div>
          <h1>{submitLabel === "Guardar cambios" ? "Editar entrada" : "Nueva entrada"}</h1>
          <div style={{ display:"flex", gap:10, alignItems:"center", marginTop:2 }}>
            {slug && <span style={{ fontSize:12, color:"var(--adm-fg-muted)" }}>/{slug}</span>}
            {autoSaved && <span style={{ fontSize:11, color:"#1a7a4a", fontFamily:"var(--adm-font-body)" }}>Autosave ✓</span>}
            {dirty && !autoSaved && <span style={{ fontSize:11, color:"var(--adm-fg-muted)", fontFamily:"var(--adm-font-body)" }}>Sin guardar</span>}
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {slug && (
            <button type="button" className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => { setShowVersions(v => !v); if (!versions) loadVersions(); }}>
              🕐 Versiones
            </button>
          )}
          {slug && <Link href={`/blog/${slug}`} target="_blank" className="adm-btn adm-btn-secondary adm-btn-sm">Ver</Link>}
          {slug && (
            <Link
              href={`/administracion-general/marketing/chat?repurpose=${encodeURIComponent(slug)}`}
              className="adm-btn adm-btn-secondary adm-btn-sm"
              title={dirty ? "Guardá los cambios antes: el chat usa la versión guardada del post" : "Abrir el chat de Marketing para convertir este post en piezas para redes"}
            >
              ✴ Reutilizar en redes
            </Link>
          )}
          <Link href={backHref||"/administracion-general/blog"} className="adm-btn adm-btn-secondary adm-btn-sm">← Volver</Link>
        </div>
      </div>

      <div className="adm-content">
        {/* Restored autosave banner */}
        {restoredBanner && (
          <div style={{ padding:"12px 16px", background:"#fff8e1", border:"1px solid #f0d060", borderRadius:8, marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center", fontFamily:"var(--adm-font-body)", fontSize:13 }}>
            <span>💾 Hay un borrador guardado automáticamente del {new Date(restoredBanner.savedAt).toLocaleString("es-AR", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}</span>
            <div style={{ display:"flex", gap:8 }}>
              <button type="button" className="adm-btn adm-btn-sm adm-btn-primary" onClick={() => applyRestore(restoredBanner)}>Usar borrador</button>
              <button type="button" className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => { setRestoredBanner(null); try { localStorage.removeItem(`blog_autosave_${slug || "new"}`); } catch {} }}>Descartar</button>
            </div>
          </div>
        )}

        {/* Versions panel */}
        {showVersions && (
          <div style={{ padding:16, background:"var(--adm-tinted)", border:"1px solid var(--adm-border)", borderRadius:8, marginBottom:16 }}>
            <div style={{ fontWeight:700, fontSize:13, fontFamily:"var(--adm-font-body)", marginBottom:12 }}>🕐 Historial de versiones</div>
            {versionsLoading ? (
              <div style={{ color:"var(--adm-fg-muted)", fontSize:12 }}>Cargando…</div>
            ) : !versions || versions.length === 0 ? (
              <div style={{ color:"var(--adm-fg-muted)", fontSize:12 }}>No hay versiones guardadas todavía. Se guardan automáticamente al publicar.</div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {versions.map((v, i) => (
                  <div key={v.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", background:"var(--adm-surface)", borderRadius:6, border:"1px solid var(--adm-border)" }}>
                    <div>
                      <span style={{ fontSize:12, fontFamily:"var(--adm-font-body)", fontWeight:600 }}>{v.title || "Sin título"}</span>
                      <span style={{ fontSize:11, color:"var(--adm-fg-muted)", marginLeft:8 }}>{new Date(v.created_at).toLocaleString("es-AR", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}</span>
                      {i === 0 && <span style={{ fontSize:10, background:"var(--adm-primary)", color:"#fff", borderRadius:10, padding:"1px 7px", marginLeft:8 }}>más reciente</span>}
                    </div>
                    <button type="button" className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => handleRestore(v.id)}>Restaurar</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <form ref={formRef} onSubmit={handleSave}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
            <div className="adm-form-group" style={{ gridColumn:"1 / -1", marginBottom:0 }}>
              <label className="adm-label">Título * <span style={{ fontSize:10, fontWeight:400, color:"var(--adm-fg-muted)" }}>Ctrl+S para guardar · Ctrl+P para preview</span></label>
              <input className="adm-input" style={{ fontSize:18, fontWeight:600 }} value={form.title} onChange={e=>update("title",e.target.value)} required placeholder="El título de tu entrada" />
              <div style={{ marginTop:6 }}>
                <SeoBar value={form.title} min={30} max={65} label="Título SEO" />
              </div>
            </div>
            <div className="adm-form-group" style={{ marginBottom:0 }}>
              <label className="adm-label">Resumen</label>
              <textarea className="adm-textarea" style={{ minHeight:72, resize:"vertical" }} value={form.excerpt} onChange={e=>update("excerpt",e.target.value)} placeholder="Dos líneas que resumen el post" />
              <div style={{ marginTop:6 }}>
                <SeoBar value={form.excerpt} min={80} max={165} label="Meta descripción" />
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div className="adm-form-group" style={{ marginBottom:0 }}>
                <label className="adm-label">Estado de publicación</label>
                <StatusPicker mode={mode} setMode={setMode} publishAt={publishAt} setPublishAt={setPublishAt} />
              </div>
            </div>
          </div>

          <div className="adm-form-group">
            <label className="adm-label">Etiquetas</label>
            <TagsInput tags={form.tags} onChange={t=>update("tags",t)} allTags={allTags} />
            <div style={{ fontSize:11, color:"var(--adm-fg-muted)", marginTop:4 }}>Escribí y Enter para agregar, o hacé clic en las etiquetas existentes</div>
          </div>

          <div className="adm-form-group">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <label className="adm-label" style={{ marginBottom:0 }}>Contenido</label>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ fontSize:11, color:"var(--adm-fg-muted)" }}>{wordCount} palabras · {readMins} min lectura</span>
                <button type="button" onClick={()=>setPreview(v=>!v)} style={{ background:preview?"var(--adm-primary)":"none", border:"1px solid var(--adm-primary)", borderRadius:6, padding:"3px 10px", fontSize:11, cursor:"pointer", color:preview?"#fff":"var(--adm-primary)", fontFamily:"var(--adm-font-body)", fontWeight:700 }}>
                  {preview ? "✏ Editar" : "👁 Preview"}
                </button>
              </div>
            </div>

            {!preview && (
              <>
                <div style={{ display:"flex", flexWrap:"wrap", gap:4, padding:"8px 10px", background:"var(--adm-tinted)", borderRadius:"8px 8px 0 0", border:"1px solid var(--adm-border)", borderBottom:"none" }}>
                  {toolbar.map(btn => <ToolbarBtn key={btn.label} label={btn.label} title={btn.title} onClick={btn.action} />)}
                  <div style={{flex:1}}/>
                  <span style={{ fontSize:11, color:"var(--adm-fg-muted)", alignSelf:"center", fontFamily:"var(--adm-font-body)" }}>## título · **negrita** · *cursiva*</span>
                </div>
                <textarea ref={contentRef} className="adm-textarea code" style={{ borderRadius:"0 0 8px 8px", minHeight:420, resize:"vertical" }} value={form.content} onChange={e=>update("content",e.target.value)} spellCheck={false} placeholder={"Escribí tu entrada acá.\n\nUsá los botones de la barra para dar formato, o escribí markdown directo:\n## Para un título de sección\n**Para negrita**\n*Para cursiva*"} />
              </>
            )}

            {preview && (
              <div style={{ border:"1px solid var(--adm-border)", borderRadius:8, padding:"24px 32px", minHeight:420, background:"var(--adm-bg)", fontFamily:"Georgia, serif", lineHeight:1.75, color:"var(--adm-fg)" }} dangerouslySetInnerHTML={{ __html: renderPreview(form.content) || "<p style='color:var(--adm-fg-muted);font-style:italic'>El preview aparece acá…</p>" }} />
            )}
          </div>

          <div style={{ display:"flex", gap:12, paddingTop:8 }}>
            <button type="submit" className="adm-btn adm-btn-primary" disabled={loading || !form.title.trim()}>
              {loading ? "Guardando…" : submitLabel || "Guardar"}
            </button>
            <Link href={backHref||"/administracion-general/blog"} className="adm-btn adm-btn-secondary">Cancelar</Link>
          </div>
        </form>
      </div>

      <style>{`
        .adm-textarea.code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:14px; line-height:1.65; }
        .adm-content h2 { font-family:Georgia,serif; font-style:italic; color:var(--adm-primary); margin:16px 0 8px; font-size:20px; }
        .adm-content h3 { font-family:Georgia,serif; color:var(--adm-fg); margin:12px 0 6px; font-size:17px; }
        .adm-content blockquote { border-left:3px solid var(--adm-primary); padding-left:12px; color:var(--adm-fg-2); font-style:italic; margin:12px 0; }
        .adm-content code { background:var(--adm-tinted); padding:2px 5px; border-radius:4px; font-size:.9em; }
        .adm-content hr { border:none; border-top:1px dashed var(--adm-border); margin:16px 0; }
        .adm-content ul { padding-left:20px; }
        .adm-content a { color:var(--adm-primary); }
      `}</style>
    </>
  );
}
