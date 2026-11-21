"use client";
import { useEffect, useRef, useState } from "react";
import { useToast } from "../../AdminToast";
import AssetPicker, { useAssets } from "./AssetPicker";

const PIN_SCRIPT = "https://assets.pinterest.com/js/pinit.js";
const BOARD_RE = /^https:\/\/([a-z]{2,3}\.|www\.)?pinterest\.[a-z.]{2,6}\/[^/?#]+\/[^/?#]+\/?$/i;

function normalizeBoard(url) {
  const clean = String(url || "").trim().split(/[?#]/)[0];
  if (!clean) return "";
  return clean.endsWith("/") ? clean : `${clean}/`;
}

/** Widget oficial de Pinterest para mostrar un tablero (no necesita API). */
function PinterestBoard({ url }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!url || !ref.current) return;
    ref.current.innerHTML = "";
    const a = document.createElement("a");
    a.setAttribute("data-pin-do", "embedBoard");
    a.setAttribute("data-pin-board-width", "900");
    a.setAttribute("data-pin-scale-height", "520");
    a.setAttribute("data-pin-scale-width", "120");
    a.href = url;
    ref.current.appendChild(a);

    const build = () => window.PinUtils?.build?.();
    const existing = document.querySelector(`script[src="${PIN_SCRIPT}"]`);
    if (existing) {
      build();
    } else {
      const s = document.createElement("script");
      s.src = PIN_SCRIPT;
      s.async = true;
      s.defer = true;
      s.onload = build;
      document.body.appendChild(s);
    }
  }, [url]);
  return <div ref={ref} className="mk-marca-pinterest" />;
}

export default function MoodboardTab({ brand, saveKey }) {
  const toast = useToast();
  const mood = brand.moodboard || {};
  const [url, setUrl] = useState(mood.pinterest_url || "");
  const [notes, setNotes] = useState(mood.notes || "");
  const [picking, setPicking] = useState(false);
  const { assets } = useAssets(mood.asset_ids || []);

  async function save(patch, msg = "Moodboard guardado") {
    try {
      await saveKey("moodboard", { ...mood, ...patch });
      toast({ text: msg });
    } catch (e) {
      toast({ type: "error", text: e.message });
    }
  }

  const board = normalizeBoard(url);
  const validBoard = !board || BOARD_RE.test(board);
  const savedBoard = mood.pinterest_url;

  return (
    <div className="mk-marca-stack">
      <section className="adm-card mk-marca-section">
        <h2 className="mk-marca-h2">Tablero de Pinterest</h2>
        <p className="mk-marca-hint">Pegá la URL de un tablero tuyo (ej. https://www.pinterest.com/databymilo/estetica/). Tiene que ser público.</p>
        <div className="mk-marca-row">
          <input className="adm-input mk-marca-grow" placeholder="https://www.pinterest.com/usuario/tablero/" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button
            className="adm-btn adm-btn-primary adm-btn-sm"
            disabled={!validBoard || board === (savedBoard || "")}
            onClick={() => save({ pinterest_url: board })}
          >
            Guardar
          </button>
        </div>
        {!validBoard && <p className="mk-marca-words is-over">Esa URL no parece un tablero de Pinterest (usuario/tablero).</p>}
        {savedBoard ? (
          <PinterestBoard url={savedBoard} />
        ) : (
          <div className="adm-empty">
            <p>Todavía no hay tablero.</p>
          </div>
        )}
      </section>

      <section className="adm-card mk-marca-section">
        <div className="mk-marca-section-head">
          <div>
            <h2 className="mk-marca-h2">Imágenes de referencia</h2>
            <p className="mk-marca-hint">Se guardan en la biblioteca como referencia visual de la marca.</p>
          </div>
          <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setPicking(true)}>
            + Agregar
          </button>
        </div>
        {assets.length === 0 ? (
          <div className="adm-empty">
            <p>Sin imágenes de referencia.</p>
          </div>
        ) : (
          <div className="mk-marca-mood-grid">
            {assets.map((a, i) => (
              <figure key={a.id} className="mk-marca-mood-item">
                {a.url && <img src={a.url} alt={a.name} loading="lazy" />}
                {i < 3 && <span className="mk-marca-mood-badge">Referencia {i + 1}</span>}
                <button
                  className="mk-marca-mood-remove"
                  aria-label="Quitar del moodboard"
                  onClick={() => save({ asset_ids: (mood.asset_ids || []).filter((id) => id !== a.id) }, "Imagen quitada del moodboard")}
                >
                  ✕
                </button>
              </figure>
            ))}
          </div>
        )}
        <label className="adm-form-group">
          <span className="adm-label">Notas de estética</span>
          <textarea className="adm-textarea mk-marca-ta" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <div>
          <button className="adm-btn adm-btn-primary adm-btn-sm" disabled={notes === (mood.notes || "")} onClick={() => save({ notes })}>
            Guardar notas
          </button>
        </div>
      </section>

      {picking && (
        <AssetPicker
          title="Imágenes de referencia"
          multiple
          uploadTags={["moodboard"]}
          onClose={() => setPicking(false)}
          onPick={(list) => {
            setPicking(false);
            const ids = [...new Set([...(mood.asset_ids || []), ...list.map((a) => a.id)])];
            save({ asset_ids: ids }, "Moodboard actualizado");
          }}
        />
      )}
    </div>
  );
}
