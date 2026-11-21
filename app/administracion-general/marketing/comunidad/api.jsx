// Cliente chico para /api/admin/marketing/community/* desde las pestañas.
import { NETWORKS } from "@/lib/marketing/constants";

const BASE = "/api/admin/marketing/community";

export async function api(path, { method = "GET", body, form } = {}) {
  const init = { method };
  if (form) init.body = form;
  else if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  const res = await fetch(`${BASE}${path}`, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export const COMMUNITY_NETWORKS = [
  ...NETWORKS,
  { id: "email", label: "Email", color: "#7a6670" },
  { id: "otro", label: "Otro", color: "#9a8a90" },
];
const NET_BY_ID = Object.fromEntries(COMMUNITY_NETWORKS.map((n) => [n.id, n]));
export const netOf = (id) => NET_BY_ID[id] || null;

export function fmtDate(value) {
  if (!value) return "";
  const d = value.length === 10 ? new Date(`${value}T12:00:00`) : new Date(value);
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function NetworkPill({ id }) {
  const n = netOf(id);
  if (!n) return null;
  return (
    <span className="mk-comunidad-net" style={{ "--net": n.color }}>
      {n.label}
    </span>
  );
}

// Vercel corta los pedidos de más de ~4,5 MB: las imágenes grandes se
// achican en el navegador antes de subirlas (los GIF quedan como están).
export async function fitImage(file, { maxBytes = 3.5 * 1024 * 1024, maxSide = 2000 } = {}) {
  if (!file || file.size <= maxBytes || file.type === "image/gif") return file;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ? new File([blob], "imagen.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}
