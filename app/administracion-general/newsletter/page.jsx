"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

import ListSubscribersPanel from "../ListSubscribersPanel";

function StatCard({ label, value, sub, color }) {
  return (
    <div className="adm-stat-card">
      <div className="adm-stat-label">{label}</div>
      <div className="adm-stat-value" style={color ? { color } : {}}>{value ?? "…"}</div>
      {sub && <div className="adm-stat-sub">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    sent: ["adm-badge-active", "Enviado"],
    draft: ["adm-badge-inactive", "Borrador"],
    scheduled: ["", "Programado"],
    queued: ["", "En cola"],
  };
  const [cls, label] = map[status] ?? ["adm-badge-inactive", status];
  return <span className={`adm-badge ${cls}`}>{label}</span>;
}

function MetricPill({ label, value }) {
  if (value == null) return null;
  const pct = typeof value === "number" && value <= 1 ? (value * 100).toFixed(1) + "%" : value;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, background: "var(--adm-tinted)", border: "1px solid var(--adm-border)",
      borderRadius: 20, padding: "2px 8px", color: "var(--adm-fg-2)",
      fontFamily: "var(--adm-font-body)",
    }}>
      {label} <strong style={{ color: "var(--adm-primary)" }}>{pct}</strong>
    </span>
  );
}

