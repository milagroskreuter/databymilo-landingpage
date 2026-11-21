"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { KEYDATE_KINDS, KEYDATE_KIND_BY_ID, KEYDATE_REGIONS } from "@/lib/marketing/launches/constants";
import { formatDate, todayAR } from "@/lib/marketing/launches/dates";
import { BASE, Field, KindDot, Modal, Tabs, api } from "../ui";
import { PlanKeyDateModal } from "../forms";
import { useToast } from "../../../AdminToast";

const EMPTY = { name: "", starts_on: "", ends_on: "", kind: "comercial", region: "AR", approximate: false, notes: "", active: true };

export default function KeyDatesClient() {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [resources, setResources] = useState([]);
  const [error, setError] = useState(null);
  const [showPast, setShowPast] = useState(false);
  const [kind, setKind] = useState("");
  const [editing, setEditing] = useState(null); // objeto o EMPTY
  const [planning, setPlanning] = useState(null);

  async function load() {
    try {
      const [k, l] = await Promise.all([api("/keydates?all=1"), api("")]);
      setList(k.keydates);
      setResources(l.resources);
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => { load(); }, []);

  const today = todayAR();
  const visible = useMemo(
    () => (list || []).filter((k) => (showPast || (k.ends_on || k.starts_on) >= today) && (!kind || k.kind === kind)),
    [list, showPast, kind, today]
  );
  const byYear = useMemo(() => {
    const g = {};
    for (const k of visible) (g[k.starts_on.slice(0, 4)] ||= []).push(k);
    return Object.entries(g);
  }, [visible]);

  async function remove(k) {
    if (!confirm(`¿Borrar "${k.name}" (${formatDate(k.starts_on, { year: true })})?`)) return;
    try {
      await api(`/keydates/${k.id}`, { method: "DELETE" });
      toast({ text: "Fecha borrada" });
      load();
    } catch (err) {
      toast({ type: "error", text: err.message });
    }
  }

  return (
    <>
      <div className="adm-header">
        <h1>Fechas clave</h1>
        <button className="adm-btn adm-btn-primary" onClick={() => setEditing(EMPTY)}>+ Nueva fecha</button>
      </div>
      <div className="adm-content">
        <Tabs />
        {error && <div className="adm-alert adm-alert-error">{error}</div>}

        <div className="adm-toolbar">
          <select className="adm-input adm-select" style={{ width: "auto" }} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">Todos los tipos</option>
            {KEYDATE_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
          <label className="mk-lanzamientos-inline" style={{ fontSize: 13 }}>
            <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} />
            Mostrar las que ya pasaron
          </label>
          <span className="mk-lanzamientos-spacer" />
          <span className="mk-lanzamientos-muted">
            <span className="mk-lanzamientos-approx">aprox.</span> = sin fecha oficial confirmada todavía
          </span>
        </div>

        {!list ? (
          <div className="adm-skel" style={{ height: 300 }} />
        ) : visible.length === 0 ? (
          <div className="adm-card"><div className="adm-empty">No hay fechas para mostrar.</div></div>
        ) : (
          byYear.map(([year, items]) => (
            <div key={year} className="adm-card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="adm-card-head" style={{ padding: "16px 22px 0" }}>
                <span className="adm-card-title">{year}</span>
                <span className="adm-card-hint">{items.length} fechas</span>
              </div>
              <div className="adm-table-wrap">
                <table className="adm-table mk-lanzamientos-table">
                  <thead>
                    <tr><th>Fecha</th><th>Faltan</th><th>Nombre</th><th>Tipo</th><th>Región</th><th></th></tr>
                  </thead>
                  <tbody>
                    {items.map((k) => {
                      const past = (k.ends_on || k.starts_on) < today;
                      return (
                        <tr key={k.id} className={past || !k.active ? "mk-lanzamientos-past" : ""}>
                          <td style={{ whiteSpace: "nowrap" }}>
                            {formatDate(k.starts_on, { weekday: true })}
                            {k.ends_on && k.ends_on !== k.starts_on && ` – ${formatDate(k.ends_on)}`}
                          </td>
                          <td style={{ whiteSpace: "nowrap", fontWeight: 700, color: "var(--adm-primary)" }}>
                            {past ? "—" : k.days_left <= 0 ? "en curso" : `${k.days_left} d`}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>
                              {k.name} {k.approximate && <span className="mk-lanzamientos-approx">aprox.</span>}
                              {!k.active && <span className="mk-lanzamientos-muted"> · oculta</span>}
                            </div>
                            {k.notes && <div className="mk-lanzamientos-muted" style={{ fontSize: 11.5 }}>{k.notes}</div>}
                            {k.launches?.length > 0 && (
                              <div className="mk-lanzamientos-inline" style={{ marginTop: 4, gap: 4 }}>
                                {k.launches.map((l) => (
                                  <Link key={l.id} href={`${BASE}/${l.id}`} className="mk-lanzamientos-chip">➶ {l.name}</Link>
                                ))}
                              </div>
                            )}
                          </td>
                          <td style={{ whiteSpace: "nowrap" }}>
                            <span className="mk-lanzamientos-inline" style={{ gap: 6 }}>
                              <KindDot kind={k.kind} />{KEYDATE_KIND_BY_ID[k.kind]?.label || k.kind}
                            </span>
                          </td>
                          <td>{k.region}</td>
                          <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                            <div className="mk-lanzamientos-inline" style={{ justifyContent: "flex-end", gap: 6 }}>
                              {!past && <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setPlanning(k)}>Planificar</button>}
                              <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setEditing(k)}>Editar</button>
                              <button className="mk-lanzamientos-x" style={{ opacity: 1 }} onClick={() => remove(k)} aria-label="Borrar">×</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {editing && <KeyDateModal value={editing} onClose={() => setEditing(null)} onSaved={load} />}
      {planning && <PlanKeyDateModal keydate={planning} resources={resources} onClose={() => setPlanning(null)} onDone={load} />}
    </>
  );
}

function KeyDateModal({ value, onClose, onSaved }) {
  const toast = useToast();
  const isNew = !value.id;
  const [form, setForm] = useState({ ...EMPTY, ...Object.fromEntries(Object.entries(value).map(([k, v]) => [k, v ?? ""])) });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = {
      name: form.name, starts_on: form.starts_on, ends_on: form.ends_on, kind: form.kind,
      region: form.region, approximate: form.approximate, notes: form.notes, active: form.active,
    };
    try {
      await api(isNew ? "/keydates" : `/keydates/${value.id}`, { method: isNew ? "POST" : "PUT", body });
      toast({ text: isNew ? "Fecha agregada ✦" : "Fecha guardada ✦" });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <Modal title={isNew ? "Nueva fecha clave" : "Editar fecha clave"} onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="adm-alert adm-alert-error">{error}</div>}
        <Field label="Nombre">
          <input className="adm-input" value={form.name} onChange={set("name")} autoFocus required />
        </Field>
        <div className="mk-lanzamientos-row">
          <Field label="Fecha">
            <input type="date" className="adm-input" value={form.starts_on} onChange={set("starts_on")} required />
          </Field>
          <Field label="Hasta (si dura varios días)">
            <input type="date" className="adm-input" value={form.ends_on} onChange={set("ends_on")} />
          </Field>
        </div>
        <div className="mk-lanzamientos-row">
          <Field label="Tipo">
            <select className="adm-input adm-select" value={form.kind} onChange={set("kind")}>
              {KEYDATE_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
            </select>
          </Field>
          <Field label="Región">
            <select className="adm-input adm-select" value={form.region} onChange={set("region")}>
              {KEYDATE_REGIONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Notas">
          <textarea className="adm-input adm-textarea" rows={2} value={form.notes} onChange={set("notes")} />
        </Field>
        <div className="mk-lanzamientos-inline" style={{ gap: 18, fontSize: 13, marginBottom: 12 }}>
          <label className="mk-lanzamientos-inline">
            <input type="checkbox" checked={form.approximate} onChange={set("approximate")} /> Fecha aproximada
          </label>
          <label className="mk-lanzamientos-inline">
            <input type="checkbox" checked={form.active} onChange={set("active")} /> Mostrar en próximas fechas y calendario
          </label>
        </div>
        <div className="mk-lanzamientos-modal-actions">
          <button type="button" className="adm-btn adm-btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="adm-btn adm-btn-primary" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</button>
        </div>
      </form>
    </Modal>
  );
}
