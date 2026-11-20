"use client";
// Vistas de calendario (mes y semana), tablero por estado y lista.
// Arrastrar usa drag & drop nativo: el id de la pieza viaja en dataTransfer.
import { useState } from "react";
import { STATUSES, STATUS_BY_ID, NETWORK_BY_ID } from "@/lib/marketing/constants";
import { PIPELINE } from "@/lib/marketing/content";
import {
  arDateKey, arTime, addDaysKey, weekStartKey, monthKey, shortDayLabel, WEEKDAYS,
} from "@/lib/marketing/content/dates";
import { pieceColor, StatusBadge, NetworkTag, formatLabel, whenText } from "./shared";

const DRAG_TYPE = "text/plain";

function startDrag(e, piece) {
  e.dataTransfer.setData(DRAG_TYPE, piece.id);
  e.dataTransfer.effectAllowed = "move";
}

function useDropZone(onDropId) {
  const [over, setOver] = useState(false);
  return {
    over,
    props: {
      onDragOver: (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!over) setOver(true);
      },
      onDragLeave: (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOver(false);
      },
      onDrop: (e) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData(DRAG_TYPE);
        if (id) onDropId(id);
      },
    },
  };
}

function Chip({ piece, ctx, detailed = false }) {
  const color = pieceColor(piece, ctx.colorBy, ctx.pillarsById);
  const done = piece.status === "publicado";
  const discarded = piece.status === "descartado";
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => startDrag(e, piece)}
      onClick={(e) => {
        e.stopPropagation();
        ctx.onEdit(piece);
      }}
      className={`mk-cal-chip${done ? " is-done" : ""}${discarded ? " is-discarded" : ""}${detailed ? " is-detailed" : ""}`}
      style={{ "--c": color }}
      title={`${piece.title} · ${STATUS_BY_ID[piece.status]?.label || ""}`}
    >
      <span className="mk-cal-chip-line">
        {piece.scheduled_at && <span className="mk-cal-chip-time">{arTime(piece.scheduled_at)}</span>}
        <span className="mk-cal-chip-title">{piece.title}</span>
      </span>
      {detailed && (
        <span className="mk-cal-chip-meta">
          {NETWORK_BY_ID[piece.network]?.label || "Sin red"}
          {piece.format ? ` · ${formatLabel(piece.format)}` : ""}
          {" · "}
          <span style={{ color: STATUS_BY_ID[piece.status]?.color }}>{STATUS_BY_ID[piece.status]?.label}</span>
        </span>
      )}
    </button>
  );
}

function DayCell({ dayKey, pieces, ctx, outside, detailed = false, header }) {
  const zone = useDropZone((id) => ctx.onMoveToDay(id, dayKey));
  const isToday = dayKey === ctx.todayKey;
  const isPast = dayKey < ctx.todayKey;
  return (
    <div
      {...zone.props}
      className={`mk-cal-day${outside ? " is-outside" : ""}${isToday ? " is-today" : ""}${isPast ? " is-past" : ""}${zone.over ? " is-over" : ""}`}
      onDoubleClick={() => ctx.onCreate({ date: dayKey })}
    >
      <div className="mk-cal-day-head">
        <span className="mk-cal-day-num">{header || Number(dayKey.slice(8))}</span>
        <button type="button" className="mk-cal-day-add" onClick={() => ctx.onCreate({ date: dayKey })} aria-label={`Nueva pieza el ${shortDayLabel(dayKey)}`}>
          +
        </button>
      </div>
      <div className="mk-cal-day-list">
        {pieces.map((p) => (
          <Chip key={p.id} piece={p} ctx={ctx} detailed={detailed} />
        ))}
      </div>
    </div>
  );
}

function groupByDay(pieces) {
  const map = {};
  for (const p of pieces) {
    if (!p.scheduled_at) continue;
    const k = arDateKey(p.scheduled_at);
    (map[k] ||= []).push(p);
  }
  for (const k in map) map[k].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  return map;
}

const WEEK_HEAD = [1, 2, 3, 4, 5, 6, 0].map((d) => WEEKDAYS[d].slice(0, 3));

export function MonthView({ cursor, pieces, ctx }) {
  const ym = monthKey(cursor);
  const first = `${ym}-01`;
  const start = weekStartKey(first);
  const days = [];
  // Semanas completas (lunes a domingo) hasta cubrir el último día del mes.
  for (let d = start; !(days.length % 7 === 0 && monthKey(d) > ym); d = addDaysKey(d, 1)) {
    days.push(d);
  }
  const byDay = groupByDay(pieces);
  return (
    <div className="mk-cal-month">
      {WEEK_HEAD.map((w) => (
        <div key={w} className="mk-cal-wday">
          {w}
        </div>
      ))}
      {days.map((d) => (
        <DayCell key={d} dayKey={d} pieces={byDay[d] || []} ctx={ctx} outside={monthKey(d) !== ym} />
      ))}
    </div>
  );
}

