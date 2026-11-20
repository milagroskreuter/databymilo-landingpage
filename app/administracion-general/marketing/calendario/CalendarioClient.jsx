"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NETWORKS, STATUSES } from "@/lib/marketing/constants";
import { arDateKey, arTime, arToISO, addDaysKey, weekStartKey, monthKey, monthLabel, shortDayLabel } from "@/lib/marketing/content/dates";
import { pillarBalance } from "@/lib/marketing/content/pillars";
import { useToast } from "../../AdminToast";
import { api } from "./api";
import { byId, FALLBACK_COLOR } from "./shared";
import { MonthView, WeekView, BoardView, ListView, UnscheduledTray } from "./CalendarViews";
import PieceEditor from "./PieceEditor";
import PillarsPanel from "./PillarsPanel";
import SeriesPanel from "./SeriesPanel";
import "./calendario.css";

const VIEWS = [
  { id: "mes", label: "Mes" },
  { id: "semana", label: "Semana" },
  { id: "tablero", label: "Tablero" },
  { id: "lista", label: "Lista" },
  { id: "pilares", label: "Pilares" },
  { id: "series", label: "Series" },
];
const CAL_VIEWS = ["mes", "semana", "tablero", "lista"];
const PREFS_KEY = "mk-cal-prefs";

function readPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
  } catch {
    return {};
  }
}
function writePrefs(p) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {}
}

