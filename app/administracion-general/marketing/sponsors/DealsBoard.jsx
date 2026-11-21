"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useToast } from "../../AdminToast";
import { networkLabel } from "@/lib/marketing/constants";
import {
  STAGES, STAGE_BY_ID, DONE_STAGES, WON_STAGES, INTERACTION_KINDS, INTERACTION_KIND_BY_ID,
  CURRENCIES, formatMoney, sumByCurrency, shortDate, daysFromToday, todayAR,
} from "@/lib/marketing/sponsors/constants";
import { api, Modal, Field } from "./ui";

const EMPTY = {
  brand: "", stage: "prospecto", contact_name: "", contact_email: "", contact_role: "", website: "",
  amount: "", currency: "USD", next_step: "", next_step_on: "", notes: "", lost_reason: "",
  show_in_media_kit: false, logo_url: "",
};

function dueLabel(iso) {
  const d = daysFromToday(iso);
  if (d === null) return null;
  if (d < 0) return { text: `Vencida hace ${-d} ${-d === 1 ? "día" : "días"}`, cls: "late" };
  if (d === 0) return { text: "Hoy", cls: "today" };
  if (d === 1) return { text: "Mañana", cls: "soon" };
  return { text: shortDate(iso), cls: d <= 7 ? "soon" : "" };
}

