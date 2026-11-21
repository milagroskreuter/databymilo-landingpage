// Sistema de marca de Data by Milo: valores iniciales y forma de cada clave.
// Se guarda en la tabla compartida mk_brand (clave → jsonb). Lo leen las
// plantillas, el chat IA y el chequeo de coherencia, así que los nombres de
// las claves y de los campos de abajo son un contrato: se pueden agregar
// campos, no renombrar.
//
// Valores sacados del sitio real: app/globals.css (paleta y tipografías),
// lib/og/template.jsx (imágenes para compartir) y los mails de lib/notify.js.

export const BRAND_KEYS = ["palette", "typography", "voice", "rules", "bios", "moodboard", "logo", "references"];

// Roles de color que usan las plantillas (cada color de la paleta tiene uno).
export const COLOR_ROLES = [
  { id: "principal", label: "Principal" },
  { id: "acento", label: "Acento" },
  { id: "fondo", label: "Fondo" },
  { id: "texto", label: "Texto" },
  { id: "destacado", label: "Destacado" },
  { id: "suave", label: "Suave" },
  { id: "neutro", label: "Neutro" },
];

export const DEFAULT_BRAND = {
  // palette.colors[]: { name, hex, role, use }
  palette: {
    colors: [
      { name: "Vino", hex: "#8b1a4a", role: "principal", use: "Fondo de portadas y placas, botones, títulos sobre crema." },
      { name: "Rosa", hex: "#d4447a", role: "acento", use: "Acentos, palabras destacadas, links. Nunca como fondo de texto largo." },
      { name: "Crema", hex: "#fdf5ec", role: "fondo", use: "Fondo general y texto sobre vino." },
      { name: "Tinta", hex: "#1a1a1a", role: "texto", use: "Texto de cuerpo sobre crema o blanco." },
      { name: "Rosa suave", hex: "#f2b7d1", role: "suave", use: "Eyebrows y detalles sobre vino; fondos de tarjetas." },
      { name: "Manteca", hex: "#fbe7a8", role: "destacado", use: "Resaltar un dato o una palabra. Poca superficie." },
      { name: "Lavanda", hex: "#e8d9f0", role: "neutro", use: "Fondos alternativos suaves (degradés con rosa)." },
    ],
    notes: "Base cálida: crema + vino. El rosa y la manteca son acentos, no fondos.",
  },

  // typography.fonts[]: { role, family, weight, style, use }
  typography: {
    fonts: [
      { role: "titulos", family: "Playfair Display", weight: "700", style: "italic", use: "Títulos y frases grandes. Itálica bold, interlineado apretado (1.08)." },
      { role: "cuerpo", family: "Montserrat", weight: "500–600", style: "normal", use: "Texto de cuerpo, datos, botones. Eyebrows en mayúsculas con espaciado 0.18–0.22em." },
      { role: "acento", family: "Caveat", weight: "600", style: "normal", use: "Notas al margen escritas a mano. Una por pieza como mucho." },
    ],
    scale: "Título 64–96 px en placas 1080; cuerpo 30–40 px; eyebrow 22–26 px.",
    notes: "En mails se usa Georgia itálica para títulos y Arial para el cuerpo (no cargan fuentes web).",
  },

  voice: {
    tone: "Cercana, honesta y con humor. Como una amiga que trabaja en tech y te cuenta lo que nadie te dice: data, pero cute.",
    traits: ["español rioplatense con vos", "frases cortas", "desde adentro (experiencia propia)", "útil antes que viral"],
    words_yes: ["contado desde adentro", "te dejo", "guardalo", "data", "corpo", "cuaderno", "probá", "spoiler"],
    words_no: ["tú / usted", "sinergia", "disruptivo", "gurú", "hackeá tu carrera", "100% garantizado", "¡Hola a todos!"],
    examples_good: [
      "la corpo no te lo cuenta, pero yo sí.",
      "Una carta los domingos. Corta y útil.",
      "Sin spam · cancelá cuando quieras",
      "Ups, algo se enredó. Probá de nuevo.",
    ],
    examples_bad: [
      "¡¡Descubre los 10 secretos que los expertos no quieren que sepas!!",
      "Estimado usuario, le informamos que…",
    ],
    notes: "Emojis con moderación (✦ ✧ ♥ en vez de caritas). Nada de mayúsculas sostenidas para gritar.",
  },

  // rules: valores numéricos que chequean las plantillas + reglas en texto.
  rules: {
    max_colors_per_piece: 2,
    max_words_per_slide: 20,
    max_fonts_per_piece: 2,
    items: [
      "Máximo 2 colores protagonistas por pieza (más crema o tinta como base).",
      "Texto máximo 20 palabras por placa o slide.",
      "Títulos en Playfair itálica; cuerpo en Montserrat. No mezclar otras fuentes.",
      "Siempre la firma data · by milo o @databymilo en la última slide.",
      "Una sola idea por slide; el dato grande, la explicación chica.",
      "Márgenes generosos: al menos 80 px en placas de 1080.",
      "Fotos cálidas y con luz natural; nada de bancos de imágenes corporativos fríos.",
    ],
  },

  // bios: una por red (ids de lib/marketing/constants.js → NETWORKS).
  bios: {
    instagram: "Tech, data e IA contado desde adentro ✦\nla corpo no te lo cuenta, pero yo sí.\n↓ guías y carta de los domingos",
    linkedin: "Tech, data e IA contado desde adentro: lo que la corpo no te cuenta y nadie te explica en los cursos. Escribo una carta los domingos en databymilo.me",
    threads: "data, pero cute ✦ tech e IA contado desde adentro",
    youtube: "Tech, data e IA contado desde adentro. Tutoriales, carrera y lo que la corpo no te cuenta.",
    tiktok: "",
    newsletter: "Una carta los domingos. Corta y útil.",
  },

  // moodboard: tablero de Pinterest + imágenes de referencia de la biblioteca.
  moodboard: {
    pinterest_url: "",
    notes: "Cálido, editorial y un poco coqueto: papel crema, cuaderno, washi tape, rosa y vino.",
    asset_ids: [],
  },

  logo: {
    wordmark: "data · by milo",
    description: "Wordmark en Playfair Display itálica bold; el punto del medio va en manteca (#fbe7a8) sobre vino o en rosa sobre crema.",
    handle: "@databymilo",
    site: "databymilo.me",
    asset_id: null,
    usage: [
      "Sobre vino: texto crema y punto manteca.",
      "Sobre crema: texto vino y punto rosa.",
      "No deformar, no sombras, no contornos.",
    ],
  },

  references: {
    design_system_url: "https://claude.ai/artifact/FHK96eK6F7SPDZrdPNKAyT",
    notes: "Sistema de diseño en Claude Design armado desde el sitio real.",
  },
};

