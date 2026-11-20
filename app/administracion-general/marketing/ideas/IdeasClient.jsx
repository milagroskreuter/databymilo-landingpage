"use client";
// Banco de ideas: piezas en estado "idea". Captura rápida, puntaje, pilar,
// etiquetas, búsqueda y "Pasar al calendario".
import { useEffect, useMemo, useRef, useState } from "react";
import { NETWORKS, FORMATS } from "@/lib/marketing/constants";
import { parseQuickIdea } from "@/lib/marketing/content";
import { arDateKey, arToISO, addDaysKey } from "@/lib/marketing/content/dates";
import { useToast } from "../../AdminToast";
import { api } from "../calendario/api";
import { byId, Stars } from "../calendario/shared";
import PieceEditor from "../calendario/PieceEditor";
import "../calendario/calendario.css";

const SORTS = [
  { id: "recent", label: "Más nuevas" },
  { id: "score", label: "Mejor puntaje" },
  { id: "old", label: "Más viejas" },
];

function ScheduleModal({ idea, onClose, onDone }) {
  const toast = useToast();
  const [date, setDate] = useState(addDaysKey(arDateKey(), 1));
  const [time, setTime] = useState("10:00");
  const [network, setNetwork] = useState(idea.network || "linkedin");
  const [format, setFormat] = useState(idea.format || "");
  const [status, setStatus] = useState("guion");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e) {
    e.preventDefault();
    if (!date) return;
    setBusy(true);
    try {
      const item = await api.updateContent(idea.id, {
        status,
        network: network || null,
        format: format || null,
        scheduled_at: arToISO(date, time),
      });
      toast?.({ text: "Pasó al calendario" });
      onDone(item);
    } catch (err) {
      toast?.({ type: "error", text: err.message });
      setBusy(false);
    }
  }

  return (
    <div className="mk-cal-modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="mk-cal-modal mk-cal-schedule" onSubmit={submit} role="dialog" aria-modal="true" aria-label="Pasar al calendario">
        <div className="mk-cal-modal-head">
          <h2>Pasar al calendario</h2>
          <button type="button" className="mk-cal-x" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <div className="mk-cal-modal-body">
          <p className="mk-cal-idea-title" style={{ cursor: "default" }}>
            {idea.title}
          </p>
          <div className="mk-cal-grid-2">
            <label className="mk-cal-field">
              <span className="adm-label">Fecha</span>
              <input type="date" className="adm-input" value={date} onChange={(e) => setDate(e.target.value)} required />
            </label>
            <label className="mk-cal-field">
              <span className="adm-label">Hora (AR)</span>
              <input type="time" className="adm-input" value={time} onChange={(e) => setTime(e.target.value)} />
            </label>
            <label className="mk-cal-field">
              <span className="adm-label">Red</span>
              <select className="adm-select" value={network} onChange={(e) => setNetwork(e.target.value)}>
                {NETWORKS.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mk-cal-field">
              <span className="adm-label">Formato</span>
              <select className="adm-select" value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="">—</option>
                {FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mk-cal-radio">
            <label>
              <input type="radio" name="st" checked={status === "guion"} onChange={() => setStatus("guion")} />
              <span>
                Guion
                <small>Falta escribirla o grabarla.</small>
              </span>
            </label>
            <label>
              <input type="radio" name="st" checked={status === "programado"} onChange={() => setStatus("programado")} />
              <span>
                Programado
                <small>Ya está lista para salir ese día.</small>
              </span>
            </label>
          </div>
        </div>
        <div className="mk-cal-modal-foot">
          <span className="mk-cal-grow" />
          <button type="button" className="adm-btn adm-btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="adm-btn adm-btn-primary" disabled={busy || !date}>
            {busy ? "Guardando…" : "Pasar al calendario"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function IdeasClient() {
  const toast = useToast();
  const inputRef = useRef(null);
  const [ideas, setIdeas] = useState([]);
  const [pillars, setPillars] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [quick, setQuick] = useState("");
  const [quickPillar, setQuickPillar] = useState("");
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [pillarFilter, setPillarFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sort, setSort] = useState("recent");
  const [editing, setEditing] = useState(null);
  const [scheduling, setScheduling] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [list, pl, se] = await Promise.all([api.listContent({ ideas: "1" }), api.listPillars(), api.listSeries()]);
        setIdeas(list);
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
  const activePillars = pillars.filter((p) => p.active !== false);

  const allTags = useMemo(() => {
    const count = {};
    for (const i of ideas) for (const t of i.tags || []) count[t] = (count[t] || 0) + 1;
    return Object.entries(count).sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, [ideas]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = ideas.filter((i) => {
      if (pillarFilter && (pillarFilter === "none" ? i.pillar_id : i.pillar_id !== pillarFilter)) return false;
      if (tagFilter && !(i.tags || []).includes(tagFilter)) return false;
      if (s && !`${i.title} ${i.notes || ""} ${i.hook || ""} ${(i.tags || []).join(" ")}`.toLowerCase().includes(s)) return false;
      return true;
    });
    const byDate = (a, b) => b.created_at.localeCompare(a.created_at);
    if (sort === "score") list.sort((a, b) => (b.score || 0) - (a.score || 0) || byDate(a, b));
    else if (sort === "old") list.sort((a, b) => -byDate(a, b));
    else list.sort(byDate);
    return list;
  }, [ideas, q, pillarFilter, tagFilter, sort]);

  async function addQuick(e) {
    e.preventDefault();
    const { title, tags } = parseQuickIdea(quick);
    if (!title) return;
    setSaving(true);
    try {
      const item = await api.createContent({ title, tags, status: "idea", pillar_id: quickPillar || null, source: "manual" });
      setIdeas((l) => [item, ...l]);
      setQuick("");
      inputRef.current?.focus();
    } catch (err) {
      toast?.({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function patch(idea, data) {
    const prev = ideas;
    setIdeas((l) => l.map((i) => (i.id === idea.id ? { ...i, ...data } : i)));
    try {
      const item = await api.updateContent(idea.id, data);
      setIdeas((l) => (item.status === "idea" ? l.map((i) => (i.id === item.id ? item : i)) : l.filter((i) => i.id !== item.id)));
    } catch (err) {
      setIdeas(prev);
      toast?.({ type: "error", text: err.message });
    }
  }

  function afterSave(item) {
    setIdeas((l) => {
      const without = l.filter((i) => i.id !== item.id);
      return item.status === "idea" ? (l.some((i) => i.id === item.id) ? l.map((i) => (i.id === item.id ? item : i)) : [item, ...l]) : without;
    });
    setEditing(null);
  }

  return (
    <>
      <div className="adm-header">
        <h1>Banco de ideas</h1>
        <span className="adm-card-hint">{ideas.length} ideas</span>
      </div>

      <div className="adm-content">
        <form className="mk-cal-quick" onSubmit={addQuick}>
          <input
            ref={inputRef}
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            placeholder="Anotá una idea y apretá Enter…  (podés sumar #etiquetas)"
            aria-label="Nueva idea"
            maxLength={220}
            autoFocus
          />
          <select className="mk-cal-filter" value={quickPillar} onChange={(e) => setQuickPillar(e.target.value)} aria-label="Pilar de la idea">
            <option value="">Sin pilar</option>
            {activePillars.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button type="submit" className="adm-btn adm-btn-primary adm-btn-sm" disabled={saving || !quick.trim()}>
            Guardar
          </button>
        </form>
        <p className="mk-cal-quick-help">Ej.: &ldquo;3 errores al armar un dashboard #powerbi #errores&rdquo;. Después la completás con el editor.</p>

        {loadError && <div className="adm-alert adm-alert-error">No se pudieron cargar las ideas: {loadError}</div>}

        <div className="mk-cal-toolbar">
          <input className="adm-search" placeholder="Buscar ideas…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" />
          <select className="mk-cal-filter" value={pillarFilter} onChange={(e) => setPillarFilter(e.target.value)} aria-label="Filtrar por pilar">
            <option value="">Todos los pilares</option>
            {pillars.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            <option value="none">Sin pilar</option>
          </select>
          <select className="mk-cal-filter" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar">
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        {allTags.length > 0 && (
          <div className="mk-cal-tags">
            {allTags.slice(0, 30).map((t) => (
              <button key={t} type="button" className={`mk-cal-tag${tagFilter === t ? " active" : ""}`} onClick={() => setTagFilter(tagFilter === t ? "" : t)}>
                #{t}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="adm-skel mk-cal-skel" />
        ) : !shown.length ? (
          <div className="adm-empty">{ideas.length ? "Ninguna idea coincide con la búsqueda." : "Todavía no hay ideas. Anotá la primera arriba."}</div>
        ) : (
          <div className="mk-cal-ideas">
            {shown.map((i) => (
              <article key={i.id} className="mk-cal-idea" style={{ "--pc": pillarsById[i.pillar_id]?.color }}>
                <button type="button" className="mk-cal-idea-title" onClick={() => setEditing(i)}>
                  {i.title}
                </button>
                {(i.tags || []).length > 0 && (
                  <div className="mk-cal-tags">
                    {i.tags.map((t) => (
                      <button key={t} type="button" className={`mk-cal-tag${tagFilter === t ? " active" : ""}`} onClick={() => setTagFilter(tagFilter === t ? "" : t)}>
                        #{t}
                      </button>
                    ))}
                  </div>
                )}
                <div className="mk-cal-idea-row">
                  <select
                    className="mk-cal-filter"
                    value={i.pillar_id || ""}
                    onChange={(e) => patch(i, { pillar_id: e.target.value || null })}
                    aria-label="Pilar"
                  >
                    <option value="">Sin pilar</option>
                    {pillars.filter((p) => p.active !== false || p.id === i.pillar_id).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <Stars value={i.score} onChange={(v) => patch(i, { score: v })} size="sm" />
                </div>
                <div className="mk-cal-idea-foot">
                  <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setScheduling(i)}>
                    Pasar al calendario
                  </button>
                  <button type="button" className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setEditing(i)}>
                    Editar
                  </button>
                  <span className="mk-cal-grow" />
                  <button type="button" className="adm-link-btn" onClick={() => patch(i, { status: "descartado" })} title="Descartar idea">
                    Descartar
                  </button>
                </div>
                <span className="mk-cal-idea-date">
                  {new Date(i.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                  {i.source && i.source !== "manual" ? ` · ${i.source}` : ""}
                </span>
              </article>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <PieceEditor
          key={editing.id}
          piece={editing}
          pillars={pillars}
          series={series}
          onClose={() => setEditing(null)}
          onSaved={afterSave}
          onDeleted={(id) => {
            setIdeas((l) => l.filter((x) => x.id !== id));
            setEditing(null);
          }}
        />
      )}
      {scheduling && (
        <ScheduleModal
          idea={scheduling}
          onClose={() => setScheduling(null)}
          onDone={(item) => {
            setIdeas((l) => l.filter((x) => x.id !== item.id));
            setScheduling(null);
          }}
        />
      )}
    </>
  );
}
