"use client";
import { useCallback, useEffect, useState } from "react";
import { typeMeta, timeAgo } from "../notificationMeta";

const FILTERS = [
  { key: "all", label: "Todas" },
  { key: "subscribe", label: "Suscripciones" },
  { key: "unsubscribe", label: "Bajas" },
  { key: "post_notified", label: "Notas avisadas" },
];

export default function NotificacionesPage() {
  const [items, setItems] = useState(null);
  const [unread, setUnread] = useState(0);
  const [filter, setFilter] = useState("all");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const params = new URLSearchParams({ limit: "100" });
    if (filter !== "all") params.set("type", filter);
    if (onlyUnread) params.set("unread", "1");
    try {
      const res = await fetch(`/api/admin/notifications?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setItems(d.notifications || []);
      setUnread(d.unread || 0);
    } catch {
      setError("No se pudieron cargar las notificaciones.");
      setItems([]);
    }
  }, [filter, onlyUnread]);

  useEffect(() => {
    setItems(null);
    load();
  }, [load]);

  async function call(method, body) {
    const res = await fetch("/api/admin/notifications", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) setError("No se pudo completar la acción.");
    await load();
  }

  const hasRead = (items || []).some((n) => n.read);

  return (
    <>
      <div className="adm-header">
        <h1>Notificaciones</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={load}>↺ Actualizar</button>
          <button
            className="adm-btn adm-btn-secondary adm-btn-sm"
            disabled={unread === 0}
            onClick={() => call("PATCH", { all: true })}
          >
            Marcar todas como leídas
          </button>
          <button
            className="adm-btn adm-btn-danger adm-btn-sm"
            disabled={!hasRead}
            onClick={() => {
              if (confirm("¿Borrar todas las notificaciones leídas?")) call("DELETE", { allRead: true });
            }}
          >
            Borrar leídas
          </button>
        </div>
      </div>

      <div className="adm-content">
        <div className="adm-alert adm-alert-info" style={{ marginBottom: 16 }}>
          Cada suscripción, baja y nota avisada llega acá y también por mail a{" "}
          <strong>databymilo@gmail.com</strong>.
        </div>

        {error && (
          <div className="adm-alert adm-alert-error" style={{ marginBottom: 16 }}>{error}</div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`adm-btn adm-btn-sm ${filter === f.key ? "adm-btn-primary" : "adm-btn-secondary"}`}
            >
              {f.label}
            </button>
          ))}
          <label style={{ marginLeft: "auto", display: "inline-flex", gap: 6, alignItems: "center", fontSize: 12, color: "var(--adm-fg-2)", cursor: "pointer" }}>
            <input type="checkbox" checked={onlyUnread} onChange={(e) => setOnlyUnread(e.target.checked)} />
            Solo sin leer{unread > 0 ? ` (${unread})` : ""}
          </label>
        </div>

        <div className="adm-card" style={{ padding: 0, overflow: "hidden" }}>
          {items === null ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--adm-fg-muted)" }}>Cargando…</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--adm-fg-muted)" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔔</div>
              <div>{onlyUnread ? "No tenés notificaciones sin leer." : "Todavía no hay notificaciones."}</div>
            </div>
          ) : (
            items.map((n) => {
              const meta = typeMeta(n.type);
              return (
                <div key={n.id} className={`adm-notif-row${n.read ? "" : " unread"}`}>
                  <span className="adm-notif-ico" style={{ background: meta.color + "1f", color: meta.color }}>
                    {meta.icon}
                  </span>
                  <div className="adm-notif-main">
                    <div className="adm-notif-title">{n.title}</div>
                    {n.body && <div className="adm-notif-body">{n.body}</div>}
                    <div className="adm-notif-meta">
                      <span
                        className="adm-badge"
                        style={{ background: meta.color + "1f", color: meta.color, border: `1px solid ${meta.color}44` }}
                      >
                        {meta.label}
                      </span>
                      <span title={new Date(n.created_at).toLocaleString("es-AR")}>{timeAgo(n.created_at)}</span>
                    </div>
                  </div>
                  <div className="adm-notif-actions">
                    {!n.read && (
                      <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => call("PATCH", { ids: [n.id] })}>
                        Leída
                      </button>
                    )}
                    <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => call("DELETE", { id: n.id })}>
                      Borrar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
