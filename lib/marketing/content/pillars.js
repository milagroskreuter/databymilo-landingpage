// Pilares de contenido (mk_pillars) y balance real contra el objetivo.

import { DAY_MS } from "./dates";

export const PILLARS_TABLE = "mk_pillars";
const HEX_RE = /^#[0-9a-f]{6}$/i;

export function validatePillar(input, { partial = false } = {}) {
  if (!input || typeof input !== "object") return { error: "Datos inválidos" };
  const data = {};
  const has = (k) => Object.prototype.hasOwnProperty.call(input, k);

  if (!partial || has("name")) {
    const name = String(input.name || "").trim().slice(0, 60);
    if (!name) return { error: "El pilar necesita un nombre" };
    data.name = name;
  }
  if (has("description")) data.description = String(input.description || "").trim().slice(0, 300) || null;
  if (has("color") || !partial) {
    const color = input.color || "#8b1a4a";
    if (!HEX_RE.test(color)) return { error: "Color inválido (usá #rrggbb)" };
    data.color = color;
  }
  if (has("target_pct")) {
    if (input.target_pct == null || input.target_pct === "") data.target_pct = null;
    else {
      const n = Math.round(Number(input.target_pct));
      if (!Number.isFinite(n) || n < 0 || n > 100) return { error: "El objetivo va de 0 a 100%" };
      data.target_pct = n;
    }
  }
  if (has("sort_order")) data.sort_order = Math.round(Number(input.sort_order)) || 0;
  if (has("active")) data.active = !!input.active;
  return { data };
}

export function isSalesPillar(pillar) {
  return /venta/i.test(pillar?.name || "");
}

/**
 * Balance de pilares: % de piezas por pilar en los últimos `days` días más todo
 * lo próximo (con fecha), contra el % objetivo de cada pilar.
 * Cuenta piezas con fecha y no descartadas; las ideas sin fecha no cuentan.
 */
export function pillarBalance(pieces, pillars, { now = Date.now(), days = 30 } = {}) {
  const since = now - days * DAY_MS;
  const counted = (pieces || []).filter(
    (p) => p.scheduled_at && p.status !== "descartado" && new Date(p.scheduled_at).getTime() >= since
  );
  const byPillar = new Map();
  let withoutPillar = 0;
  for (const p of counted) {
    if (!p.pillar_id) withoutPillar++;
    else byPillar.set(p.pillar_id, (byPillar.get(p.pillar_id) || 0) + 1);
  }
  const withPillar = counted.length - withoutPillar;
  const rows = (pillars || [])
    .filter((pl) => pl.active !== false || byPillar.get(pl.id))
    .map((pl) => {
      const count = byPillar.get(pl.id) || 0;
      const pct = withPillar ? Math.round((count / withPillar) * 100) : 0;
      const target = pl.target_pct ?? null;
      return {
        id: pl.id,
        name: pl.name,
        color: pl.color,
        count,
        pct,
        target,
        diff: target == null ? null : pct - target,
        isSales: isSalesPillar(pl),
      };
    });
  const sales = rows.find((r) => r.isSales);
  const salesOver = !!(sales && sales.target != null && withPillar > 0 && sales.pct > sales.target);
  const targetSum = (pillars || []).filter((p) => p.active !== false).reduce((s, p) => s + (p.target_pct || 0), 0);
  return { rows, total: counted.length, withPillar, withoutPillar, salesOver, sales, targetSum };
}
