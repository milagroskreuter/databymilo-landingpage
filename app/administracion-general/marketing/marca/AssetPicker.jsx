"use client";
import { useEffect, useRef, useState } from "react";
import { api, uploadAsset } from "./api";
import { useToast } from "../../AdminToast";

/** Carga archivos de la biblioteca por id (con URL firmada). */
export function useAssets(ids) {
  const key = (ids || []).join(",");
  const [assets, setAssets] = useState([]);
  useEffect(() => {
    if (!key) {
      setAssets([]);
      return;
    }
    let alive = true;
    api(`assets?ids=${encodeURIComponent(key)}`)
      .then((d) => {
        if (!alive) return;
        const byId = Object.fromEntries(d.assets.map((a) => [a.id, a]));
        setAssets(key.split(",").map((id) => byId[id]).filter(Boolean));
      })
      .catch(() => alive && setAssets([]));
    return () => {
      alive = false;
    };
  }, [key]);
  return { assets, setAssets };
}

/** Modal para elegir una imagen de la biblioteca o subir una nueva. */
export default function AssetPicker({ title = "Elegí una imagen", onPick, onClose, uploadTags = [], multiple = false }) {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [assets, setAssets] = useState(null);
  const [selected, setSelected] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => {
      api(`assets?type=image&limit=120${q ? `&q=${encodeURIComponent(q)}` : ""}`)
        .then((d) => setAssets(d.assets))
        .catch((e) => {
          setAssets([]);
          toast({ type: "error", text: e.message });
        });
    }, 250);
    return () => clearTimeout(t);
  }, [q, toast]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onFiles(files) {
    setUploading(true);
    try {
      const up = [];
      for (const f of files) up.push(await uploadAsset(f, uploadTags));
      if (!multiple) return onPick(up[0]);
      setAssets((a) => [...up, ...(a || [])]);
      setSelected((s) => [...s, ...up]);
    } catch (e) {
      toast({ type: "error", text: e.message });
    } finally {
      setUploading(false);
    }
  }

  function toggle(a) {
    if (!multiple) return onPick(a);
    setSelected((s) => (s.some((x) => x.id === a.id) ? s.filter((x) => x.id !== a.id) : [...s, a]));
  }

  return (
    <div className="mk-marca-modal-bg" onClick={onClose}>
      <div className="mk-marca-modal" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="mk-marca-modal-head">
          <h3 className="mk-marca-h2">{title}</h3>
          <button className="adm-link-btn" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="adm-toolbar">
          <input className="adm-search" placeholder="Buscar por nombre o etiqueta…" value={q} onChange={(e) => setQ(e.target.value)} />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            hidden
            onChange={(e) => e.target.files?.length && onFiles([...e.target.files])}
          />
          <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? "Subiendo…" : "Subir imagen"}
          </button>
        </div>
        <div className="mk-marca-picker-grid">
          {assets === null ? (
            <p className="mk-marca-hint">Cargando…</p>
          ) : assets.length === 0 ? (
            <p className="mk-marca-hint">No hay imágenes. Subí una.</p>
          ) : (
            assets.map((a) => (
              <button
                key={a.id}
                className={`mk-marca-picker-item${selected.some((x) => x.id === a.id) ? " is-selected" : ""}`}
                onClick={() => toggle(a)}
                title={a.name}
              >
                {a.url && <img src={a.url} alt={a.name} loading="lazy" />}
              </button>
            ))
          )}
        </div>
        {multiple && (
          <div className="mk-marca-modal-foot">
            <button className="adm-btn adm-btn-primary" disabled={!selected.length} onClick={() => onPick(selected)}>
              Usar {selected.length || ""} {selected.length === 1 ? "imagen" : "imágenes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
