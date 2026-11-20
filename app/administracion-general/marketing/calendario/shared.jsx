"use client";
// Piezas chicas compartidas por calendario, ideas y resumen.
import { NETWORK_BY_ID, STATUS_BY_ID, FORMAT_BY_ID } from "@/lib/marketing/constants";
import { arDateKey, arTime, shortDayLabel } from "@/lib/marketing/content/dates";

export const FALLBACK_COLOR = "#a59098";

export function pieceColor(piece, colorBy, pillarsById) {
  if (colorBy === "pillar") return pillarsById?.[piece.pillar_id]?.color || FALLBACK_COLOR;
  return NETWORK_BY_ID[piece.network]?.color || FALLBACK_COLOR;
}

export function StatusBadge({ status }) {
  const s = STATUS_BY_ID[status];
  if (!s) return null;
  return (
    <span className="mk-cal-status" style={{ "--c": s.color }}>
      {s.label}
    </span>
  );
}

export function NetworkTag({ network }) {
  const n = NETWORK_BY_ID[network];
  if (!n) return null;
  return (
    <span className="mk-cal-net" style={{ "--c": n.color }}>
      {n.label}
    </span>
  );
}

export function formatLabel(id) {
  return FORMAT_BY_ID[id]?.label || "";
}

export function whenText(iso) {
  if (!iso) return "Sin fecha";
  return `${shortDayLabel(arDateKey(iso))} · ${arTime(iso)}`;
}

export function Stars({ value, onChange, size = "md" }) {
  return (
    <span className={`mk-cal-stars mk-cal-stars-${size}`} role="radiogroup" aria-label="Puntaje">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} de 5`}
          className={value >= n ? "on" : ""}
          onClick={onChange ? () => onChange(value === n ? null : n) : undefined}
          disabled={!onChange}
        >
          ★
        </button>
      ))}
    </span>
  );
}

export function byId(list) {
  return Object.fromEntries((list || []).map((x) => [x.id, x]));
}
