"use client";
import { useEffect, useImperativeHandle, useRef, forwardRef, useState } from "react";

const FONTS = [
  { label: "Georgia (serif)", value: "Georgia, 'Times New Roman', serif" },
  { label: "Arial (sans)", value: "Arial, Helvetica, sans-serif" },
  { label: "Trebuchet", value: "'Trebuchet MS', Helvetica, sans-serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Times", value: "'Times New Roman', Times, serif" },
  { label: "Courier (máquina)", value: "'Courier New', Courier, monospace" },
  { label: "Manuscrita", value: "'Brush Script MT', 'Segoe Script', cursive" },
];
const SIZES = [11, 12, 13, 14, 15, 16, 18, 20, 24, 28, 32, 40, 48];
const SWATCHES = ["#1a0a10", "#3d1a2a", "#8b1a4a", "#d4447a", "#f2b7d1", "#a07080", "#fdf5ec", "#ffffff"];

export const BLOCK_STYLES = {
  h1: "font-family:Georgia,serif;font-size:32px;font-weight:700;color:#8b1a4a;line-height:1.2;margin:0 0 16px;",
  h2: "font-family:Georgia,serif;font-size:24px;font-weight:700;color:#8b1a4a;line-height:1.3;margin:0 0 14px;",
  h3: "font-family:Georgia,serif;font-style:italic;font-size:19px;color:#1a0a10;line-height:1.35;margin:0 0 12px;",
  p: "font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3d1a2a;line-height:1.75;margin:0 0 18px;",
};

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function safeUrl(u) {
  const t = (u || "").trim();
  return /^(https?:|mailto:)/i.test(t) ? t : null;
}

export function legacyToHtml(text) {
  if (!text || text.trim().startsWith("<")) return text || "";
  return text.split("\n\n").filter(Boolean)
    .map(p => `<p style="${BLOCK_STYLES.p}">${esc(p).replace(/\n/g, "<br/>")}</p>`).join("");
}

const btn = {
  minWidth: 30, height: 30, background: "white", border: "1px solid var(--adm-border)", borderRadius: 4,
  cursor: "pointer", color: "var(--adm-fg)", display: "inline-flex", alignItems: "center", justifyContent: "center",
  padding: "0 7px", fontSize: 13, fontFamily: "var(--adm-font-body)",
};
const sel = { height: 30, border: "1px solid var(--adm-border)", borderRadius: 4, fontSize: 12, background: "white", padding: "0 4px", fontFamily: "var(--adm-font-body)" };
const sep = <div style={{ width: 1, height: 22, background: "var(--adm-border)", margin: "0 3px" }} />;

