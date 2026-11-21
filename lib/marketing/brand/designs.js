// Diseños base de placas y carruseles (compartido entre la UI y el generador).
// Cada campo de texto acepta *palabra* para resaltarla con el color de acento.

export const SIZES = [
  { id: "1080x1350", label: "Vertical 4:5 (1080×1350)", width: 1080, height: 1350 },
  { id: "1080x1080", label: "Cuadrado (1080×1080)", width: 1080, height: 1080 },
];

export const THEMES = [
  { id: "oscuro", label: "Fondo principal (vino)" },
  { id: "claro", label: "Fondo claro (crema)" },
];

export const DESIGNS = [
  {
    id: "portada",
    label: "Portada de carrusel",
    fields: [
      { key: "eyebrow", label: "Antetítulo", placeholder: "Carrera en data" },
      { key: "title", label: "Título", placeholder: "3 cosas que *nadie* te dice de tu primer trabajo en data", multiline: true },
      { key: "subtitle", label: "Bajada", placeholder: "spoiler: no es SQL" },
      { key: "swipe", label: "Texto de deslizar", placeholder: "Deslizá →" },
    ],
  },
  {
    id: "dato",
    label: "Slide de dato",
    fields: [
      { key: "eyebrow", label: "Antetítulo", placeholder: "Dato" },
      { key: "number", label: "Número grande", placeholder: "73%" },
      { key: "label", label: "Qué significa", placeholder: "de los dashboards *nadie* los abre después del primer mes", multiline: true },
      { key: "source", label: "Fuente", placeholder: "Fuente: encuesta interna 2026" },
    ],
  },
  {
    id: "lista",
    label: "Slide de lista",
    fields: [
      { key: "title", label: "Título", placeholder: "Lo que sí importa" },
      { key: "items", label: "Ítems (uno por línea, máx. 5)", placeholder: "Preguntar el porqué\nContar una historia\nSimplificar", multiline: true },
    ],
  },
  {
    id: "cita",
    label: "Cita",
    fields: [
      { key: "quote", label: "Cita", placeholder: "Un dato sin contexto es solo un número *lindo*.", multiline: true },
      { key: "author", label: "Autor", placeholder: "— Milo" },
    ],
  },
  {
    id: "cta",
    label: "CTA final",
    fields: [
      { key: "title", label: "Título", placeholder: "¿Te sirvió? *Guardalo.*", multiline: true },
      { key: "action", label: "Acción", placeholder: "Comentá GUIA y te la mando por DM" },
      { key: "handle", label: "Firma", placeholder: "@databymilo" },
    ],
  },
];

export const DESIGN_BY_ID = Object.fromEntries(DESIGNS.map((d) => [d.id, d]));

/** Texto visible de un slide (para contar palabras contra las reglas). */
export function slideText(design, data = {}) {
  const d = DESIGN_BY_ID[design];
  if (!d) return "";
  return d.fields
    .filter((f) => f.key !== "swipe" && f.key !== "handle" && f.key !== "source")
    .map((f) => String(data[f.key] || "").replace(/\*/g, ""))
    .join(" ");
}

/** Arma la query string del generador. */
export function renderQuery({ design, size, theme, page, total, data }) {
  const sp = new URLSearchParams({ design, size, theme });
  if (page) sp.set("page", String(page));
  if (total) sp.set("total", String(total));
  for (const [k, v] of Object.entries(data || {})) if (v) sp.set(`f_${k}`, String(v).slice(0, 600));
  return sp.toString();
}
