"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function NewsletterPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/newsletter/contacts");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleRemove(id, email) {
    if (!confirm(`Â¿Eliminar ${email} de la lista?`)) return;
    const res = await fetch("/api/admin/newsletter/contacts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setMsg({ type: "success", text: `${email} eliminada` });
      load();
    } else {
      setMsg({ type: "error", text: "Error al eliminar" });
    }
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

  return (
    <>
      <div className="adm-header">
        <h1>Newsletter â€” Suscriptoras</h1>
        <Link href="/administracion-general/newsletter/compose" className="adm-btn adm-btn-primary">
          âœ¦ Escribir email
        </Link>
      </div>

      <div className="adm-content">
        {msg && (
          <div className={`adm-alert adm-alert-${msg.type}`} style={{ marginBottom: 16 }}>
            {msg.text}
          </div>
        )}

        <div className="adm-stats-grid" style={{ marginBottom: 24 }}>
          <div className="adm-stat-card">
            <div className="adm-stat-label">Total</div>
            <div className="adm-stat-value">{data?.total ?? "â€¦"}</div>
          </div>
          <div className="adm-stat-card">
            <div className="adm-stat-label">Activas</div>
            <div className="adm-stat-value">{data?.active ?? "â€¦"}</div>
          </div>
        </div>

        <div className="adm-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--adm-border)", display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input
              className="adm-input"
              placeholder="Buscar por email o nombreâ€¦"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 280, marginBottom: 0 }}
            />
            <select
              className="adm-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ width: "auto" }}
            >
              <option value="all">Todas</option>
              <option value="active">Activas</option>
              <option value="unsub">Desuscriptas</option>
            </select>
          </div>

          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--adm-text-muted)" }}>Cargandoâ€¦</div>
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
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "var(--adm-text-muted)", padding: 32 }}>
                      No hay resultados
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c.id}>
                      <td>{c.email}</td>
                      <td style={{ color: "var(--adm-text-muted)" }}>{c.first_name || "â€”"}</td>
                      <td>
                        <span className={`adm-badge ${c.unsubscribed ? "adm-badge-inactive" : "adm-badge-active"}`}>
                          {c.unsubscribed ? "Desuscripta" : "Activa"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="adm-btn adm-btn-danger adm-btn-sm"
                          onClick={() => handleRemove(c.id, c.email)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
