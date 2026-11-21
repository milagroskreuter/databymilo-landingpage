"use client";
// Editor de una pieza de contenido (modal). Sirve para crear y para editar.
import { useEffect, useRef, useState } from "react";
import { NETWORKS, STATUSES, FORMATS, NETWORK_BY_ID, STATUS_BY_ID, FORMAT_BY_ID } from "@/lib/marketing/constants";
import { arDateKey, arTime, arToISO } from "@/lib/marketing/content/dates";
import { useToast } from "../../AdminToast";
import { api } from "./api";
import { Stars } from "./shared";

function toForm(piece) {
  const p = piece || {};
  return {
    title: p.title || "",
    status: p.status || "idea",
    network: p.network || "",
    format: p.format || "",
    pillar_id: p.pillar_id || "",
    series_id: p.series_id || "",
    date: p.scheduled_at ? arDateKey(p.scheduled_at) : p.date || "",
    time: p.scheduled_at ? arTime(p.scheduled_at) : p.time || "10:00",
    hook: p.hook || "",
    script: p.script || "",
    caption: p.caption || "",
    cta: p.cta || "",
    notes: p.notes || "",
    tags: (p.tags || []).join(", "),
    permalink: p.permalink || "",
    score: p.score ?? null,
  };
}

// Redes para las que se arma una versión propia de cada idea (Facebook y Threads usan la de Instagram).
const VERSION_NETWORKS = ["instagram", "linkedin"];

/** Formato equivalente en la otra red (un reel en LinkedIn se sube como video). */
function formatFor(network, format) {
  if (network === "linkedin" && (format === "reel" || format === "short")) return "video";
  if (network === "instagram" && (format === "video" || format === "articulo")) return "reel";
  return format || null;
}

function fromForm(f) {
  return {
    title: f.title,
    status: f.status,
    network: f.network || null,
    format: f.format || null,
    pillar_id: f.pillar_id || null,
    series_id: f.series_id || null,
    scheduled_at: f.date ? arToISO(f.date, f.time) : null,
    hook: f.hook,
    script: f.script,
    caption: f.caption,
    cta: f.cta,
    notes: f.notes,
    tags: f.tags,
    permalink: f.permalink,
    score: f.score,
  };
}

/**
 * piece: fila de mk_content (con id) o valores iniciales para una nueva
 * (puede traer `date` "YYYY-MM-DD" y `time`).
 */