export function WeekView({ cursor, pieces, ctx }) {
  const start = weekStartKey(cursor);
  const days = Array.from({ length: 7 }, (_, i) => addDaysKey(start, i));
  const byDay = groupByDay(pieces);
  return (
    <div className="mk-cal-week">
      {days.map((d) => (
        <DayCell key={d} dayKey={d} pieces={byDay[d] || []} ctx={ctx} detailed header={shortDayLabel(d)} />
      ))}
    </div>
  );
}

/** Piezas sin fecha que no son ideas: se pueden arrastrar a un día. */
export function UnscheduledTray({ pieces, ctx }) {
  const zone = useDropZone((id) => ctx.onUnschedule(id));
  return (
    <div {...zone.props} className={`mk-cal-tray${zone.over ? " is-over" : ""}`}>
      <span className="adm-mini-label">Sin fecha</span>
      {pieces.length ? (
        <div className="mk-cal-tray-list">
          {pieces.map((p) => (
            <Chip key={p.id} piece={p} ctx={ctx} />
          ))}
        </div>
      ) : (
        <span className="mk-cal-tray-empty">Arrastrá acá una pieza para sacarle la fecha.</span>
      )}
    </div>
  );
}

function BoardColumn({ status, pieces, ctx }) {
  const zone = useDropZone((id) => ctx.onMoveToStatus(id, status.id));
  return (
    <div {...zone.props} className={`mk-cal-col${zone.over ? " is-over" : ""}`} style={{ "--c": status.color }}>
      <div className="mk-cal-col-head">
        <span>{status.label}</span>
        <span className="mk-cal-col-count">{pieces.length}</span>
      </div>
      <div className="mk-cal-col-list">
        {pieces.map((p) => (
          <button
            key={p.id}
            type="button"
            draggable
            onDragStart={(e) => startDrag(e, p)}
            onClick={() => ctx.onEdit(p)}
            className="mk-cal-card"
            style={{ "--pc": pieceColor(p, ctx.colorBy, ctx.pillarsById) }}
          >
            <span className="mk-cal-card-title">{p.title}</span>
            <span className="mk-cal-card-meta">
              <NetworkTag network={p.network} />
              {p.format && <span>{formatLabel(p.format)}</span>}
            </span>
            <span className="mk-cal-card-meta">
              <span className={p.scheduled_at && arDateKey(p.scheduled_at) < ctx.todayKey && !["publicado", "descartado"].includes(p.status) ? "mk-cal-late" : ""}>
                {whenText(p.scheduled_at)}
              </span>
              {ctx.pillarsById[p.pillar_id] && <span>· {ctx.pillarsById[p.pillar_id].name}</span>}
            </span>
          </button>
        ))}
        {status.id === "idea" && (
          <button type="button" className="mk-cal-col-add" onClick={() => ctx.onCreate({ status: "idea" })}>
            + Idea
          </button>
        )}
      </div>
    </div>
  );
}

export function BoardView({ pieces, ctx, showDiscarded }) {
  const cols = STATUSES.filter((s) => PIPELINE.includes(s.id) || (showDiscarded && s.id === "descartado"));
  const sortKey = (p) => p.scheduled_at || "9999";
  return (
    <div className="mk-cal-board">
      {cols.map((s) => (
        <BoardColumn
          key={s.id}
          status={s}
          ctx={ctx}
          pieces={pieces.filter((p) => p.status === s.id).sort((a, b) => sortKey(a).localeCompare(sortKey(b)))}
        />
      ))}
    </div>
  );
}

export function ListView({ pieces, ctx }) {
  const sorted = [...pieces].sort((a, b) => (a.scheduled_at || "9999").localeCompare(b.scheduled_at || "9999"));
  if (!sorted.length) return <div className="adm-empty">No hay piezas con estos filtros.</div>;
  return (
    <div className="adm-table-wrap mk-cal-table-wrap">
      <table className="adm-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Título</th>
            <th>Red</th>
            <th>Formato</th>
            <th>Pilar</th>
            <th>Serie</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const late = p.scheduled_at && arDateKey(p.scheduled_at) < ctx.todayKey && !["publicado", "descartado", "idea"].includes(p.status);
            return (
              <tr key={p.id} className="mk-cal-row" onClick={() => ctx.onEdit(p)}>
                <td className={late ? "mk-cal-late" : ""}>{whenText(p.scheduled_at)}</td>
                <td className="mk-cal-row-title">{p.title}</td>
                <td>
                  <NetworkTag network={p.network} />
                </td>
                <td>{formatLabel(p.format) || "—"}</td>
                <td>
                  {ctx.pillarsById[p.pillar_id] ? (
                    <span className="mk-cal-dot-label">
                      <i style={{ background: ctx.pillarsById[p.pillar_id].color }} />
                      {ctx.pillarsById[p.pillar_id].name}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{ctx.seriesById[p.series_id]?.name || "—"}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <select
                    className="mk-cal-inline-select"
                    value={p.status}
                    style={{ color: STATUS_BY_ID[p.status]?.color }}
                    onChange={(e) => ctx.onMoveToStatus(p.id, e.target.value)}
                    aria-label="Estado"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export { StatusBadge };
