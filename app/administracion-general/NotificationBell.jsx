"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { typeMeta, timeAgo } from "./notificationMeta";

const POLL_MS = 60_000;

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const rootRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications?limit=8", { cache: "no-store" });
      if (!res.ok) return;
      const d = await res.json();
      setItems(d.notifications || []);
      setUnread(d.unread || 0);
    } catch {
      // sin conexión: se reintenta en el próximo ciclo
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => {});
  }

  async function markRead(n) {
    if (n.read) return;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    setUnread((u) => Math.max(0, u - 1));
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [n.id] }),
    }).catch(() => {});
  }

  return (
    <div className="adm-bell" ref={rootRef}>
      <button
        type="button"
        className="adm-bell-btn"
        aria-label={unread > 0 ? `Notificaciones, ${unread} sin leer` : "Notificaciones"}
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && <span className="adm-bell-badge">{unread > 99 ? "99+" : unread}</span>}
      </button>

      {open && (
        <div className="adm-bell-panel" role="dialog" aria-label="Notificaciones">
          <div className="adm-bell-head">
            <strong>Notificaciones</strong>
            {unread > 0 && (
              <button type="button" className="adm-bell-link" onClick={markAllRead}>
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="adm-bell-list">
            {!loaded ? (
              <div className="adm-bell-empty">Cargando…</div>
            ) : items.length === 0 ? (
              <div className="adm-bell-empty">
                Todavía no hay novedades.
                <br />
                Acá vas a ver suscripciones, bajas y notas avisadas.
              </div>
            ) : (
              items.map((n) => {
                const meta = typeMeta(n.type);
                return (
                  <Link
                    key={n.id}
                    href="/administracion-general/notificaciones"
                    className={`adm-bell-item${n.read ? "" : " unread"}`}
                    onClick={() => {
                      markRead(n);
                      setOpen(false);
                    }}
                  >
                    <span className="adm-bell-ico" style={{ background: meta.color + "1f", color: meta.color }}>
                      {meta.icon}
                    </span>
                    <span className="adm-bell-txt">
                      <span className="adm-bell-title">{n.title}</span>
                      <span className="adm-bell-time">{timeAgo(n.created_at)}</span>
                    </span>
                    {!n.read && <span className="adm-bell-dot" aria-hidden="true" />}
                  </Link>
                );
              })
            )}
          </div>

          <Link
            href="/administracion-general/notificaciones"
            className="adm-bell-foot"
            onClick={() => setOpen(false)}
          >
            Ver todas las notificaciones →
          </Link>
        </div>
      )}
    </div>
  );
}
