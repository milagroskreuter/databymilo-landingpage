"use client";
import { useEffect, useMemo, useState } from "react";
import { NETWORKS } from "@/lib/marketing/constants";
import { DEST_TYPES, ICONS, slugify, buildDestination, isInternalUrl, isHotmartUrl, SITE } from "@/lib/marketing/links/shared";
import { api } from "./util";

const BLANK = {
  title: "",
  slug: "",
  dest_type: "url",
  url: "",
  resource_slug: "",
  list_slug: "",
  network: "",
  campaign: "",
  keyword: "",
  content_id: "",
  notes: "",
  icon: "",
  in_bio: false,
  featured: false,
  add_utm: true,
  active: true,
};

export default function LinkForm({ initial, options, campaigns, onCancel, onSaved }) {
  const isNew = !initial.id;
  const [form, setForm] = useState(() => {
    const f = { ...BLANK };
    for (const k of Object.keys(BLANK)) if (initial[k] != null) f[k] = initial[k];
    return f;
  });
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const resource = options.resources.find((r) => r.slug === form.resource_slug) || null;

  const preview = useMemo(() => {
    const slug = form.slug || "tu-link";
    const link = { ...form, slug, campaign: slugify(form.campaign) || null, resource };
    const ok =
      (form.dest_type === "url" && form.url) ||
      ((form.dest_type === "resource" || form.dest_type === "resource_checkout") && form.resource_slug) ||
      (form.dest_type === "list" && form.list_slug);
    if (!ok) return null;
    return buildDestination(link, { network: form.network || null, via: form.in_bio ? "bio" : "direct" });
  }, [form, resource]);

  const destIsSite = preview ? isInternalUrl(preview) : false;
  const destIsHotmart = preview ? isHotmartUrl(preview) : false;

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = { ...form };
      if (isNew) {
        await api("", { method: "POST", body: JSON.stringify(body) });
      } else {
        await api(`/${initial.id}`, { method: "PATCH", body: JSON.stringify(body) });
      }
      onSaved(isNew ? `Listo ✦ databymilo.me/go/${slugify(form.slug || form.title)}` : "Cambios guardados ✓");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const paidResources = options.resources.filter((r) => r.is_paid && r.payment_url);
  const resourceChoices = form.dest_type === "resource_checkout" ? paidResources : options.resources;

  return (
    <div className="mk-links-a-overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <form className="mk-links-a-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-label={isNew ? "Nuevo link" : "Editar link"}>
        <div className="mk-links-a-modal-head">
          <h2>{isNew ? (form.in_bio ? "Nuevo botón de la bio" : "Nuevo link corto") : "Editar link"}</h2>
          <button type="button" className="mk-links-a-x" onClick={onCancel} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="mk-links-a-modal-body">
          <label className="adm-label">Título *</label>
          <input
            className="adm-input"
            required
            maxLength={120}
            autoFocus
            placeholder={form.in_bio ? "Ej: Guía gratis: tu primer análisis" : "Ej: Reel SQL — guía gratis"}
            value={form.title}
            onChange={(e) => {
              const title = e.target.value;
              setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title, 40) }));
            }}
          />

          <label className="adm-label">Destino *</label>
          <div className="mk-links-a-row">
            <select className="adm-input" value={form.dest_type} onChange={(e) => set("dest_type", e.target.value)}>
              {DEST_TYPES.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
            {form.dest_type === "url" && (
              <input
                className="adm-input"
                required
                placeholder="https://… o /blog/mi-nota"
                value={form.url}
                onChange={(e) => set("url", e.target.value)}
              />
            )}
            {(form.dest_type === "resource" || form.dest_type === "resource_checkout") && (
              <select className="adm-input" required value={form.resource_slug} onChange={(e) => set("resource_slug", e.target.value)}>
                <option value="">Elegí un recurso…</option>
                {resourceChoices.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.title} {r.is_paid ? "(pago)" : "(gratis)"}
                  </option>
                ))}
              </select>
            )}
            {form.dest_type === "list" && (
              <select className="adm-input" required value={form.list_slug} onChange={(e) => set("list_slug", e.target.value)}>
                <option value="">Elegí una lista…</option>
                {options.lists.map((l) => (
                  <option key={l.slug} value={l.slug}>
                    {l.name}
                    {l.active === false ? " (cerrada)" : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <label className="adm-label">Link corto</label>
          <div className="mk-links-a-row mk-links-a-slug">
            <span>databymilo.me/go/</span>
            <input
              className="adm-input"
              maxLength={60}
              placeholder="guia-sql"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", slugify(e.target.value));
              }}
            />
          </div>
          {!isNew && initial.slug && form.slug !== initial.slug && (
            <p className="mk-links-a-warn">Ojo: si cambiás el link corto, el anterior deja de funcionar donde ya lo compartiste.</p>
          )}

          <div className="mk-links-a-grid2">
            <div>
              <label className="adm-label">Red de origen</label>
              <select className="adm-input" value={form.network} onChange={(e) => set("network", e.target.value)}>
                <option value="">Se detecta sola</option>
                {NETWORKS.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="adm-label">Campaña</label>
              <input
                className="adm-input"
                list="mk-links-campaigns"
                maxLength={60}
                placeholder="lanzamiento-sql"
                value={form.campaign}
                onChange={(e) => set("campaign", e.target.value)}
              />
              <datalist id="mk-links-campaigns">
                {campaigns.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="mk-links-a-grid2">
            <div>
              <label className="adm-label">Palabra para comentar</label>
              <input
                className="adm-input"
                maxLength={40}
                placeholder="SQL"
                value={form.keyword}
                onChange={(e) => set("keyword", e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <label className="adm-label">Publicación</label>
              <select className="adm-input" value={form.content_id || ""} onChange={(e) => set("content_id", e.target.value)}>
                <option value="">Ninguna</option>
                {options.content.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title.slice(0, 60)}
                    {c.network ? ` · ${c.network}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mk-links-a-checks">
            <label>
              <input type="checkbox" checked={form.in_bio} onChange={(e) => set("in_bio", e.target.checked)} /> Mostrar en /links
            </label>
            {form.in_bio && (
              <label>
                <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} /> Destacado
              </label>
            )}
            <label>
              <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} /> Activo
            </label>
            <label title="Solo se agregan si el destino es databymilo.me">
              <input type="checkbox" checked={form.add_utm} onChange={(e) => set("add_utm", e.target.checked)} /> UTM automáticas
            </label>
          </div>

          {form.in_bio && (
            <>
              <label className="adm-label">Ícono del botón</label>
              <select className="adm-input" value={form.icon || ""} onChange={(e) => set("icon", e.target.value)}>
                {ICONS.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.label}
                  </option>
                ))}
              </select>
            </>
          )}

          <label className="adm-label">Notas</label>
          <textarea
            className="adm-textarea"
            rows={2}
            maxLength={1000}
            value={form.notes || ""}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Para qué es, dónde lo usaste…"
          />

          {preview && (
            <div className="mk-links-a-preview">
              <div className="adm-mini-label">A dónde lleva {form.network ? "" : "(ejemplo sin red)"}</div>
              <code>{preview.replace(SITE, "databymilo.me")}</code>
              <p>
                {destIsSite
                  ? form.add_utm
                    ? "Destino del sitio: se agregan UTM para ver las visitas por red."
                    : "Destino del sitio, sin UTM."
                  : destIsHotmart
                    ? "Destino Hotmart: se agrega sck para que la venta llegue atribuida a este link y red."
                    : "Destino externo: se cuentan los clicks, sin UTM."}
              </p>
            </div>
          )}

          {error && <div className="adm-alert adm-alert-error">{error}</div>}
        </div>

        <div className="mk-links-a-modal-foot">
          <button type="button" className="adm-btn adm-btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>
            {saving ? "Guardando…" : isNew ? "Crear" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
