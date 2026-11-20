"use client";
import { useCallback, useEffect, useState } from "react";

// Suscriptoras de una lista que vive en Supabase (Edición Corpo o una personalizada).
export default function ListSubscribersPanel({ slug }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", firstName: "" });
  const [adding, setAdding] = useState(false);

  const base = `/api/admin/lists/${encodeURIComponent(slug)}/subscribers`;

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch(base, { cache: "no-store" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "No se pudo cargar la lista");
      setData(d);
    } catch (err) {
      setError(err.message);
      setData({ subscribers: [], total: 0, active: 0, list: null });
    }
  }, [base]);

  useEffect(() => { setData(null); load(); }, [load]);

  async function call(method, body, okText) {
    const res = await fetch(base, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      if (okText) setMsg({ type: "success", text: okText });
      await load();
      return true;
    }
    setMsg({ type: "error", text: d.error || "No se pudo completar la acción" });
    return false;
  }

  async function handleAdd(e) {
    e.preventDefault();
    setAdding(true);
    const ok = await call("POST", addForm, `${addForm.email} agregada ✦`);
    if (ok) { setAddForm({ email: "", firstName: "" }); setShowAdd(false); }
    setAdding(false);
  }

  const list = data?.list;
  const subs = data?.subscribers ?? [];
  const bothCount = subs.filter((s) => s.inBoth).length;
  const showBoth = slug === "corpo";

  const filtered = subs.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.email.toLowerCase().includes(q) || (s.first_name || "").toLowerCase().includes(q);
    const matchFilter =
      filter === "all" ||
      (filter === "active" && s.subscribed) ||
      (filter === "unsub" && !s.subscribed) ||
      (filter === "both" && s.inBoth);
    return matchSearch && matchFilter;
  });

  return (
    <div className="adm-table-wrap" style={{ padding: 0 }}>
      {msg && (
        <div className={`adm-alert adm-alert-${msg.type}`} style={{ margin: 16 }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", opacity: 0.6 }}>✕</button>
        </div>
      )}

      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--adm-border)", fontSize: 12, color: "var(--adm-fg-2)", lineHeight: 1.6 }}>
        {list?.description && <div style={{ marginBottom: 4 }}>{list.description}</div>}
        {data ? (
          <>
            <strong>{data.active}</strong> activas de <strong>{data.total}</strong> en total
            {showBoth && <> · <strong>{bothCount}</strong> también están en La carta del domingo</>}.
          </>
        ) : "Cargando…"}
      </div>

      {error && <div className="adm-alert adm-alert-error" style={{ margin: 16 }}>{error}</div>}

      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--adm-border)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          className="adm-input"
          placeholder="Buscar por email o nombre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 240, marginBottom: 0 }}
        />
        <select className="adm-select" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: "auto" }}>
          <option value="all">Todas ({data?.total ?? "…"})</option>
          <option value="active">Activas ({data?.active ?? "…"})</option>
          <option value="unsub">Desuscriptas ({data ? data.total - data.active : "…"})</option>
          {showBoth && <option value="both">En ambas listas ({bothCount})</option>}
        </select>
        <div style={{ flex: 1 }} />
        <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? "✕ Cancelar" : "+ Agregar contacto"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} style={{ padding: "16px 20px", background: "var(--adm-tinted)", borderBottom: "1px solid var(--adm-border)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="adm-form-group" style={{ margin: 0, flex: "1 1 200px" }}>
            <label className="adm-label">Email *</label>
            <input className="adm-input" type="email" required value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} placeholder="hola@ejemplo.com" style={{ marginBottom: 0 }} />
          </div>
          <div className="adm-form-group" style={{ margin: 0, flex: "1 1 140px" }}>
            <label className="adm-label">Nombre</label>
            <input className="adm-input" value={addForm.firstName} onChange={(e) => setAddForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="Nombre" style={{ marginBottom: 0 }} />
          </div>
          <button type="submit" className="adm-btn adm-btn-primary adm-btn-sm" disabled={adding}>
            {adding ? "Agregando…" : "Agregar"}
          </button>
        </form>
      )}

      {!data ? (
        <div style={{ padding: 32, textAlign: "center", color: "var(--adm-fg-muted)" }}>Cargando…</div>
      ) : subs.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--adm-fg-muted)", fontFamily: "var(--adm-font-body)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✉</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Todavía no hay suscriptoras en esta lista</div>
          <div style={{ fontSize: 12 }}>Aparecen cuando alguien se suma desde el link o el formulario de la lista.</div>
        </div>
      ) : (
        <table className="adm-table">
          <thead>
            <tr><th>Email</th><th>Nombre</th><th>Desde</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--adm-fg-muted)", padding: 32 }}>No hay resultados</td></tr>
            ) : filtered.map((s) => (
              <tr key={s.email}>
                <td style={{ fontWeight: 500 }}>
                  {s.email}
                  {s.inBoth && (
                    <span
                      className="adm-badge"
                      title="Está activa en La carta del domingo y en Edición Corpo"
                      style={{ marginLeft: 8, fontSize: 10, background: "var(--adm-accent)", color: "#fff", border: "1px solid var(--adm-accent)" }}
                    >
                      ✦ ambas listas
                    </span>
                  )}
                </td>
                <td style={{ color: "var(--adm-fg-muted)" }}>{s.first_name || "—"}</td>
                <td style={{ color: "var(--adm-fg-muted)", fontSize: 12, whiteSpace: "nowrap" }}>
                  {new Date(s.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td>
                  <span className={`adm-badge ${s.subscribed ? "adm-badge-active" : "adm-badge-inactive"}`}>
                    {s.subscribed ? "Activa" : "Desuscripta"}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button
                      className="adm-btn adm-btn-secondary adm-btn-sm"
                      onClick={() => call("PATCH", { email: s.email, subscribed: !s.subscribed })}
                    >
                      {s.subscribed ? "Desuscribir" : "Reactivar"}
                    </button>
                    <button
                      className="adm-btn adm-btn-danger adm-btn-sm"
                      onClick={() => {
                        if (confirm(`¿Eliminar ${s.email} de esta lista?`)) {
                          call("DELETE", { email: s.email }, `${s.email} eliminada`);
                        }
                      }}
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
  );
}
