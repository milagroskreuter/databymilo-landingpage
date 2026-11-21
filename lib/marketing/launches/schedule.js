import { addDays } from "./dates";
import { DEFAULT_OPEN_DAYS, DEFAULT_PRE_DAYS } from "./constants";

// Fechas efectivas de un lanzamiento: completa las que falten con valores por defecto.
export function effectiveDates(launch) {
  const launchOn = launch?.launch_on || null;
  if (!launchOn) return { startsOn: launch?.starts_on || null, launchOn: null, endsOn: launch?.ends_on || null };
  return {
    startsOn: launch.starts_on || addDays(launchOn, -DEFAULT_PRE_DAYS),
    launchOn,
    endsOn: launch.ends_on || addDays(launchOn, DEFAULT_OPEN_DAYS),
  };
}

// Fecha de una tarea según su ancla y desplazamiento.
export function dueDateFor(launch, anchor, offsetDays) {
  if (!anchor || offsetDays == null) return null;
  const { launchOn, endsOn } = effectiveDates(launch);
  const base = anchor === "end" ? endsOn : launchOn;
  return base ? addDays(base, offsetDays) : null;
}

// Filas de mk_launches_tasks a partir de las plantillas activas.
export function tasksFromTemplates(launch, templates) {
  return templates
    .filter((t) => t.active !== false)
    .map((t) => ({
      launch_id: launch.id,
      template_id: t.id,
      phase: t.phase,
      title: t.title,
      description: t.description || null,
      anchor: t.anchor,
      offset_days: t.offset_days,
      due_on: dueDateFor(launch, t.anchor, t.offset_days),
      sort_order: t.sort_order ?? 0,
    }));
}

// Fase según una fecha.
export function phaseForDate(launch, date) {
  const { launchOn, endsOn } = effectiveDates(launch);
  if (!date || !launchOn) return "pre";
  if (date < launchOn) return "pre";
  if (date <= endsOn) return "launch";
  return "post";
}