export const SNIPPET_KINDS = [
  { id: "cta", label: "CTA" },
  { id: "bio", label: "Bio" },
  { id: "dm", label: "Respuesta a DM" },
  { id: "comentario", label: "Comentá y te lo mando" },
  { id: "hashtags", label: "Hashtags" },
  { id: "otro", label: "Otro" },
];

export const ASSET_SOURCES = [
  { id: "upload", label: "Subido" },
  { id: "template", label: "Plantilla" },
  { id: "unsplash", label: "Unsplash" },
  { id: "canva", label: "Canva" },
];

export const ASSET_BUCKET = "marketing-assets";

/** Devuelve el hex del primer color con ese rol, o el fallback. */
export function colorByRole(palette, role, fallback) {
  const c = (palette?.colors || []).find((x) => x.role === role && /^#[0-9a-f]{3,8}$/i.test(x.hex || ""));
  return c?.hex || fallback;
}

/** Une lo guardado con los valores iniciales (las claves que falten toman el default). */
export function withDefaults(saved = {}) {
  const out = {};
  for (const key of BRAND_KEYS) {
    const def = DEFAULT_BRAND[key];
    const val = saved[key];
    out[key] = val && typeof val === "object" && !Array.isArray(val) ? { ...def, ...val } : def;
  }
  return out;
}

export function countWords(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}
