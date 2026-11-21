"use client";
import { useEffect, useState } from "react";
import { ANCHORS, PHASES } from "@/lib/marketing/launches/constants";
import { Tabs, api } from "../ui";
import { useToast } from "../../../AdminToast";

// Texto legible del momento de una tarea: "7 días antes de la apertura".
function whenLabel(t) {
  const anchor = ANCHORS.find((a) => a.id === t.anchor)?.label || "la apertura";
  const n = t.offset_days;
  if (n === 0) return `el día de ${anchor}`;
  return `${Math.abs(n)} día${Math.abs(n) === 1 ? "" : "s"} ${n < 0 ? "antes" : "después"} de ${anchor}`;
}

export default function TemplatesClient() {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setList((await api("/templates")).templates);
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => { load(); }, []);

  async function save(id, patch) {
    try {
      const { template } = await api(`/templates/${id}`, { method: "PUT", body: patch });
      setList((l) => l.map((t) => (t.id === id ? template : t)));
    } catch (err) {
      toast({ type: "error", text: err.message });
    }
  }

  async function remove(t) {
    if (!confirm(`¿Borrar la plantilla "${t.title}"? Las tareas ya creadas en lanzamientos no cambian.`)) return;
    try {
      await api(`/templates/${t.id}`, { method: "DELETE" });
      setList((l) => l.filter((x) => x.id !== t.id));
    } catch (err) {
      toast({ type: "error", text: err.message });
    }
  }

  async function add(phase, title) {
    try {
      const defaults = { pre: { anchor: "launch", offset_days: -7 }, launch: { anchor: "launch", offset_days: 0 }, post: { anchor: "end", offset_days: 3 } };
      const { template } = await api("/templates", { method: "POST", body: { phase, title, ...defaults[phase] } });
      setList((l) => [...l, template]);
    } catch (err) {
      toast({ type: "error", text: err.message });
    }
  }

  return (
    <>
      <div className="adm-header">
        <h1>Plantillas de checklist</h1>
      </div>
      <div className="adm-content">
        <Tabs />
        <p className="adm-card-note">
          Estas tareas se copian a cada lanzamiento nuevo, con la fecha calculada desde la apertura o el cierre.
          Cambiarlas no modifica los lanzamientos que ya tienen checklist.
        </p>
        {error && <div className="adm-alert adm-alert-error">{error}</div>}
        {!list ? (
          <div className="adm-skel" style={{ height: 300 }} />
        ) : (
          PHASES.map((ph) => {
            const items = list
              .filter((t) => t.phase === ph.id)
              .sort((a, b) => (a.anchor === b.anchor ? a.offset_days - b.offset_days : a.anchor === "launch" ? -1 : 1) || a.sort_order - b.sort_order);
            return (
              <div key={ph.id} className="adm-card" style={{ padding: 0, overflow: "hidden" }}>
                <div className="adm-card-head" style={{ padding: "16px 22px 0" }}>
                  <span className="adm-card-title">{ph.label}</span>
                  <span className="adm-card-hint">{items.filter((t) => t.active).length} activas</span>
                </div>
                <div className="adm-table-wrap">
                  <table className="adm-table mk-lanzamientos-table">
                    <thead>
                      <tr><th style={{ width: 40 }}>Usar</th><th>Tarea</th><th style={{ width: 290 }}>Cuándo</th><th style={{ width: 30 }}></th></tr>
                    </thead>
                    <tbody>
                      {items.map((t) => <TemplateRow key={t.id} t={t} onSave={(p) => save(t.id, p)} onDelete={() => remove(t)} />)}
                    </tbody>
                  </table>
                </div>
                <AddRow onAdd={(title) => add(ph.id, title)} />
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

function TemplateRow({ t, onSave, onDelete }) {
  const [title, setTitle] = useState(t.title);
  const [desc, setDesc] = useState(t.description || "");
  const [offset, setOffset] = useState(Math.abs(t.offset_days));
  const [dir, setDir] = useState(t.offset_days < 0 ? "antes" : t.offset_days > 0 ? "despues" : "dia");

  function saveWhen(nextOffset, nextDir, anchor = t.anchor) {
    const n = nextDir === "dia" ? 0 : (nextDir === "antes" ? -1 : 1) * Math.abs(parseInt(nextOffset, 10) || 0);
    if (n !== t.offset_days || anchor !== t.anchor) onSave({ offset_days: n, anchor });
  }

  return (
    <tr className={t.active ? "" : "mk-lanzamientos-past"}>
      <td><input type="checkbox" checked={t.active} onChange={(e) => onSave({ active: e.target.checked })} aria-label="Usar esta tarea" /></td>
      <td>
        <input className="adm-input" value={title} onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() && title !== t.title && onSave({ title })} style={{ width: "100%", fontWeight: 600 }} />
        <input className="adm-input" value={desc} placeholder="Detalle (opcional)" onChange={(e) => setDesc(e.target.value)}
          onBlur={() => desc !== (t.description || "") && onSave({ description: desc })} style={{ width: "100%", marginTop: 4, fontSize: 12 }} />
      </td>
      <td>
        <div className="mk-lanzamientos-inline" style={{ gap: 4, flexWrap: "nowrap" }}>
          {dir !== "dia" && (
            <input type="number" min="0" className="adm-input" style={{ width: 56 }} value={offset}
              onChange={(e) => setOffset(e.target.value)} onBlur={() => saveWhen(offset, dir)} />
          )}
          <select className="adm-input adm-select" value={dir} onChange={(e) => { setDir(e.target.value); saveWhen(offset || 1, e.target.value); if (!offset) setOffset(1); }}>
            <option value="antes">días antes de</option>
            <option value="dia">el día de</option>
            <option value="despues">días después de</option>
          </select>
          <select className="adm-input adm-select" value={t.anchor} onChange={(e) => saveWhen(offset, dir, e.target.value)}>
            {ANCHORS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>
        <div className="mk-lanzamientos-muted" style={{ fontSize: 11, marginTop: 3 }}>{whenLabel(t)}</div>
      </td>
      <td><button className="mk-lanzamientos-x" style={{ opacity: 1 }} onClick={onDelete} aria-label="Borrar plantilla">×</button></td>
    </tr>
  );
}

function AddRow({ onAdd }) {
  const [title, setTitle] = useState("");
  return (
    <form
      className="mk-lanzamientos-add"
      style={{ padding: "4px 22px 16px" }}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        await onAdd(title.trim());
        setTitle("");
      }}
    >
      <input className="adm-input" placeholder="+ Nueva tarea de plantilla" value={title} onChange={(e) => setTitle(e.target.value)} />
      {title && <button className="adm-btn adm-btn-primary adm-btn-sm">Sumar</button>}
    </form>
  );
}
