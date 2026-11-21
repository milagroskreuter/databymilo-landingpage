"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, fitImage, fmtDate } from "./api";

const FILTERS = [
  { id: "pending", label: "Pendientes" },
  { id: "approved", label: "Aprobados" },
  { id: "rejected", label: "Rechazados" },
  { id: "all", label: "Todos" },
];
const STATUS_BADGE = {
  pending: { label: "Pendiente", cls: "mk-comunidad-badge-pending" },
  approved: { label: "Aprobado", cls: "adm-badge-active" },
  rejected: { label: "Rechazado", cls: "adm-badge-inactive" },
};

export default function TestimoniosTab({ summary, onChange }) {
  const [filter, setFilter] = useState(null);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [showNew, setShowNew] = useState(false);

  // Arranca en "Pendientes" si hay alguno; si no, en "Aprobados".
  useEffect(() => {
    if (filter === null && summary) setFilter(summary.pendingTestimonials > 0 ? "pending" : "approved");
  }, [summary, filter]);

  const load = useCallback(async () => {
    if (!filter) return;
    setLoading(true);
    try {
      const data = await api(`/testimonials?status=${filter}`);
      setItems(data.items);
      setProducts(data.products);
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  // Si no llega el resumen (error), igual mostrar algo.
  useEffect(() => {
    const t = setTimeout(() => setFilter((f) => f ?? "pending"), 1500);
    return () => clearTimeout(t);
  }, []);

  async function patch(id, body, okText) {
    setMsg(null);
    try {
      const { item } = await api(`/testimonials/${id}`, { method: "PATCH", body });
      const stillVisible = filter === "all" || item.status === filter;
      setItems((list) => (stillVisible ? list.map((x) => (x.id === id ? item : x)) : list.filter((x) => x.id !== id)));
      if (okText) setMsg({ type: "success", text: okText });
      onChange?.();
      return true;
    } catch (err) {
      setMsg({ type: "error", text: err.message });
      return false;
    }
  }

  async function remove(t) {
    if (!confirm(`¿Eliminar el testimonio de ${t.name}? No se puede deshacer.`)) return;
    try {
      await api(`/testimonials/${t.id}`, { method: "DELETE" });
      setItems((list) => list.filter((x) => x.id !== t.id));
      onChange?.();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
  }

  return (
    <div className="mk-comunidad-panel">
      <div className="mk-comunidad-toolbar">
        <div className="mk-comunidad-filters">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`mk-comunidad-chip${filter === f.id ? " is-on" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              {f.id === "pending" && summary?.pendingTestimonials > 0 ? ` · ${summary.pendingTestimonials}` : ""}
            </button>
          ))}
        </div>
        <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setShowNew((v) => !v)}>
          {showNew ? "Cerrar" : "+ Cargar a mano"}
        </button>
      </div>

      {msg && <div className={`adm-alert adm-alert-${msg.type}`}>{msg.text}</div>}

      {showNew && (
        <NewTestimonial
          products={products}
          onCreated={(item) => {
            setShowNew(false);
            setMsg({ type: "success", text: `Testimonio de ${item.name} guardado` });
            if (filter === "all" || filter === item.status) setItems((l) => [item, ...l]);
            onChange?.();
          }}
        />
      )}

      {loading ? (
        <div className="adm-card mk-comunidad-loading">Cargando…</div>
      ) : items.length === 0 ? (
        <div className="adm-card adm-empty">
          {filter === "pending"
            ? "No hay testimonios pendientes. Compartí el link del formulario para recibir más."
            : "Todavía no hay testimonios acá."}
        </div>
      ) : (
        <div className="mk-comunidad-list">
          {items.map((t) => (
            <TestimonialCard key={t.id} t={t} products={products} onPatch={patch} onRemove={remove} />
          ))}
        </div>
      )}
    </div>
  );
}

function TestimonialCard({ t, products, onPatch, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(t);
  const [showOriginal, setShowOriginal] = useState(false);
  const [busy, setBusy] = useState(false);
  const edited = t.text !== t.original_text;
  const badge = STATUS_BADGE[t.status];

  async function run(body, okText) {
    setBusy(true);
    const ok = await onPatch(t.id, body, okText);
    setBusy(false);
    return ok;
  }

  async function save() {
    const ok = await run(
      { text: draft.text, name: draft.name, relation: draft.relation || "", social_url: draft.social_url || "" },
      "Cambios guardados"
    );
    if (ok) setEditing(false);
  }

  function toggleProduct(slug) {
    const next = t.products.includes(slug) ? t.products.filter((s) => s !== slug) : [...t.products, slug];
    run({ products: next });
  }

  return (
    <article className={`adm-card mk-comunidad-tcard${t.featured ? " is-featured" : ""}`}>
      <div className="mk-comunidad-avatar">
        {t.photo_url ? <img src={t.photo_url} alt={t.name} /> : <span>{t.name.slice(0, 1).toUpperCase()}</span>}
      </div>

      <div className="mk-comunidad-tbody">
        <div className="mk-comunidad-thead">
          <div>
            {editing ? (
              <div className="mk-comunidad-edit-row">
                <input className="adm-input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Nombre" />
                <input className="adm-input" value={draft.relation || ""} onChange={(e) => setDraft({ ...draft, relation: e.target.value })} placeholder="Cómo te conoció / qué compró" />
              </div>
            ) : (
              <>
                <div className="mk-comunidad-tname">
                  {t.name}
                  {t.featured && <span className="mk-comunidad-star" title="Destacado">★</span>}
                </div>
                {t.relation && <div className="mk-comunidad-trel">{t.relation}</div>}
              </>
            )}
          </div>
          <div className="mk-comunidad-tside">
            {badge && <span className={`adm-badge ${badge.cls}`}>{badge.label}</span>}
            <span className="mk-comunidad-date">
              {fmtDate(t.created_at)}
              {t.source === "manual" ? " · a mano" : ""}
            </span>
          </div>
        </div>

        {editing ? (
          <>
            <textarea className="adm-textarea" value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} rows={5} />
            <input className="adm-input" value={draft.social_url || ""} onChange={(e) => setDraft({ ...draft, social_url: e.target.value })} placeholder="Link a su red (opcional)" />
            <p className="mk-comunidad-hint">El texto original queda guardado: siempre lo podés restaurar.</p>
          </>
        ) : (
          <blockquote className="mk-comunidad-quote">{t.text}</blockquote>
        )}

        {edited && !editing && (
          <div className="mk-comunidad-original">
            <button type="button" className="adm-link-btn" onClick={() => setShowOriginal((v) => !v)}>
              {showOriginal ? "Ocultar original" : "Editado · ver original"}
            </button>
            {showOriginal && (
              <>
                <blockquote className="mk-comunidad-quote is-original">{t.original_text}</blockquote>
                <button type="button" className="adm-link-btn" disabled={busy} onClick={() => run({ restoreOriginal: true }, "Texto original restaurado")}>
                  Restaurar el original
                </button>
              </>
            )}
          </div>
        )}

        {t.social_url && !editing && (
          <a className="mk-comunidad-social" href={t.social_url} target="_blank" rel="noreferrer noopener">
            {t.social_url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")} ↗
          </a>
        )}

        {products.length > 0 && (
          <div className="mk-comunidad-prods">
            <span className="mk-comunidad-mini">Producto</span>
            {products.map((p) => (
              <button
                key={p.slug}
                type="button"
                disabled={busy}
                className={`mk-comunidad-tag is-toggle${t.products.includes(p.slug) ? " is-on" : ""}`}
                onClick={() => toggleProduct(p.slug)}
                title={p.is_paid ? "Pago" : "Gratuito"}
              >
                {p.title}
              </button>
            ))}
          </div>
        )}

        <div className="mk-comunidad-actions">
          {editing ? (
            <>
              <button className="adm-btn adm-btn-primary adm-btn-sm" disabled={busy} onClick={save}>Guardar</button>
              <button className="adm-btn adm-btn-secondary adm-btn-sm" disabled={busy} onClick={() => { setDraft(t); setEditing(false); }}>Cancelar</button>
            </>
          ) : (
            <>
              {t.status !== "approved" && (
                <button className="adm-btn adm-btn-primary adm-btn-sm" disabled={busy} onClick={() => run({ status: "approved" }, `Aprobado: ya puede mostrarse en el sitio`)}>
                  Aprobar
                </button>
              )}
              {t.status === "approved" && (
                <button className="adm-btn adm-btn-secondary adm-btn-sm" disabled={busy} onClick={() => run({ featured: !t.featured })}>
                  {t.featured ? "★ Quitar destacado" : "☆ Destacar"}
                </button>
              )}
              {t.status !== "rejected" && (
                <button className="adm-btn adm-btn-secondary adm-btn-sm" disabled={busy} onClick={() => run({ status: "rejected" }, "Rechazado")}>
                  Rechazar
                </button>
              )}
              {t.status !== "pending" && (
                <button className="adm-link-btn" disabled={busy} onClick={() => run({ status: "pending" })}>Volver a pendiente</button>
              )}
              <span className="mk-comunidad-spacer" />
              <button className="adm-link-btn" onClick={() => { setDraft(t); setEditing(true); }}>Editar</button>
              {t.photo_url && (
                <button className="adm-link-btn" disabled={busy} onClick={() => confirm("¿Quitar la foto?") && run({ removePhoto: true }, "Foto quitada")}>
                  Quitar foto
                </button>
              )}
              <button className="adm-link-btn mk-comunidad-danger" onClick={() => onRemove(t)}>Eliminar</button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function NewTestimonial({ products, onCreated }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState([]);
  const formRef = useRef(null);

  async function submit(e) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    fd.set("products", picked.join(","));
    fd.set("consent", fd.get("consent") ? "true" : "");
    const photo = fd.get("photo");
    if (photo && photo.size > 0) {
      const fitted = await fitImage(photo, { maxBytes: 2.5 * 1024 * 1024, maxSide: 1200 });
      fd.set("photo", fitted, fitted.name || "foto.jpg");
    }
    setBusy(true);
    try {
      const { item } = await api("/testimonials", { method: "POST", form: fd });
      formRef.current?.reset();
      setPicked([]);
      onCreated(item);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  return (
    <form ref={formRef} className="adm-card mk-comunidad-form" onSubmit={submit}>
      <div className="adm-card-head">
        <span className="adm-card-title">Cargar un testimonio a mano</span>
        <span className="adm-card-hint">Para los que llegan por DM, mail o comentario</span>
      </div>
      <div className="mk-comunidad-grid2">
        <label className="adm-form-group">
          <span className="adm-label">Nombre</span>
          <input name="name" className="adm-input" required maxLength={80} />
        </label>
        <label className="adm-form-group">
          <span className="adm-label">Cómo te conoció / qué compró</span>
          <input name="relation" className="adm-input" maxLength={140} />
        </label>
      </div>
      <label className="adm-form-group">
        <span className="adm-label">Testimonio</span>
        <textarea name="text" className="adm-textarea" required rows={4} />
      </label>
      <div className="mk-comunidad-grid2">
        <label className="adm-form-group">
          <span className="adm-label">Link a su red (opcional)</span>
          <input name="social_url" className="adm-input" />
        </label>
        <label className="adm-form-group">
          <span className="adm-label">Foto (opcional)</span>
          <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="adm-input" />
        </label>
      </div>
      {products.length > 0 && (
        <div className="mk-comunidad-prods">
          <span className="mk-comunidad-mini">Producto</span>
          {products.map((p) => (
            <button
              key={p.slug}
              type="button"
              className={`mk-comunidad-tag is-toggle${picked.includes(p.slug) ? " is-on" : ""}`}
              onClick={() => setPicked((l) => (l.includes(p.slug) ? l.filter((s) => s !== p.slug) : [...l, p.slug]))}
            >
              {p.title}
            </button>
          ))}
        </div>
      )}
      <div className="mk-comunidad-grid2">
        <label className="adm-form-group">
          <span className="adm-label">Estado</span>
          <select name="status" className="adm-select" defaultValue="approved">
            <option value="approved">Aprobado</option>
            <option value="pending">Pendiente</option>
          </select>
        </label>
        <label className="mk-comunidad-check">
          <input type="checkbox" name="consent" />
          <span>La persona me dio permiso para publicarlo</span>
        </label>
      </div>
      {error && <div className="adm-alert adm-alert-error">{error}</div>}
      <div>
        <button className="adm-btn adm-btn-primary" disabled={busy}>{busy ? "Guardando…" : "Guardar testimonio"}</button>
      </div>
    </form>
  );
}
