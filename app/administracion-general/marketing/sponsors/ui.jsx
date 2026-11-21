"use client";
import { useEffect } from "react";

const BASE = "/api/admin/marketing/sponsors";

/** fetch JSON contra /api/admin/marketing/sponsors/<path>. Lanza Error con el mensaje del servidor. */
export async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE}/${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
  return json;
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="mk-sponsors-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`mk-sponsors-modal${wide ? " wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="mk-sponsors-modal-head">
          <h2>{title}</h2>
          <button type="button" className="mk-sponsors-x" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="mk-sponsors-modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint, span }) {
  return (
    <label className={`adm-form-group mk-sponsors-field${span ? ` span-${span}` : ""}`}>
      <span className="adm-label">{label}</span>
      {children}
      {hint ? <span className="mk-sponsors-hint">{hint}</span> : null}
    </label>
  );
}

export function Pill({ color, children }) {
  return (
    <span className="mk-sponsors-pill" style={{ "--pill": color || "#9a8a90" }}>
      {children}
    </span>
  );
}
