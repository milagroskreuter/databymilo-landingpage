// Valores compartidos por toda la sección Marketing del hub.
// Si un área necesita un valor nuevo, lo agrega acá (sin renombrar los existentes:
// están guardados en la base).

export const NETWORKS = [
  { id: "instagram", label: "Instagram", color: "#c13584", auto: true },
  { id: "linkedin", label: "LinkedIn", color: "#0a66c2", auto: false }, // métricas por archivo exportado
  { id: "threads", label: "Threads", color: "#1a0a10", auto: true },
  { id: "youtube", label: "YouTube", color: "#cc0000", auto: true },
  { id: "tiktok", label: "TikTok", color: "#25a8a8", auto: false },
  { id: "newsletter", label: "Newsletter", color: "#8b1a4a", auto: false },
  { id: "blog", label: "Blog", color: "#7c3aed", auto: false },
];

export const STATUSES = [
  { id: "idea", label: "Idea", color: "#9a8a90" },
  { id: "guion", label: "Guion", color: "#d99a3e" },
  { id: "grabado", label: "Grabado", color: "#c2577f" },
  { id: "editado", label: "Editado", color: "#7c3aed" },
  { id: "programado", label: "Programado", color: "#0a66c2" },
  { id: "publicado", label: "Publicado", color: "#17663e" },
  { id: "descartado", label: "Descartado", color: "#c0392b" },
];

export const FORMATS = [
  { id: "reel", label: "Reel" },
  { id: "carrusel", label: "Carrusel" },
  { id: "post", label: "Post" },
  { id: "historia", label: "Historia" },
  { id: "video", label: "Video" },
  { id: "short", label: "Short" },
  { id: "articulo", label: "Artículo" },
  { id: "email", label: "Email" },
];

export const CONTENT_SOURCES = ["manual", "chat", "repurpose", "audiencia", "serie", "lanzamiento", "competencia"];

const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
export const NETWORK_BY_ID = byId(NETWORKS);
export const STATUS_BY_ID = byId(STATUSES);
export const FORMAT_BY_ID = byId(FORMATS);

export function networkLabel(id) {
  return NETWORK_BY_ID[id]?.label || id || "—";
}
export function statusLabel(id) {
  return STATUS_BY_ID[id]?.label || id || "—";
}
