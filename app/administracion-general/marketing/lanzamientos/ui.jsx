"use client";
// Piezas compartidas por las pantallas de Lanzamientos.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LAUNCH_STATUS_BY_ID, LAUNCH_STATUSES, KEYDATE_KIND_BY_ID } from "@/lib/marketing/launches/constants";
import { NETWORK_BY_ID } from "@/lib/marketing/constants";
import "./lanzamientos.css";

export const BASE = "/administracion-general/marketing/lanzamientos";
export const API = "/api/admin/marketing/launches";

// fetch JSON que tira error con el mensaje de la API.
export async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export function Tabs() {
  const pathname = usePathname();
  const tabs = [
    { href: BASE, label: "Lanzamientos" },
    { href: `${BASE}/fechas`, label: "Fechas clave" },
    { href: `${BASE}/plantillas`, label: "Plantillas de checklist" },
  ];
  return (
    <nav className="mk-lanzamientos-tabs">
      {tabs.map((t) => {
        const active = t.href === BASE ? pathname === BASE || /\/lanzamientos\/[0-9a-f-]{36}/.test(pathname) : pathname.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={`mk-lanzamientos-tab${active ? " is-active" : ""}`}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function StatusBadge({ status }) {
  const s = LAUNCH_STATUS_BY_ID[status] || LAUNCH_STATUSES[0];
  return (
    <span className="mk-lanzamientos-status" style={{ background: `${s.color}1f`, color: s.color }}>
      <span className="mk-lanzamientos-dot" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

export function KindDot({ kind }) {
  const k = KEYDATE_KIND_BY_ID[kind];
  return <span className="mk-lanzamientos-dot" style={{ background: k?.color || "#9a8a90" }} title={k?.label} />;
}

export function NetworkTag({ network }) {
  const n = NETWORK_BY_ID[network];
  if (!n) return <span className="mk-lanzamientos-muted">—</span>;
  return (
    <span className="mk-lanzamientos-net" style={{ background: n.color }}>
      {n.label}
    </span>
  );
}

export function Progress({ done, total }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <>
      <div className="mk-lanzamientos-progress" aria-label={`${pct}% del checklist`}>
        <span style={{ width: `${pct}%` }} />
      </div>
      <span className="mk-lanzamientos-progress-label">
        {done}/{total} tareas
      </span>
    </>
  );
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="mk-lanzamientos-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`mk-lanzamientos-modal${wide ? " is-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="adm-form-group">
      <span className="adm-label">{label}</span>
      {children}
      {hint && <span className="mk-lanzamientos-muted">{hint}</span>}
    </label>
  );
}

export function ResourceSelect({ value, onChange, resources }) {
  return (
    <select className="adm-input adm-select" value={value || ""} onChange={(e) => onChange(e.target.value)}>
      <option value="">— Sin recurso —</option>
      {resources.some((r) => r.is_paid) && (
        <optgroup label="Pagos">
          {resources.filter((r) => r.is_paid).map((r) => (
            <option key={r.slug} value={r.slug}>{r.title}</option>
          ))}
        </optgroup>
      )}
      {resources.some((r) => !r.is_paid) && (
        <optgroup label="Gratuitos">
          {resources.filter((r) => !r.is_paid).map((r) => (
            <option key={r.slug} value={r.slug}>{r.title}</option>
          ))}
        </optgroup>
      )}
    </select>
  );
}

export function money(totals) {
  if (!totals?.length) return "—";
  return totals
    .map((t) => `${t.currency === "USD" ? "US$" : t.currency + " "}${t.value.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`)
    .join(" · ");
}
