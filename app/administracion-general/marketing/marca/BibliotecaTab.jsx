"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "../../AdminToast";
import { NETWORKS, networkLabel } from "@/lib/marketing/constants";
import { ASSET_SOURCES, SNIPPET_KINDS } from "@/lib/marketing/brand/defaults";
import { api, copyText, formatBytes, uploadAsset } from "./api";

const KIND_LABEL = Object.fromEntries(SNIPPET_KINDS.map((k) => [k.id, k.label]));
const SOURCE_LABEL = Object.fromEntries(ASSET_SOURCES.map((s) => [s.id, s.label]));

function AssetDetail({ asset, onClose, onChange, onDelete }) {
  const toast = useToast();
  const [name, setName] = useState(asset.name);
  const [tags, setTags] = useState((asset.tags || []).join(", "));
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setName(asset.name);
    setTags((asset.tags || []).join(", "));
  }, [asset]);

  async function save() {
    setBusy(true);
    try {
      const { asset: a } = await api(`assets/${asset.id}`, { method: "PATCH", body: { name, tags } });
      onChange(a);
      toast({ text: "Guardado" });
    } catch (e) {
      toast({ type: "error", text: e.message });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`¿Borrar "${asset.name}" de la biblioteca? No se puede deshacer.`)) return;
    setBusy(true);
    try {
      await api(`assets/${asset.id}`, { method: "DELETE" });
      onDelete(asset.id);
      toast({ text: "Archivo borrado" });
    } catch (e) {
      toast({ type: "error", text: e.message });
      setBusy(false);
    }
  }

  const isImage = asset.mime?.startsWith("image/");
  const m = asset.meta || {};
  return (
    <aside className="adm-card mk-marca-detail">
      <div className="mk-marca-modal-head">
        <h3 className="mk-marca-h2">Detalle</h3>
        <button className="adm-link-btn" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
      </div>
      <div className="mk-marca-detail-preview">
        {isImage && asset.url ? <img src={asset.url} alt={asset.name} /> : <div className="mk-marca-file-icon">{(asset.mime || "archivo").split("/").pop()}</div>}
      </div>
      <p className="mk-marca-hint">
        {SOURCE_LABEL[asset.source] || asset.source}
        {asset.width ? ` · ${asset.width}×${asset.height}` : ""}
        {asset.size_bytes ? ` · ${formatBytes(asset.size_bytes)}` : ""}
        {` · ${new Date(asset.created_at).toLocaleDateString("es-AR")}`}
      </p>
      {asset.source === "unsplash" && m.author && (
        <p className="mk-marca-attrib">
          Foto de{" "}
          <a href={m.author_url} target="_blank" rel="noopener noreferrer">
            {m.author}
          </a>{" "}
          en{" "}
          <a href={m.photo_url} target="_blank" rel="noopener noreferrer">
            Unsplash
          </a>
        </p>
      )}
      <label className="adm-form-group">
        <span className="adm-label">Nombre</span>
        <input className="adm-input" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="adm-form-group">
        <span className="adm-label">Etiquetas (separadas por coma)</span>
        <input className="adm-input" value={tags} onChange={(e) => setTags(e.target.value)} />
      </label>
      <div className="mk-marca-row mk-marca-wrap">
        <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={save} disabled={busy}>
          Guardar
        </button>
        {asset.url && (
          <a className="adm-btn adm-btn-secondary adm-btn-sm" href={asset.url} target="_blank" rel="noopener noreferrer" download={asset.name}>
            Descargar
          </a>
        )}
        {asset.url && (
          <button
            className="adm-btn adm-btn-secondary adm-btn-sm"
            onClick={async () => (await copyText(asset.url)) && toast({ text: "Link copiado (vence en 1 hora)" })}
          >
            Copiar link
          </button>
        )}
        <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={remove} disabled={busy}>
          Borrar
        </button>
      </div>
    </aside>
  );
}

