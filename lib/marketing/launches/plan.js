// Plan base de piezas para un lanzamiento de ebook en LinkedIn e Instagram.
// Cada pieza cae en el calendario (mk_content) con fecha y hora.
import { addDays, atTimeIso, todayAR } from "./dates";
import { effectiveDates } from "./schedule";
import { PIECE_SOURCE } from "./constants";

// anchor: launch | end; offset en días; time en hora de Argentina.
const BASE_PLAN = [
  // Antes
  { phase: "pre", anchor: "launch", offset: -14, network: "linkedin", format: "post", time: "09:00",
    title: "El problema que resuelve", hook: "El error que veo una y otra vez cuando alguien empieza con datos…" },
  { phase: "pre", anchor: "launch", offset: -12, network: "instagram", format: "carrusel", time: "18:00",
    title: "Mito o error común del tema", hook: "Esto que te dijeron sobre el análisis de datos no es tan así" },
  { phase: "pre", anchor: "launch", offset: -10, network: "linkedin", format: "carrusel", time: "09:00",
    title: "Detrás de escena: cómo armé el ebook", hook: "Me llevó meses escribir esto. Te cuento cómo fue." },
  { phase: "pre", anchor: "launch", offset: -7, network: "instagram", format: "reel", time: "18:00",
    title: "Anuncio: se viene + lista de espera", cta: "Sumate a la lista de espera (link en bio)" },
  { phase: "pre", anchor: "launch", offset: -7, network: "linkedin", format: "post", time: "09:00",
    title: "Anuncio de fecha + lista de espera", cta: "Comentá \"quiero\" y te aviso cuando abra" },
  { phase: "pre", anchor: "launch", offset: -4, network: "instagram", format: "carrusel", time: "18:00",
    title: "Adelanto: una página del ebook", hook: "Te muestro una parte de lo que vas a encontrar" },
  { phase: "pre", anchor: "launch", offset: -2, network: "linkedin", format: "post", time: "09:00",
    title: "Para quién es (y para quién no)" },
  { phase: "pre", anchor: "launch", offset: -1, network: "instagram", format: "historia", time: "19:00",
    title: "Cuenta regresiva: mañana abre" },
  // Día de apertura y venta abierta
  { phase: "launch", anchor: "launch", offset: 0, network: "linkedin", format: "post", time: "09:00",
    title: "¡Ya está disponible!", cta: "Link en el primer comentario" },
  { phase: "launch", anchor: "launch", offset: 0, network: "instagram", format: "carrusel", time: "12:00",
    title: "Qué incluye el ebook", cta: "Link en bio" },
  { phase: "launch", anchor: "launch", offset: 0, network: "instagram", format: "historia", time: "19:00",
    title: "Historias de apertura con link" },
  { phase: "launch", anchor: "launch", offset: 2, network: "instagram", format: "reel", time: "18:00",
    title: "Primeras reacciones y testimonios" },
  { phase: "launch", anchor: "launch", offset: 3, network: "linkedin", format: "post", time: "09:00",
    title: "Preguntas frecuentes sobre el ebook" },
  { phase: "launch", anchor: "end", offset: -1, network: "instagram", format: "historia", time: "19:00",
    title: "Recordatorio: queda un día" },
  { phase: "launch", anchor: "end", offset: 0, network: "linkedin", format: "post", time: "09:00",
    title: "Último día del lanzamiento" },
  { phase: "launch", anchor: "end", offset: 0, network: "instagram", format: "historia", time: "18:00",
    title: "Cierra hoy" },
  // Después
  { phase: "post", anchor: "end", offset: 3, network: "linkedin", format: "post", time: "09:00",
    title: "Lo que aprendí lanzando este ebook" },
  { phase: "post", anchor: "end", offset: 5, network: "instagram", format: "carrusel", time: "18:00",
    title: "Testimonios de lectoras" },
];

// Lista de piezas propuestas (sin guardar). Marca las que ya existen (mismo título + red)
// y las que quedarían en el pasado.
export function buildPiecePlan(launch, existing = []) {
  const { launchOn, endsOn } = effectiveDates(launch);
  if (!launchOn) return [];
  const today = todayAR();
  const name = launch.name?.trim() || "Lanzamiento";
  const taken = new Set(existing.map((c) => `${c.network}|${(c.title || "").toLowerCase()}`));

  return BASE_PLAN.map((p, i) => {
    const date = addDays(p.anchor === "end" ? endsOn : launchOn, p.offset);
    const title = `${name}: ${p.title}`;
    return {
      key: String(i),
      phase: p.phase,
      network: p.network,
      format: p.format,
      date,
      time: p.time,
      title,
      hook: p.hook || null,
      cta: p.cta || null,
      exists: taken.has(`${p.network}|${title.toLowerCase()}`),
      past: date < today,
    };
  }).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

// Fila para insertar en mk_content.
export function pieceRow({ title, network, format, date, time = "10:00", hook, cta, notes }, { launchId, pillarId } = {}) {
  return {
    title,
    status: "idea",
    network: network || null,
    format: format || null,
    pillar_id: pillarId || null,
    launch_id: launchId || null,
    scheduled_at: date ? atTimeIso(date, time) : null,
    hook: hook || null,
    cta: cta || null,
    notes: notes || null,
    tags: ["lanzamiento"],
    source: PIECE_SOURCE,
  };
}

// Id del pilar "Venta" (si existe) para las piezas de lanzamiento.
export async function salesPillarId(supabase) {
  const { data } = await supabase.from("mk_pillars").select("id, name").eq("active", true);
  return (data || []).find((p) => /venta/i.test(p.name))?.id || null;
}
