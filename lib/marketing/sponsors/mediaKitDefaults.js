// Textos y opciones por defecto del media kit (/media-kit). Se guardan editados en
// mk_sponsors_settings (clave 'media_kit'); lo que no se editó sale de acá.

export const MEDIA_KIT_KEY = "media_kit";

export const MEDIA_KIT_STATS = [
  { id: "followers", label: "Seguidores por red" },
  { id: "engagement", label: "Engagement promedio" },
  { id: "newsletter", label: "Suscriptoras de la newsletter" },
  { id: "visits", label: "Visitas al sitio (30 días)" },
];

export const DEFAULT_MEDIA_KIT = {
  hero_title: "Tech, data e IA contados desde adentro.",
  hero_sub:
    "Data by Milo es un cuaderno sobre la vida en la corpo, la IA aplicada y la carrera en tech, para mujeres de LATAM que trabajan o quieren trabajar en tech.",
  about:
    "Soy Milo. Trabajo en data para una fintech del exterior, desde Buenos Aires, y antes pasé por una de las corpos tech más grandes de LATAM. Cuento lo que veo desde adentro, sin filtro corporativo ni motivacional: cómo se trabaja de verdad con datos, qué pasa con la IA en las empresas y cómo se arma una carrera en tech.",
  topics: [
    { title: "Vida en la corpo", desc: "Anécdotas, dinámicas internas y la diferencia entre cómo se vende trabajar en tech y cómo se vive." },
    { title: "IA aplicada", desc: "Qué se usa de verdad en las empresas, qué es humo y cómo sacarle provecho en el trabajo diario." },
    { title: "Data explicada simple", desc: "SQL, BI, Python y análisis de datos explicados como a una amiga en un café." },
    { title: "Carrera en tech", desc: "Entrevistas, cambios de rol, sueldos y decisiones de carrera en LATAM." },
  ],
  audience_text:
    "Una comunidad que trabaja con datos o quiere hacerlo: lee, guarda y comparte contenido práctico sobre herramientas, carrera y trabajo en tech.",
  audience_points: [
    "Mujeres de LATAM, mayormente de 22 a 35 años",
    "Analistas, perfiles junior y semi senior, y personas en transición a tech",
    "Interés en herramientas de datos, IA, productividad y desarrollo profesional",
  ],
  collab_formats: [
    { title: "Post o carrusel patrocinado", desc: "Una pieza en LinkedIn o Instagram, con mi voz y tu producto en un caso real." },
    { title: "Mención en la newsletter", desc: "Un bloque en La carta del domingo, con link y llamado a la acción." },
    { title: "Reseña o tutorial", desc: "Uso la herramienta de verdad y cuento cómo me sirvió, paso a paso." },
    { title: "Paquete o embajadora", desc: "Varias piezas durante uno a tres meses, con reporte de resultados al final." },
  ],
  rates_note: "Precios de referencia. Los paquetes se arman a medida.",
  brands_extra: [],
  contact_email: "databymilo@gmail.com",
  contact_text: "¿Tenés una marca o un producto que le sirve a esta comunidad? Escribime y lo armamos juntas.",
  contact_cta: "Escribime",
  booking_url: "",
  networks: [], // vacío = todas las redes con datos
  show: {
    followers: true,
    engagement: true,
    newsletter: true,
    visits: true,
    rates: false,
    brands: true,
    collab_formats: true,
    audience: true,
  },
  indexable: false,
};

/** Une lo guardado con los valores por defecto (campo por campo). */
export function mergeMediaKit(saved) {
  const s = saved && typeof saved === "object" ? saved : {};
  return {
    ...DEFAULT_MEDIA_KIT,
    ...s,
    show: { ...DEFAULT_MEDIA_KIT.show, ...(s.show || {}) },
  };
}
