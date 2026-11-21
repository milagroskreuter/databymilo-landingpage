"use client";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "../../AdminToast";
import { NETWORKS, networkLabel } from "@/lib/marketing/constants";
import { COLLAB_STATUSES, COLLAB_STATUS_BY_ID, shortDate } from "@/lib/marketing/sponsors/constants";
import { api, Modal, Field, Pill } from "./ui";

export default function CollabsPanel() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [edit, setEdit] = useState(null);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    try { setItems((await api("collabs")).items); setError(""); } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (error) return <div className="adm-alert adm-alert-error">{error}</div>;
  if (!items) return <div className="adm-skel" style={{ height: 200 }} />;

  const shown = items.filter((c) => !filter || c.status === filter);

  return (
    <div className="mk-sponsors-stack">
      <div className="mk-sponsors-bar">
        <div className="mk-sponsors-filters">
          <button className={!filter ? "on" : ""} onClick={() => setFilter("")}>Todas · {items.length}</button>
          {COLLAB_STATUSES.map((s) => {
            const n = items.filter((c) => c.status === s.id).length;
            return n ? <button key={s.id} className={filter === s.id ? "on" : ""} onClick={() => setFilter(s.id)}>{s.label} · {n}</button> : null;
          })}
        </div>
        <button className="adm-btn adm-btn-primary" onClick={() => setEdit({ status: "idea" })}>+ Nueva colaboración</button>
      </div>

      {!items.length ? (
        <div className="adm-empty"><p>Todavía no anotaste colaboraciones con otros creadores.</p><p>Sumá ideas de lives, posts en conjunto o cruces de newsletter.</p></div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Creador/a</th><th>Red</th><th>Idea</th><th>Fecha</th><th>Estado</th><th /></tr></thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.creator_name}</strong>
                    {c.handle && <div className="mk-sponsors-sub">{c.handle}</div>}
                  </td>
                  <td>{c.network ? networkLabel(c.network) : "—"}</td>
                  <td style={{ maxWidth: 340 }}>{c.idea || "—"}</td>
                  <td>{c.collab_on ? shortDate(c.collab_on) : "—"}</td>
                  <td><Pill color={COLLAB_STATUS_BY_ID[c.status]?.color}>{COLLAB_STATUS_BY_ID[c.status]?.label || c.status}</Pill></td>
                  <td style={{ textAlign: "right" }}><button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setEdit(c)}>Editar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {edit && <CollabModal collab={edit} onClose={() => setEdit(null)} onSaved={load} toast={toast} />}
    </div>
  );
}

function CollabModal({ collab, onClose, onSaved, toast }) {
  const isNew = !collab.id;
  const [f, setF] = useState({
    creator_name: collab.creator_name || "", handle: collab.handle || "", network: collab.network || "", idea: collab.idea || "",
    status: collab.status || "idea", collab_on: collab.collab_on || "", contact: collab.contact || "", link: collab.link || "", notes: collab.notes || "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  async function save(e) {
    e.preventDefault();
    if (!f.creator_name.trim()) return toast({ type: "error", text: "Poné el nombre del creador o creadora" });
    setBusy(true);
    try {
      if (isNew) await api("collabs", { method: "POST", body: f });
      else await api(`collabs/${collab.id}`, { method: "PATCH", body: f });
      toast({ text: "Guardado" });
      onSaved();
      onClose();
    } catch (err) {
      toast({ type: "error", text: err.message });
      setBusy(false);
    }
  }
  async function remove() {
    if (!window.confirm(`¿Borrar la colaboración con ${collab.creator_name}?`)) return;
    try { await api(`collabs/${collab.id}`, { method: "DELETE" }); onSaved(); onClose(); } catch (err) { toast({ type: "error", text: err.message }); }
  }

  return (
    <Modal title={isNew ? "Nueva colaboración" : collab.creator_name} onClose={onClose}>
      <form onSubmit={save} className="mk-sponsors-form">
        <div className="mk-sponsors-grid">
          <Field label="Creador/a" span={2}><input className="adm-input" value={f.creator_name} onChange={(e) => set("creator_name", e.target.value)} autoFocus /></Field>
          <Field label="Usuario"><input className="adm-input" value={f.handle} onChange={(e) => set("handle", e.target.value)} placeholder="@usuario" /></Field>
          <Field label="Red">
            <select className="adm-select" value={f.network} onChange={(e) => set("network", e.target.value)}>
              <option value="">—</option>
              {NETWORKS.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
          </Field>
          <Field label="Estado">
            <select className="adm-select" value={f.status} onChange={(e) => set("status", e.target.value)}>
              {COLLAB_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Fecha"><input className="adm-input" type="date" value={f.collab_on} onChange={(e) => set("collab_on", e.target.value)} /></Field>
          <Field label="La idea" span={3}><textarea className="adm-textarea" style={{ minHeight: 80 }} value={f.idea} onChange={(e) => set("idea", e.target.value)} placeholder="Qué harían juntas" /></Field>
          <Field label="Contacto" span={2}><input className="adm-input" value={f.contact} onChange={(e) => set("contact", e.target.value)} placeholder="Email o DM" /></Field>
          <Field label="Link (perfil o publicación)"><input className="adm-input" value={f.link} onChange={(e) => set("link", e.target.value)} /></Field>
          <Field label="Notas" span={3}><textarea className="adm-textarea" style={{ minHeight: 56 }} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
        </div>
        <div className="mk-sponsors-actions">
          {!isNew && <button type="button" className="adm-btn adm-btn-danger" onClick={remove}>Borrar</button>}
          <span style={{ flex: 1 }} />
          <button type="button" className="adm-btn adm-btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="adm-btn adm-btn-primary" disabled={busy}>{busy ? "Guardando…" : "Guardar"}</button>
        </div>
      </form>
    </Modal>
  );
}
