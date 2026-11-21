"use client";
import { useEffect, useState } from "react";
import { useToast } from "../../AdminToast";
import { NETWORKS } from "@/lib/marketing/constants";
import { api, Field } from "./ui";

const SHOW_LABELS = {
  followers: "Seguidores por red",
  engagement: "Engagement promedio",
  newsletter: "Suscriptoras de la newsletter",
  visits: "Visitas al sitio (últimos 30 días)",
  audience: "Sección de audiencia",
  collab_formats: "Formatos de colaboración",
  brands: "Marcas con las que trabajé",
  rates: "Mostrar tarifas",
};

// Edita una lista de { title, desc }.
function PairList({ label, items, onChange, addLabel }) {
  const update = (i, k, v) => onChange(items.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <div className="mk-sponsors-pairs">
      <span className="adm-label">{label}</span>
      {items.map((it, i) => (
        <div key={i} className="mk-sponsors-pair">
          <input className="adm-input" value={it.title} placeholder="Título" onChange={(e) => update(i, "title", e.target.value)} />
          <textarea className="adm-textarea" style={{ minHeight: 56 }} value={it.desc} placeholder="Descripción" onChange={(e) => update(i, "desc", e.target.value)} />
          <button type="button" className="mk-sponsors-x" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Quitar">✕</button>
        </div>
      ))}
      <button type="button" className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => onChange([...items, { title: "", desc: "" }])}>+ {addLabel}</button>
    </div>
  );
}

export default function MediaKitEditor() {
  const toast = useToast();
  const [s, setS] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("settings").then((r) => setS(r.settings)).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="adm-alert adm-alert-error">{error}</div>;
  if (!s) return <div className="adm-skel" style={{ height: 240 }} />;

  const set = (k, v) => setS((x) => ({ ...x, [k]: v }));
  const setShow = (k, v) => setS((x) => ({ ...x, show: { ...x.show, [k]: v } }));
  const toggleNet = (id) => set("networks", s.networks.includes(id) ? s.networks.filter((n) => n !== id) : [...s.networks, id]);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api("settings", { method: "PUT", body: s });
      setS(r.settings);
      toast({ text: "Media kit actualizado" });
    } catch (err) {
      toast({ type: "error", text: err.message });
    }
    setBusy(false);
  }

  return (
    <form onSubmit={save} className="mk-sponsors-stack">
      <div className="adm-alert adm-alert-info">
        Esta es la página pública <a href="/media-kit" target="_blank" rel="noreferrer"><b>/media-kit</b></a>. Los números (seguidores, engagement, newsletter y visitas) se actualizan solos cada pocas horas; si una métrica todavía no tiene datos, no aparece.
        {" "}Mientras no la marques como indexable, los buscadores no la listan: es para mandarle el link a las marcas.
      </div>

      <section className="adm-card mk-sponsors-section">
        <h3>Qué se muestra</h3>
        <div className="mk-sponsors-checks">
          {Object.keys(SHOW_LABELS).map((k) => (
            <label key={k} className="mk-sponsors-check">
              <input type="checkbox" checked={Boolean(s.show[k])} onChange={(e) => setShow(k, e.target.checked)} /> {SHOW_LABELS[k]}
            </label>
          ))}
          <label className="mk-sponsors-check">
            <input type="checkbox" checked={Boolean(s.indexable)} onChange={(e) => set("indexable", e.target.checked)} /> Permitir que Google la indexe
          </label>
        </div>
        <div style={{ marginTop: 12 }}>
          <span className="adm-label">Redes que se muestran (ninguna marcada = todas las que tengan datos)</span>
          <div className="mk-sponsors-checks" style={{ marginTop: 6 }}>
            {NETWORKS.map((n) => (
              <label key={n.id} className="mk-sponsors-check">
                <input type="checkbox" checked={s.networks.includes(n.id)} onChange={() => toggleNet(n.id)} /> {n.label}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="adm-card mk-sponsors-section">
        <h3>Presentación</h3>
        <Field label="Título"><input className="adm-input" value={s.hero_title} onChange={(e) => set("hero_title", e.target.value)} /></Field>
        <Field label="Bajada"><textarea className="adm-textarea" style={{ minHeight: 70 }} value={s.hero_sub} onChange={(e) => set("hero_sub", e.target.value)} /></Field>
        <Field label="Quién soy"><textarea className="adm-textarea" style={{ minHeight: 110 }} value={s.about} onChange={(e) => set("about", e.target.value)} /></Field>
        <PairList label="De qué hablo" items={s.topics} onChange={(v) => set("topics", v)} addLabel="Agregar tema" />
      </section>

      <section className="adm-card mk-sponsors-section">
        <h3>Audiencia</h3>
        <Field label="Descripción" hint="Escribí solo datos que puedas respaldar (por ejemplo con tus estadísticas de LinkedIn o Instagram).">
          <textarea className="adm-textarea" style={{ minHeight: 70 }} value={s.audience_text} onChange={(e) => set("audience_text", e.target.value)} />
        </Field>
        <Field label="Puntos (uno por línea)">
          <textarea className="adm-textarea" style={{ minHeight: 90 }} value={s.audience_points.join("\n")} onChange={(e) => set("audience_points", e.target.value.split("\n"))} />
        </Field>
      </section>

      <section className="adm-card mk-sponsors-section">
        <h3>Formas de trabajar juntas</h3>
        <PairList label="Formatos" items={s.collab_formats} onChange={(v) => set("collab_formats", v)} addLabel="Agregar formato" />
        <Field label="Nota debajo de las tarifas"><input className="adm-input" value={s.rates_note} onChange={(e) => set("rates_note", e.target.value)} /></Field>
      </section>

      <section className="adm-card mk-sponsors-section">
        <h3>Marcas y contacto</h3>
        <Field label="Marcas extra (una por línea)" hint="Además de las marcas que marques en el tablero con “Mostrar en el media kit”.">
          <textarea className="adm-textarea" style={{ minHeight: 70 }} value={s.brands_extra.join("\n")} onChange={(e) => set("brands_extra", e.target.value.split("\n"))} />
        </Field>
        <Field label="Texto de contacto"><textarea className="adm-textarea" style={{ minHeight: 60 }} value={s.contact_text} onChange={(e) => set("contact_text", e.target.value)} /></Field>
        <div className="mk-sponsors-grid">
          <Field label="Email de contacto"><input className="adm-input" type="email" value={s.contact_email} onChange={(e) => set("contact_email", e.target.value)} /></Field>
          <Field label="Texto del botón"><input className="adm-input" value={s.contact_cta} onChange={(e) => set("contact_cta", e.target.value)} /></Field>
          <Field label="Link para agendar (opcional)"><input className="adm-input" value={s.booking_url} onChange={(e) => set("booking_url", e.target.value)} placeholder="https://…" /></Field>
        </div>
      </section>

      <div className="mk-sponsors-actions">
        <a className="adm-btn adm-btn-secondary" href="/media-kit" target="_blank" rel="noreferrer">Ver página →</a>
        <span style={{ flex: 1 }} />
        <button type="submit" className="adm-btn adm-btn-primary" disabled={busy}>{busy ? "Guardando…" : "Guardar cambios"}</button>
      </div>
    </form>
  );
}
