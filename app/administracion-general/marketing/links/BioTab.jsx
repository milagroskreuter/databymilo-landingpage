"use client";
import { useEffect, useState } from "react";
import { api, copyText, fmt } from "./util";

const SOCIALS = [
  { id: "instagram", label: "Instagram" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "threads", label: "Threads" },
  { id: "youtube", label: "YouTube" },
  { id: "tiktok", label: "TikTok" },
];

export default function BioTab({ links, previewKey, onEdit, onPatch, onReorder, onRemove, onSavedSettings, onError }) {
  const [page, setPage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    api("/settings")
      .then((d) => setPage(d.page))
      .catch((err) => onError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bio = (links ?? []).filter((l) => l.in_bio).sort((a, b) => a.bio_order - b.bio_order);

  const move = (idx, dir) => {
    const ids = bio.map((l) => l.id);
    const j = idx + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    onReorder(ids);
  };

  const onDrop = (targetId) => {
    if (!dragId || dragId === targetId) return;
    const ids = bio.map((l) => l.id).filter((id) => id !== dragId);
    ids.splice(ids.indexOf(targetId), 0, dragId);
    setDragId(null);
    onReorder(ids);
  };

  const set = (k, v) => setPage((p) => ({ ...p, [k]: v }));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const d = await api("/settings", { method: "PUT", body: JSON.stringify(page) });
      setPage(d.page);
      onSavedSettings();
    } catch (err) {
      onError(err.message);
    }
    setSaving(false);
  }

  const copy = async (text, key) => {
    await copyText(text);
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? "" : c)), 1800);
  };

  return (
    <div className="mk-links-a-bio">
      <div className="mk-links-a-bio-main">
        <div className="adm-alert adm-alert-info" style={{ lineHeight: 1.6 }}>
          Poné en cada red su link con la red al final, así cada click queda atribuido:
          <div className="mk-links-a-biourls">
            {["instagram", "linkedin", "threads", "youtube"].map((n) => {
              const u = `databymilo.me/links?from=${n}`;
              return (
                <button key={n} type="button" className="mk-links-a-chip" onClick={() => copy(`https://${u}`, n)}>
                  {copied === n ? "Copiado ✓" : u}
                </button>
              );
            })}
          </div>
        </div>

        <section className="adm-card">
          <div className="mk-links-a-card-head">
            <div className="adm-section-title" style={{ margin: 0 }}>
              Botones
            </div>
            <span className="mk-links-a-muted">Arrastrá para ordenar · clicks de los últimos 30 días</span>
          </div>
          {links == null ? (
            <div className="adm-skel" style={{ height: 120 }} />
          ) : bio.length === 0 ? (
            <div className="adm-empty">
              <p>Todavía no hay botones. Creá el primero con “+ Nuevo botón”.</p>
            </div>
          ) : (
            <ul className="mk-links-a-sortable">
              {bio.map((l, i) => (
                <li
                  key={l.id}
                  draggable
                  onDragStart={() => setDragId(l.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(l.id)}
                  onDragEnd={() => setDragId(null)}
                  className={`mk-links-a-sort-item${dragId === l.id ? " is-dragging" : ""}${l.active ? "" : " is-off"}`}
                >
                  <span className="mk-links-a-grip" aria-hidden="true">
                    ⋮⋮
                  </span>
                  <div className="mk-links-a-sort-main">
                    <div className="mk-links-a-sort-title">
                      {l.featured && <span className="mk-links-a-star">✦</span>} {l.title}
                    </div>
                    <div className="mk-links-a-muted">
                      /go/{l.slug} · {fmt(l.clicks_30d)} clicks
                      {!l.active && " · oculto"}
                    </div>
                  </div>
                  <div className="mk-links-a-sort-actions">
                    <button type="button" className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Subir">
                      ↑
                    </button>
                    <button
                      type="button"
                      className="adm-btn adm-btn-sm adm-btn-secondary"
                      onClick={() => move(i, 1)}
                      disabled={i === bio.length - 1}
                      aria-label="Bajar"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="adm-btn adm-btn-sm adm-btn-secondary"
                      onClick={() => onPatch(l, { featured: !l.featured })}
                      title={l.featured ? "Quitar destacado" : "Destacar"}
                    >
                      {l.featured ? "★" : "☆"}
                    </button>
                    <button
                      type="button"
                      className="adm-btn adm-btn-sm adm-btn-secondary"
                      onClick={() => onPatch(l, { active: !l.active })}
                    >
                      {l.active ? "Ocultar" : "Mostrar"}
                    </button>
                    <button type="button" className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => onEdit(l)}>
                      Editar
                    </button>
                    <button type="button" className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => onPatch(l, { in_bio: false }, "Botón sacado de /links (el link corto sigue andando)")}>
                      Sacar
                    </button>
                    <button type="button" className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => onRemove(l)} aria-label="Borrar">
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <form className="adm-card" onSubmit={save}>
          <div className="adm-section-title" style={{ marginTop: 0 }}>
            Perfil
          </div>
          {!page ? (
            <div className="adm-skel" style={{ height: 160 }} />
          ) : (
            <>
              <div className="mk-links-a-grid2">
                <div>
                  <label className="adm-label">Nombre</label>
                  <input className="adm-input" maxLength={60} value={page.name || ""} onChange={(e) => set("name", e.target.value)} />
                </div>
                <div>
                  <label className="adm-label">Usuario</label>
                  <input className="adm-input" maxLength={60} value={page.handle || ""} onChange={(e) => set("handle", e.target.value)} />
                </div>
              </div>
              <label className="adm-label">Bio corta</label>
              <textarea className="adm-textarea" rows={3} maxLength={300} value={page.bio || ""} onChange={(e) => set("bio", e.target.value)} />
              <label className="adm-label">Foto (URL o ruta del sitio)</label>
              <input
                className="adm-input"
                maxLength={500}
                placeholder="/milo-foto.webp"
                value={page.photo_url || ""}
                onChange={(e) => set("photo_url", e.target.value)}
              />
              <div className="adm-mini-label" style={{ margin: "6px 0 8px" }}>
                Íconos de redes (abajo de los botones)
              </div>
              <div className="mk-links-a-grid2">
                {SOCIALS.map((s) => (
                  <div key={s.id}>
                    <label className="adm-label">{s.label}</label>
                    <input
                      className="adm-input"
                      placeholder="https://…"
                      value={page.socials?.[s.id] || ""}
                      onChange={(e) => set("socials", { ...(page.socials || {}), [s.id]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <label className="adm-label">Texto al pie (opcional)</label>
              <input className="adm-input" maxLength={120} value={page.footer || ""} onChange={(e) => set("footer", e.target.value)} />
              <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>
                {saving ? "Guardando…" : "Guardar perfil"}
              </button>
            </>
          )}
        </form>
      </div>

      <aside className="mk-links-a-phone-wrap">
        <div className="adm-mini-label" style={{ marginBottom: 8 }}>
          Maqueta en celular
        </div>
        <div className="mk-links-a-phone">
          <div className="mk-links-a-mock">
            {page?.photo_url ? <img src={page.photo_url} alt="" /> : null}
            <strong>{page?.name}</strong>
            <span>{page?.handle}</span>
            <p>{page?.bio}</p>
            {bio.filter((l) => l.active).map((l) => (
              <div key={l.id} className={`mk-links-a-mock-btn${l.featured ? " is-featured" : ""}`}>
                {l.title}
              </div>
            ))}
          </div>
        </div>
        <p className="mk-links-a-muted" style={{ marginTop: 8 }}>
          Maqueta simple de la página. Para verla de verdad, usá “Ver /links”.
        </p>
      </aside>
    </div>
  );
}
