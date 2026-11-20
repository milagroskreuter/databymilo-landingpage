import { NETWORK_BY_ID } from "@/lib/marketing/constants";
import { EXTRA_NETWORKS } from "@/lib/marketing/links/shared";

export function netLabel(id) {
  if (!id) return "Sin red";
  return NETWORK_BY_ID[id]?.label || EXTRA_NETWORKS[id]?.label || id;
}

export function netColor(id) {
  if (!id) return EXTRA_NETWORKS["sin-red"].color;
  return NETWORK_BY_ID[id]?.color || EXTRA_NETWORKS[id]?.color || "#b797cf";
}

export function fmt(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString("es-AR", { maximumFractionDigits: 1 });
}

export function fmtDay(day) {
  const [, m, d] = String(day).split("-");
  return `${Number(d)}/${Number(m)}`;
}

export function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export async function api(path, opts = {}) {
  const res = await fetch(`/api/admin/marketing/links${path}`, {
    cache: "no-store",
    ...opts,
    headers: opts.body ? { "Content-Type": "application/json", ...(opts.headers || {}) } : opts.headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Algo salió mal");
  return data;
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    window.prompt("Copiá:", text);
    return false;
  }
}

export const PERIODS = [
  { days: 7, label: "7 días" },
  { days: 30, label: "30 días" },
  { days: 90, label: "90 días" },
  { days: 365, label: "1 año" },
];
