"use client";
import { useEffect, useState } from "react";
import { useToast } from "../../AdminToast";
import { NETWORKS } from "@/lib/marketing/constants";
import { COLOR_ROLES } from "@/lib/marketing/brand/defaults";
import { copyText, linesToList, listToLines } from "./api";
import AssetPicker, { useAssets } from "./AssetPicker";

// Límites de caracteres de bio por red (aprox., para avisar).
const BIO_LIMITS = { instagram: 150, threads: 150, tiktok: 80, linkedin: 2600, youtube: 1000 };

/** Bloque editable de una clave del sistema de marca, con su propio botón Guardar. */
function Section({ title, hint, value, onSave, children }) {
  const toast = useToast();
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(value), [value]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(value);

  async function save() {
    setSaving(true);
    try {
      await onSave(draft);
      toast({ text: `${title}: guardado` });
    } catch (e) {
      toast({ type: "error", text: e.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="adm-card mk-marca-section">
      <div className="mk-marca-section-head">
        <div>
          <h2 className="mk-marca-h2">{title}</h2>
          {hint && <p className="mk-marca-hint">{hint}</p>}
        </div>
        <div className="mk-marca-row">
          {dirty && (
            <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setDraft(value)} disabled={saving}>
              Descartar
            </button>
          )}
          <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={save} disabled={!dirty || saving}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
      {children(draft, setDraft)}
    </section>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="adm-form-group">
      <span className="adm-label">{label}</span>
      {children}
      {hint && <span className="mk-marca-hint">{hint}</span>}
    </label>
  );
}

function Lines({ value, onChange, rows = 4, placeholder }) {
  // Se edita como texto y se guarda como lista (una por línea).
  const [text, setText] = useState(listToLines(value));
  useEffect(() => {
    if (JSON.stringify(linesToList(text)) !== JSON.stringify(value || [])) setText(listToLines(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <textarea
      className="adm-textarea mk-marca-ta"
      rows={rows}
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        setText(e.target.value);
        onChange(linesToList(e.target.value));
      }}
    />
  );
}

const isHex = (h) => /^#[0-9a-f]{6}$/i.test(h || "");

function PaletteEditor({ draft, setDraft }) {
  const colors = draft.colors || [];
  const set = (i, patch) => setDraft({ ...draft, colors: colors.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const move = (i, d) => {
    const next = [...colors];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    setDraft({ ...draft, colors: next });
  };
  return (
    <>
      <div className="mk-marca-swatches">
        {colors.map((c, i) => (
          <div key={i} className="mk-marca-swatch" style={{ background: isHex(c.hex) ? c.hex : "#ccc" }} title={`${c.name} ${c.hex}`}>
            <span>{c.name}</span>
            <small>{c.hex}</small>
          </div>
        ))}
      </div>
      <div className="mk-marca-colors">
        {colors.map((c, i) => (
          <div key={i} className="mk-marca-color-row">
            <input
              type="color"
              className="mk-marca-color-input"
              value={isHex(c.hex) ? c.hex : "#000000"}
              onChange={(e) => set(i, { hex: e.target.value })}
              aria-label={`Color ${c.name}`}
            />
            <input className="adm-input mk-marca-hex" value={c.hex} onChange={(e) => set(i, { hex: e.target.value.trim() })} />
            <input className="adm-input" value={c.name} placeholder="Nombre" onChange={(e) => set(i, { name: e.target.value })} />
            <select className="adm-select" value={c.role || "neutro"} onChange={(e) => set(i, { role: e.target.value })}>
              {COLOR_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            <input className="adm-input mk-marca-grow" value={c.use || ""} placeholder="Uso" onChange={(e) => set(i, { use: e.target.value })} />
            <div className="mk-marca-row mk-marca-row-tight">
              <button className="adm-link-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Subir">↑</button>
              <button className="adm-link-btn" disabled={i === colors.length - 1} onClick={() => move(i, 1)} aria-label="Bajar">↓</button>
              <button className="adm-link-btn mk-marca-danger" onClick={() => setDraft({ ...draft, colors: colors.filter((_, j) => j !== i) })} aria-label="Quitar">✕</button>
            </div>
          </div>
        ))}
      </div>
      <button
        className="adm-btn adm-btn-secondary adm-btn-sm"
        onClick={() => setDraft({ ...draft, colors: [...colors, { name: "Nuevo", hex: "#cccccc", role: "neutro", use: "" }] })}
      >
        + Color
      </button>
      <Field label="Notas">
        <input className="adm-input" value={draft.notes || ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
      </Field>
      <p className="mk-marca-hint">
        Las plantillas usan el primer color de cada rol: Principal (fondo oscuro), Fondo (fondo claro), Texto, Acento, Suave y Destacado.
      </p>
    </>
  );
}

const FONT_PREVIEW = {
  "Playfair Display": "var(--font-playfair), Georgia, serif",
  Montserrat: "var(--font-montserrat), sans-serif",
  Caveat: "var(--font-caveat), cursive",
};

function TypographyEditor({ draft, setDraft }) {
  const fonts = draft.fonts || [];
  const set = (i, patch) => setDraft({ ...draft, fonts: fonts.map((f, j) => (j === i ? { ...f, ...patch } : f)) });
  return (
    <>
      {fonts.map((f, i) => (
        <div key={i} className="mk-marca-font">
          <div
            className="mk-marca-font-sample"
            style={{ fontFamily: FONT_PREVIEW[f.family] || f.family, fontStyle: f.style === "italic" ? "italic" : "normal", fontWeight: parseInt(f.weight, 10) || 600 }}
          >
            {f.role === "acento" ? "una nota al margen ✦" : "la corpo no te lo cuenta"}
          </div>
          <div className="mk-marca-grid4">
            <Field label="Rol">
              <input className="adm-input" value={f.role} onChange={(e) => set(i, { role: e.target.value })} />
            </Field>
            <Field label="Familia">
              <input className="adm-input" value={f.family} onChange={(e) => set(i, { family: e.target.value })} />
            </Field>
            <Field label="Peso">
              <input className="adm-input" value={f.weight} onChange={(e) => set(i, { weight: e.target.value })} />
            </Field>
            <Field label="Estilo">
              <select className="adm-select" value={f.style} onChange={(e) => set(i, { style: e.target.value })}>
                <option value="normal">Normal</option>
                <option value="italic">Itálica</option>
              </select>
            </Field>
          </div>
          <div className="mk-marca-row">
            <input className="adm-input mk-marca-grow" value={f.use || ""} placeholder="Uso" onChange={(e) => set(i, { use: e.target.value })} />
            <button className="adm-link-btn mk-marca-danger" onClick={() => setDraft({ ...draft, fonts: fonts.filter((_, j) => j !== i) })}>
              Quitar
            </button>
          </div>
        </div>
      ))}
      <button
        className="adm-btn adm-btn-secondary adm-btn-sm"
        onClick={() => setDraft({ ...draft, fonts: [...fonts, { role: "", family: "", weight: "400", style: "normal", use: "" }] })}
      >
        + Tipografía
      </button>
      <div className="mk-marca-grid2">
        <Field label="Escala">
          <input className="adm-input" value={draft.scale || ""} onChange={(e) => setDraft({ ...draft, scale: e.target.value })} />
        </Field>
        <Field label="Notas">
          <input className="adm-input" value={draft.notes || ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
        </Field>
      </div>
    </>
  );
}

function VoiceEditor({ draft, setDraft }) {
  const set = (k) => (v) => setDraft({ ...draft, [k]: v });
  return (
    <>
      <Field label="Tono">
        <textarea className="adm-textarea mk-marca-ta" rows={3} value={draft.tone || ""} onChange={(e) => setDraft({ ...draft, tone: e.target.value })} />
      </Field>
      <div className="mk-marca-grid2">
        <Field label="Rasgos (uno por línea)">
          <Lines value={draft.traits} onChange={set("traits")} />
        </Field>
        <Field label="Notas">
          <textarea className="adm-textarea mk-marca-ta" rows={4} value={draft.notes || ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
        </Field>
        <Field label="Palabras sí (una por línea)">
          <Lines value={draft.words_yes} onChange={set("words_yes")} rows={6} />
        </Field>
        <Field label="Palabras no (una por línea)">
          <Lines value={draft.words_no} onChange={set("words_no")} rows={6} />
        </Field>
        <Field label="Ejemplos buenos (uno por línea)">
          <Lines value={draft.examples_good} onChange={set("examples_good")} rows={5} />
        </Field>
        <Field label="Ejemplos a evitar (uno por línea)">
          <Lines value={draft.examples_bad} onChange={set("examples_bad")} rows={5} />
        </Field>
      </div>
    </>
  );
}

function RulesEditor({ draft, setDraft }) {
  const num = (k) => (e) => setDraft({ ...draft, [k]: Math.max(0, parseInt(e.target.value, 10) || 0) });
  return (
    <>
      <div className="mk-marca-grid3">
        <Field label="Máx. colores por pieza">
          <input type="number" min="1" className="adm-input" value={draft.max_colors_per_piece ?? ""} onChange={num("max_colors_per_piece")} />
        </Field>
        <Field label="Máx. palabras por slide">
          <input type="number" min="1" className="adm-input" value={draft.max_words_per_slide ?? ""} onChange={num("max_words_per_slide")} />
        </Field>
        <Field label="Máx. tipografías por pieza">
          <input type="number" min="1" className="adm-input" value={draft.max_fonts_per_piece ?? ""} onChange={num("max_fonts_per_piece")} />
        </Field>
      </div>
      <Field label="Reglas visuales (una por línea)" hint="Las plantillas avisan cuando una slide pasa el máximo de palabras; el chequeo con Claude revisa todas.">
        <Lines value={draft.items} onChange={(v) => setDraft({ ...draft, items: v })} rows={8} />
      </Field>
    </>
  );
}

function BiosEditor({ draft, setDraft }) {
  const toast = useToast();
  return (
    <div className="mk-marca-bios">
      {NETWORKS.map((n) => {
        const text = draft[n.id] || "";
        const limit = BIO_LIMITS[n.id];
        const over = limit && text.length > limit;
        return (
          <div key={n.id} className="mk-marca-bio">
            <div className="mk-marca-bio-head">
              <span className="mk-marca-dot" style={{ background: n.color }} />
              <strong>{n.label}</strong>
              <span className={`mk-marca-count${over ? " is-over" : ""}`}>
                {text.length}
                {limit ? ` / ${limit}` : ""}
              </span>
              <button
                className="adm-link-btn"
                disabled={!text}
                onClick={async () => {
                  if (await copyText(text)) toast({ text: `Bio de ${n.label} copiada` });
                }}
              >
                Copiar
              </button>
            </div>
            <textarea className="adm-textarea mk-marca-ta" rows={3} value={text} onChange={(e) => setDraft({ ...draft, [n.id]: e.target.value })} />
          </div>
        );
      })}
    </div>
  );
}

function LogoEditor({ draft, setDraft }) {
  const [picking, setPicking] = useState(false);
  const { assets } = useAssets(draft.asset_id ? [draft.asset_id] : []);
  const logo = assets[0];
  const [a, b] = String(draft.wordmark || "data · by milo").split("·");
  return (
    <>
      <div className="mk-marca-logo-previews">
        <div className="mk-marca-wordmark is-dark">
          <span>{a?.trim()}</span>
          <span className="mk-marca-wordmark-dot">·</span>
          <span>{b?.trim()}</span>
        </div>
        <div className="mk-marca-wordmark is-light">
          <span>{a?.trim()}</span>
          <span className="mk-marca-wordmark-dot">·</span>
          <span>{b?.trim()}</span>
        </div>
        <div className="mk-marca-logo-file">
          {logo?.url ? <img src={logo.url} alt="Logo" /> : <span className="mk-marca-hint">Sin archivo de logo</span>}
          <div className="mk-marca-row">
            <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setPicking(true)}>
              {logo ? "Cambiar archivo" : "Elegir archivo"}
            </button>
            {draft.asset_id && (
              <button className="adm-link-btn mk-marca-danger" onClick={() => setDraft({ ...draft, asset_id: null })}>
                Quitar
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="mk-marca-grid3">
        <Field label="Wordmark">
          <input className="adm-input" value={draft.wordmark || ""} onChange={(e) => setDraft({ ...draft, wordmark: e.target.value })} />
        </Field>
        <Field label="Usuario">
          <input className="adm-input" value={draft.handle || ""} onChange={(e) => setDraft({ ...draft, handle: e.target.value })} />
        </Field>
        <Field label="Sitio">
          <input className="adm-input" value={draft.site || ""} onChange={(e) => setDraft({ ...draft, site: e.target.value })} />
        </Field>
      </div>
      <Field label="Descripción">
        <textarea className="adm-textarea mk-marca-ta" rows={2} value={draft.description || ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
      </Field>
      <Field label="Uso (uno por línea)">
        <Lines value={draft.usage} onChange={(v) => setDraft({ ...draft, usage: v })} rows={3} />
      </Field>
      {picking && (
        <AssetPicker
          title="Elegí el archivo del logo"
          uploadTags={["logo"]}
          onClose={() => setPicking(false)}
          onPick={(asset) => {
            setDraft({ ...draft, asset_id: asset.id });
            setPicking(false);
          }}
        />
      )}
    </>
  );
}

function ReferenceEditor({ draft, setDraft }) {
  return (
    <>
      <Field label="Sistema de diseño en Claude Design" hint="Referencia visual con tokens, componentes de redes y reglas, armada desde el sitio.">
        <div className="mk-marca-row">
          <input
            className="adm-input mk-marca-grow"
            value={draft.design_system_url || ""}
            placeholder="https://claude.ai/…"
            onChange={(e) => setDraft({ ...draft, design_system_url: e.target.value.trim() })}
          />
          {draft.design_system_url && (
            <a className="adm-btn adm-btn-secondary adm-btn-sm" href={draft.design_system_url} target="_blank" rel="noopener noreferrer">
              Abrir ↗
            </a>
          )}
        </div>
      </Field>
      <Field label="Notas">
        <input className="adm-input" value={draft.notes || ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
      </Field>
    </>
  );
}

export default function SistemaTab({ brand, saveKey }) {
  const ds = brand.references?.design_system_url;
  return (
    <div className="mk-marca-stack">
      <div className="adm-alert adm-alert-info mk-marca-intro">
        Esta es la única fuente de verdad de la marca: la leen las plantillas y las piezas que armás. Cada bloque se
        guarda por separado.
        {ds && (
          <>
            {" "}
            <a href={ds} target="_blank" rel="noopener noreferrer">
              Ver el sistema de diseño en Claude Design ↗
            </a>
          </>
        )}
      </div>
      <Section title="Paleta" hint="Colores con nombre, rol y uso." value={brand.palette} onSave={(v) => saveKey("palette", v)}>
        {(draft, setDraft) => <PaletteEditor draft={draft} setDraft={setDraft} />}
      </Section>
      <Section title="Tipografías" value={brand.typography} onSave={(v) => saveKey("typography", v)}>
        {(draft, setDraft) => <TypographyEditor draft={draft} setDraft={setDraft} />}
      </Section>
      <Section title="Voz" hint="Cómo suena la marca: tono, palabras sí y palabras no." value={brand.voice} onSave={(v) => saveKey("voice", v)}>
        {(draft, setDraft) => <VoiceEditor draft={draft} setDraft={setDraft} />}
      </Section>
      <Section title="Reglas visuales" value={brand.rules} onSave={(v) => saveKey("rules", v)}>
        {(draft, setDraft) => <RulesEditor draft={draft} setDraft={setDraft} />}
      </Section>
      <Section title="Bios por red" value={brand.bios} onSave={(v) => saveKey("bios", v)}>
        {(draft, setDraft) => <BiosEditor draft={draft} setDraft={setDraft} />}
      </Section>
      <Section title="Logo" value={brand.logo} onSave={(v) => saveKey("logo", v)}>
        {(draft, setDraft) => <LogoEditor draft={draft} setDraft={setDraft} />}
      </Section>
      <Section title="Referencia visual" value={brand.references} onSave={(v) => saveKey("references", v)}>
        {(draft, setDraft) => <ReferenceEditor draft={draft} setDraft={setDraft} />}
      </Section>
    </div>
  );
}
