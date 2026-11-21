"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "../../AdminToast";
import {
  SLOT_CHANNELS, SLOT_CHANNEL_BY_ID, SLOT_STATUSES, SLOT_STATUS_BY_ID, CURRENCIES,
  formatMoney, sumByCurrency, todayAR,
} from "@/lib/marketing/sponsors/constants";
import { api, Modal, Field, Pill } from "./ui";

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const WEEKDAYS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

const pad = (n) => String(n).padStart(2, "0");

export default function SlotsPanel() {
  const toast = useToast();
  const today = todayAR();
  const [cursor, setCursor] = useState(() => ({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 }));
  const [slots, setSlots] = useState(null);
  const [deals, setDeals] = useState([]);
  const [rates, setRates] = useState(null);
  const [error, setError] = useState("");
  const [slotEdit, setSlotEdit] = useState(null);
  const [rateEdit, setRateEdit] = useState(null);

  const load = useCallback(async () => {
    try {
      const [s, d, r] = await Promise.all([api("slots"), api("deals"), api("rates")]);
      setSlots(s.items);
      setDeals(d.items);
      setRates(r.items);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const dealName = useMemo(() => Object.fromEntries(deals.map((d) => [d.id, d.brand])), [deals]);

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const offset = (first.getDay() + 6) % 7; // lunes primero
    const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const out = [];
    for (let i = 0; i < offset; i++) out.push(null);
    for (let d = 1; d <= days; d++) out.push(`${cursor.y}-${pad(cursor.m + 1)}-${pad(d)}`);
    while (out.length % 7) out.push(null);
    return out;
  }, [cursor]);

  const monthPrefix = `${cursor.y}-${pad(cursor.m + 1)}`;
  const monthSlots = (slots || []).filter((s) => s.slot_date.startsWith(monthPrefix));
  const booked = monthSlots.filter((s) => ["reservado", "confirmado", "publicado", "cobrado"].includes(s.status));
  const free = monthSlots.filter((s) => s.status === "disponible").length;

  function shift(delta) {
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  if (error) return <div className="adm-alert adm-alert-error">{error}</div>;
  if (!slots || !rates) return <div className="adm-skel" style={{ height: 240 }} />;

  return (
    <div className="mk-sponsors-stack">
      <section>
        <div className="mk-sponsors-bar">
          <div className="mk-sponsors-month">
            <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => shift(-1)} aria-label="Mes anterior">←</button>
            <h3>{MONTHS[cursor.m]} {cursor.y}</h3>
            <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => shift(1)} aria-label="Mes siguiente">→</button>
          </div>
          <div className="mk-sponsors-kpis">
            <div><b>{booked.length}</b><span>con marca</span></div>
            <div><b>{free}</b><span>disponibles</span></div>
            <div><b>{sumByCurrency(booked, "price") || "—"}</b><span>en el mes</span></div>
          </div>
          <button className="adm-btn adm-btn-primary" onClick={() => setSlotEdit({ slot_date: today, channel: "linkedin", status: "disponible", currency: "USD" })}>+ Nuevo espacio</button>
        </div>

        <div className="mk-sponsors-cal">
          {WEEKDAYS.map((w) => <div key={w} className="mk-sponsors-cal-wd">{w}</div>)}
          {cells.map((iso, i) => {
            if (!iso) return <div key={i} className="mk-sponsors-cal-day blank" />;
            const here = (slots || []).filter((s) => s.slot_date === iso);
            return (
              <div key={iso} className={`mk-sponsors-cal-day${iso === today ? " today" : ""}`}>
                <button type="button" className="num" onClick={() => setSlotEdit({ slot_date: iso, channel: "linkedin", status: "disponible", currency: "USD" })} aria-label={`Agregar espacio el ${iso}`}>
                  {Number(iso.slice(8))}
                </button>
                {here.map((s) => (
                  <button key={s.id} type="button" className="mk-sponsors-chip" style={{ "--pill": SLOT_CHANNEL_BY_ID[s.channel]?.color }} onClick={() => setSlotEdit(s)} title={SLOT_STATUS_BY_ID[s.status]?.label}>
                    <span>{SLOT_CHANNEL_BY_ID[s.channel]?.label}</span>
                    <em className={`st-${s.status}`}>{s.deal_id ? dealName[s.deal_id] : s.brand || SLOT_STATUS_BY_ID[s.status]?.label}</em>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mk-sponsors-bar">
          <h3 className="mk-sponsors-h3">Tarifas por formato</h3>
          <button className="adm-btn adm-btn-secondary" onClick={() => setRateEdit({ currency: "USD", public: true, sort_order: (rates.length + 1) * 10 })}>+ Nueva tarifa</button>
        </div>
        {rates.length === 0 ? (
          <div className="adm-empty"><p>Sin tarifas cargadas. Armalas por formato (post, carrusel, mención en la newsletter, paquete…).</p></div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Formato</th><th>Canal</th><th>Precio</th><th>Público</th><th /></tr></thead>
              <tbody>
                {rates.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.name}</strong>{r.description && <div className="mk-sponsors-sub">{r.description}</div>}</td>
                    <td>{SLOT_CHANNEL_BY_ID[r.channel]?.label || r.channel || "—"}</td>
                    <td>{r.price !== null ? formatMoney(r.price, r.currency) : "A consultar"}{r.price_to ? ` – ${formatMoney(r.price_to, r.currency).replace(`${r.currency} `, "")}` : ""}</td>
                    <td>{r.public ? "Sí" : "No"}</td>
                    <td style={{ textAlign: "right" }}><button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setRateEdit(r)}>Editar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mk-sponsors-hint" style={{ marginTop: 8 }}>Las tarifas solo aparecen en el media kit si activás “Mostrar tarifas” en la pestaña Media kit.</p>
      </section>

      {slotEdit && <SlotModal slot={slotEdit} deals={deals} onClose={() => setSlotEdit(null)} onSaved={load} toast={toast} />}
      {rateEdit && <RateModal rate={rateEdit} onClose={() => setRateEdit(null)} onSaved={load} toast={toast} />}
    </div>
  );
}

function SlotModal({ slot, deals, onClose, onSaved, toast }) {
  const isNew = !slot.id;
  const [f, setF] = useState({
    slot_date: slot.slot_date, channel: slot.channel || "linkedin", format: slot.format || "", deal_id: slot.deal_id || "",
    brand: slot.brand || "", price: slot.price ?? "", currency: slot.currency || "USD", status: slot.status || "disponible", notes: slot.notes || "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { ...f, deal_id: f.deal_id || null };
      if (isNew) await api("slots", { method: "POST", body });
      else await api(`slots/${slot.id}`, { method: "PATCH", body });
      toast({ text: "Guardado" });
      onSaved();
      onClose();
    } catch (err) {
      toast({ type: "error", text: err.message });
      setBusy(false);
    }
  }
  async function remove() {
    if (!window.confirm("¿Borrar este espacio?")) return;
    try { await api(`slots/${slot.id}`, { method: "DELETE" }); onSaved(); onClose(); } catch (err) { toast({ type: "error", text: err.message }); }
  }

  return (
    <Modal title={isNew ? "Nuevo espacio patrocinado" : "Espacio patrocinado"} onClose={onClose}>
      <form onSubmit={save} className="mk-sponsors-form">
        <div className="mk-sponsors-grid">
          <Field label="Fecha"><input className="adm-input" type="date" required value={f.slot_date} onChange={(e) => set("slot_date", e.target.value)} /></Field>
          <Field label="Canal">
            <select className="adm-select" value={f.channel} onChange={(e) => set("channel", e.target.value)}>
              {SLOT_CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Estado">
            <select className="adm-select" value={f.status} onChange={(e) => set("status", e.target.value)}>
              {SLOT_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Marca (de tu tablero)" span={2}>
            <select className="adm-select" value={f.deal_id} onChange={(e) => set("deal_id", e.target.value)}>
              <option value="">— Sin acuerdo cargado —</option>
              {deals.map((d) => <option key={d.id} value={d.id}>{d.brand}</option>)}
            </select>
          </Field>
          <Field label="o nombre libre"><input className="adm-input" value={f.brand} onChange={(e) => set("brand", e.target.value)} /></Field>
          <Field label="Formato"><input className="adm-input" value={f.format} onChange={(e) => set("format", e.target.value)} placeholder="Post, carrusel, mención…" /></Field>
          <Field label="Precio"><input className="adm-input" inputMode="decimal" value={f.price} onChange={(e) => set("price", e.target.value)} /></Field>
          <Field label="Moneda">
            <select className="adm-select" value={f.currency} onChange={(e) => set("currency", e.target.value)}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Notas" span={3}><textarea className="adm-textarea" style={{ minHeight: 64 }} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
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

function RateModal({ rate, onClose, onSaved, toast }) {
  const isNew = !rate.id;
  const [f, setF] = useState({
    name: rate.name || "", channel: rate.channel || "", description: rate.description || "", price: rate.price ?? "",
    price_to: rate.price_to ?? "", currency: rate.currency || "USD", public: rate.public ?? true, sort_order: rate.sort_order ?? 0,
  });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  async function save(e) {
    e.preventDefault();
    if (!f.name.trim()) return toast({ type: "error", text: "Poné el nombre del formato" });
    setBusy(true);
    try {
      if (isNew) await api("rates", { method: "POST", body: f });
      else await api(`rates/${rate.id}`, { method: "PATCH", body: f });
      toast({ text: "Guardado" });
      onSaved();
      onClose();
    } catch (err) {
      toast({ type: "error", text: err.message });
      setBusy(false);
    }
  }
  async function remove() {
    if (!window.confirm("¿Borrar esta tarifa?")) return;
    try { await api(`rates/${rate.id}`, { method: "DELETE" }); onSaved(); onClose(); } catch (err) { toast({ type: "error", text: err.message }); }
  }

  return (
    <Modal title={isNew ? "Nueva tarifa" : "Editar tarifa"} onClose={onClose}>
      <form onSubmit={save} className="mk-sponsors-form">
        <div className="mk-sponsors-grid">
          <Field label="Formato" span={2}><input className="adm-input" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Ej: Carrusel patrocinado" autoFocus /></Field>
          <Field label="Canal">
            <select className="adm-select" value={f.channel} onChange={(e) => set("channel", e.target.value)}>
              <option value="">—</option>
              {SLOT_CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Precio"><input className="adm-input" inputMode="decimal" value={f.price} onChange={(e) => set("price", e.target.value)} /></Field>
          <Field label="Hasta (si es rango)"><input className="adm-input" inputMode="decimal" value={f.price_to} onChange={(e) => set("price_to", e.target.value)} /></Field>
          <Field label="Moneda">
            <select className="adm-select" value={f.currency} onChange={(e) => set("currency", e.target.value)}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Qué incluye" span={3}><textarea className="adm-textarea" style={{ minHeight: 64 }} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
          <label className="mk-sponsors-check span-2">
            <input type="checkbox" checked={f.public} onChange={(e) => set("public", e.target.checked)} /> Mostrar en el media kit
          </label>
          <Field label="Orden"><input className="adm-input" inputMode="numeric" value={f.sort_order} onChange={(e) => set("sort_order", e.target.value)} /></Field>
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
