"use client";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../AdminToast";
import { countWords } from "@/lib/marketing/brand/defaults";
import { DESIGNS, DESIGN_BY_ID, SIZES, THEMES, renderQuery, slideText } from "@/lib/marketing/brand/designs";
import { API, api } from "./api";

const DRAFT_KEY = "mk-marca-carrusel";

const STARTER = [
  { design: "portada", data: {} },
  { design: "dato", data: {} },
  { design: "lista", data: {} },
  { design: "cta", data: {} },
];

// Si un campo está vacío se muestra el ejemplo, así la vista previa nunca queda en blanco.
function withPlaceholders(slide) {
  const d = DESIGN_BY_ID[slide.design];
  const data = {};
  for (const f of d.fields) data[f.key] = slide.data[f.key] || f.placeholder || "";
  return data;
}

function readDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    if (d?.slides?.length) return d;
  } catch {
    /* sin borrador */
  }
  return null;
}

export default function PlantillasTab({ brand }) {
  const toast = useToast();
  const [size, setSize] = useState("1080x1350");
  const [theme, setTheme] = useState("oscuro");
  const [name, setName] = useState("Carrusel");
  const [slides, setSlides] = useState(STARTER);
  const [active, setActive] = useState(0);
  const [saving, setSaving] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const d = readDraft();
    if (d) {
      setSlides(d.slides);
      setSize(d.size || "1080x1350");
      setTheme(d.theme || "oscuro");
      setName(d.name || "Carrusel");
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ slides, size, theme, name }));
    } catch {
      /* sin almacenamiento */
    }
  }, [slides, size, theme, name, loaded]);

  const slide = slides[Math.min(active, slides.length - 1)];
  const design = DESIGN_BY_ID[slide.design];
  const total = slides.length;
  const maxWords = brand.rules?.max_words_per_slide || 0;

  const urls = useMemo(
    () =>
      slides.map((s, i) =>
        `${API}/templates/render?${renderQuery({ design: s.design, size, theme, page: total > 1 ? i + 1 : undefined, total: total > 1 ? total : undefined, data: withPlaceholders(s) })}`
      ),
    [slides, size, theme, total]
  );

  // La vista previa grande se actualiza un rato después de dejar de escribir.
  const [shown, setShown] = useState([]);
  useEffect(() => {
    const t = setTimeout(() => setShown(urls), 450);
    return () => clearTimeout(t);
  }, [urls]);
  const previewUrl = shown[active] || "";

  const words = (s) => countWords(slideText(s.design, s.data));
  const setField = (key, value) => setSlides((list) => list.map((s, i) => (i === active ? { ...s, data: { ...s.data, [key]: value } } : s)));

  function addSlide(designId) {
    setSlides((list) => {
      const next = [...list];
      next.splice(active + 1, 0, { design: designId, data: {} });
      return next;
    });
    setActive(active + 1);
  }
  function move(d) {
    const j = active + d;
    if (j < 0 || j >= slides.length) return;
    setSlides((list) => {
      const next = [...list];
      [next[active], next[j]] = [next[j], next[active]];
      return next;
    });
    setActive(j);
  }
  function removeSlide() {
    if (slides.length === 1) return;
    setSlides((list) => list.filter((_, i) => i !== active));
    setActive(Math.max(0, active - 1));
  }

  const fileName = (i) => `${name || "placa"}-${String(i + 1).padStart(2, "0")}`.replace(/[^a-z0-9-_]/gi, "-").toLowerCase();

  function downloadAll() {
    urls.forEach((u, i) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = `${u}&download=1&name=${encodeURIComponent(fileName(i))}`;
        a.download = `${fileName(i)}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, i * 700);
    });
  }

  async function saveToLibrary(indexes) {
    let ok = 0;
    for (const [n, i] of indexes.entries()) {
      setSaving(`Guardando ${n + 1} de ${indexes.length}…`);
      const s = slides[i];
      try {
        await api("templates/save", {
          method: "POST",
          body: {
            design: s.design,
            size,
            theme,
            data: withPlaceholders(s),
            page: total > 1 ? i + 1 : undefined,
            total: total > 1 ? total : undefined,
            name,
            tags: [name.toLowerCase()],
          },
        });
        ok++;
      } catch (e) {
        toast({ type: "error", text: `Slide ${i + 1}: ${e.message}` });
      }
    }
    setSaving("");
    if (ok) toast({ text: ok === 1 ? "Guardada en la biblioteca" : `${ok} placas guardadas en la biblioteca` });
  }

  const w = words(slide);
  const dims = SIZES.find((s) => s.id === size);

  return (
    <div className="mk-marca-tpl">
      <div className="mk-marca-stack">
        <div className="adm-card mk-marca-section">
          <div className="mk-marca-grid3">
            <label className="adm-form-group">
              <span className="adm-label">Nombre</span>
              <input className="adm-input" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="adm-form-group">
              <span className="adm-label">Formato</span>
              <select className="adm-select" value={size} onChange={(e) => setSize(e.target.value)}>
                {SIZES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="adm-form-group">
              <span className="adm-label">Tema</span>
              <select className="adm-select" value={theme} onChange={(e) => setTheme(e.target.value)}>
                {THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="mk-marca-hint">Una placa sola es un carrusel de 1 slide. Usá *asteriscos* para resaltar palabras con el color de acento.</p>
        </div>

        <div className="adm-card mk-marca-section">
          <div className="mk-marca-section-head">
            <h2 className="mk-marca-h2">
              Slide {active + 1} de {total} · {design.label}
            </h2>
            <div className="mk-marca-row mk-marca-row-tight">
              <button className="adm-link-btn" onClick={() => move(-1)} disabled={active === 0} aria-label="Mover antes">
                ←
              </button>
              <button className="adm-link-btn" onClick={() => move(1)} disabled={active === total - 1} aria-label="Mover después">
                →
              </button>
              <button className="adm-link-btn mk-marca-danger" onClick={removeSlide} disabled={total === 1}>
                Quitar
              </button>
            </div>
          </div>
          <label className="adm-form-group">
            <span className="adm-label">Diseño</span>
            <select
              className="adm-select"
              value={slide.design}
              onChange={(e) => setSlides((list) => list.map((s, i) => (i === active ? { ...s, design: e.target.value } : s)))}
            >
              {DESIGNS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          {design.fields.map((f) => (
            <label key={f.key} className="adm-form-group">
              <span className="adm-label">{f.label}</span>
              {f.multiline ? (
                <textarea className="adm-textarea mk-marca-ta" rows={3} value={slide.data[f.key] || ""} placeholder={f.placeholder} onChange={(e) => setField(f.key, e.target.value)} />
              ) : (
                <input className="adm-input" value={slide.data[f.key] || ""} placeholder={f.placeholder} onChange={(e) => setField(f.key, e.target.value)} />
              )}
            </label>
          ))}
          {maxWords > 0 && (
            <p className={`mk-marca-words${w > maxWords ? " is-over" : ""}`}>
              {w} / {maxWords} palabras{w > maxWords ? " · pasa el máximo de la marca, recortá" : ""}
              {w === 0 ? " (vacío: se muestra el ejemplo)" : ""}
            </p>
          )}
        </div>

        <div className="adm-card mk-marca-section">
          <span className="adm-label">Agregar slide después de esta</span>
          <div className="mk-marca-row mk-marca-wrap">
            {DESIGNS.map((d) => (
              <button key={d.id} className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => addSlide(d.id)}>
                + {d.label}
              </button>
            ))}
          </div>
          <button
            className="adm-link-btn"
            onClick={() => {
              if (confirm("¿Empezar de cero? Se pierde el borrador actual.")) {
                setSlides(STARTER);
                setActive(0);
              }
            }}
          >
            Empezar de cero
          </button>
        </div>
      </div>

      <div className="mk-marca-stack mk-marca-tpl-preview">
        <div className="mk-marca-preview-frame" style={{ aspectRatio: `${dims.width} / ${dims.height}` }}>
          {previewUrl && <img key={previewUrl} src={previewUrl} alt={`Vista previa slide ${active + 1}`} />}
        </div>
        <div className="mk-marca-row mk-marca-wrap">
          <a className="adm-btn adm-btn-primary adm-btn-sm" href={`${urls[active]}&download=1&name=${encodeURIComponent(fileName(active))}`} download={`${fileName(active)}.png`}>
            Descargar PNG
          </a>
          {total > 1 && (
            <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={downloadAll}>
              Descargar las {total}
            </button>
          )}
          <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => saveToLibrary([active])} disabled={!!saving}>
            Guardar en biblioteca
          </button>
          {total > 1 && (
            <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => saveToLibrary(slides.map((_, i) => i))} disabled={!!saving}>
              Guardar todas
            </button>
          )}
        </div>
        {saving && <p className="mk-marca-hint">{saving}</p>}
        <div className="mk-marca-strip">
          {shown.map((u, i) => (
            <button key={i} className={`mk-marca-strip-item${i === active ? " is-active" : ""}`} onClick={() => setActive(i)} style={{ aspectRatio: `${dims.width} / ${dims.height}` }}>
              <img src={u} alt={`Slide ${i + 1}`} loading="lazy" />
              {slides[i] && maxWords > 0 && words(slides[i]) > maxWords && <span className="mk-marca-strip-warn" title="Pasa el máximo de palabras">!</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
