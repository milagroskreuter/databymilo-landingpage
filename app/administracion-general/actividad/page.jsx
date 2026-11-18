"use client";
import { useEffect, useState } from "react";

const ACTION_LABELS = {
  publish: { label: "Publicada", color: "#1a7a4a" },
  schedule: { label: "Programada", color: "#7c3aed" },
  draft: { label: "Borrador", color: "#888" },
  delete: { label: "Eliminada", color: "#c0392b" },
  duplicate: { label: "Duplicada", color: "#2980b9" },
  restore: { label: "Restaurada", color: "#e67e22" },
  update: { label: "Actualizada", color: "#2980b9" },
  create: { label: "Creada", color: "#1a7a4a" },
};

const ENTITY_LABELS = { post: "Blog", recurso: "Recurso", newsletter: "Newsletter" };

function ActionBadge({ action }) {
  const cfg = ACTION_LABELS[action] || { label: action, color: "#888" };
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.color + "22", color: cfg.color, border: `1px solid ${cfg.color}44` }}>
      {cfg.label}
    </span>
  );
}

function fmt(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "hace un momento";
  if (diff < 3600000) return `hace ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `hace ${Math.floor(diff / 3600000)} h`;
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: diff > 86400000 * 30 ? "numeric" : undefined });
}

export default function ActividadPage() {
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/activity?limit=100");
    if (res.ok) { const d = await res.json(); setLog(d.log || []); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const items = (log || []).filter(item =>
    filter === "all" || item.entity_type === filter
  );

  return (
    <>
      <div className="adm-header">
        <h1>Log de actividad</h1>
        <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={load}>↺ Actualizar</button>
      </div>

      <div className="adm-content">
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {["all", "post", "recurso"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`adm-btn adm-btn-sm ${filter === f ? "adm-btn-primary" : "adm-btn-secondary"}`}
            >
              {f === "all" ? "Todo" : ENTITY_LABELS[f] || f}
            </button>
          ))}
        </div>

        <div className="adm-card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--adm-fg-muted)" }}>Cargando…</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--adm-fg-muted)" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <div>No hay actividad registrada todavía.</div>
            </div>
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Acción</th>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Cuándo</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td><ActionBadge action={item.action} /></td>
                    <td style={{ fontWeight: 500, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.entity_title || item.entity_id || "—"}
                    </td>
                    <td style={{ color: "var(--adm-fg-muted)", fontSize: 12 }}>
                      {ENTITY_LABELS[item.entity_type] || item.entity_type}
                    </td>
                    <td style={{ color: "var(--adm-fg-muted)", fontSize: 12, whiteSpace: "nowrap" }}>
                      {fmt(item.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
