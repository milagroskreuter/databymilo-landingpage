"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

function slugifyClient(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
    .replace(/-$/g, "");
}

const EMPTY = { name: "", slug: "", description: "", button_label: "" };

export default function ListasPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null); // slug en edición
  const [editForm, setEditForm] = useState(EMPTY);
  const [copied, setCopied] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/lists", { cache: "no-store" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "No se pudieron cargar las listas");
      setData(d);
    } catch (err) {
      setError(err.message);
      setData({ lists: [], both: null });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createList(e) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg({ type: "success", text: `Lista "${d.list.name}" creada ✦ Ya podés compartir su link.` });
      setForm(EMPTY);
      setSlugTouched(false);
      setShowNew(false);
      load();
    } else {
      setMsg({ type: "error", text: d.error || "No se pudo crear la lista" });
    }
    setSaving(false);
  }

  async function patchList(slug, body, okText) {
    const res = await fetch(`/api/admin/lists/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      if (okText) setMsg({ type: "success", text: okText });
      load();
      return true;
    }
    setMsg({ type: "error", text: d.error || "No se pudo guardar" });
    return false;
  }

  async function saveEdit(l) {
    const body = { description: editForm.description, button_label: editForm.button_label };
    if (l.kind === "custom") body.name = editForm.name;
    if (await patchList(l.slug, body, "Cambios guardados ✓")) setEditing(null);
  }

  async function deleteList(l) {
    const n = l.total ?? 0;
    const warn = n > 0
      ? `¿Eliminar "${l.name}"? Se borran también sus ${n} suscriptoras. Esto no se puede deshacer.`
      : `¿Eliminar "${l.name}"?`;
    if (!confirm(warn)) return;
    const res = await fetch(`/api/admin/lists/${encodeURIComponent(l.slug)}`, { method: "DELETE" });
    const d = await res.json().catch(() => ({}));
    if (res.ok) { setMsg({ type: "success", text: `Lista "${l.name}" eliminada` }); load(); }
    else setMsg({ type: "error", text: d.error || "No se pudo eliminar" });
  }

  async function copyLink(l) {
    try {
      await navigator.clipboard.writeText(l.publicUrl);
      setCopied(l.slug);
      setTimeout(() => setCopied((c) => (c === l.slug ? "" : c)), 2000);
    } catch {
      window.prompt("Copiá el link:", l.publicUrl);
    }
  }

  function startEdit(l) {
    setEditing(l.slug);
    setEditForm({ name: l.name, slug: l.slug, description: l.description || "", button_label: l.button_label || "" });
  }

  const lists = data?.lists ?? [];

  return (
    <>
      <div className="adm-header">
        <h1>Listas</h1>
        <button className="adm-btn adm-btn-primary" onClick={() => setShowNew((v) => !v)}>
          {showNew ? "✕ Cancelar" : "+ Nueva lista"}
        </button>
      </div>

      <div className="adm-content">
        <div className="adm-alert adm-alert-info" style={{ marginBottom: 16, lineHeight: 1.6 }}>
          Cada lista tiene su propia página de suscripción con la estética del sitio. Copiás el link, lo compartís
          (membresía, un tema de interés, lo que quieras) y quienes se suman quedan solo en esa lista.
          {data?.both != null && (
            <> Hoy <strong>{data.both}</strong> {data.both === 1 ? "persona está" : "personas están"} en La carta del domingo y en Edición Corpo a la vez.</>
          )}
        </div>

        {msg && (
          <div className={`adm-alert adm-alert-${msg.type}`} style={{ marginBottom: 16 }}>
            {msg.text}
            <button onClick={() => setMsg(null)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", opacity: 0.6 }}>✕</button>
          </div>
        )}
        {error && <div className="adm-alert adm-alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        {showNew && (
          <form onSubmit={createList} className="adm-card" style={{ marginBottom: 24, display: "grid", gap: 14 }}>
            <div className="adm-section-title" style={{ margin: 0 }}>Nueva lista</div>

            <div className="adm-form-group" style={{ margin: 0 }}>
              <label className="adm-label">Nombre *</label>
              <input
                className="adm-input"
                required
                maxLength={80}
                placeholder="Ej: Membresía, Interesadas en SQL, Lista de espera…"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugifyClient(name) }));
                }}
                style={{ marginBottom: 0 }}
              />
            </div>

            <div className="adm-form-group" style={{ margin: 0 }}>
              <label className="adm-label">Link de la página</label>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "var(--adm-fg-muted)" }}>databymilo.me/listas/</span>
                <input
                  className="adm-input"
                  maxLength={40}
                  value={form.slug}
                  onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: slugifyClient(e.target.value) })); }}
                  placeholder="membresia"
                  style={{ marginBottom: 0, maxWidth: 240 }}
                />
              </div>
            </div>

            <div className="adm-form-group" style={{ margin: 0 }}>
              <label className="adm-label">Texto de la página (opcional)</label>
              <textarea
                className="adm-textarea"
                maxLength={500}
                rows={3}
                placeholder="Lo que ve la persona antes de dejar su mail: para qué es esta lista, qué va a recibir…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                style={{ marginBottom: 0, resize: "vertical" }}
              />
            </div>

            <div className="adm-form-group" style={{ margin: 0 }}>
              <label className="adm-label">Texto del botón (opcional)</label>
              <input
                className="adm-input"
                maxLength={30}
                placeholder="Sumame →"
                value={form.button_label}
                onChange={(e) => setForm((f) => ({ ...f, button_label: e.target.value }))}
                style={{ marginBottom: 0, maxWidth: 240 }}
              />
            </div>

            <div>
              <button type="submit" className="adm-btn adm-btn-primary" disabled={saving || !form.name.trim() || !form.slug}>
                {saving ? "Creando…" : "Crear lista"}
              </button>
            </div>
          </form>
        )}

        {!data ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--adm-fg-muted)" }}>Cargando…</div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {lists.map((l) => {
              const isEditing = editing === l.slug;
              return (
                <div key={l.slug} className="adm-card" style={{ display: "grid", gap: 12, opacity: l.active ? 1 : 0.75 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                    <div style={{ fontFamily: "var(--adm-font-display)", fontStyle: "italic", fontWeight: 700, fontSize: 20 }}>{l.name}</div>
                    <span className="adm-badge adm-badge-inactive">{l.kind === "system" ? "Del sistema" : "Personalizada"}</span>
                    {!l.active && <span className="adm-badge" style={{ background: "#fdf0e0", color: "#a05a00", border: "1px solid #f0d4a8" }}>Pausada</span>}
                  </div>

                  <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13, color: "var(--adm-fg-2)" }}>
                    <span><strong style={{ color: "var(--adm-primary)", fontSize: 18 }}>{l.activeCount ?? "—"}</strong> activas</span>
                    <span><strong style={{ fontSize: 18 }}>{l.total ?? "—"}</strong> en total</span>
                  </div>

                  {l.description && !isEditing && (
                    <div style={{ fontSize: 13, color: "var(--adm-fg-2)", lineHeight: 1.55 }}>{l.description}</div>
                  )}

                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", background: "var(--adm-tinted)", border: "1px solid var(--adm-border)", borderRadius: 8, padding: "8px 12px" }}>
                    <code style={{ fontSize: 12, wordBreak: "break-all", flex: "1 1 220px" }}>{l.publicUrl}</code>
                    <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => copyLink(l)}>
                      {copied === l.slug ? "✓ Copiado" : "Copiar link"}
                    </button>
                    <a href={`/listas/${l.slug}`} target="_blank" rel="noopener noreferrer" className="adm-btn adm-btn-secondary adm-btn-sm" style={{ textDecoration: "none" }}>
                      Ver página ↗
                    </a>
                  </div>

                  {isEditing && (
                    <div style={{ display: "grid", gap: 12, padding: 14, background: "var(--adm-tinted)", borderRadius: 8, border: "1px solid var(--adm-border)" }}>
                      {l.kind === "custom" && (
                        <div className="adm-form-group" style={{ margin: 0 }}>
                          <label className="adm-label">Nombre</label>
                          <input className="adm-input" maxLength={80} value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} style={{ marginBottom: 0 }} />
                        </div>
                      )}
                      <div className="adm-form-group" style={{ margin: 0 }}>
                        <label className="adm-label">Texto de la página</label>
                        <textarea className="adm-textarea" rows={3} maxLength={500} value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} style={{ marginBottom: 0, resize: "vertical" }} />
                      </div>
                      <div className="adm-form-group" style={{ margin: 0 }}>
                        <label className="adm-label">Texto del botón</label>
                        <input className="adm-input" maxLength={30} value={editForm.button_label} onChange={(e) => setEditForm((f) => ({ ...f, button_label: e.target.value }))} placeholder="Sumame →" style={{ marginBottom: 0, maxWidth: 240 }} />
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => saveEdit(l)}>Guardar</button>
                        <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setEditing(null)}>Cancelar</button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Link href={`/administracion-general/newsletter?lista=${l.slug}`} className="adm-btn adm-btn-secondary adm-btn-sm" style={{ textDecoration: "none" }}>
                      Ver suscriptoras
                    </Link>
                    <Link href={`/administracion-general/newsletter/compose?lista=${l.slug}`} className="adm-btn adm-btn-secondary adm-btn-sm" style={{ textDecoration: "none" }}>
                      ✦ Escribir a esta lista
                    </Link>
                    {!isEditing && (
                      <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => startEdit(l)}>Editar</button>
                    )}
                    {l.kind === "custom" && (
                      <button
                        className="adm-btn adm-btn-secondary adm-btn-sm"
                        onClick={() => patchList(l.slug, { active: !l.active }, l.active ? "Lista pausada: ya no acepta suscripciones" : "Lista reanudada ✦")}
                      >
                        {l.active ? "Pausar suscripciones" : "Reanudar suscripciones"}
                      </button>
                    )}
                    {l.kind === "custom" && (
                      <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => deleteList(l)}>Eliminar</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