export default function NewsletterPage() {
  // "carta" | "history" | "list:<slug>"
  const [tab, setTab] = useState("carta");
  const [data, setData] = useState(null);
  const [broadcasts, setBroadcasts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bLoading, setBLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // Add contact form
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", firstName: "", lastName: "" });
  const [addLoading, setAddLoading] = useState(false);
  const [editingTags, setEditingTags] = useState(null); // { email, tags: [], notes: "" }
  const [tagsInput, setTagsInput] = useState("");
  const [tagsSaving, setTagsSaving] = useState(false);

  async function loadContacts() {
    setLoading(true);
    const res = await fetch("/api/admin/newsletter/contacts");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  async function loadBroadcasts() {
    setBLoading(true);
    const res = await fetch("/api/admin/newsletter/broadcasts");
    if (res.ok) setBroadcasts(await res.json());
    setBLoading(false);
  }

  // Listas que viven en Supabase (Edición Corpo + las personalizadas): una pestaña por lista
  const [otherLists, setOtherLists] = useState([]);

  useEffect(() => {
    fetch("/api/admin/lists?names=1")
      .then((r) => (r.ok ? r.json() : { lists: [] }))
      .then((d) => setOtherLists((d.lists || []).filter((l) => l.source !== "resend")))
      .catch(() => {});
  }, []);

  // /newsletter?lista=<slug> abre directo la pestaña de esa lista
  useEffect(() => {
    const l = new URLSearchParams(window.location.search).get("lista");
    if (l) setTab(l === "carta" ? "carta" : `list:${l}`);
  }, []);

  useEffect(() => { loadContacts(); }, []);
  useEffect(() => { if (tab === "history" && !broadcasts) loadBroadcasts(); }, [tab]);

  async function handleRemove(id, email) {
    if (!confirm(`¿Eliminar ${email} de la lista?`)) return;
    const res = await fetch("/api/admin/newsletter/contacts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) { setMsg({ type: "success", text: `${email} eliminada` }); loadContacts(); }
    else setMsg({ type: "error", text: "Error al eliminar" });
  }

  async function handleToggle(contact) {
    const res = await fetch("/api/admin/newsletter/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: contact.id, unsubscribed: !contact.unsubscribed }),
    });
    if (res.ok) loadContacts();
    else setMsg({ type: "error", text: "Error al actualizar" });
  }

  async function handleAdd(e) {
    e.preventDefault();
    setAddLoading(true);
    const res = await fetch("/api/admin/newsletter/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg({ type: "success", text: `${addForm.email} agregada ✦` });
      setAddForm({ email: "", firstName: "", lastName: "" });
      setShowAdd(false);
      loadContacts();
    } else {
      setMsg({ type: "error", text: d.error || "Error al agregar" });
    }
    setAddLoading(false);
  }

  function openTagEditor(contact) {
    setEditingTags({ email: contact.email, tags: contact.tags || [], notes: contact.notes || "" });
    setTagsInput("");
  }

  async function saveContactTags() {
    if (!editingTags) return;
    setTagsSaving(true);
    const res = await fetch("/api/admin/newsletter/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: editingTags.email, updateTags: true, tags: editingTags.tags, notes: editingTags.notes }),
    });
    if (res.ok) { setMsg({ type: "success", text: "Etiquetas guardadas ✓" }); setEditingTags(null); loadContacts(); }
    else setMsg({ type: "error", text: "Error al guardar" });
    setTagsSaving(false);
  }

  function addTag(tag) {
    const t = tag.trim().toLowerCase();
    if (!t || editingTags.tags.includes(t)) return;
    setEditingTags(e => ({ ...e, tags: [...e.tags, t] }));
    setTagsInput("");
  }

  async function handleDeleteBroadcast(id, subject) {
    if (!confirm(`¿Eliminar el email "${subject}"? Solo funciona si está en borrador.`)) return;
    const res = await fetch("/api/admin/newsletter/broadcasts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) { setMsg({ type: "success", text: "Email eliminado" }); loadBroadcasts(); }
    else setMsg({ type: "error", text: "No se puede eliminar (ya fue enviado)" });
  }

  const contacts = data?.data ?? [];
  const filtered = contacts.filter((c) => {
    const matchSearch = !search ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.first_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "active" && !c.unsubscribed) ||
      (filter === "unsub" && c.unsubscribed) ||
      (filter === "both" && c.inBoth);
    return matchSearch && matchFilter;
  });

  const bList = broadcasts?.data ?? [];

  return (
    <>
      <div className="adm-header">
        <h1>Newsletter</h1>
        <Link href="/administracion-general/newsletter/compose" className="adm-btn adm-btn-primary">
          ✦ Escribir email
        </Link>
      </div>

      <div className="adm-content">
        {msg && (
          <div className={`adm-alert adm-alert-${msg.type}`} style={{ marginBottom: 16 }}>
            {msg.text}
            <button onClick={() => setMsg(null)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", opacity: .6 }}>✕</button>
          </div>
        )}

        {/* KPIs (de La carta del domingo) */}
        {tab === "carta" && (
        <div className="adm-stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", marginBottom: 24 }}>
          <StatCard label="Total suscriptoras" value={data?.total} sub="en la lista" />
          <StatCard label="Activas" value={data?.active} sub="reciben emails" color="var(--adm-primary)" />
          <StatCard
            label="Desuscriptas"
            value={data ? (data.total - data.active) : null}
            sub="ya no reciben"
          />
          <StatCard label="En ambas listas" value={data ? contacts.filter(c => c.inBoth).length : null} sub="carta + edición corpo" color="var(--adm-accent)" />
          <StatCard label="Emails enviados" value={bList.filter(b => b.status === "sent").length || (bLoading ? "…" : "—")} sub="broadcasts" />
        </div>
        )}

        {/* Tabs: una por lista + historial */}
        <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--adm-border)", marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { key: "carta", label: "La carta del domingo" },
            ...otherLists.map((l) => ({ key: `list:${l.slug}`, label: l.name })),
            { key: "history", label: "Historial de envíos" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "10px 20px",
                fontFamily: "var(--adm-font-body)", fontSize: 13, fontWeight: tab === t.key ? 700 : 400,
                color: tab === t.key ? "var(--adm-primary)" : "var(--adm-fg-muted)",
                borderBottom: tab === t.key ? "2px solid var(--adm-primary)" : "2px solid transparent",
                marginBottom: -2,
              }}
            >
              {t.label}
            </button>
          ))}
          <Link
            href="/administracion-general/listas"
            style={{ marginLeft: "auto", alignSelf: "center", fontSize: 12, fontWeight: 600, color: "var(--adm-primary)", textDecoration: "none", padding: "0 4px" }}
          >
            + Crear o gestionar listas
          </Link>
        </div>

        {/* TAB: La carta del domingo */}
        {tab === "carta" && (
          <div className="adm-table-wrap" style={{ padding: 0 }}>
            {/* Toolbar */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--adm-border)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <input
                className="adm-input"
                placeholder="Buscar por email o nombre…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ maxWidth: 240, marginBottom: 0 }}
              />
              <select
                className="adm-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{ width: "auto" }}
              >
                <option value="all">Todas ({data?.total ?? "…"})</option>
                <option value="active">Activas ({data?.active ?? "…"})</option>
                <option value="unsub">Desuscriptas ({data ? data.total - data.active : "…"})</option>
                <option value="both">En ambas listas ({data ? contacts.filter(c => c.inBoth).length : "…"})</option>
              </select>
              <div style={{ flex: 1 }} />
              <button
                className="adm-btn adm-btn-secondary adm-btn-sm"
                onClick={() => setShowAdd(v => !v)}
              >
                {showAdd ? "✕ Cancelar" : "+ Agregar contacto"}
              </button>
            </div>

            {/* Add form */}
            {showAdd && (
              <form onSubmit={handleAdd} style={{ padding: "16px 20px", background: "var(--adm-tinted)", borderBottom: "1px solid var(--adm-border)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div className="adm-form-group" style={{ margin: 0, flex: "1 1 200px" }}>
                  <label className="adm-label">Email *</label>
                  <input
                    className="adm-input"
                    type="email"
                    required
                    value={addForm.email}
                    onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="hola@ejemplo.com"
                    style={{ marginBottom: 0 }}
                  />
                </div>
                <div className="adm-form-group" style={{ margin: 0, flex: "1 1 140px" }}>
                  <label className="adm-label">Nombre</label>
                  <input
                    className="adm-input"
                    value={addForm.firstName}
                    onChange={e => setAddForm(f => ({ ...f, firstName: e.target.value }))}
                    placeholder="Nombre"
                    style={{ marginBottom: 0 }}
                  />
                </div>
                <div className="adm-form-group" style={{ margin: 0, flex: "1 1 140px" }}>
                  <label className="adm-label">Apellido</label>
                  <input
                    className="adm-input"
                    value={addForm.lastName}
                    onChange={e => setAddForm(f => ({ ...f, lastName: e.target.value }))}
                    placeholder="Apellido"
                    style={{ marginBottom: 0 }}
                  />
                </div>
                <button type="submit" className="adm-btn adm-btn-primary adm-btn-sm" disabled={addLoading}>
                  {addLoading ? "Agregando…" : "Agregar"}
                </button>
              </form>
            )}

            {/* Table */}
            {loading ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--adm-fg-muted)" }}>Cargando…</div>
            ) : (
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Nombre</th>
                    <th>Etiquetas</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--adm-fg-muted)", padding: 32 }}>No hay resultados</td></tr>
                  ) : filtered.map((c) => (
                    <>
                      <tr key={c.id}>
                        <td style={{ fontWeight: 500 }}>{c.email}</td>
                        <td style={{ color: "var(--adm-fg-muted)" }}>{[c.first_name, c.last_name].filter(Boolean).join(" ") || "—"}</td>
                        <td>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                            {c.inBoth && (
                              <span
                                className="adm-badge"
                                title="Está activa en La carta del domingo y en Edición Corpo"
                                style={{ fontSize: 10, background: "var(--adm-accent)", color: "#fff", border: "1px solid var(--adm-accent)" }}
                              >
                                ✦ ambas listas
                              </span>
                            )}
                            {(c.tags || []).map(t => (
                              <span key={t} className="adm-badge adm-badge-primary" style={{ fontSize: 10 }}>{t}</span>
                            ))}
                            <button type="button" onClick={() => editingTags?.email === c.email ? setEditingTags(null) : openTagEditor(c)} style={{ fontSize: 10, background: "none", border: "1px dashed var(--adm-border)", borderRadius: 4, padding: "1px 6px", cursor: "pointer", color: "var(--adm-fg-muted)" }}>
                              {editingTags?.email === c.email ? "✕" : "+ tag"}
                            </button>
                          </div>
                        </td>
                        <td>
                          <span className={`adm-badge ${c.unsubscribed ? "adm-badge-inactive" : "adm-badge-active"}`}>
                            {c.unsubscribed ? "Desuscripta" : "Activa"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => handleToggle(c)}>
                              {c.unsubscribed ? "Reactivar" : "Desuscribir"}
                            </button>
                            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => handleRemove(c.id, c.email)}>
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                      {editingTags?.email === c.email && (
                        <tr key={`${c.id}-tags`}>
                          <td colSpan={5} style={{ background: "var(--adm-tinted)", padding: "12px 16px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                              <div>
                                <div style={{ fontSize: 11, fontFamily: "var(--adm-font-body)", fontWeight: 700, marginBottom: 6 }}>Etiquetas</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                                  {editingTags.tags.map(t => (
                                    <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "var(--adm-primary)", color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 11 }}>
                                      {t}
                                      <button type="button" onClick={() => setEditingTags(e => ({ ...e, tags: e.tags.filter(x => x !== t) }))} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", padding: 0, lineHeight: 1 }}>✕</button>
                                    </span>
                                  ))}
                                  <input
                                    className="adm-input"
                                    value={tagsInput}
                                    onChange={e => setTagsInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(tagsInput); } }}
                                    placeholder="nueva etiqueta + Enter"
                                    style={{ width: 180, marginBottom: 0, fontSize: 12, padding: "4px 8px" }}
                                  />
                                  {tagsInput && <button type="button" className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => addTag(tagsInput)}>Agregar</button>}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: 11, fontFamily: "var(--adm-font-body)", fontWeight: 700, marginBottom: 4 }}>Notas internas</div>
                                <textarea
                                  className="adm-textarea"
                                  value={editingTags.notes}
                                  onChange={e => setEditingTags(et => ({ ...et, notes: e.target.value }))}
                                  placeholder="Notas sobre este contacto…"
                                  style={{ minHeight: 60, fontSize: 12, resize: "vertical" }}
                                />
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button className="adm-btn adm-btn-sm adm-btn-primary" onClick={saveContactTags} disabled={tagsSaving}>{tagsSaving ? "Guardando…" : "Guardar"}</button>
                                <button className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => setEditingTags(null)}>Cancelar</button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB: Historial */}
        {tab === "history" && (
          <div className="adm-table-wrap" style={{ padding: 0 }}>
            {bLoading ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--adm-fg-muted)" }}>Cargando historial…</div>
            ) : bList.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--adm-fg-muted)", fontFamily: "var(--adm-font-body)" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✉</div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Todavía no enviaste ningún email</div>
                <div style={{ fontSize: 12 }}>Cuando mandes tu primera carta, va a aparecer acá.</div>
              </div>
            ) : (
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Asunto</th>
                    <th>Estado</th>
                    <th>Enviado</th>
                    <th>Métricas</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {bList.map((b) => {
                    const m = b.metrics;
                    const sentAt = b.sent_at || b.scheduled_at || b.created_at;
                    return (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 600, maxWidth: 260 }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.subject || "—"}</div>
                        </td>
                        <td><StatusBadge status={b.status} /></td>
                        <td style={{ color: "var(--adm-fg-muted)", fontSize: 12, whiteSpace: "nowrap" }}>
                          {sentAt ? new Date(sentAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td>
                          {m ? (
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {m.opens != null && <MetricPill label="📬 aperturas" value={m.opens} />}
                              {m.clicks != null && <MetricPill label="🖱 clicks" value={m.clicks} />}
                              {m.unsubscribes != null && <MetricPill label="↩ unsubs" value={m.unsubscribes} />}
                            </div>
                          ) : (
                            <span style={{ color: "var(--adm-fg-muted)", fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {b.status === "draft" && (
                            <button
                              className="adm-btn adm-btn-danger adm-btn-sm"
                              onClick={() => handleDeleteBroadcast(b.id, b.subject)}
                            >
                              Eliminar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB: listas de Supabase (Edición Corpo y personalizadas) */}
        {tab.startsWith("list:") && (
          <ListSubscribersPanel key={tab} slug={tab.slice(5)} />
        )}
      </div>
    </>
  );
}