export default function PieceEditor({ piece, pillars = [], series = [], onClose, onSaved, onDeleted }) {
  const toast = useToast();
  const isNew = !piece?.id;
  const [form, setForm] = useState(() => toForm(piece));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const titleRef = useRef(null);
  const groupId = piece?.variant_of || piece?.id || null;
  const [versions, setVersions] = useState([]);

  useEffect(() => {
    if (!groupId) return;
    let alive = true;
    api
      .listContent({ group: groupId })
      .then((items) => alive && setVersions(items.filter((v) => v.id !== piece.id)))
      .catch(() => alive && setVersions([]));
    return () => {
      alive = false;
    };
  }, [groupId, piece?.id]);

  useEffect(() => {
    if (isNew) titleRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isNew, onClose]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  async function save(e) {
    e?.preventDefault();
    setError("");
    if (!form.title.trim()) {
      setError("Poné un título");
      return;
    }
    if (form.status === "programado" && !form.date) {
      setError("Para marcarla como programada ponele fecha");
      return;
    }
    setSaving(true);
    try {
      const data = fromForm(form);
      const item = isNew
        ? await api.createContent({ ...data, source: piece?.source || "manual" })
        : await api.updateContent(piece.id, data);
      toast?.({ text: isNew ? "Pieza creada" : "Cambios guardados" });
      onSaved?.(item);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`¿Borrar "${piece.title}"? No se puede deshacer. Si solo no la vas a hacer, mejor marcala como descartada.`)) return;
    setSaving(true);
    try {
      await api.deleteContent(piece.id);
      toast?.({ text: "Pieza borrada" });
      onDeleted?.(piece.id);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function createVersion(network) {
    setSaving(true);
    setError("");
    try {
      const base = fromForm(form);
      const label = NETWORK_BY_ID[network]?.label || network;
      const item = await api.createContent({
        ...base,
        network,
        format: formatFor(network, base.format),
        caption: "",
        status: base.status === "publicado" ? "idea" : base.status,
        notes: [`Versión para ${label} de “${base.title}”: adaptá el texto a esta red.`, base.notes].filter(Boolean).join("\n\n"),
        variant_of: groupId,
        source: "repurpose",
      });
      toast?.({ text: `Versión para ${label} creada` });
      onSaved?.(item);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function discard() {
    setSaving(true);
    try {
      const item = await api.updateContent(piece.id, { status: "descartado" });
      toast?.({ text: "Pieza descartada" });
      onSaved?.(item);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const activePillars = pillars.filter((p) => p.active !== false || p.id === form.pillar_id);

  return (
    <div className="mk-cal-modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <form className="mk-cal-modal" onSubmit={save} role="dialog" aria-modal="true" aria-label={isNew ? "Nueva pieza" : "Editar pieza"}>
        <div className="mk-cal-modal-head">
          <h2>{isNew ? "Nueva pieza" : "Editar pieza"}</h2>
          <button type="button" className="mk-cal-x" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="mk-cal-modal-body">
          <label className="mk-cal-field mk-cal-span-2">
            <span className="adm-label">Título</span>
            <input ref={titleRef} className="adm-input" value={form.title} onChange={set("title")} maxLength={200} placeholder="De qué trata la pieza" />
          </label>

          <div className="mk-cal-grid-3">
            <label className="mk-cal-field">
              <span className="adm-label">Estado</span>
              <select className="adm-select" value={form.status} onChange={set("status")}>
                {STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mk-cal-field">
              <span className="adm-label">Red</span>
              <select className="adm-select" value={form.network} onChange={set("network")}>
                <option value="">—</option>
                {NETWORKS.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mk-cal-field">
              <span className="adm-label">Formato</span>
              <select className="adm-select" value={form.format} onChange={set("format")}>
                <option value="">—</option>
                {FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mk-cal-field">
              <span className="adm-label">Pilar</span>
              <select className="adm-select" value={form.pillar_id} onChange={set("pillar_id")}>
                <option value="">—</option>
                {activePillars.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="mk-cal-field">
              <span className="adm-label">Serie</span>
              <select className="adm-select" value={form.series_id} onChange={set("series_id")}>
                <option value="">—</option>
                {series.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="mk-cal-field">
              <span className="adm-label">Puntaje</span>
              <Stars value={form.score} onChange={set("score")} />
            </div>
            <label className="mk-cal-field">
              <span className="adm-label">Fecha</span>
              <input type="date" className="adm-input" value={form.date} onChange={set("date")} />
            </label>
            <label className="mk-cal-field">
              <span className="adm-label">Hora (AR)</span>
              <input type="time" className="adm-input" value={form.time} onChange={set("time")} disabled={!form.date} />
            </label>
            <div className="mk-cal-field mk-cal-field-end">
              {form.date && (
                <button type="button" className="adm-link-btn" onClick={() => setForm((f) => ({ ...f, date: "" }))}>
                  Quitar fecha
                </button>
              )}
            </div>
          </div>

          <label className="mk-cal-field">
            <span className="adm-label">Gancho</span>
            <textarea className="adm-textarea mk-cal-ta-sm" value={form.hook} onChange={set("hook")} placeholder="La primera línea o los primeros 3 segundos" />
          </label>
          <label className="mk-cal-field">
            <span className="adm-label">Guion</span>
            <textarea className="adm-textarea" value={form.script} onChange={set("script")} />
          </label>
          <label className="mk-cal-field">
            <span className="adm-label">Caption</span>
            <textarea className="adm-textarea" value={form.caption} onChange={set("caption")} />
          </label>
          <div className="mk-cal-grid-2">
            <label className="mk-cal-field">
              <span className="adm-label">CTA</span>
              <input className="adm-input" value={form.cta} onChange={set("cta")} placeholder="Ej.: comentá DATOS y te paso el ebook" />
            </label>
            <label className="mk-cal-field">
              <span className="adm-label">Etiquetas</span>
              <input className="adm-input" value={form.tags} onChange={set("tags")} placeholder="excel, power-bi" />
            </label>
          </div>
          <label className="mk-cal-field">
            <span className="adm-label">Notas</span>
            <textarea className="adm-textarea mk-cal-ta-sm" value={form.notes} onChange={set("notes")} />
          </label>
          <label className="mk-cal-field">
            <span className="adm-label">Permalink (link a la publicación)</span>
            <input className="adm-input" type="url" value={form.permalink} onChange={set("permalink")} placeholder="https://" />
          </label>

          {!isNew && (VERSION_NETWORKS.includes(form.network) || versions.length > 0) && (
            <div className="mk-cal-versions">
              <span className="adm-label">Versiones por red</span>
              {versions.length > 0 ? (
                <ul>
                  {versions.map((v) => (
                    <li key={v.id}>
                      <strong>{NETWORK_BY_ID[v.network]?.label || "Sin red"}</strong>
                      {v.format ? ` · ${FORMAT_BY_ID[v.format]?.label || v.format}` : ""}
                      {` · ${STATUS_BY_ID[v.status]?.label || v.status}`}
                      {v.scheduled_at ? ` · ${new Date(v.scheduled_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", timeZone: "America/Argentina/Buenos_Aires" })}` : " · sin fecha"}
                      {v.id === piece.variant_of ? " (original)" : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mk-cal-meta">Todavía no tiene versión para otra red.</p>
              )}
              <div className="mk-cal-versions-add">
                {VERSION_NETWORKS.filter((n) => n !== form.network && !versions.some((v) => v.network === n)).map((n) => (
                  <button key={n} type="button" className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => createVersion(n)} disabled={saving}>
                    + Versión para {NETWORK_BY_ID[n].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isNew && (
            <p className="mk-cal-meta">
              Origen: {piece.source || "manual"}
              {piece.published_at ? ` · Publicada el ${new Date(piece.published_at).toLocaleDateString("es-AR")}` : ""}
              {piece.created_at ? ` · Creada el ${new Date(piece.created_at).toLocaleDateString("es-AR")}` : ""}
            </p>
          )}
          {error && <div className="adm-alert adm-alert-error">{error}</div>}
        </div>

        <div className="mk-cal-modal-foot">
          {!isNew && (
            <>
              <button type="button" className="adm-btn adm-btn-danger adm-btn-sm" onClick={remove} disabled={saving}>
                Borrar
              </button>
              {piece.status !== "descartado" && (
                <button type="button" className="adm-btn adm-btn-secondary adm-btn-sm" onClick={discard} disabled={saving}>
                  Descartar
                </button>
              )}
            </>
          )}
          <span className="mk-cal-grow" />
          <button type="button" className="adm-btn adm-btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>
            {saving ? "Guardando…" : isNew ? "Crear pieza" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