export default function CalendarioClient() {
  const toast = useToast();
  const todayKey = arDateKey();
  const [items, setItems] = useState([]);
  const [pillars, setPillars] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [view, setView] = useState("mes");
  const [cursor, setCursor] = useState(todayKey);
  const [filters, setFilters] = useState({ network: "", pillar: "", status: "", series: "", q: "" });
  const [colorBy, setColorBy] = useState("network");
  const [showDiscarded, setShowDiscarded] = useState(false);
  const [editing, setEditing] = useState(null);

  // Vista desde la URL (?vista=semana) y preferencias guardadas.
  useEffect(() => {
    const p = readPrefs();
    if (p.colorBy) setColorBy(p.colorBy);
    const v = new URLSearchParams(window.location.search).get("vista") || p.view;
    if (VIEWS.some((x) => x.id === v)) setView(v);
    const nueva = new URLSearchParams(window.location.search).get("nueva");
    if (nueva) setEditing({ date: /^\d{4}-\d{2}-\d{2}$/.test(nueva) ? nueva : "", status: "guion" });
  }, []);

  function changeView(v) {
    setView(v);
    writePrefs({ ...readPrefs(), view: v });
    const url = new URL(window.location.href);
    url.searchParams.set("vista", v);
    url.searchParams.delete("nueva");
    window.history.replaceState(null, "", url);
  }
  function changeColorBy(c) {
    setColorBy(c);
    writePrefs({ ...readPrefs(), colorBy: c });
  }

  const loadItems = useCallback(async () => {
    const list = await api.listContent();
    setItems(list);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [list, pl, se] = await Promise.all([api.listContent(), api.listPillars(), api.listSeries()]);
        setItems(list);
        setPillars(pl);
        setSeries(se);
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pillarsById = useMemo(() => byId(pillars), [pillars]);
  const seriesById = useMemo(() => byId(series), [series]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return items.filter((p) => {
      if (filters.network && p.network !== filters.network) return false;
      if (filters.pillar && (filters.pillar === "none" ? p.pillar_id : p.pillar_id !== filters.pillar)) return false;
      if (filters.series && p.series_id !== filters.series) return false;
      if (filters.status) {
        if (p.status !== filters.status) return false;
      } else if (p.status === "descartado" && !showDiscarded) return false;
      if (q && !`${p.title} ${p.hook || ""} ${(p.tags || []).join(" ")}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, filters, showDiscarded]);

  const balance = useMemo(() => pillarBalance(items, pillars), [items, pillars]);

  // ── Cambios con actualización optimista ──
  async function patchPiece(id, patch, okText) {
    const prev = items;
    setItems((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    try {
      const item = await api.updateContent(id, patch);
      setItems((list) => list.map((p) => (p.id === id ? item : p)));
      if (okText) toast?.({ text: okText });
    } catch (err) {
      setItems(prev);
      toast?.({ type: "error", text: err.message });
    }
  }

  const ctx = {
    todayKey,
    colorBy,
    pillarsById,
    seriesById,
    onEdit: (p) => setEditing(p),
    onCreate: (init) => setEditing({ status: init.date ? "guion" : "idea", ...init }),
    onMoveToDay: (id, dayKey) => {
      const p = items.find((x) => x.id === id);
      if (!p) return;
      const time = p.scheduled_at ? arTime(p.scheduled_at) : "10:00";
      if (p.scheduled_at && arDateKey(p.scheduled_at) === dayKey) return;
      const patch = { scheduled_at: arToISO(dayKey, time) };
      if (p.status === "idea") patch.status = "guion";
      patchPiece(id, patch, `Movida al ${shortDayLabel(dayKey)}`);
    },
    onUnschedule: (id) => {
      const p = items.find((x) => x.id === id);
      if (!p || !p.scheduled_at) return;
      if (p.status === "programado") {
        toast?.({ type: "warn", text: "Una pieza programada necesita fecha: cambiale el estado primero" });
        return;
      }
      patchPiece(id, { scheduled_at: null }, "Le sacaste la fecha");
    },
    onMoveToStatus: (id, status) => {
      const p = items.find((x) => x.id === id);
      if (!p || p.status === status) return;
      if (status === "programado" && !p.scheduled_at) {
        // Sin fecha no se puede programar: se abre el editor para elegirla.
        setEditing({ ...p, status: "programado" });
        toast?.({ type: "warn", text: "Elegí la fecha para programarla" });
        return;
      }
      const label = STATUSES.find((s) => s.id === status)?.label;
      patchPiece(id, { status }, `Pasó a ${label}`);
    },
  };

  function onSaved(item) {
    setItems((list) => (list.some((p) => p.id === item.id) ? list.map((p) => (p.id === item.id ? item : p)) : [...list, item]));
    setEditing(null);
  }
  function onDeleted(id) {
    setItems((list) => list.filter((p) => p.id !== id));
    setEditing(null);
  }

  // ── Navegación de fechas ──
  function move(dir) {
    if (view === "semana") setCursor((c) => addDaysKey(c, dir * 7));
    else {
      const [y, m] = monthKey(cursor).split("-").map(Number);
      const d = new Date(Date.UTC(y, m - 1 + dir, 1));
      setCursor(d.toISOString().slice(0, 10));
    }
  }
  const rangeLabel =
    view === "semana"
      ? `${shortDayLabel(weekStartKey(cursor))} – ${shortDayLabel(addDaysKey(weekStartKey(cursor), 6))}`
      : monthLabel(monthKey(cursor));

  const unscheduled = filtered.filter((p) => !p.scheduled_at && !["idea", "publicado", "descartado"].includes(p.status));
  const legend =
    colorBy === "network"
      ? NETWORKS.filter((n) => items.some((p) => p.network === n.id)).map((n) => ({ id: n.id, label: n.label, color: n.color }))
      : pillars.map((p) => ({ id: p.id, label: p.name, color: p.color }));
  const isCal = CAL_VIEWS.includes(view);
  const setFilter = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const activeFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <div className="adm-header">
        <h1>Calendario editorial</h1>
        <button type="button" className="adm-btn adm-btn-primary" onClick={() => setEditing({ status: "guion" })}>
          + Nueva pieza
        </button>
      </div>

      <div className="adm-content">
        <div className="mk-cal-tabs" role="tablist">
          {VIEWS.map((v) => (
            <button key={v.id} type="button" role="tab" aria-selected={view === v.id} className={view === v.id ? "active" : ""} onClick={() => changeView(v.id)}>
              {v.label}
            </button>
          ))}
        </div>

        {loadError && <div className="adm-alert adm-alert-error">No se pudo cargar el calendario: {loadError}</div>}

        {isCal && (
          <div className="mk-cal-toolbar">
            {(view === "mes" || view === "semana") && (
              <div className="mk-cal-nav">
                <button type="button" className="mk-cal-nav-btn" onClick={() => move(-1)} aria-label="Anterior">
                  ‹
                </button>
                <span className="mk-cal-range">{rangeLabel}</span>
                <button type="button" className="mk-cal-nav-btn" onClick={() => move(1)} aria-label="Siguiente">
                  ›
                </button>
                <button type="button" className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setCursor(todayKey)}>
                  Hoy
                </button>
              </div>
            )}
            <div className="mk-cal-filters">
              <input className="adm-search mk-cal-search" placeholder="Buscar…" value={filters.q} onChange={setFilter("q")} aria-label="Buscar" />
              <select className="mk-cal-filter" value={filters.network} onChange={setFilter("network")} aria-label="Red">
                <option value="">Todas las redes</option>
                {NETWORKS.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </select>
              <select className="mk-cal-filter" value={filters.pillar} onChange={setFilter("pillar")} aria-label="Pilar">
                <option value="">Todos los pilares</option>
                {pillars.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                <option value="none">Sin pilar</option>
              </select>
              <select className="mk-cal-filter" value={filters.status} onChange={setFilter("status")} aria-label="Estado">
                <option value="">Todos los estados</option>
                {STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              {series.length > 0 && (
                <select className="mk-cal-filter" value={filters.series} onChange={setFilter("series")} aria-label="Serie">
                  <option value="">Todas las series</option>
                  {series.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
              {activeFilters && (
                <button type="button" className="adm-link-btn" onClick={() => setFilters({ network: "", pillar: "", status: "", series: "", q: "" })}>
                  Limpiar
                </button>
              )}
            </div>
          </div>
        )}

        {isCal && (
          <div className="mk-cal-subbar">
            <div className="mk-cal-seg" role="group" aria-label="Colorear por">
              <span>Color por</span>
              <button type="button" className={colorBy === "network" ? "active" : ""} onClick={() => changeColorBy("network")}>
                Red
              </button>
              <button type="button" className={colorBy === "pillar" ? "active" : ""} onClick={() => changeColorBy("pillar")}>
                Pilar
              </button>
            </div>
            <div className="adm-legend mk-cal-legend">
              {legend.map((l) => (
                <span key={l.id} className="mk-cal-dot-label">
                  <i style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
              {colorBy === "pillar" && (
                <span className="mk-cal-dot-label">
                  <i style={{ background: FALLBACK_COLOR }} />
                  Sin pilar
                </span>
              )}
            </div>
            <label className="mk-cal-check">
              <input type="checkbox" checked={showDiscarded} onChange={(e) => setShowDiscarded(e.target.checked)} />
              Mostrar descartadas
            </label>
          </div>
        )}

        {loading ? (
          <div className="adm-skel mk-cal-skel" />
        ) : (
          <>
            {(view === "mes" || view === "semana") && unscheduled.length > 0 && <UnscheduledTray pieces={unscheduled} ctx={ctx} />}
            {view === "mes" && <MonthView cursor={cursor} pieces={filtered} ctx={ctx} />}
            {view === "semana" && <WeekView cursor={cursor} pieces={filtered} ctx={ctx} />}
            {view === "tablero" && <BoardView pieces={filtered} ctx={ctx} showDiscarded={showDiscarded || filters.status === "descartado"} />}
            {view === "lista" && <ListView pieces={filtered} ctx={ctx} />}
            {view === "pilares" && <PillarsPanel pillars={pillars} setPillars={setPillars} balance={balance} />}
            {view === "series" && (
              <SeriesPanel
                series={series}
                setSeries={setSeries}
                pillars={pillars}
                pillarsById={pillarsById}
                items={items}
                reloadItems={() => loadItems().catch((err) => toast?.({ type: "error", text: err.message }))}
              />
            )}
            {(view === "mes" || view === "semana") && (
              <p className="mk-cal-hint">Arrastrá una pieza a otro día para moverla (mantiene la hora). Doble clic en un día crea una pieza ahí.</p>
            )}
            {view === "tablero" && <p className="mk-cal-hint">Arrastrá una tarjeta a otra columna para cambiarle el estado.</p>}
          </>
        )}
      </div>

      {editing && (
        <PieceEditor
          key={editing.id || "new"}
          piece={editing}
          pillars={pillars}
          series={series}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
          onDeleted={onDeleted}
        />
      )}
    </>
  );
}
