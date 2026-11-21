"use client";
import { useEffect, useState } from "react";

const today = () => new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10); // día en Argentina
const blankPost = () => ({ url: "", posted_day: today(), title: "", impressions: "", likes: "", comments: "", shares: "" });

// Ventana para cargar a mano las métricas de LinkedIn cuando no se puede exportar el archivo.
export default function LinkedinManual({ onClose, onSave, busy }) {
  const [day, setDay] = useState(today());
  const [followers, setFollowers] = useState("");
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const setPost = (i, patch) => setPosts((list) => list.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (followers === "" && !posts.length) {
      setError("Cargá los seguidores o al menos una publicación.");
      return;
    }
    try {
      await onSave({ day, followers: followers === "" ? null : followers, posts });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mk-metricas-modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="mk-metricas-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-label="Cargar LinkedIn a mano">
        <div className="mk-metricas-modal-head">
          <h2>Cargar LinkedIn a mano</h2>
          <button type="button" className="mk-metricas-modal-x" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <p className="mk-metricas-hint">
          Copiá los números de <strong>Rendimiento</strong> en LinkedIn. Alcanza con una vez por semana. Si cargás el mismo día o la misma
          publicación otra vez, se actualiza sin duplicar.
        </p>

        <fieldset className="mk-metricas-modal-box">
          <legend>Seguidores</legend>
          <div className="mk-metricas-modal-row">
            <label>
              Total de seguidores
              <input className="adm-input" type="number" min="0" inputMode="numeric" placeholder="Ej. 1627" value={followers} onChange={(e) => setFollowers(e.target.value)} autoFocus />
            </label>
            <label>
              Al día
              <input className="adm-input" type="date" max={today()} value={day} onChange={(e) => setDay(e.target.value)} />
            </label>
          </div>
        </fieldset>

        <fieldset className="mk-metricas-modal-box">
          <legend>Publicaciones (opcional)</legend>
          {posts.length === 0 && (
            <p className="mk-metricas-hint">
              Para ver el rendimiento de cada publicación y cruzarla con tu calendario, agregá su link y sus números (los ves al tocar “Ver
              estadísticas” en la publicación).
            </p>
          )}
          {posts.map((p, i) => (
            <div className="mk-metricas-modal-post" key={i}>
              <div className="mk-metricas-modal-row">
                <label className="grow">
                  Link de la publicación
                  <input className="adm-input" type="url" placeholder="https://www.linkedin.com/posts/…" value={p.url} onChange={(e) => setPost(i, { url: e.target.value })} />
                </label>
                <label>
                  Publicada el
                  <input className="adm-input" type="date" max={today()} value={p.posted_day} onChange={(e) => setPost(i, { posted_day: e.target.value })} />
                </label>
              </div>
              <label>
                Título o primera línea (opcional)
                <input className="adm-input" maxLength={200} value={p.title} onChange={(e) => setPost(i, { title: e.target.value })} />
              </label>
              <div className="mk-metricas-modal-row">
                {[
                  ["impressions", "Impresiones"],
                  ["likes", "Reacciones"],
                  ["comments", "Comentarios"],
                  ["shares", "Compartidos"],
                ].map(([k, label]) => (
                  <label key={k}>
                    {label}
                    <input className="adm-input" type="number" min="0" inputMode="numeric" value={p[k]} onChange={(e) => setPost(i, { [k]: e.target.value })} />
                  </label>
                ))}
              </div>
              <button type="button" className="mk-metricas-link" onClick={() => setPosts((l) => l.filter((_, j) => j !== i))}>
                Quitar esta publicación
              </button>
            </div>
          ))}
          <button type="button" className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => setPosts((l) => [...l, blankPost()])} disabled={posts.length >= 50}>
            + Agregar publicación
          </button>
        </fieldset>

        {error && <div className="adm-alert adm-alert-error">{error}</div>}

        <div className="mk-metricas-modal-foot">
          <button type="button" className="adm-btn adm-btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="adm-btn adm-btn-primary" disabled={busy}>{busy ? "Guardando…" : "Guardar"}</button>
        </div>
      </form>
    </div>
  );
}
