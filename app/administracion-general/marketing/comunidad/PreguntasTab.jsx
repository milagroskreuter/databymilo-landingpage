"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, fmtDate, today, COMMUNITY_NETWORKS, NetworkPill } from "./api";

const FILTERS = [
  { id: "open", label: "Sin usar" },
  { id: "used", label: "Ya usadas" },
  { id: "all", label: "Todas" },
];

const STOP = new Set("de la el los las un una y o que en a con por para como cómo qué que es se lo me mi tu te al del".split(" "));
const words = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOP.has(w));

// Preguntas abiertas parecidas a lo que se está escribiendo (para sumar +1 en vez de duplicar).
function similar(text, items) {
  const mine = new Set(words(text));
  if (mine.size < 2) return [];
  return items
    .filter((q) => !q.used_at)
    .map((q) => {
      const theirs = new Set(words(q.text));
      let shared = 0;
      for (const w of mine) if (theirs.has(w)) shared++;
      return { q, score: shared / Math.min(mine.size, theirs.size || 1) };
    })
    .filter((x) => x.score >= 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.q);
}

const EMPTY = { text: "", network: "instagram", asked_on: "", tags: "", times: 1 };

export default function PreguntasTab({ onChange }) {
  const [filter, setFilter] = useState("open");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState({ ...EMPTY, asked_on: today() });
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [allOpen, setAllOpen] = useState([]); // para detectar repetidas aunque el filtro sea otro

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ items }, open] = await Promise.all([
        api(`/questions?filter=${filter}`),
        filter === "open" ? Promise.resolve(null) : api("/questions?filter=open"),
      ]);
      setItems(items);
      setAllOpen(open ? open.items : items);
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const matches = useMemo(() => similar(form.text, allOpen), [form.text, allOpen]);
  const allTags = useMemo(() => [...new Set(items.flatMap((q) => q.tags))].sort(), [items]);
  const visible = useMemo(() => {
    const s = search.trim().toLowerCase();
    return items.filter((q) => (!s || q.text.toLowerCase().includes(s)) && (!tagFilter || q.tags.includes(tagFilter)));
  }, [items, search, tagFilter]);

  function replace(item) {
    setItems((list) => list.map((x) => (x.id === item.id ? item : x)));
    setAllOpen((list) => (item.used_at ? list.filter((x) => x.id !== item.id) : list.map((x) => (x.id === item.id ? item : x))));
  }

  async function add(e) {
    e.preventDefault();
    if (!form.text.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const { item } = await api("/questions", { method: "POST", body: form });
      if (filter !== "used") setItems((l) => [item, ...l]);
      setAllOpen((l) => [item, ...l]);
      setForm({ ...EMPTY, network: form.network, asked_on: form.asked_on });
      onChange?.();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
    setBusy(false);
  }

  async function bump(q, clearForm = false) {
    try {
      const { item } = await api(`/questions/${q.id}`, { method: "PATCH", body: { bump: true } });
      replace(item);
      if (!items.some((x) => x.id === item.id) && filter !== "used") setItems((l) => [item, ...l]);
      if (clearForm) {
        setForm({ ...EMPTY, network: form.network, asked_on: form.asked_on });
        setMsg({ type: "success", text: `Sumada una repetición: ya van ${item.times}` });
      }
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
  }

  async function toIdea(q) {
    try {
      const { item, content } = await api(`/questions/${q.id}/idea`, { method: "POST" });
      if (filter === "open") setItems((l) => l.filter((x) => x.id !== q.id));
      else replace(item);
      setAllOpen((l) => l.filter((x) => x.id !== q.id));
      setMsg({ type: "success", text: `Idea creada: “${content.title}”` });
      onChange?.();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
  }

  async function save(q, body) {
    try {
      const { item } = await api(`/questions/${q.id}`, { method: "PATCH", body });
      if (body.used === false && filter === "used") setItems((l) => l.filter((x) => x.id !== q.id));
      else replace(item);
      if (body.used === false) {
        setAllOpen((l) => [item, ...l]);
        onChange?.();
      }
      return true;
    } catch (err) {
      setMsg({ type: "error", text: err.message });
      return false;
    }
  }

  async function remove(q) {
    if (!confirm("¿Eliminar esta pregunta?")) return;
    try {
      await api(`/questions/${q.id}`, { method: "DELETE" });
      setItems((l) => l.filter((x) => x.id !== q.id));
      setAllOpen((l) => l.filter((x) => x.id !== q.id));
      onChange?.();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
  }

  return (
    <div className="mk-comunidad-panel">
      <form className="adm-card mk-comunidad-form" onSubmit={add}>
        <div className="adm-card-head">
          <span className="adm-card-title">Anotar una pregunta</span>
          <span className="adm-card-hint">Lo que te preguntan por DM o en comentarios</span>
        </div>
        <textarea
          className="adm-textarea mk-comunidad-qinput"
          placeholder="¿Cómo arranco a aprender SQL si no soy de sistemas?"
          value={form.text}
          onChange={(e) => setForm({ ...form, text: e.target.value })}
          rows={2}
          maxLength={1000}
        />
        {matches.length > 0 && (
          <div className="mk-comunidad-similar">
            <span className="mk-comunidad-mini">¿Ya la tenías? Sumale una repetición:</span>
            {matches.map((q) => (
              <div key={q.id} className="mk-comunidad-similar-row">
                <span>{q.text}</span>
                <button type="button" className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => bump(q, true)}>
                  +1 ({q.times})
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="mk-comunidad-grid4">
          <label className="adm-form-group">
            <span className="adm-label">Red</span>
            <select className="adm-select" value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })}>
              {COMMUNITY_NETWORKS.map((n) => (
                <option key={n.id} value={n.id}>{n.label}</option>
              ))}
            </select>
          </label>
          <label className="adm-form-group">
            <span className="adm-label">Fecha</span>
            <input type="date" className="adm-input" value={form.asked_on} onChange={(e) => setForm({ ...form, asked_on: e.target.value })} />
          </label>
          <label className="adm-form-group">
            <span className="adm-label">Etiquetas</span>
            <input className="adm-input" placeholder="sql, carrera" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} list="mk-comunidad-tags" />
          </label>
          <label className="adm-form-group">
            <span className="adm-label">Veces</span>
            <input type="number" min={1} className="adm-input" value={form.times} onChange={(e) => setForm({ ...form, times: e.target.value })} />
          </label>
        </div>
        <datalist id="mk-comunidad-tags">
          {allTags.map((t) => <option key={t} value={t} />)}
        </datalist>
        <div>
          <button className="adm-btn adm-btn-primary" disabled={busy || !form.text.trim()}>
            {busy ? "Guardando…" : "Guardar pregunta"}
          </button>
        </div>
      </form>

      {msg && (
        <div className={`adm-alert adm-alert-${msg.type}`}>
          {msg.text}
          {msg.type === "success" && msg.text.startsWith("Idea creada") && (
            <> · <Link href="/administracion-general/marketing/ideas" className="adm-card-link">Ver ideas →</Link></>
          )}
        </div>
      )}

      <div className="mk-comunidad-toolbar">
        <div className="mk-comunidad-filters">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" className={`mk-comunidad-chip${filter === f.id ? " is-on" : ""}`} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="mk-comunidad-toolbar-right">
          {allTags.length > 0 && (
            <select className="adm-select mk-comunidad-small-select" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
              <option value="">Todas las etiquetas</option>
              {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          <input className="adm-search" placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="adm-card mk-comunidad-loading">Cargando…</div>
      ) : visible.length === 0 ? (
        <div className="adm-card adm-empty">
          {filter === "open" && !search && !tagFilter
            ? "No hay preguntas sin usar. Cuando te pregunten algo por DM, anotalo acá."
            : "No hay preguntas que coincidan."}
        </div>
      ) : (
        <div className="adm-card mk-comunidad-qlist">
          {visible.map((q) => (
            <QuestionRow key={q.id} q={q} allTags={allTags} onBump={bump} onIdea={toIdea} onSave={save} onRemove={remove} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionRow({ q, onBump, onIdea, onSave, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);

  function startEdit() {
    setDraft({ text: q.text, network: q.network || "otro", asked_on: q.asked_on, tags: q.tags.join(", "), times: q.times, notes: q.notes || "" });
    setEditing(true);
  }

  async function doSave() {
    setBusy(true);
    if (await onSave(q, draft)) setEditing(false);
    setBusy(false);
  }

  async function wrap(fn) {
    setBusy(true);
    await fn();
    setBusy(false);
  }

  if (editing) {
    return (
      <div className="mk-comunidad-qrow is-editing">
        <textarea className="adm-textarea" rows={2} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
        <div className="mk-comunidad-grid4">
          <select className="adm-select" value={draft.network} onChange={(e) => setDraft({ ...draft, network: e.target.value })}>
            {COMMUNITY_NETWORKS.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
          <input type="date" className="adm-input" value={draft.asked_on} onChange={(e) => setDraft({ ...draft, asked_on: e.target.value })} />
          <input className="adm-input" placeholder="Etiquetas" value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} list="mk-comunidad-tags" />
          <input type="number" min={1} className="adm-input" value={draft.times} onChange={(e) => setDraft({ ...draft, times: e.target.value })} />
        </div>
        <input className="adm-input" placeholder="Notas (opcional)" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
        <div className="mk-comunidad-actions">
          <button className="adm-btn adm-btn-primary adm-btn-sm" disabled={busy} onClick={doSave}>Guardar</button>
          <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setEditing(false)}>Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`mk-comunidad-qrow${q.used_at ? " is-used" : ""}`}>
      <div className="mk-comunidad-times" title="Cuántas veces te la preguntaron">
        <strong>{q.times}</strong>
        <span>{q.times === 1 ? "vez" : "veces"}</span>
        {!q.used_at && (
          <button type="button" className="mk-comunidad-plus" disabled={busy} onClick={() => wrap(() => onBump(q))} aria-label="Sumar una repetición">
            +1
          </button>
        )}
      </div>
      <div className="mk-comunidad-qmain">
        <p className="mk-comunidad-qtext">{q.text}</p>
        <div className="mk-comunidad-meta">
          <NetworkPill id={q.network} />
          <span>{fmtDate(q.asked_on)}</span>
          {q.tags.map((t) => <span key={t} className="mk-comunidad-tag">{t}</span>)}
          {q.used_at && <span className="adm-badge adm-badge-active">Idea creada {fmtDate(q.used_at)}</span>}
        </div>
        {q.notes && <p className="mk-comunidad-qnotes">{q.notes}</p>}
      </div>
      <div className="mk-comunidad-qactions">
        {q.used_at ? (
          <>
            <Link href="/administracion-general/marketing/ideas" className="adm-btn adm-btn-secondary adm-btn-sm">Ver ideas</Link>
            <button className="adm-link-btn" disabled={busy} onClick={() => wrap(() => onSave(q, { used: false }))}>Reabrir</button>
          </>
        ) : (
          <button className="adm-btn adm-btn-primary adm-btn-sm" disabled={busy} onClick={() => wrap(() => onIdea(q))}>
            Convertir en idea
          </button>
        )}
        <div className="mk-comunidad-qlinks">
          <button className="adm-link-btn" onClick={startEdit}>Editar</button>
          <button className="adm-link-btn mk-comunidad-danger" onClick={() => onRemove(q)}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}
