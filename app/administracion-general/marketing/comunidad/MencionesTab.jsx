"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, fitImage, fmtDate, today, COMMUNITY_NETWORKS, NetworkPill } from "./api";

const FILTERS = [
  { id: "pending", label: "Para compartir" },
  { id: "shared", label: "Ya compartidas" },
  { id: "all", label: "Todas" },
];
const EMPTY = { url: "", network: "linkedin", author: "", note: "", mentioned_on: "" };

export default function MencionesTab({ onChange }) {
  const [filter, setFilter] = useState("pending");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState({ ...EMPTY, mentioned_on: today() });
  const [shot, setShot] = useState(null); // { file, preview }
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await api(`/mentions?filter=${filter}`);
      setItems(items);
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => () => shot?.preview && URL.revokeObjectURL(shot.preview), [shot]);

  function pickFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    setShot({ file, preview: URL.createObjectURL(file) });
  }

  // Pegar una captura con Ctrl+V en cualquier parte del formulario.
  function onPaste(e) {
    const file = [...(e.clipboardData?.files || [])].find((f) => f.type.startsWith("image/"));
    if (file) {
      e.preventDefault();
      pickFile(file);
    }
  }

  async function add(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.set(k, v));
    if (shot) {
      const file = await fitImage(shot.file);
      fd.set("screenshot", file, file.name || "captura.png");
    }
    try {
      const { item } = await api("/mentions", { method: "POST", form: fd });
      if (filter !== "shared") setItems((l) => [item, ...l]);
      setForm({ ...EMPTY, network: form.network, mentioned_on: today() });
      setShot(null);
      onChange?.();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
    setBusy(false);
  }

  async function setShared(m, shared) {
    try {
      const { item } = await api(`/mentions/${m.id}`, { method: "PATCH", body: { shared } });
      const visible = filter === "all" || (filter === "shared") === item.shared;
      setItems((l) => (visible ? l.map((x) => (x.id === m.id ? item : x)) : l.filter((x) => x.id !== m.id)));
      onChange?.();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
  }

  async function remove(m) {
    if (!confirm("¿Eliminar esta mención (y su captura)?")) return;
    try {
      await api(`/mentions/${m.id}`, { method: "DELETE" });
      setItems((l) => l.filter((x) => x.id !== m.id));
      onChange?.();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      setMsg({ type: "success", text: "Link copiado" });
    } catch {}
  }

  const canSave = form.url.trim() || form.author.trim() || form.note.trim() || shot;

  return (
    <div className="mk-comunidad-panel">
      <form className="adm-card mk-comunidad-form" onSubmit={add} onPaste={onPaste}>
        <div className="adm-card-head">
          <span className="adm-card-title">Guardar una mención</span>
          <span className="adm-card-hint">Alguien te nombró, compartió tu post o hizo algo con tu contenido</span>
        </div>
        <div className="mk-comunidad-mform">
          <div className="mk-comunidad-mfields">
            <label className="adm-form-group">
              <span className="adm-label">Link</span>
              <input className="adm-input" placeholder="https://www.linkedin.com/posts/…" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </label>
            <div className="mk-comunidad-grid3">
              <label className="adm-form-group">
                <span className="adm-label">Red</span>
                <select className="adm-select" value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })}>
                  {COMMUNITY_NETWORKS.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
              </label>
              <label className="adm-form-group">
                <span className="adm-label">Autor</span>
                <input className="adm-input" placeholder="@usuaria o nombre" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
              </label>
              <label className="adm-form-group">
                <span className="adm-label">Fecha</span>
                <input type="date" className="adm-input" value={form.mentioned_on} onChange={(e) => setForm({ ...form, mentioned_on: e.target.value })} />
              </label>
            </div>
            <label className="adm-form-group">
              <span className="adm-label">Nota</span>
              <input className="adm-input" placeholder="Qué dijo, por qué vale compartirlo" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </label>
          </div>
          <div
            className={`mk-comunidad-drop${shot ? " has-shot" : ""}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              pickFile(e.dataTransfer.files?.[0]);
            }}
            role="button"
            tabIndex={0}
          >
            {shot ? (
              <>
                <img src={shot.preview} alt="Captura" />
                <button type="button" className="mk-comunidad-drop-x" onClick={(e) => { e.stopPropagation(); setShot(null); }} aria-label="Quitar captura">
                  ×
                </button>
              </>
            ) : (
              <span>Captura (opcional)<br /><small>Arrastrala, elegila o pegala con Ctrl+V</small></span>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ""; }}
            />
          </div>
        </div>
        <div>
          <button className="adm-btn adm-btn-primary" disabled={busy || !canSave}>{busy ? "Guardando…" : "Guardar mención"}</button>
        </div>
      </form>

      {msg && <div className={`adm-alert adm-alert-${msg.type}`}>{msg.text}</div>}

      <div className="mk-comunidad-filters">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className={`mk-comunidad-chip${filter === f.id ? " is-on" : ""}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="adm-card mk-comunidad-loading">Cargando…</div>
      ) : items.length === 0 ? (
        <div className="adm-card adm-empty">
          {filter === "pending" ? "No hay menciones esperando. Cuando alguien te nombre, guardala acá." : "Todavía no hay menciones acá."}
        </div>
      ) : (
        <div className="mk-comunidad-mgrid">
          {items.map((m) => (
            <article key={m.id} className={`adm-card mk-comunidad-mcard${m.shared ? " is-shared" : ""}`}>
              {m.screenshot_url && (
                <a href={m.screenshot_url} target="_blank" rel="noreferrer" className="mk-comunidad-shot">
                  <img src={m.screenshot_url} alt={`Captura de ${m.author || "la mención"}`} />
                </a>
              )}
              <div className="mk-comunidad-mbody">
                <div className="mk-comunidad-meta">
                  <NetworkPill id={m.network} />
                  <span>{fmtDate(m.mentioned_on)}</span>
                  {m.shared && <span className="adm-badge adm-badge-active">Compartida</span>}
                </div>
                {m.author && <div className="mk-comunidad-tname">{m.author}</div>}
                {m.note && <p className="mk-comunidad-mnote">{m.note}</p>}
                {m.url && (
                  <div className="mk-comunidad-mlinks">
                    <a href={m.url} target="_blank" rel="noreferrer noopener" className="adm-card-link">Abrir ↗</a>
                    <button type="button" className="adm-link-btn" onClick={() => copy(m.url)}>Copiar link</button>
                  </div>
                )}
                <div className="mk-comunidad-actions">
                  {m.shared ? (
                    <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setShared(m, false)}>Desmarcar</button>
                  ) : (
                    <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setShared(m, true)}>Ya la compartí</button>
                  )}
                  <span className="mk-comunidad-spacer" />
                  <button className="adm-link-btn mk-comunidad-danger" onClick={() => remove(m)}>Eliminar</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