function Archivos() {
  const toast = useToast();
  const [assets, setAssets] = useState(null);
  const [tags, setTags] = useState([]);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [source, setSource] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const [uploading, setUploading] = useState("");
  const [drag, setDrag] = useState(false);
  const [open, setOpen] = useState(null);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (tag) sp.set("tag", tag);
    if (source) sp.set("source", source);
    try {
      const d = await api(`assets?${sp}`);
      setAssets(d.assets);
      setTags(d.tags);
    } catch (e) {
      setAssets([]);
      toast({ type: "error", text: e.message });
    }
  }, [q, tag, source, toast]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function onFiles(files) {
    const list = [...files];
    let ok = 0;
    for (let i = 0; i < list.length; i++) {
      setUploading(`Subiendo ${i + 1} de ${list.length}…`);
      try {
        await uploadAsset(list[i], uploadTags.split(","));
        ok++;
      } catch (e) {
        toast({ type: "error", text: `${list[i].name}: ${e.message}` });
      }
    }
    setUploading("");
    if (ok) toast({ text: ok === 1 ? "Archivo subido" : `${ok} archivos subidos` });
    load();
  }

  return (
    <div className={`mk-marca-lib${open ? " has-detail" : ""}`}>
      <div className="mk-marca-stack">
        <div
          className={`mk-marca-drop${drag ? " is-drag" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
          }}
        >
          <input ref={fileRef} type="file" multiple hidden onChange={(e) => e.target.files?.length && onFiles(e.target.files)} />
          <div>
            <strong>{uploading || "Arrastrá archivos acá"}</strong>
            <p className="mk-marca-hint">Imágenes, videos o PDFs de hasta 50 MB. Se guardan privados.</p>
          </div>
          <input className="adm-input mk-marca-drop-tags" placeholder="Etiquetas para lo que subas (ej. reel, portada)" value={uploadTags} onChange={(e) => setUploadTags(e.target.value)} />
          <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => fileRef.current?.click()} disabled={!!uploading}>
            Elegir archivos
          </button>
        </div>

        <div className="adm-toolbar">
          <input className="adm-search" placeholder="Buscar por nombre o etiqueta…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="adm-select mk-marca-auto" value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="">Todos los orígenes</option>
            {ASSET_SOURCES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        {tags.length > 0 && (
          <div className="mk-marca-chips">
            <button className={`mk-marca-chip${!tag ? " is-active" : ""}`} onClick={() => setTag("")}>
              Todas
            </button>
            {tags.slice(0, 30).map((t) => (
              <button key={t.name} className={`mk-marca-chip${tag === t.name ? " is-active" : ""}`} onClick={() => setTag(tag === t.name ? "" : t.name)}>
                {t.name} <small>{t.count}</small>
              </button>
            ))}
          </div>
        )}

        {assets === null ? (
          <p className="mk-marca-hint">Cargando…</p>
        ) : assets.length === 0 ? (
          <div className="adm-empty">
            <p>{q || tag || source ? "No hay archivos con ese filtro." : "Todavía no hay archivos en la biblioteca."}</p>
          </div>
        ) : (
          <div className="mk-marca-grid">
            {assets.map((a) => (
              <button key={a.id} className={`mk-marca-card${open?.id === a.id ? " is-open" : ""}`} onClick={() => setOpen(a)}>
                <div className="mk-marca-card-img">
                  {a.mime?.startsWith("image/") && a.url ? (
                    <img src={a.url} alt={a.name} loading="lazy" />
                  ) : (
                    <div className="mk-marca-file-icon">{(a.mime || "archivo").split("/").pop()}</div>
                  )}
                </div>
                <div className="mk-marca-card-body">
                  <span className="mk-marca-card-name">{a.name}</span>
                  {a.tags?.length > 0 && <span className="mk-marca-card-tags">{a.tags.slice(0, 3).join(" · ")}</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      {open && (
        <AssetDetail
          asset={open}
          onClose={() => setOpen(null)}
          onChange={(a) => {
            setOpen(a);
            setAssets((list) => list.map((x) => (x.id === a.id ? a : x)));
          }}
          onDelete={(id) => {
            setOpen(null);
            setAssets((list) => list.filter((x) => x.id !== id));
          }}
        />
      )}
    </div>
  );
}

const EMPTY = { kind: "cta", title: "", body: "", network: "", tags: "" };

function Frases() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [kind, setKind] = useState("");
  const [q, setQ] = useState("");
  const [form, setForm] = useState(null); // null | { id?, ...campos }

  const load = useCallback(async () => {
    const sp = new URLSearchParams();
    if (kind) sp.set("kind", kind);
    if (q) sp.set("q", q);
    try {
      setItems((await api(`snippets?${sp}`)).snippets);
    } catch (e) {
      setItems([]);
      toast({ type: "error", text: e.message });
    }
  }, [kind, q, toast]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function save(e) {
    e.preventDefault();
    try {
      const body = { ...form, tags: form.tags };
      if (form.id) await api(`snippets/${form.id}`, { method: "PATCH", body });
      else await api("snippets", { method: "POST", body });
      setForm(null);
      toast({ text: "Frase guardada" });
      load();
    } catch (err) {
      toast({ type: "error", text: err.message });
    }
  }

  async function remove(s) {
    if (!confirm(`¿Borrar "${s.title}"?`)) return;
    try {
      await api(`snippets/${s.id}`, { method: "DELETE" });
      setItems((l) => l.filter((x) => x.id !== s.id));
    } catch (err) {
      toast({ type: "error", text: err.message });
    }
  }

  async function copy(s) {
    if (await copyText(s.body)) {
      toast({ text: "Copiado" });
      setItems((l) => l.map((x) => (x.id === s.id ? { ...x, uses: (x.uses || 0) + 1 } : x)));
      api(`snippets/${s.id}`, { method: "PATCH", body: { copied: true } }).catch(() => {});
    }
  }

  return (
    <div className="mk-marca-stack">
      <div className="adm-toolbar">
        <input className="adm-search" placeholder="Buscar frases…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setForm({ ...EMPTY, kind: kind || "cta" })}>
          + Nueva frase
        </button>
      </div>
      <div className="mk-marca-chips">
        <button className={`mk-marca-chip${!kind ? " is-active" : ""}`} onClick={() => setKind("")}>
          Todas
        </button>
        {SNIPPET_KINDS.map((k) => (
          <button key={k.id} className={`mk-marca-chip${kind === k.id ? " is-active" : ""}`} onClick={() => setKind(kind === k.id ? "" : k.id)}>
            {k.label}
          </button>
        ))}
      </div>

      {form && (
        <form className="adm-card mk-marca-snippet-form" onSubmit={save}>
          <div className="mk-marca-grid3">
            <label className="adm-form-group">
              <span className="adm-label">Tipo</span>
              <select className="adm-select" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                {SNIPPET_KINDS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="adm-form-group">
              <span className="adm-label">Red (opcional)</span>
              <select className="adm-select" value={form.network || ""} onChange={(e) => setForm({ ...form, network: e.target.value })}>
                <option value="">Cualquiera</option>
                {NETWORKS.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="adm-form-group">
              <span className="adm-label">Etiquetas</span>
              <input className="adm-input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </label>
          </div>
          <label className="adm-form-group">
            <span className="adm-label">Título</span>
            <input className="adm-input" required value={form.title} placeholder="Ej. Comentá GUIA" onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <label className="adm-form-group">
            <span className="adm-label">Texto</span>
            <textarea className="adm-textarea mk-marca-ta" rows={4} required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </label>
          <div className="mk-marca-row">
            <button type="submit" className="adm-btn adm-btn-primary adm-btn-sm">
              Guardar
            </button>
            <button type="button" className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setForm(null)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {items === null ? (
        <p className="mk-marca-hint">Cargando…</p>
      ) : items.length === 0 ? (
        <div className="adm-empty">
          <p>No hay frases guardadas{kind ? " de este tipo" : ""}.</p>
        </div>
      ) : (
        <div className="mk-marca-snippets">
          {items.map((s) => (
            <div key={s.id} className="adm-card mk-marca-snippet">
              <div className="mk-marca-snippet-head">
                <span className="adm-badge">{KIND_LABEL[s.kind] || s.kind}</span>
                {s.network && <span className="mk-marca-hint">{networkLabel(s.network)}</span>}
                <strong className="mk-marca-grow">{s.title}</strong>
              </div>
              <p className="mk-marca-snippet-body">{s.body}</p>
              <div className="mk-marca-row">
                <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => copy(s)}>
                  Copiar
                </button>
                <button
                  className="adm-link-btn"
                  onClick={() => setForm({ id: s.id, kind: s.kind, title: s.title, body: s.body, network: s.network || "", tags: (s.tags || []).join(", ") })}
                >
                  Editar
                </button>
                <button className="adm-link-btn mk-marca-danger" onClick={() => remove(s)}>
                  Borrar
                </button>
                <span className="mk-marca-hint mk-marca-push">{s.uses ? `copiada ${s.uses} ${s.uses === 1 ? "vez" : "veces"}` : ""}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BibliotecaTab() {
  const [view, setView] = useState("archivos");
  return (
    <div className="mk-marca-stack">
      <div className="mk-marca-seg">
        <button className={view === "archivos" ? "is-active" : ""} onClick={() => setView("archivos")}>
          Archivos
        </button>
        <button className={view === "frases" ? "is-active" : ""} onClick={() => setView("frases")}>
          Frases guardadas
        </button>
      </div>
      {view === "archivos" ? <Archivos /> : <Frases />}
    </div>
  );
}
