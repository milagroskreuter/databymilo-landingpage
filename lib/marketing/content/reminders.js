// Avisos diarios del calendario editorial (los manda el cron
// /api/cron/marketing-reminders). Funciones puras: reciben piezas y devuelven
// los avisos a crear; el cron se encarga de no repetirlos el mismo día.

import { networkLabel } from "@/lib/marketing/constants";
import { arDateKey, arTime, arDayStartISO, addDaysKey, shortDayLabel, DAY_MS } from "./dates";

// Redes donde no puede pasar una semana sin nada en el calendario.
export const MAIN_NETWORKS = ["linkedin", "instagram"];
const OPEN = (p) => p.status !== "publicado" && p.status !== "descartado";

function list(pieces, withDay = false) {
  const lines = pieces.slice(0, 8).map((p) => {
    const when = withDay ? `${shortDayLabel(arDateKey(p.scheduled_at))} ` : "";
    const net = p.network ? ` (${networkLabel(p.network)})` : "";
    return `• ${when}${arTime(p.scheduled_at)} ${p.title}${net}`;
  });
  if (pieces.length > 8) lines.push(`… y ${pieces.length - 8} más`);
  return lines.join("\n");
}

/**
 * pieces: filas de mk_content con scheduled_at desde hace un tiempo en adelante.
 * Devuelve [{ kind, title, body, metadata }]. `kind` identifica el aviso del día.
 */
export function computeReminders(pieces, { now = Date.now() } = {}) {
  const today = arDateKey(now);
  const todayStart = new Date(arDayStartISO(today)).getTime();
  const tomorrowStart = new Date(arDayStartISO(addDaysKey(today, 1))).getTime();
  const weekEnd = now + 7 * DAY_MS;
  const dated = (pieces || []).filter((p) => p.scheduled_at);
  const t = (p) => new Date(p.scheduled_at).getTime();
  const out = [];

  const forToday = dated.filter((p) => OPEN(p) && p.status !== "idea" && t(p) >= todayStart && t(p) < tomorrowStart);
  if (forToday.length) {
    out.push({
      kind: "today",
      title: forToday.length === 1 ? `Hoy toca publicar: ${forToday[0].title}` : `Hoy tenés ${forToday.length} piezas para publicar`,
      body: list(forToday),
      metadata: { ids: forToday.map((p) => p.id) },
    });
  }

  const overdue = dated.filter((p) => OPEN(p) && p.status !== "idea" && t(p) < todayStart);
  if (overdue.length) {
    out.push({
      kind: "overdue",
      title: overdue.length === 1 ? "Tenés 1 pieza atrasada" : `Tenés ${overdue.length} piezas atrasadas`,
      body: `Tenían fecha y todavía no están publicadas:\n${list(overdue, true)}\n\nPublicalas, cambiales la fecha o descartalas.`,
      metadata: { ids: overdue.map((p) => p.id) },
    });
  }

  for (const net of MAIN_NETWORKS) {
    const next = dated.filter((p) => p.network === net && p.status !== "descartado" && t(p) >= now && t(p) < weekEnd);
    if (!next.length) {
      out.push({
        kind: `gap-${net}`,
        title: `${networkLabel(net)}: nada programado en los próximos 7 días`,
        body: `No hay ninguna pieza de ${networkLabel(net)} en el calendario para esta semana. Pasá una idea al calendario o generá las piezas de una serie.`,
        metadata: { network: net },
      });
    }
  }

  return out.map((r) => ({ ...r, metadata: { ...r.metadata, kind: r.kind, day: today, link: "/administracion-general/marketing/calendario" } }));
}
