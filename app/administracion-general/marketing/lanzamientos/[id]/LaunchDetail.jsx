"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PHASES } from "@/lib/marketing/launches/constants";
import { addDays, diffDays, formatDate, isoToDateAR, relativeDays, todayAR } from "@/lib/marketing/launches/dates";
import { effectiveDates } from "@/lib/marketing/launches/schedule";
import { FORMATS, FORMAT_BY_ID, NETWORKS, STATUS_BY_ID } from "@/lib/marketing/constants";
import { BASE, Field, Modal, NetworkTag, Progress, StatusBadge, Tabs, api, money } from "../ui";
import { LaunchFormModal } from "../forms";
import { countdown } from "../LanzamientosClient";
import { useToast } from "../../../AdminToast";

export default function LaunchDetail() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [resultsKey, setResultsKey] = useState(0);

  async function load() {
    try {
      setData(await api(`/${id}`));
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function remove() {
    if (!confirm(`¿Borrar "${data.launch.name}" y su checklist? Las piezas quedan en el calendario.`)) return;
    try {
      await api(`/${id}`, { method: "DELETE" });
      toast({ text: "Lanzamiento borrado" });
      router.push(BASE);
    } catch (err) {
      toast({ type: "error", text: err.message });
    }
  }

  if (error) {
    return (
      <div className="adm-content">
        <Link href={BASE} className="mk-lanzamientos-back">← Lanzamientos</Link>
        <div className="adm-alert adm-alert-error">{error}</div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="adm-content">
        <div className="adm-skel" style={{ height: 60 }} />
        <div className="adm-skel" style={{ height: 240 }} />
      </div>
    );
  }

  const { launch, tasks, pieces, resources, keydate } = data;
  const resource = resources.find((r) => r.slug === launch.resource_slug);
  const c = countdown(launch);
  const done = tasks.filter((t) => t.done).length;

  return (
    <>
      <div className="adm-header">
        <div>
          <Link href={BASE} className="mk-lanzamientos-back">← Lanzamientos</Link>
          <h1>{launch.name}</h1>
          <div className="mk-lanzamientos-inline" style={{ marginTop: 8 }}>
            <StatusBadge status={launch.status} />
            {keydate && (
              <span className="mk-lanzamientos-chip">
                Fecha clave: {keydate.name}{keydate.approximate ? " (aprox.)" : ""}
              </span>
            )}
          </div>
        </div>
        <div className="mk-lanzamientos-inline">
          <button className="adm-btn adm-btn-secondary" onClick={() => setEditing(true)}>Editar</button>
          <button className="adm-btn adm-btn-danger" onClick={remove}>Borrar</button>
        </div>
      </div>

      <div className="adm-content">
        <Tabs />

        <div className="mk-lanzamientos-hero">
          <div className="adm-stat-card">
            <div className="adm-stat-label">Cuenta regresiva</div>
            <div className="adm-stat-value">{c.big}</div>
            <div className="adm-stat-sub">{c.sub}</div>
          </div>
          <div className="adm-stat-card">
            <div className="adm-stat-label">Checklist</div>
            <div className="adm-stat-value">{tasks.length ? `${Math.round((done / tasks.length) * 100)}%` : "—"}</div>
            <div className="adm-stat-sub">{done} de {tasks.length} tareas</div>
          </div>
          <div className="adm-stat-card">
            <div className="adm-stat-label">Piezas</div>
            <div className="adm-stat-value">{pieces.length}</div>
            <div className="adm-stat-sub">{pieces.filter((p) => p.status === "publicado").length} publicadas</div>
          </div>
          <div className="adm-stat-card">
            <div className="adm-stat-label">Recurso</div>
            <div className="adm-stat-sub" style={{ fontSize: 14, fontWeight: 600, color: "var(--adm-ink)" }}>
              {resource ? resource.title : launch.resource_slug || "Sin recurso"}
            </div>
            {resource && (
              <Link href={`/recursos/${resource.slug}`} target="_blank" className="adm-card-link">Ver en el sitio ↗</Link>
            )}
          </div>
        </div>

        <TimelineCard launch={launch} tasks={tasks} pieces={pieces} />

        {launch.notes && (
          <div className="adm-card">
            <div className="adm-mini-label">Notas</div>
            <p style={{ whiteSpace: "pre-wrap", fontSize: 13.5, lineHeight: 1.55 }}>{launch.notes}</p>
          </div>
        )}

        <ChecklistCard launch={launch} tasks={tasks} onChange={load} />
        <PiecesCard launch={launch} pieces={pieces} onChange={load} />
        <ResultsCard launchId={launch.id} key={resultsKey} />
      </div>

      {editing && (
        <LaunchFormModal
          launch={launch}
          resources={resources}
          onClose={() => setEditing(false)}
          onSaved={() => { load(); setResultsKey((k) => k + 1); }}
        />
      )}
    </>
  );
}

/* ---------- Línea de tiempo ---------- */

function TimelineCard({ launch, tasks, pieces }) {
  const { startsOn, launchOn, endsOn } = effectiveDates(launch);
  if (!launchOn) {
    return (
      <div className="adm-card">
        <div className="adm-card-title">Línea de tiempo</div>
        <p className="adm-card-note" style={{ marginTop: 8 }}>Poné la fecha de apertura para ver la línea de tiempo.</p>
      </div>
    );
  }
  const today = todayAR();
  const postEnd = addDays(endsOn, 14);
  const total = Math.max(1, diffDays(startsOn, postEnd));
  const pos = (d) => Math.min(100, Math.max(0, (diffDays(startsOn, d) / total) * 100));
  const w = (a, b) => `${((diffDays(a, b) / total) * 100).toFixed(2)}%`;
  const todayIn = today >= startsOn && today <= postEnd;

  const marks = [
    ...tasks.filter((t) => t.due_on).map((t) => ({ d: t.due_on, color: t.done ? "#17663e" : "#d99a3e", title: `Tarea: ${t.title}` })),
    ...pieces.filter((p) => p.scheduled_at).map((p) => ({ d: isoToDateAR(p.scheduled_at), color: "#0a66c2", title: `Pieza: ${p.title}` })),
  ].filter((m) => m.d >= startsOn && m.d <= postEnd);

  const phaseOf = today < launchOn ? "pre" : today <= endsOn ? "launch" : "post";

  return (
    <div className="adm-card">
      <div className="adm-card-head">
        <span className="adm-card-title">Línea de tiempo</span>
        <span className="adm-card-hint">
          {todayIn ? `Hoy: ${PHASES.find((p) => p.id === phaseOf).label.toLowerCase()}` : today < startsOn ? `Empieza ${relativeDays(diffDays(today, startsOn))}` : "Terminado"}
        </span>
      </div>
      <div className="mk-lanzamientos-timeline">
        <div className="mk-lanzamientos-tl-bar">
          <div className="mk-lanzamientos-tl-seg mk-lanzamientos-tl-pre" style={{ width: w(startsOn, launchOn) }}>Antes</div>
          <div className="mk-lanzamientos-tl-seg mk-lanzamientos-tl-launch" style={{ width: w(launchOn, addDays(endsOn, 1)) }}>Durante</div>
          <div className="mk-lanzamientos-tl-seg mk-lanzamientos-tl-post" style={{ flex: 1 }}>Después</div>
        </div>
        {todayIn && <div className="mk-lanzamientos-tl-today" style={{ left: `${pos(today)}%` }} />}
        <div className="mk-lanzamientos-tl-marks">
          {marks.map((m, i) => (
            <span key={i} className="mk-lanzamientos-tl-mark" style={{ left: `${pos(m.d)}%`, background: m.color }} title={`${formatDate(m.d)} · ${m.title}`} />
          ))}
        </div>
        <div className="mk-lanzamientos-tl-dates">
          <span style={{ left: 0 }}>{formatDate(startsOn)}</span>
          <span style={{ left: `${pos(launchOn)}%` }}>Abre {formatDate(launchOn)}</span>
          <span style={{ left: `${pos(endsOn)}%` }}>Cierra {formatDate(endsOn)}</span>
          <span style={{ left: "100%" }}>{formatDate(postEnd)}</span>
        </div>
      </div>
      <div className="adm-legend" style={{ marginTop: 14 }}>
        <span className="adm-legend-item"><span className="adm-legend-swatch" style={{ background: "#d99a3e", borderRadius: "50%" }} />Tarea pendiente</span>
        <span className="adm-legend-item"><span className="adm-legend-swatch" style={{ background: "#17663e", borderRadius: "50%" }} />Tarea hecha</span>
        <span className="adm-legend-item"><span className="adm-legend-swatch" style={{ background: "#0a66c2", borderRadius: "50%" }} />Pieza</span>
        {(!launch.starts_on || !launch.ends_on) && (
          <span className="adm-legend-item">Sin {!launch.starts_on ? "inicio" : "cierre"} cargado: se usa un valor por defecto.</span>
        )}
      </div>
    </div>
  );
}

/* ---------- Checklist ---------- */

function ChecklistCard({ launch, tasks, onChange }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const today = todayAR();

  async function call(path, opts, msg) {
    try {
      await api(path, opts);
      if (msg) toast({ text: msg });
      onChange();
    } catch (err) {
      toast({ type: "error", text: err.message });
    }
  }

  async function fromTemplates() {
    setBusy(true);
    await call(`/${launch.id}/tasks`, { method: "POST", body: { fromTemplates: true } }, "Checklist armado ✦");
    setBusy(false);
  }

  const done = tasks.filter((t) => t.done).length;

  return (
    <div className="adm-card">
      <div className="adm-card-head">
        <span className="adm-card-title">Checklist</span>
        <div className="mk-lanzamientos-inline" style={{ minWidth: 220 }}>
          {tasks.length > 0 && <Progress done={done} total={tasks.length} />}
        </div>
      </div>
      {tasks.length === 0 && (
        <div className="adm-alert adm-alert-info mk-lanzamientos-inline" style={{ marginBottom: 14 }}>
          <span>Este lanzamiento todavía no tiene checklist.</span>
          <span className="mk-lanzamientos-spacer" />
          <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={fromTemplates} disabled={busy}>
            Armar desde las plantillas
          </button>
        </div>
      )}
      <div className="mk-lanzamientos-phases">
        {PHASES.map((ph) => {
          const list = tasks.filter((t) => t.phase === ph.id);
          return (
            <div key={ph.id}>
              <div className="mk-lanzamientos-phase-title">
                <span>{ph.label}</span>
                <span>{list.filter((t) => t.done).length}/{list.length}</span>
              </div>
              {list.map((t) => (
                <TaskRow
                  key={t.id}
                  t={t}
                  today={today}
                  onToggle={() => call(`/${launch.id}/tasks/${t.id}`, { method: "PATCH", body: { done: !t.done } })}
                  onDate={(d) => call(`/${launch.id}/tasks/${t.id}`, { method: "PATCH", body: { due_on: d } })}
                  onDelete={() => confirm(`¿Borrar "${t.title}"?`) && call(`/${launch.id}/tasks/${t.id}`, { method: "DELETE" })}
                />
              ))}
              <AddTask onAdd={(title, due_on) => call(`/${launch.id}/tasks`, { method: "POST", body: { title, due_on, phase: ph.id } })} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskRow({ t, today, onToggle, onDate, onDelete }) {
  const [editDate, setEditDate] = useState(false);
  const late = !t.done && t.due_on && t.due_on < today;
  return (
    <div className={`mk-lanzamientos-task${t.done ? " is-done" : ""}`}>
      <input type="checkbox" checked={t.done} onChange={onToggle} aria-label={`Marcar "${t.title}"`} />
      <div>
        <div className="mk-lanzamientos-task-title">{t.title}</div>
        {t.description && <div className="mk-lanzamientos-task-desc">{t.description}</div>}
      </div>
      <div className={`mk-lanzamientos-task-due${late ? " is-late" : ""}`}>
        {editDate ? (
          <input
            type="date"
            className="adm-input"
            style={{ padding: "2px 4px", fontSize: 11 }}
            defaultValue={t.due_on || ""}
            autoFocus
            onBlur={(e) => { setEditDate(false); if (e.target.value !== (t.due_on || "")) onDate(e.target.value); }}
          />
        ) : (
          <button
            type="button"
            className="adm-link-btn"
            style={{ fontSize: 11, color: "inherit", fontWeight: "inherit" }}
            onClick={() => setEditDate(true)}
            title={t.due_on ? `${formatDate(t.due_on, { weekday: true, year: true })} · tocá para cambiar` : "Poner fecha"}
          >
            {t.due_on ? formatDate(t.due_on) : "sin fecha"}
          </button>
        )}
        <button className="mk-lanzamientos-x" onClick={onDelete} aria-label="Borrar tarea">×</button>
      </div>
    </div>
  );
}

function AddTask({ onAdd }) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await onAdd(title.trim(), due);
    setTitle("");
    setDue("");
  }
  return (
    <form className="mk-lanzamientos-add" onSubmit={submit}>
      <input className="adm-input" placeholder="+ Tarea propia" value={title} onChange={(e) => setTitle(e.target.value)} />
      {title && <input type="date" className="adm-input" style={{ flex: "0 0 130px" }} value={due} onChange={(e) => setDue(e.target.value)} />}
      {title && <button className="adm-btn adm-btn-primary adm-btn-sm">Sumar</button>}
    </form>
  );
}

/* ---------- Piezas ---------- */

function PiecesCard({ launch, pieces, onChange }) {
  const [planOpen, setPlanOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  return (
    <div className="adm-card">
      <div className="adm-card-head">
        <span className="adm-card-title">Piezas del lanzamiento</span>
        <div className="mk-lanzamientos-inline">
          <Link href="/administracion-general/marketing/calendario" className="adm-card-link">Ver calendario →</Link>
          <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setAddOpen(true)}>+ Pieza</button>
          <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setPlanOpen(true)} disabled={!launch.launch_on}
            title={launch.launch_on ? "" : "Poné la fecha de apertura primero"}>
            Generar plan base
          </button>
        </div>
      </div>
      {pieces.length === 0 ? (
        <p className="adm-card-note">
          Todavía no hay piezas. Generá un plan base (LinkedIn + Instagram, antes / durante / después) y quedan en el calendario como ideas con fecha.
        </p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Fecha</th><th>Red</th><th>Formato</th><th>Pieza</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {pieces.map((p) => {
                const st = STATUS_BY_ID[p.status];
                const d = isoToDateAR(p.scheduled_at);
                return (
                  <tr key={p.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{d ? formatDate(d, { weekday: true }) : "—"}</td>
                    <td><NetworkTag network={p.network} /></td>
                    <td>{FORMAT_BY_ID[p.format]?.label || "—"}</td>
                    <td>
                      {p.permalink ? <a href={p.permalink} target="_blank" rel="noreferrer">{p.title}</a> : p.title}
                    </td>
                    <td>
                      <span className="mk-lanzamientos-inline" style={{ gap: 6, fontSize: 12 }}>
                        <span className="mk-lanzamientos-dot" style={{ background: st?.color || "#9a8a90" }} />
                        {st?.label || p.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {planOpen && <PlanModal launch={launch} onClose={() => setPlanOpen(false)} onDone={onChange} />}
      {addOpen && <AddPieceModal launch={launch} onClose={() => setAddOpen(false)} onDone={onChange} />}
    </div>
  );
}

function PlanModal({ launch, onClose, onDone }) {
  const toast = useToast();
  const [plan, setPlan] = useState(null);
  const [sel, setSel] = useState(new Set());
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api(`/${launch.id}/plan`)
      .then(({ plan }) => {
        setPlan(plan);
        setSel(new Set(plan.filter((p) => !p.exists && !p.past).map((p) => p.key)));
      })
      .catch((err) => setError(err.message));
  }, [launch.id]);

  const toggle = (k) => setSel((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  async function create() {
    setSaving(true);
    try {
      const data = await api(`/${launch.id}/plan`, { method: "POST", body: { keys: [...sel] } });
      toast({ text: `${data.created} piezas creadas en el calendario ✦` });
      onDone();
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const grouped = useMemo(() => PHASES.map((ph) => ({ ...ph, items: (plan || []).filter((p) => p.phase === ph.id) })), [plan]);

  return (
    <Modal title="Plan base de piezas" onClose={onClose} wide>
      <p className="mk-lanzamientos-muted" style={{ marginBottom: 12 }}>
        Elegí qué piezas crear. Quedan como <b>ideas con fecha</b> en el calendario, asociadas a este lanzamiento.
      </p>
      {error && <div className="adm-alert adm-alert-error">{error}</div>}
      {!plan ? (
        <div className="adm-skel" style={{ height: 200 }} />
      ) : (
        grouped.map((g) => g.items.length > 0 && (
          <div key={g.id} style={{ marginBottom: 14 }}>
            <div className="adm-mini-label">{g.label}</div>
            {g.items.map((p) => (
              <label key={p.key} className={`mk-lanzamientos-plan-row${p.exists || p.past ? " is-off" : ""}`}>
                <input type="checkbox" checked={sel.has(p.key)} disabled={p.exists} onChange={() => toggle(p.key)} />
                <span>{formatDate(p.date, { weekday: true })} {p.time}</span>
                <span>
                  {p.title}
                  <span className="mk-lanzamientos-muted"> · {FORMAT_BY_ID[p.format]?.label}</span>
                  {p.exists && <span className="mk-lanzamientos-muted"> · ya existe</span>}
                  {p.past && !p.exists && <span className="mk-lanzamientos-muted"> · fecha pasada</span>}
                </span>
                <NetworkTag network={p.network} />
              </label>
            ))}
          </div>
        ))
      )}
      <div className="mk-lanzamientos-modal-actions">
        <button className="adm-btn adm-btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="adm-btn adm-btn-primary" onClick={create} disabled={saving || !sel.size}>
          {saving ? "Creando…" : `Crear ${sel.size} pieza${sel.size === 1 ? "" : "s"}`}
        </button>
      </div>
    </Modal>
  );
}

function AddPieceModal({ launch, onClose, onDone }) {
  const toast = useToast();
  const [form, setForm] = useState({ title: "", network: "linkedin", format: "post", date: launch.launch_on || "", time: "10:00" });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/${launch.id}/pieces`, { method: "POST", body: form });
      toast({ text: "Pieza creada ✦" });
      onDone();
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <Modal title="Nueva pieza del lanzamiento" onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="adm-alert adm-alert-error">{error}</div>}
        <Field label="Título">
          <input className="adm-input" value={form.title} onChange={set("title")} autoFocus required />
        </Field>
        <div className="mk-lanzamientos-row">
          <Field label="Red">
            <select className="adm-input adm-select" value={form.network} onChange={set("network")}>
              {NETWORKS.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
          </Field>
          <Field label="Formato">
            <select className="adm-input adm-select" value={form.format} onChange={set("format")}>
              {FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </Field>
        </div>
        <div className="mk-lanzamientos-row">
          <Field label="Fecha">
            <input type="date" className="adm-input" value={form.date} onChange={set("date")} />
          </Field>
          <Field label="Hora">
            <input type="time" className="adm-input" value={form.time} onChange={set("time")} />
          </Field>
        </div>
        <div className="mk-lanzamientos-modal-actions">
          <button type="button" className="adm-btn adm-btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="adm-btn adm-btn-primary" disabled={saving}>{saving ? "Creando…" : "Crear pieza"}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- Resultados ---------- */

const REASONS = {
  no_resource: "Asociá un recurso del sitio al lanzamiento para ver sus ventas.",
  no_dates: "Poné la fecha de apertura para ver los resultados.",
  not_started: "Los resultados aparecen cuando abra el lanzamiento.",
  error: "No se pudieron leer las ventas.",
};

function ResultsCard({ launchId }) {
  const [r, setR] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    api(`/${launchId}/results`).then(setR).catch((err) => setError(err.message));
  }, [launchId]);

  const max = r?.daily ? Math.max(1, ...r.daily.map((d) => d.count)) : 1;

  return (
    <div className="adm-card">
      <div className="adm-card-head">
        <span className="adm-card-title">Resultados</span>
        {r?.available && (
          <span className="adm-card-hint">
            {formatDate(r.period.from)} – {formatDate(r.period.to)}{r.period.open ? " (sigue abierto)" : ""} vs. {formatDate(r.previousPeriod.from)} – {formatDate(r.previousPeriod.to)}
          </span>
        )}
      </div>
      {error && <div className="adm-alert adm-alert-error">{error}</div>}
      {!r && !error && <div className="adm-skel" style={{ height: 90 }} />}
      {r && !r.available && <p className="adm-card-note">{REASONS[r.reason] || "Sin datos."}{r.error ? ` (${r.error})` : ""}</p>}
      {r?.available && (
        <>
          <div className="adm-stats-grid">
            <div className="adm-stat-card">
              <div className="adm-stat-label">Ventas en el lanzamiento</div>
              <div className="adm-stat-value">{r.current.count}</div>
              {r.deltaPct != null ? (
                <span className={`adm-trend ${r.deltaPct > 0 ? "adm-trend-up" : r.deltaPct < 0 ? "adm-trend-down" : "adm-trend-flat"}`}>
                  {r.deltaPct > 0 ? "+" : ""}{r.deltaPct}% vs. antes
                </span>
              ) : (
                <div className="adm-stat-sub">{r.previous.count === 0 && r.current.count > 0 ? "Sin ventas en el período anterior" : ""}</div>
              )}
            </div>
            <div className="adm-stat-card">
              <div className="adm-stat-label">Ingresos{r.usesNet ? " (neto)" : ""}</div>
              <div className="adm-stat-value" style={{ fontSize: 22 }}>{money(r.current.totals)}</div>
            </div>
            <div className="adm-stat-card">
              <div className="adm-stat-label">Período anterior ({r.period.days} días)</div>
              <div className="adm-stat-value">{r.previous.count}</div>
              <div className="adm-stat-sub">{money(r.previous.totals)}</div>
            </div>
            {r.goal && (
              <div className="adm-stat-card">
                <div className="adm-stat-label">Objetivo</div>
                <div className="adm-stat-value">{Math.round((r.current.count / r.goal) * 100)}%</div>
                <div className="adm-stat-sub">{r.current.count} de {r.goal} ventas</div>
              </div>
            )}
          </div>
          {r.daily.length > 1 && (
            <>
              <div className="mk-lanzamientos-bars" aria-label="Ventas por día">
                {r.daily.map((d) => (
                  <div key={d.day} className={d.count ? "" : "is-zero"} style={{ height: `${(d.count / max) * 100}%` }}
                    title={`${formatDate(d.day, { weekday: true })}: ${d.count} venta${d.count === 1 ? "" : "s"}`} />
                ))}
              </div>
              <div className="mk-lanzamientos-tl-dates" style={{ height: 16 }}>
                <span style={{ left: 0 }}>{formatDate(r.daily[0].day)}</span>
                <span style={{ left: "100%" }}>{formatDate(r.daily[r.daily.length - 1].day)}</span>
              </div>
            </>
          )}
          <p className="adm-card-note" style={{ marginTop: 10 }}>
            Ventas aprobadas de Hotmart (sin las de prueba) asociadas al recurso, comparadas con los {r.period.days} días anteriores a la apertura.
          </p>
        </>
      )}
    </div>
  );
}
