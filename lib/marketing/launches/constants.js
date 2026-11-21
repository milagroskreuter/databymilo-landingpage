// Valores del área Lanzamientos (están guardados en la base: no renombrar ids).

export const LAUNCH_STATUSES = [
  { id: "planning", label: "Planificando", color: "#d99a3e" },
  { id: "active", label: "En curso", color: "#17663e" },
  { id: "done", label: "Terminado", color: "#7c3aed" },
  { id: "canceled", label: "Cancelado", color: "#9a8a90" },
];

export const PHASES = [
  { id: "pre", label: "Pre-lanzamiento", short: "Antes" },
  { id: "launch", label: "Lanzamiento y venta abierta", short: "Durante" },
  { id: "post", label: "Post-lanzamiento", short: "Después" },
];

export const ANCHORS = [
  { id: "launch", label: "la apertura" },
  { id: "end", label: "el cierre" },
];

export const KEYDATE_KINDS = [
  { id: "comercial", label: "Comercial", color: "#17663e" },
  { id: "contenido", label: "Contenido", color: "#0a66c2" },
  { id: "efemeride", label: "Efeméride", color: "#d99a3e" },
  { id: "personal", label: "Propia", color: "#8b1a4a" },
];

export const KEYDATE_REGIONS = [
  { id: "AR", label: "Argentina" },
  { id: "LatAm", label: "LatAm" },
  { id: "Global", label: "Global" },
];

// Días por defecto alrededor de la apertura cuando faltan fechas.
export const DEFAULT_PRE_DAYS = 21;
export const DEFAULT_OPEN_DAYS = 7;

const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
export const LAUNCH_STATUS_BY_ID = byId(LAUNCH_STATUSES);
export const PHASE_BY_ID = byId(PHASES);
export const KEYDATE_KIND_BY_ID = byId(KEYDATE_KINDS);

export const PIECE_SOURCE = "lanzamiento"; // valor de mk_content.source para piezas creadas desde acá
