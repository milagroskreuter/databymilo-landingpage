"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LAUNCH_STATUSES } from "@/lib/marketing/launches/constants";
import { addDays, formatDate } from "@/lib/marketing/launches/dates";
import { BASE, Field, Modal, ResourceSelect, api } from "./ui";
import { useToast } from "../../AdminToast";

const EMPTY = { name: "", resource_slug: "", status: "planning", starts_on: "", launch_on: "", ends_on: "", goal_sales: "", notes: "" };

// Alta / edición de un lanzamiento.
export function LaunchFormModal({ launch, resources, onClose, onSaved }) {
  const toast = useToast();
  const router = useRouter();
  const isNew = !launch?.id;
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    ...Object.fromEntries(Object.entries(launch || {}).map(([k, v]) => [k, v ?? ""])),
  }));
  const [applyTemplates, setApplyTemplates] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  // Al elegir la apertura, propone inicio (3 semanas antes) y cierre (1 semana después).
  function setLaunchOn(e) {
    const v = e.target.value;
    setForm((f) => ({
      ...f,
      launch_on: v,
      starts_on: f.starts_on || (v ? addDays(v, -21) : ""),
      ends_on: f.ends_on || (v ? addDays(v, 7) : ""),
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: form.name,
        resource_slug: form.resource_slug,
        status: form.status,
        starts_on: form.starts_on,
        launch_on: form.launch_on,
        ends_on: form.ends_on,
        goal_sales: form.goal_sales,
        notes: form.notes,
      };
      if (isNew) {
        const data = await api("", { method: "POST", body: { ...body, applyTemplates } });
        toast({ text: data.tasks ? `Lanzamiento creado con ${data.tasks} tareas ✦` : "Lanzamiento creado ✦" });
        router.push(`${BASE}/${data.launch.id}`);
      } else {
        const data = await api(`/${launch.id}`, { method: "PUT", body });
        toast({ text: data.movedTasks ? `Guardado. Se movieron ${data.movedTasks} tareas a las nuevas fechas.` : "Guardado ✦" });
        onSaved?.(data.launch);
        onClose();
      }
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <Modal title={isNew ? "Nuevo lanzamiento" : "Editar lanzamiento"} onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="adm-alert adm-alert-error">{error}</div>}
        <Field label="Nombre">
          <input className="adm-input" value={form.name} onChange={set("name")} placeholder="Ej.: Lanzamiento ebook SQL" autoFocus required />
        </Field>
        <div className="mk-lanzamientos-row">
          <Field label="Recurso del sitio">
            <ResourceSelect value={form.resource_slug} onChange={set("resource_slug")} resources={resources} />
          </Field>
          <Field label="Estado">
            <select className="adm-input adm-select" value={form.status} onChange={set("status")}>
              {LAUNCH_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
        </div>
        <div className="mk-lanzamientos-row">
          <Field label="Apertura (lanzamiento)">
            <input type="date" className="adm-input" value={form.launch_on} onChange={setLaunchOn} />
          </Field>
          <Field label="Inicio del pre-lanzamiento">
            <input type="date" className="adm-input" value={form.starts_on} onChange={set("starts_on")} />
          </Field>
          <Field label="Cierre">
            <input type="date" className="adm-input" value={form.ends_on} onChange={set("ends_on")} />
          </Field>
        </div>
        <Field label="Objetivo de ventas (opcional)">
          <input type="number" min="0" className="adm-input" value={form.goal_sales} onChange={set("goal_sales")} placeholder="Ej.: 30" />
        </Field>
        <Field label="Notas">
          <textarea className="adm-input adm-textarea" rows={3} value={form.notes} onChange={set("notes")} />
        </Field>
        {isNew && (
          <label className="mk-lanzamientos-inline" style={{ fontSize: 13, marginBottom: 12 }}>
            <input type="checkbox" checked={applyTemplates} onChange={(e) => setApplyTemplates(e.target.checked)} />
            Armar el checklist con las plantillas
          </label>
        )}
        <div className="mk-lanzamientos-modal-actions">
          <button type="button" className="adm-btn adm-btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="adm-btn adm-btn-primary" disabled={saving}>{saving ? "Guardando…" : isNew ? "Crear" : "Guardar"}</button>
        </div>
      </form>
    </Modal>
  );
}

// "Planificar" una fecha clave: crea un lanzamiento o piezas para ese día.
export function PlanKeyDateModal({ keydate, resources, onClose, onDone }) {
  const toast = useToast();
  const router = useRouter();
  const [mode, setMode] = useState("launch");
  const [name, setName] = useState(keydate.name);
  const [resource, setResource] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const data = await api(`/keydates/${keydate.id}/plan`, {
        method: "POST",
        body: { mode, name, resource_slug: resource },
      });
      if (mode === "launch") {
        toast({ text: "Lanzamiento creado ✦" });
        router.push(`${BASE}/${data.launch.id}`);
      } else {
        toast({ text: `${data.created} piezas creadas en el calendario ✦` });
        onDone?.();
        onClose();
      }
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const range = keydate.ends_on && keydate.ends_on !== keydate.starts_on
    ? `${formatDate(keydate.starts_on, { weekday: true })} al ${formatDate(keydate.ends_on, { weekday: true, year: true })}`
    : formatDate(keydate.starts_on, { weekday: true, year: true });

  return (
    <Modal title={`Planificar: ${keydate.name}`} onClose={onClose}>
      <form onSubmit={submit}>
        <p className="mk-lanzamientos-muted" style={{ marginBottom: 14 }}>
          {range}
          {keydate.approximate && " · fecha aproximada, confirmala antes de comprometerte"}
        </p>
        {error && <div className="adm-alert adm-alert-error">{error}</div>}
        <div className="adm-form-group">
          <label className="mk-lanzamientos-inline" style={{ fontSize: 13.5 }}>
            <input type="radio" name="mode" checked={mode === "launch"} onChange={() => setMode("launch")} />
            <span><b>Crear un lanzamiento</b> que abra ese día (con checklist y pre-lanzamiento de 3 semanas)</span>
          </label>
          <label className="mk-lanzamientos-inline" style={{ fontSize: 13.5 }}>
            <input type="radio" name="mode" checked={mode === "pieces"} onChange={() => setMode("pieces")} />
            <span><b>Crear piezas</b> para ese día: un post de LinkedIn y un carrusel de Instagram</span>
          </label>
        </div>
        {mode === "launch" && (
          <div className="mk-lanzamientos-row">
            <Field label="Nombre">
              <input className="adm-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Recurso">
              <ResourceSelect value={resource} onChange={setResource} resources={resources} />
            </Field>
          </div>
        )}
        <div className="mk-lanzamientos-modal-actions">
          <button type="button" className="adm-btn adm-btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="adm-btn adm-btn-primary" disabled={saving}>{saving ? "Creando…" : "Planificar"}</button>
        </div>
      </form>
    </Modal>
  );
}
