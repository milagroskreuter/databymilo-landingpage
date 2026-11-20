"use client";
// ABM de series recurrentes (mk_series) y generación de sus piezas.
import { useState } from "react";
import { NETWORKS, FORMATS, NETWORK_BY_ID } from "@/lib/marketing/constants";
import { WEEKDAYS } from "@/lib/marketing/content/dates";
import { cadenceLabel, FREQS } from "@/lib/marketing/content/series";
import { useToast } from "../../AdminToast";
import { api } from "./api";

const EMPTY = { name: "", description: "", network: "linkedin", format: "", pillar_id: "", freq: "weekly", weekday: 1, time: "10:00", active: true };
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function toForm(s) {
  if (!s) return { ...EMPTY };
  const c = s.cadence || {};
  return {
    name: s.name,
    description: s.description || "",
    network: s.network || "",
    format: s.format || "",
    pillar_id: s.pillar_id || "",
    freq: c.freq || "weekly",
    weekday: c.weekday ?? 1,
    time: c.time || "10:00",
    anchor: c.anchor,
    active: s.active !== false,
  };
}

function SeriesForm({ initial, pillars, onSubmit, onCancel, submitLabel }) {
  const [f, setF] = useState(() => toForm(initial));
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit({
        name: f.name,
        description: f.description,
        network: f.network || null,
        format: f.format || null,
        pillar_id: f.pillar_id || null,
        active: f.active,
        cadence: { freq: f.freq, weekday: Number(f.weekday), time: f.time, anchor: f.anchor },
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="mk-cal-series-form" onSubmit={submit}>
      <div className="mk-cal-grid-2">
        <label className="mk-cal-field">
          <span className="adm-label">Nombre</span>
          <input className="adm-input" value={f.name} onChange={set("name")} placeholder="Ej.: Dato del lunes" required />
        </label>
        <label className="mk-cal-field">
          <span className="adm-label">Descripción</span>
          <input className="adm-input" value={f.description} onChange={set("description")} />
        </label>
      </div>
      <div className="mk-cal-grid-3">
        <label className="mk-cal-field">
          <span className="adm-label">Red</span>
          <select className="adm-select" value={f.network} onChange={set("network")}>
            <option value="">—</option>
            {NETWORKS.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
        </label>
        <label className="mk-cal-field">
          <span className="adm-label">Formato</span>
          <select className="adm-select" value={f.format} onChange={set("format")}>
            <option value="">—</option>
            {FORMATS.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
        </label>
        <label className="mk-cal-field">
          <span className="adm-label">Pilar</span>
          <select className="adm-select" value={f.pillar_id} onChange={set("pillar_id")}>
            <option value="">—</option>
            {pillars.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="mk-cal-field">
          <span className="adm-label">Cadencia</span>
          <select className="adm-select" value={f.freq} onChange={set("freq")}>
            {FREQS.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
        </label>
        <label className="mk-cal-field">
          <span className="adm-label">Día</span>
          <select className="adm-select" value={f.weekday} onChange={set("weekday")}>
            {DAY_ORDER.map((d) => (
              <option key={d} value={d}>
                {WEEKDAYS[d]}
              </option>
            ))}
          </select>
        </label>
        <label className="mk-cal-field">
          <span className="adm-label">Hora (AR)</span>
          <input type="time" className="adm-input" value={f.time} onChange={set("time")} />
        </label>
      </div>
      {f.freq === "biweekly" && (
        <p className="adm-card-note">Quincenal: arranca la semana en que la guardás y después va día por medio de semana.</p>
      )}
      <div className="mk-cal-form-foot">
        <label className="mk-cal-check">
          <input type="checkbox" checked={f.active} onChange={set("active")} /> Activa
        </label>
        <span className="mk-cal-grow" />
        {onCancel && (
          <button type="button" className="adm-btn adm-btn-secondary adm-btn-sm" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type="submit" className="adm-btn adm-btn-primary adm-btn-sm" disabled={busy || !f.name.trim()}>
          {busy ? "Guardando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function SeriesCard({ s, pillars, pillarsById, count, onSaved, onDeleted, onGenerated }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [weeks, setWeeks] = useState(4);
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const r = await api.generateSeries(s.id, Number(weeks));
      toast?.({
        type: r.created ? "success" : "warn",
        text: r.created
          ? `Se crearon ${r.created} piezas${r.skipped ? ` (${r.skipped} ya existían)` : ""}`
          : "No había fechas nuevas: ya estaban todas generadas",
      });
      onGenerated();
    } catch (err) {
      toast?.({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`¿Borrar la serie "${s.name}"? Las piezas ya generadas quedan en el calendario.`)) return;
    try {
      await api.deleteSeries(s.id);
      onDeleted(s.id);
      toast?.({ text: "Serie borrada" });
    } catch (err) {
      toast?.({ type: "error", text: err.message });
    }
  }

  if (editing) {
    return (
      <div className="adm-card">
        <SeriesForm
          initial={s}
          pillars={pillars}
          submitLabel="Guardar"
          onCancel={() => setEditing(false)}
          onSubmit={async (data) => {
            try {
              const item = await api.updateSeries(s.id, data);
              onSaved(item);
              setEditing(false);
              toast?.({ text: "Serie guardada" });
            } catch (err) {
              toast?.({ type: "error", text: err.message });
            }
          }}
        />
      </div>
    );
  }

  const pillar = pillarsById[s.pillar_id];
  return (
    <div className={`adm-card mk-cal-series${s.active === false ? " is-off" : ""}`}>
      <div className="mk-cal-series-main">
        <h3>{s.name}</h3>
        <p className="mk-cal-series-meta">
          {cadenceLabel(s.cadence)}
          {s.network ? ` · ${NETWORK_BY_ID[s.network]?.label}` : ""}
          {pillar ? ` · ${pillar.name}` : ""}
          {` · ${count} piezas en el calendario`}
          {s.active === false ? " · pausada" : ""}
        </p>
        {s.description && <p className="adm-card-note">{s.description}</p>}
      </div>
      <div className="mk-cal-series-actions">
        <label className="mk-cal-weeks">
          Próximas
          <input type="number" min="1" max="26" className="adm-input" value={weeks} onChange={(e) => setWeeks(e.target.value)} aria-label="Semanas" />
          semanas
        </label>
        <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={generate} disabled={busy || s.active === false}>
          {busy ? "Generando…" : "Generar piezas"}
        </button>
        <button type="button" className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setEditing(true)}>
          Editar
        </button>
        <button type="button" className="adm-btn adm-btn-danger adm-btn-sm" onClick={remove}>
          Borrar
        </button>
      </div>
    </div>
  );
}

export default function SeriesPanel({ series, setSeries, pillars, pillarsById, items, reloadItems }) {
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const counts = {};
  for (const p of items) if (p.series_id) counts[p.series_id] = (counts[p.series_id] || 0) + 1;

  return (
    <div className="mk-cal-series-wrap">
      <div className="mk-cal-series-intro">
        <p className="adm-card-note">
          Formatos que se repiten (&ldquo;Dato del lunes&rdquo;, &ldquo;Viernes de preguntas&rdquo;). &ldquo;Generar piezas&rdquo; crea en el
          calendario las de las próximas semanas, en estado Guion, sin duplicar fechas que ya existen (tampoco las que descartaste).
        </p>
        {!creating && (
          <button type="button" className="adm-btn adm-btn-primary" onClick={() => setCreating(true)}>
            + Nueva serie
          </button>
        )}
      </div>
      {creating && (
        <div className="adm-card">
          <SeriesForm
            pillars={pillars}
            submitLabel="Crear serie"
            onCancel={() => setCreating(false)}
            onSubmit={async (data) => {
              try {
                const item = await api.createSeries(data);
                setSeries((l) => [...l, item]);
                setCreating(false);
                toast?.({ text: "Serie creada" });
              } catch (err) {
                toast?.({ type: "error", text: err.message });
              }
            }}
          />
        </div>
      )}
      {!series.length && !creating && <div className="adm-empty">Todavía no hay series.</div>}
      {series.map((s) => (
        <SeriesCard
          key={s.id}
          s={s}
          pillars={pillars}
          pillarsById={pillarsById}
          count={counts[s.id] || 0}
          onSaved={(item) => setSeries((l) => l.map((x) => (x.id === item.id ? item : x)))}
          onDeleted={(id) => setSeries((l) => l.filter((x) => x.id !== id))}
          onGenerated={reloadItems}
        />
      ))}
    </div>
  );
}
