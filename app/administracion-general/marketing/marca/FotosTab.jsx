"use client";
import { useState } from "react";
import { useToast } from "../../AdminToast";
import { api } from "./api";

export default function FotosTab() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [orientation, setOrientation] = useState("portrait");
  const [state, setState] = useState({ results: [], page: 0, totalPages: 0, configured: true, searched: false });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});
  const [tags, setTags] = useState("");

  async function search(page = 1) {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const d = await api(`unsplash?q=${encodeURIComponent(q.trim())}&page=${page}&orientation=${orientation}`);
      setState((s) => ({
        configured: d.configured,
        searched: true,
        page,
        totalPages: d.totalPages || 0,
        results: page === 1 ? d.results || [] : [...s.results, ...(d.results || [])],
      }));
    } catch (e) {
      toast({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  }

  async function save(photo) {
    setSaving((s) => ({ ...s, [photo.id]: true }));
    try {
      await api("unsplash/save", { method: "POST", body: { id: photo.id, tags: tags.split(",").map((t) => t.trim()).filter(Boolean) } });
      setSaved((s) => ({ ...s, [photo.id]: true }));
      toast({ text: "Foto guardada en la biblioteca" });
    } catch (e) {
      toast({ type: "error", text: e.message });
    } finally {
      setSaving((s) => ({ ...s, [photo.id]: false }));
    }
  }

  if (!state.configured) {
    return (
      <div className="adm-card mk-marca-section mk-marca-setup">
        <h2 className="mk-marca-h2">Conectar Unsplash</h2>
        <ol>
          <li>
            Entrá a <a href="https://unsplash.com/oauth/applications" target="_blank" rel="noopener noreferrer">unsplash.com/oauth/applications</a> y creá una
            aplicación nueva (aceptá las guías de la API).
          </li>
          <li>Copiá el <strong>Access Key</strong>.</li>
          <li>
            En Vercel (proyecto <code>databymilo-landingpage</code>) agregá la variable <code>UNSPLASH_ACCESS_KEY</code> con esa clave. Opcional:{" "}
            <code>UNSPLASH_APP_NAME</code> con el nombre de la app (se usa en los links de atribución).
          </li>
          <li>Volvé a deployar. En modo demo Unsplash permite 50 búsquedas por hora; para más, pedí el modo producción desde la misma página.</li>
        </ol>
      </div>
    );
  }

  return (
    <div className="mk-marca-stack">
      <form
        className="adm-toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          search(1);
        }}
      >
        <input className="adm-search" placeholder="Buscar fotos en Unsplash (en inglés da más resultados: laptop, coffee, notebook…)" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="adm-select mk-marca-auto" value={orientation} onChange={(e) => setOrientation(e.target.value)}>
          <option value="portrait">Vertical</option>
          <option value="squarish">Cuadrada</option>
          <option value="landscape">Horizontal</option>
        </select>
        <button className="adm-btn adm-btn-primary adm-btn-sm" type="submit" disabled={loading || !q.trim()}>
          {loading ? "Buscando…" : "Buscar"}
        </button>
      </form>
      <input className="adm-input" placeholder="Etiquetas para las fotos que guardes (opcional, separadas por coma)" value={tags} onChange={(e) => setTags(e.target.value)} />

      {state.searched && state.results.length === 0 && !loading && (
        <div className="adm-empty">
          <p>No encontré fotos para esa búsqueda.</p>
        </div>
      )}

      <div className="mk-marca-photos">
        {state.results.map((p) => (
          <figure key={p.id} className="mk-marca-photo" style={{ background: p.color || "#eee" }}>
            <img src={p.thumb} alt={p.alt} loading="lazy" />
            <figcaption>
              <span className="mk-marca-attrib">
                Foto de{" "}
                <a href={p.authorUrl} target="_blank" rel="noopener noreferrer">
                  {p.author}
                </a>{" "}
                en{" "}
                <a href={p.unsplashUrl} target="_blank" rel="noopener noreferrer">
                  Unsplash
                </a>
              </span>
              <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => save(p)} disabled={saving[p.id] || saved[p.id]}>
                {saved[p.id] ? "Guardada ✓" : saving[p.id] ? "Guardando…" : "Guardar"}
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
      {state.page > 0 && state.page < state.totalPages && (
        <button className="adm-btn adm-btn-secondary" onClick={() => search(state.page + 1)} disabled={loading}>
          {loading ? "Cargando…" : "Más resultados"}
        </button>
      )}
      <p className="mk-marca-hint">
        Las fotos se guardan con el crédito del autor. Cuando las publiques, poné &quot;Foto de [autor] en Unsplash&quot; si la red lo permite (no es obligatorio
        pero es lo que pide Unsplash como buena práctica).
      </p>
    </div>
  );
}
