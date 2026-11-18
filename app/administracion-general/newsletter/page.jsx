"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const TABS = ["Suscriptoras", "Historial de envíos"];

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
  const [tab, setTab] = useState(0);
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

  useEffect(() => { loadContacts(); }, []);
  useEffect(() => { if (tab === 1 && !broadcasts) loadBroadcasts(); }, [tab]);

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
      (filter === "unsub" && c.unsubscribed);
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

        {/* KPIs */}
        <div className="adm-stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", marginBottom: 24 }}>
          <StatCard label="Total suscriptoras" value={data?.total} sub="en la lista" />
          <StatCard label="Activas" value={data?.active} sub="reciben emails" color="var(--adm-primary)" />
          <StatCard
            label="Desuscriptas"
            value={data ? (data.total - data.active) : null}
            sub="ya no reciben"
          />
          <StatCard label="Emails enviados" value={bList.filter(b => b.status === "sent").length || (bLoading ? "…" : "—")} sub="broadcasts" />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--adm-border)", marginBottom: 20 }}>
          {TABS.map((t, i) => (
            <button
              key={i}
              onClick={() => setTab(i)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "10px 20px",
                fontFamily: "var(--adm-font-body)", fontSize: 13, fontWeight: tab === i ? 700 : 400,
                color: tab === i ? "var(--adm-primary)" : "var(--adm-fg-muted)",
                borderBottom: tab === i ? "2px solid var(--adm-primary)" : "2px solid transparent",
                marginBottom: -2,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* TAB: Suscriptoras */}
        {tab === 0 && (
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
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--adm-fg-muted)", padding: 32 }}>No hay resultados</td></tr>
                  ) : filtered.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 500 }}>{c.email}</td>
                      <td style={{ color: "var(--adm-fg-muted)" }}>{[c.first_name, c.last_name].filter(Boolean).join(" ") || "—"}</td>
                      <td>
                        <span className={`adm-badge ${c.unsubscribed ? "adm-badge-inactive" : "adm-badge-active"}`}>
                          {c.unsubscribed ? "Desuscripta" : "Activa"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button
                            className="adm-btn adm-btn-secondary adm-btn-sm"
                            onClick={() => handleToggle(c)}
                            title={c.unsubscribed ? "Reactivar" : "Desuscribir"}
                          >
                            {c.unsubscribed ? "Reactivar" : "Desuscribir"}
                          </button>
                          <button
                            className="adm-btn adm-btn-danger adm-btn-sm"
                            onClick={() => handleRemove(c.id, c.email)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB: Historial */}
        {tab === 1 && (
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
      </div>
    </>
  );
}
