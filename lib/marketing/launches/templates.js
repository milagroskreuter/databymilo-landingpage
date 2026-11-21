import { PHASE_BY_ID } from "./constants";

// Normaliza una plantilla de tarea recibida del admin.
export function templateFromBody(body) {
  const out = {};
  if (body.title !== undefined) out.title = String(body.title || "").trim();
  if (body.description !== undefined) out.description = body.description ? String(body.description) : null;
  if (body.phase !== undefined) out.phase = PHASE_BY_ID[body.phase] ? body.phase : "pre";
  if (body.anchor !== undefined) out.anchor = body.anchor === "end" ? "end" : "launch";
  if (body.offset_days !== undefined) {
    const n = parseInt(body.offset_days, 10);
    out.offset_days = Number.isFinite(n) ? n : 0;
  }
  if (body.sort_order !== undefined) {
    const n = parseInt(body.sort_order, 10);
    out.sort_order = Number.isFinite(n) ? n : 0;
  }
  if (body.active !== undefined) out.active = !!body.active;
  return out;
}
