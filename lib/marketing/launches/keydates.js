// Fechas clave (tabla mk_launches_keydates). Solo servidor.
// Para el calendario u otras áreas:
//
//   import { listKeyDates } from "@/lib/marketing/launches/keydates";
//   const fechas = await listKeyDates({ from: "2026-12-01", to: "2026-12-31" });
//   // → [{ id, name, starts_on, ends_on, kind, region, approximate, notes, days_left }]
//
// Una fecha entra si su rango [starts_on, ends_on] se cruza con [from, to].
import { getSupabaseAdmin } from "@/lib/supabase";
import { addDays, daysUntil, todayAR } from "./dates";

export { KEYDATE_KINDS, KEYDATE_REGIONS, KEYDATE_KIND_BY_ID } from "./constants";

export const KEYDATE_FIELDS = "id, name, starts_on, ends_on, kind, region, approximate, notes, active";

export async function listKeyDates({ from, to, includeInactive = false, supabase } = {}) {
  const db = supabase || getSupabaseAdmin();
  let q = db.from("mk_launches_keydates").select(KEYDATE_FIELDS).order("starts_on", { ascending: true });
  if (!includeInactive) q = q.eq("active", true);
  // Traemos desde un poco antes por las fechas de varios días que empezaron antes de "from".
  if (from) q = q.gte("starts_on", addDays(from, -60));
  if (to) q = q.lte("starts_on", to);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const today = todayAR();
  return (data || [])
    .filter((k) => !from || (k.ends_on || k.starts_on) >= from)
    .map((k) => ({ ...k, days_left: daysUntil(k.starts_on, today) }));
}

// Próximas fechas (incluye las que están en curso hoy).
export async function upcomingKeyDates({ days = 120, limit, supabase } = {}) {
  const today = todayAR();
  const list = await listKeyDates({ from: today, to: addDays(today, days), supabase });
  return limit ? list.slice(0, limit) : list;
}

// Normaliza el cuerpo de un POST/PUT.
export function keydateFromBody(body) {
  const out = {};
  if (body.name !== undefined) out.name = String(body.name || "").trim();
  if (body.starts_on !== undefined) out.starts_on = body.starts_on || null;
  if (body.ends_on !== undefined) out.ends_on = body.ends_on || null;
  if (body.kind !== undefined) out.kind = body.kind || "comercial";
  if (body.region !== undefined) out.region = body.region || "AR";
  if (body.approximate !== undefined) out.approximate = !!body.approximate;
  if (body.notes !== undefined) out.notes = body.notes ? String(body.notes) : null;
  if (body.active !== undefined) out.active = !!body.active;
  if (out.ends_on && out.starts_on && out.ends_on < out.starts_on) out.ends_on = null;
  return out;
}