export default function DealsBoard() {
  const toast = useToast();
  const [deals, setDeals] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // deal (con id) o { ...EMPTY }
  const [dragId, setDragId] = useState(null);
  const [overStage, setOverStage] = useState(null);

  const load = useCallback(async () => {
    try {
      const { items } = await api("deals");
      setDeals(items);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const due = useMemo(
    () =>
      (deals || [])
        .filter((d) => !DONE_STAGES.includes(d.stage) && d.next_step_on && daysFromToday(d.next_step_on) <= 0)
        .sort((a, b) => a.next_step_on.localeCompare(b.next_step_on)),
    [deals]
  );

  const open = (deals || []).filter((d) => !DONE_STAGES.includes(d.stage));
  const pipeline = sumByCurrency(open.filter((d) => d.stage !== "cerrada"));
  const toCollect = sumByCurrency((deals || []).filter((d) => d.stage === "cerrada"));
  const collected = sumByCurrency((deals || []).filter((d) => d.stage === "cobrada"));

  async function moveTo(id, stage) {
    const deal = deals.find((d) => d.id === id);
    if (!deal || deal.stage === stage) return;
    setDeals((list) => list.map((d) => (d.id === id ? { ...d, stage } : d)));
    try {
      await api(`deals/${id}`, { method: "PATCH", body: { stage } });
      load();
    } catch (e) {
      toast({ type: "error", text: e.message });
      load();
    }
  }

  if (error) return <div className="adm-alert adm-alert-error">{error}</div>;
  if (!deals) return <div className="adm-skel" style={{ height: 220 }} />;

  return (
    <div className="mk-sponsors-stack">
      <div className="mk-sponsors-bar">
        <div className="mk-sponsors-kpis">
          <div><b>{open.length}</b><span>marcas activas</span></div>
          <div><b>{pipeline || "—"}</b><span>en juego</span></div>
          <div><b>{toCollect || "—"}</b><span>por cobrar</span></div>
          <div><b>{collected || "—"}</b><span>cobrado</span></div>
        </div>
        <button className="adm-btn adm-btn-primary" onClick={() => setEditing({ ...EMPTY })}>+ Nueva marca</button>
      </div>

      {due.length > 0 && (
        <section className="mk-sponsors-due" aria-label="Acciones vencidas o de hoy">
          <h3>Para hacer ahora · {due.length}</h3>
          <ul>
            {due.map((d) => {
              const l = dueLabel(d.next_step_on);
              return (
                <li key={d.id}>
                  <button type="button" onClick={() => setEditing(d)}>
                    <span className={`mk-sponsors-due-tag ${l.cls}`}>{l.text}</span>
                    <strong>{d.brand}</strong>
                    <span className="mk-sponsors-due-step">{d.next_step || "Sin detalle del próximo paso"}</span>
                    <span className="mk-sponsors-due-stage">{STAGE_BY_ID[d.stage]?.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {!deals.length && (
        <div className="adm-empty">
          <p>Todavía no cargaste ninguna marca.</p>
          <p>Sumá la primera con “Nueva marca” y movela por el tablero a medida que avanza.</p>
        </div>
      )}

      <div className="mk-sponsors-board">
        {STAGES.map((st) => {
          const col = deals.filter((d) => d.stage === st.id);
          return (
            <div
              key={st.id}
              className={`mk-sponsors-col${overStage === st.id ? " over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setOverStage(st.id); }}
              onDragLeave={() => setOverStage((s) => (s === st.id ? null : s))}
              onDrop={(e) => { e.preventDefault(); setOverStage(null); if (dragId) moveTo(dragId, st.id); setDragId(null); }}
            >
              <div className="mk-sponsors-col-head" style={{ "--pill": st.color }}>
                <span>{st.label}</span>
                <em>{col.length}</em>
              </div>
              {col.map((d) => {
                const l = !DONE_STAGES.includes(d.stage) && d.next_step_on ? dueLabel(d.next_step_on) : null;
                return (
                  <button
                    key={d.id}
                    type="button"
                    draggable
                    onDragStart={() => setDragId(d.id)}
                    onDragEnd={() => { setDragId(null); setOverStage(null); }}
                    className="mk-sponsors-card"
                    onClick={() => setEditing(d)}
                  >
                    <strong>{d.brand}</strong>
                    {d.contact_name && <span className="sub">{d.contact_name}</span>}
                    {d.amount !== null && d.amount !== undefined && <span className="amt">{formatMoney(d.amount, d.currency)}</span>}
                    {(d.next_step || l) && (
                      <span className={`next ${l?.cls || ""}`}>
                        {l ? `${l.text} · ` : ""}{d.next_step || ""}
                      </span>
                    )}
                  </button>
                );
              })}
              {!col.length && <div className="mk-sponsors-col-empty">—</div>}
            </div>
          );
        })}
      </div>

      {editing && (
        <DealModal
          deal={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { load(); }}
        />
      )}
    </div>
  );
}

function DealModal({ deal, onClose, onSaved }) {
  const toast = useToast();
  const isNew = !deal.id;
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    ...Object.fromEntries(Object.entries(deal).map(([k, v]) => [k, v ?? (typeof EMPTY[k] === "boolean" ? false : "")])),
  }));
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save(e) {
    e?.preventDefault();
    if (!form.brand.trim()) return toast({ type: "error", text: "Poné el nombre de la marca" });
    setBusy(true);
    const body = {
      brand: form.brand, stage: form.stage, contact_name: form.contact_name, contact_email: form.contact_email,
      contact_role: form.contact_role, website: form.website, amount: form.amount, currency: form.currency,
      next_step: form.next_step, next_step_on: form.next_step_on, notes: form.notes, lost_reason: form.lost_reason,
      show_in_media_kit: form.show_in_media_kit, logo_url: form.logo_url,
    };
    try {
      if (isNew) await api("deals", { method: "POST", body });
      else await api(`deals/${deal.id}`, { method: "PATCH", body });
      toast({ text: "Guardado" });
      onSaved();
      onClose();
    } catch (err) {
      toast({ type: "error", text: err.message });
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`¿Borrar "${deal.brand}" con todo su historial? No se puede deshacer.`)) return;
    try {
      await api(`deals/${deal.id}`, { method: "DELETE" });
      toast({ text: "Marca borrada" });
      onSaved();
      onClose();
    } catch (err) {
      toast({ type: "error", text: err.message });
    }
  }

  return (
    <Modal title={isNew ? "Nueva marca" : deal.brand} onClose={onClose} wide>
      <div className={isNew ? "" : "mk-sponsors-split"}>
        <form onSubmit={save} className="mk-sponsors-form">
          <div className="mk-sponsors-grid">
            <Field label="Marca" span={2}>
              <input className="adm-input" value={form.brand} onChange={(e) => set("brand", e.target.value)} autoFocus={isNew} maxLength={120} />
            </Field>
            <Field label="Etapa">
              <select className="adm-select" value={form.stage} onChange={(e) => set("stage", e.target.value)}>
                {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Contacto">
              <input className="adm-input" value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
            </Field>
            <Field label="Cargo">
              <input className="adm-input" value={form.contact_role} onChange={(e) => set("contact_role", e.target.value)} />
            </Field>
            <Field label="Email">
              <input className="adm-input" type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} />
            </Field>
            <Field label="Sitio web">
              <input className="adm-input" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="marca.com" />
            </Field>
            <Field label="Monto">
              <input className="adm-input" inputMode="decimal" value={form.amount} onChange={(e) => set("amount", e.target.value)} />
            </Field>
            <Field label="Moneda">
              <select className="adm-select" value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Próximo paso" span={2}>
              <input className="adm-input" value={form.next_step} onChange={(e) => set("next_step", e.target.value)} placeholder="Ej: mandar propuesta con tarifas" />
            </Field>
            <Field label="Para cuándo">
              <input className="adm-input" type="date" value={form.next_step_on || ""} onChange={(e) => set("next_step_on", e.target.value)} />
            </Field>
            {form.stage === "perdida" && (
              <Field label="Por qué se perdió" span={3}>
                <input className="adm-input" value={form.lost_reason} onChange={(e) => set("lost_reason", e.target.value)} />
              </Field>
            )}
            <Field label="Notas" span={3}>
              <textarea className="adm-textarea" style={{ minHeight: 80 }} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </Field>
            <label className="mk-sponsors-check span-3">
              <input type="checkbox" checked={form.show_in_media_kit} onChange={(e) => set("show_in_media_kit", e.target.checked)} />
              Mostrar esta marca en el media kit (“marcas con las que trabajé”)
            </label>
            {form.show_in_media_kit && (
              <Field label="URL del logo (opcional)" span={3} hint="Si no hay logo, se muestra el nombre.">
                <input className="adm-input" value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://…" />
              </Field>
            )}
          </div>
          <div className="mk-sponsors-actions">
            {!isNew && <button type="button" className="adm-btn adm-btn-danger" onClick={remove}>Borrar</button>}
            <span style={{ flex: 1 }} />
            <button type="button" className="adm-btn adm-btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="adm-btn adm-btn-primary" disabled={busy}>{busy ? "Guardando…" : "Guardar"}</button>
          </div>
        </form>

        {!isNew && <DealSide deal={deal} />}
      </div>
    </Modal>
  );
}

// Historial de interacciones, piezas asociadas y reporte.
function DealSide({ deal }) {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [pieces, setPieces] = useState(null);
  const [entry, setEntry] = useState({ kind: "email", summary: "", happened_on: todayAR() });
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);

  const loadHistory = useCallback(async () => {
    try { setItems((await api(`interactions?deal_id=${deal.id}`)).items); } catch (e) { toast({ type: "error", text: e.message }); }
  }, [deal.id, toast]);
  const loadPieces = useCallback(async () => {
    try { setPieces((await api(`deals/${deal.id}/content`)).items); } catch { setPieces([]); }
  }, [deal.id]);
  useEffect(() => { loadHistory(); loadPieces(); }, [loadHistory, loadPieces]);

  useEffect(() => {
    const t = setTimeout(async () => {
      try { setResults((await api(`content-search?q=${encodeURIComponent(q)}`)).items); } catch { setResults([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  async function addEntry(e) {
    e.preventDefault();
    if (!entry.summary.trim()) return;
    try {
      await api("interactions", { method: "POST", body: { deal_id: deal.id, ...entry } });
      setEntry((x) => ({ ...x, summary: "" }));
      loadHistory();
    } catch (err) { toast({ type: "error", text: err.message }); }
  }
  async function delEntry(id) {
    try { await api(`interactions/${id}`, { method: "DELETE" }); loadHistory(); } catch (err) { toast({ type: "error", text: err.message }); }
  }
  async function link(contentId) {
    try { await api(`deals/${deal.id}/content`, { method: "POST", body: { content_id: contentId } }); setQ(""); loadPieces(); }
    catch (err) { toast({ type: "error", text: err.message }); }
  }
  async function unlink(contentId) {
    try { await api(`deals/${deal.id}/content?content_id=${contentId}`, { method: "DELETE" }); loadPieces(); }
    catch (err) { toast({ type: "error", text: err.message }); }
  }

  const linked = new Set((pieces || []).map((p) => p.id));

  return (
    <aside className="mk-sponsors-side">
      <h3>Historial</h3>
      <form onSubmit={addEntry} className="mk-sponsors-entry">
        <div className="row">
          <select className="adm-select" value={entry.kind} onChange={(e) => setEntry({ ...entry, kind: e.target.value })}>
            {INTERACTION_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
          <input className="adm-input" type="date" value={entry.happened_on} onChange={(e) => setEntry({ ...entry, happened_on: e.target.value })} />
        </div>
        <textarea className="adm-textarea" style={{ minHeight: 56 }} placeholder="Qué pasó o qué acordaron" value={entry.summary} onChange={(e) => setEntry({ ...entry, summary: e.target.value })} />
        <button className="adm-btn adm-btn-secondary adm-btn-sm" type="submit" disabled={!entry.summary.trim()}>Agregar</button>
      </form>
      <ul className="mk-sponsors-history">
        {items === null && <li className="muted">Cargando…</li>}
        {items?.length === 0 && <li className="muted">Sin interacciones todavía.</li>}
        {items?.map((i) => (
          <li key={i.id}>
            <div className="meta">
              <span>{INTERACTION_KIND_BY_ID[i.kind]?.icon} {INTERACTION_KIND_BY_ID[i.kind]?.label || i.kind}</span>
              <span>{shortDate(i.happened_on)}</span>
              <button type="button" onClick={() => delEntry(i.id)} aria-label="Borrar">✕</button>
            </div>
            <p>{i.summary}</p>
          </li>
        ))}
      </ul>

      <h3>Piezas de la campaña</h3>
      <ul className="mk-sponsors-pieces">
        {pieces?.length === 0 && <li className="muted">Ninguna asociada.</li>}
        {pieces?.map((p) => (
          <li key={p.id}>
            <span>{p.title}<em>{networkLabel(p.network)}</em></span>
            <button type="button" onClick={() => unlink(p.id)} aria-label="Quitar">✕</button>
          </li>
        ))}
      </ul>
      <input className="adm-input" placeholder="Buscar pieza del calendario para asociar…" value={q} onChange={(e) => setQ(e.target.value)} />
      {q && (
        <ul className="mk-sponsors-results">
          {results.filter((r) => !linked.has(r.id)).map((r) => (
            <li key={r.id}><button type="button" onClick={() => link(r.id)}>{r.title}<em>{networkLabel(r.network)}</em></button></li>
          ))}
          {!results.filter((r) => !linked.has(r.id)).length && <li className="muted">Sin resultados.</li>}
        </ul>
      )}

      {WON_STAGES.includes(deal.stage) && (
        <Link className="adm-btn adm-btn-primary" style={{ marginTop: 14, justifyContent: "center" }} href={`/administracion-general/marketing/sponsors/reporte/${deal.id}`}>
          Ver reporte de la campaña →
        </Link>
      )}
    </aside>
  );
}
