"use client";
// ABM de pilares (mk_pillars) + balance real contra objetivo.
import { useState } from "react";
import { useToast } from "../../AdminToast";
import { api } from "./api";
import PillarBalance from "./PillarBalance";

function PillarRow({ pillar, onChange, onDelete }) {
  const [draft, setDraft] = useState({ color: pillar.color, name: pillar.name, target_pct: pillar.target_pct ?? "", description: pillar.description || "" });
  const commit = (field, value) => {
    if (String(value ?? "") === String(pillar[field] ?? "")) return;
    onChange(pillar, { [field]: value === "" ? null : value });
  };
  return (
    <div className={`mk-cal-pillar${pillar.active === false ? " is-off" : ""}`}>
      <input
        type="color"
        className="mk-cal-color"
        value={draft.color}
        onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
        onBlur={() => commit("color", draft.color)}
        aria-label={`Color de ${pillar.name}`}
      />
      <input
        className="adm-input mk-cal-pillar-name"
        value={draft.name}
        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
        onBlur={() => (draft.name.trim() ? commit("name", draft.name.trim()) : setDraft((d) => ({ ...d, name: pillar.name })))}
        aria-label="Nombre"
      />
      <input
        className="adm-input mk-cal-pillar-desc"
        value={draft.description}
        placeholder="Descripción"
        onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
        onBlur={() => commit("description", draft.description.trim())}
        aria-label="Descripción"
      />
      <label className="mk-cal-pillar-pct">
        <input
          type="number"
          min="0"
          max="100"
          className="adm-input"
          value={draft.target_pct}
          onChange={(e) => setDraft((d) => ({ ...d, target_pct: e.target.value }))}
          onBlur={() => commit("target_pct", draft.target_pct === "" ? "" : Number(draft.target_pct))}
          aria-label="Objetivo en %"
        />
        <span>%</span>
      </label>
      <label className="mk-cal-check">
        <input type="checkbox" checked={pillar.active !== false} onChange={(e) => onChange(pillar, { active: e.target.checked })} />
        Activo
      </label>
      <button type="button" className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => onDelete(pillar)}>
        Borrar
      </button>
    </div>
  );
}

export default function PillarsPanel({ pillars, setPillars, balance }) {
  const toast = useToast();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#5b7fa6");
  const [newPct, setNewPct] = useState("");

  const sum = pillars.filter((p) => p.active !== false).reduce((s, p) => s + (p.target_pct || 0), 0);

  async function update(pillar, patch) {
    const prev = pillars;
    setPillars((list) => list.map((p) => (p.id === pillar.id ? { ...p, ...patch } : p)));
    try {
      const item = await api.updatePillar(pillar.id, patch);
      setPillars((list) => list.map((p) => (p.id === item.id ? item : p)));
    } catch (err) {
      setPillars(prev);
      toast?.({ type: "error", text: err.message });
    }
  }

  async function remove(pillar) {
    if (!confirm(`¿Borrar el pilar "${pillar.name}"? Sus piezas quedan sin pilar. Si solo no lo usás más, desactivalo.`)) return;
    try {
      await api.deletePillar(pillar.id);
      setPillars((list) => list.filter((p) => p.id !== pillar.id));
      toast?.({ text: "Pilar borrado" });
    } catch (err) {
      toast?.({ type: "error", text: err.message });
    }
  }

  async function add(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const item = await api.createPillar({ name: newName, color: newColor, target_pct: newPct === "" ? null : Number(newPct) });
      setPillars((list) => [...list, item]);
      setNewName("");
      setNewPct("");
      toast?.({ text: "Pilar creado" });
    } catch (err) {
      toast?.({ type: "error", text: err.message });
    }
  }

  return (
    <div className="mk-cal-two">
      <section className="adm-card">
        <div className="adm-card-head">
          <h2 className="adm-card-title">Pilares</h2>
          <span className={`adm-card-hint${sum !== 100 ? " mk-cal-late" : ""}`}>Objetivos: {sum}%{sum !== 100 ? " (debería sumar 100%)" : ""}</span>
        </div>
        <div className="mk-cal-pillars">
          {pillars.map((p) => (
            <PillarRow key={p.id} pillar={p} onChange={update} onDelete={remove} />
          ))}
        </div>
        <form className="mk-cal-pillar mk-cal-pillar-new" onSubmit={add}>
          <input type="color" className="mk-cal-color" value={newColor} onChange={(e) => setNewColor(e.target.value)} aria-label="Color" />
          <input className="adm-input mk-cal-pillar-name" placeholder="Nuevo pilar" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <label className="mk-cal-pillar-pct">
            <input type="number" min="0" max="100" className="adm-input" placeholder="%" value={newPct} onChange={(e) => setNewPct(e.target.value)} aria-label="Objetivo en %" />
            <span>%</span>
          </label>
          <button type="submit" className="adm-btn adm-btn-primary adm-btn-sm" disabled={!newName.trim()}>
            Agregar
          </button>
        </form>
      </section>

      <section className="adm-card">
        <div className="adm-card-head">
          <h2 className="adm-card-title">Balance real</h2>
          <span className="adm-card-hint">últimos 30 días + próximas</span>
        </div>
        <PillarBalance balance={balance} />
      </section>
    </div>
  );
}
