// Nombres legibles de las herramientas del chat (se usan en la UI y en el servidor).
export const TOOL_LABELS = {
  list_content: "Revisó el calendario",
  get_content: "Abrió una pieza",
  create_content: "Creó una pieza",
  update_content: "Editó piezas",
  discard_content: "Descartó piezas",
  save_drafts: "Guardó borradores",
  list_pillars: "Revisó los pilares",
  create_pillar: "Creó un pilar",
  update_pillar: "Editó un pilar",
  pillar_balance: "Calculó el balance de pilares",
  list_series: "Revisó las series",
  create_series: "Creó una serie",
  update_series: "Editó una serie",
  list_blog_posts: "Revisó el blog",
  get_blog_post: "Leyó un post del blog",
  list_resources: "Revisó los recursos",
  get_brand: "Leyó el sistema de marca",
};

export function toolLabel(name) {
  return TOOL_LABELS[name] || name;
}

// Atajos de la pantalla de chat.
export const SUGGESTIONS = [
  { label: "¿Qué me toca esta semana?", prompt: "¿Qué me toca esta semana? Revisá el calendario y decime qué falta preparar." },
  { label: "10 ideas para Educativo", prompt: "Dame 10 ideas para el pilar Educativo, pensadas para LinkedIn e Instagram." },
  { label: "Reutilizá mi último post", prompt: "Reutilizá mi último post del blog: carrusel de LinkedIn, hilo, guion de reel de 30 s y email." },
  { label: "¿Cómo vienen mis pilares?", prompt: "¿Cómo viene el balance de pilares de este mes contra el objetivo?" },
  { label: "Ganchos y captions", prompt: "Necesito 5 ganchos y 2 captions para un post. Preguntame el tema si no lo sabés." },
  { label: "Guion de reel de 30 s", prompt: "Armame un guion de reel de 30 segundos con estructura gancho → valor → CTA. Preguntame el tema si no lo sabés." },
];

export function repurposePrompt(slug) {
  return `Reutilizá mi post del blog "${slug}" en redes: carrusel de LinkedIn, hilo, guion de reel de 30 s y email. Mostrame los borradores y ofrecé guardarlos.`;
}