const RichEditor = forwardRef(function RichEditor({ value, onChange, placeholder }, ref) {
  const el = useRef(null);
  const savedRange = useRef(null);
  const [showColors, setShowColors] = useState(false);
  const [buttonForm, setButtonForm] = useState(null);

  useEffect(() => {
    if (el.current && el.current.innerHTML !== value) el.current.innerHTML = value || "";
  }, [value]);

  function emit() { onChange(el.current.innerHTML); }

  function saveSel() {
    const s = window.getSelection();
    if (s.rangeCount && el.current.contains(s.anchorNode)) savedRange.current = s.getRangeAt(0).cloneRange();
  }
  function restoreSel() {
    el.current.focus();
    if (savedRange.current) {
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(savedRange.current);
    }
  }

  function exec(cmd, arg) {
    restoreSel();
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(cmd, false, arg);
    saveSel();
    emit();
  }

  function insertHtml(html) {
    restoreSel();
    document.execCommand("insertHTML", false, html);
    saveSel();
    emit();
  }

  function setFontSize(px) {
    restoreSel();
    document.execCommand("styleWithCSS", false, false);
    document.execCommand("fontSize", false, "7");
    el.current.querySelectorAll('font[size="7"]').forEach(f => {
      const span = document.createElement("span");
      span.style.fontSize = px + "px";
      span.style.lineHeight = "1.4";
      span.innerHTML = f.innerHTML;
      f.replaceWith(span);
    });
    saveSel();
    emit();
  }

  function setBlock(tag) {
    restoreSel();
    document.execCommand("formatBlock", false, tag);
    const s = window.getSelection();
    let node = s.anchorNode;
    while (node && node !== el.current) {
      if (node.nodeType === 1 && node.tagName.toLowerCase() === tag) {
        node.setAttribute("style", BLOCK_STYLES[tag]);
        break;
      }
      node = node.parentNode;
    }
    saveSel();
    emit();
  }

  function addLink() {
    const url = safeUrl(window.prompt("URL del link:", "https://"));
    if (!url) return;
    const text = window.getSelection().toString();
    if (text) exec("createLink", url);
    else insertHtml(`<a href="${esc(url)}" style="color:#8b1a4a;text-decoration:underline;">${esc(url)}</a>`);
  }

  function addImage() {
    const url = safeUrl(window.prompt("URL de la imagen (https://…):", "https://"));
    if (!url) return;
    insertHtml(`<p style="text-align:center;margin:0 0 18px;"><img src="${esc(url)}" alt="" style="max-width:100%;border-radius:8px;" /></p><p style="${BLOCK_STYLES.p}"><br/></p>`);
  }

  function addButton({ text, url, bg, fg }) {
    const u = safeUrl(url);
    if (!u || !text) return;
    insertHtml(
      `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 20px;"><tr><td style="background:${esc(bg)};border-radius:999px;padding:13px 28px;">` +
      `<a href="${esc(u)}" style="font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:14px;color:${esc(fg)};text-decoration:none;letter-spacing:.04em;">${esc(text)}</a>` +
      `</td></tr></table><p style="${BLOCK_STYLES.p}"><br/></p>`
    );
    setButtonForm(null);
  }

  useImperativeHandle(ref, () => ({
    insertHtml,
    getSelectionHtml() {
      const s = window.getSelection();
      if (!s.rangeCount || !el.current.contains(s.anchorNode) || s.isCollapsed) return "";
      const div = document.createElement("div");
      div.appendChild(s.getRangeAt(0).cloneContents());
      return div.innerHTML;
    },
    getHtml: () => el.current?.innerHTML || "",
  }));

  const blocks = {
    quote: `<table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin:0 0 22px;"><tr><td style="border-left:4px solid #d4447a;padding:16px 20px;background:#fdf0f6;border-radius:0 10px 10px 0;font-family:Georgia,serif;font-style:italic;font-size:18px;color:#8b1a4a;line-height:1.5;">Escribí la cita acá</td></tr></table><p style="${BLOCK_STYLES.p}"><br/></p>`,
    box: `<table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin:0 0 22px;"><tr><td style="background:#8b1a4a;border-radius:12px;padding:24px 28px;text-align:center;font-family:Georgia,serif;font-style:italic;font-size:20px;color:#fdf5ec;line-height:1.45;">Texto destacado</td></tr></table><p style="${BLOCK_STYLES.p}"><br/></p>`,
    divider: `<hr style="border:none;border-top:1px dashed rgba(139,26,74,.25);margin:8px 0 24px;" /><p style="${BLOCK_STYLES.p}"><br/></p>`,
  };

  return (
    <div>
      <div onMouseDown={e => { if (e.target.tagName !== "SELECT" && e.target.tagName !== "INPUT") e.preventDefault(); }}
        style={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center", padding: "6px 8px", background: "var(--adm-tinted)", border: "1px solid var(--adm-border)", borderRadius: "var(--adm-radius) var(--adm-radius) 0 0", position: "relative" }}>
        <select style={sel} title="Estilo de bloque" defaultValue="" onChange={e => { if (e.target.value) setBlock(e.target.value); e.target.value = ""; }}>
          <option value="" disabled>Estilo</option>
          <option value="h1">Título grande (H1)</option>
          <option value="h2">Título medio (H2)</option>
          <option value="h3">Subtítulo (H3)</option>
          <option value="p">Párrafo</option>
        </select>
        <select style={sel} title="Tipografía" defaultValue="" onChange={e => { if (e.target.value) exec("fontName", e.target.value); e.target.value = ""; }}>
          <option value="" disabled>Tipografía</option>
          {FONTS.map(f => <option key={f.label} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>)}
        </select>
        <select style={sel} title="Tamaño" defaultValue="" onChange={e => { if (e.target.value) setFontSize(e.target.value); e.target.value = ""; }}>
          <option value="" disabled>Tamaño</option>
          {SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
        </select>
        {sep}
        <button type="button" style={{ ...btn, fontWeight: 700 }} title="Negrita" onClick={() => exec("bold")}>B</button>
        <button type="button" style={{ ...btn, fontStyle: "italic", fontFamily: "Georgia,serif" }} title="Itálica" onClick={() => exec("italic")}>I</button>
        <button type="button" style={{ ...btn, textDecoration: "underline" }} title="Subrayado" onClick={() => exec("underline")}>U</button>
        <div style={{ position: "relative" }}>
          <button type="button" style={btn} title="Color de letra" onClick={() => setShowColors(v => !v)}>
            <span style={{ borderBottom: "3px solid #d4447a", lineHeight: 1 }}>A</span>
          </button>
          {showColors && (
            <div style={{ position: "absolute", top: 34, left: 0, zIndex: 10, background: "white", border: "1px solid var(--adm-border)", borderRadius: 6, padding: 8, display: "grid", gridTemplateColumns: "repeat(4, 22px)", gap: 6, boxShadow: "0 4px 14px rgba(0,0,0,.1)" }}>
              {SWATCHES.map(c => (
                <button key={c} type="button" title={c} onClick={() => { exec("foreColor", c); setShowColors(false); }}
                  style={{ width: 22, height: 22, borderRadius: 4, background: c, border: "1px solid rgba(0,0,0,.15)", cursor: "pointer" }} />
              ))}
              <label style={{ gridColumn: "1 / -1", fontSize: 11, display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--adm-font-body)" }}>
                Otro: <input type="color" onChange={e => exec("foreColor", e.target.value)} />
              </label>
            </div>
          )}
        </div>
        {sep}
        <button type="button" style={btn} title="Alinear izquierda" onClick={() => exec("justifyLeft")}>⯇</button>
        <button type="button" style={btn} title="Centrar" onClick={() => exec("justifyCenter")}>≡</button>
        <button type="button" style={btn} title="Lista" onClick={() => exec("insertUnorderedList")}>•</button>
        {sep}
        <button type="button" style={btn} title="Cita" onClick={() => insertHtml(blocks.quote)}>❝</button>
        <button type="button" style={btn} title="Caja destacada" onClick={() => insertHtml(blocks.box)}>▣</button>
        <button type="button" style={btn} title="Divisor" onClick={() => insertHtml(blocks.divider)}>—</button>
        {sep}
        <button type="button" style={btn} title="Link (seleccioná texto)" onClick={addLink}>🔗</button>
        <button type="button" style={{ ...btn, background: "#8b1a4a", color: "#fdf5ec", borderColor: "#8b1a4a", borderRadius: 999, fontSize: 11, fontWeight: 700 }} title="Botón con link" onClick={() => { saveSel(); setButtonForm({ text: "", url: "https://", bg: "#8b1a4a", fg: "#fdf5ec" }); }}>Botón</button>
        <button type="button" style={btn} title="Imagen" onClick={addImage}>🖼</button>
        <button type="button" style={btn} title="Quitar formato" onClick={() => exec("removeFormat")}>⌫</button>
      </div>

      {buttonForm && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", padding: "8px", background: "#fff8fb", border: "1px solid var(--adm-border)", borderTop: "none" }}>
          <input className="adm-input" style={{ flex: "1 1 140px", fontSize: 12 }} placeholder="Texto del botón" value={buttonForm.text} onChange={e => setButtonForm({ ...buttonForm, text: e.target.value })} autoFocus />
          <input className="adm-input" style={{ flex: "2 1 200px", fontSize: 12 }} placeholder="https://…" value={buttonForm.url} onChange={e => setButtonForm({ ...buttonForm, url: e.target.value })} />
          <label style={{ fontSize: 11 }}>Fondo <input type="color" value={buttonForm.bg} onChange={e => setButtonForm({ ...buttonForm, bg: e.target.value })} /></label>
          <label style={{ fontSize: 11 }}>Letra <input type="color" value={buttonForm.fg} onChange={e => setButtonForm({ ...buttonForm, fg: e.target.value })} /></label>
          <button type="button" className="adm-btn adm-btn-sm adm-btn-primary" disabled={!buttonForm.text || !safeUrl(buttonForm.url)} onClick={() => addButton(buttonForm)}>Insertar</button>
          <button type="button" className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => setButtonForm(null)}>Cancelar</button>
        </div>
      )}

      <div
        ref={el}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onKeyUp={saveSel}
        onMouseUp={saveSel}
        onBlur={saveSel}
        data-placeholder={placeholder}
        className="adm-rich-editor"
        style={{ minHeight: 320, padding: "20px 24px", background: "#fffcf6", border: "1px solid var(--adm-border)", borderTop: "none", borderRadius: "0 0 var(--adm-radius) var(--adm-radius)", outline: "none", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 15, color: "#3d1a2a", lineHeight: 1.75, overflowWrap: "anywhere" }}
      />
      <style>{`.adm-rich-editor:empty:before{content:attr(data-placeholder);color:#c099a8;font-style:italic;}`}</style>
    </div>
  );
});

export default RichEditor;
