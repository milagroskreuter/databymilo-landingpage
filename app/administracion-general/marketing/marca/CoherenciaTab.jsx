"use client";
import { useEffect, useRef, useState } from "react";
import { useToast } from "../../AdminToast";
import { api, resizeToDataUrl } from "./api";
import AssetPicker from "./AssetPicker";

const AREA_LABEL = {
  paleta: "Paleta",
  tipografia: "Tipografía",
  reglas: "Reglas",
  texto: "Texto y voz",
  moodboard: "Moodboard",
  logo: "Logo y firma",
  composicion: "Composición",
};

function scoreTone(score) {
  if (score >= 90) return "good";
  if (score >= 70) return "mid";
  return "bad";
}

function Result({ check }) {
  const r = check.result || {};
  const items = r.items || [];
  const fails = items.filter((i) => !i.ok);
  const oks = items.filter((i) => i.ok);
  return (
    <div className="adm-card mk-marca-section mk-marca-result">
      <div className="mk-marca-result-head">
        <div className={`mk-marca-score is-${scoreTone(check.score ?? r.score)}`}>
          <strong>{check.score ?? r.score}</strong>
          <span>/ 100</span>
        </div>
        <div className="mk-marca-grow">
          <p className="mk-marca-result-summary">{r.summary}</p>
          {r.colors_detected?.length > 0 && (
            <div className="mk-marca-row mk-marca-wrap">
              <span className="mk-marca-hint">Colores detectados:</span>
              {r.colors_detected.map((c, i) => (
                <span key={i} className="mk-marca-mini-swatch" style={{ background: c }} title={c} />
              ))}
              {Number.isFinite(r.words_counted) && <span className="mk-marca-hint">· {r.words_counted} palabras</span>}
            </div>
          )}
        </div>
      </div>
      {fails.length > 0 && <h3 className="adm-label mk-marca-result-title">Para corregir ({fails.length})</h3>}
      <ul className="mk-marca-checklist">
        {fails.map((it, i) => (
          <li key={`f${i}`} className="is-fail">
            <span className="mk-marca-check-mark">✕</span>
            <div>
              <strong>{it.rule}</strong> <span className="mk-marca-hint">· {AREA_LABEL[it.area] || it.area}</span>
              <p>{it.detail}</p>
              {it.fix && <p className="mk-marca-fix">→ {it.fix}</p>}
            </div>
          </li>
        ))}
      </ul>
      {oks.length > 0 && <h3 className="adm-label mk-marca-result-title">Cumple ({oks.length})</h3>}
      <ul className="mk-marca-checklist">
        {oks.map((it, i) => (
          <li key={`o${i}`} className="is-ok">
            <span className="mk-marca-check-mark">✓</span>
            <div>
              <strong>{it.rule}</strong> <span className="mk-marca-hint">· {AREA_LABEL[it.area] || it.area}</span>
              <p>{it.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CoherenciaTab({ brand, goTab }) {
  const toast = useToast();
  const [configured, setConfigured] = useState(true);
  const [history, setHistory] = useState([]);
  const [piece, setPiece] = useState(null); // { preview, dataUrl?, assetId?, name }
  const [notes, setNotes] = useState("");
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState(null);
  const [picking, setPicking] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    api("check")
      .then((d) => {
        setConfigured(d.configured);
        setHistory(d.checks || []);
      })
      .catch(() => {});
  }, []);

  async function onFile(file) {
    if (!file.type.startsWith("image/")) return toast({ type: "error", text: "Tiene que ser una imagen" });
    try {
      const dataUrl = await resizeToDataUrl(file);
      setPiece({ preview: dataUrl, dataUrl, name: file.name });
      setCurrent(null);
    } catch (e) {
      toast({ type: "error", text: e.message });
    }
  }

  async function run() {
    setRunning(true);
    setCurrent(null);
    try {
      const { check } = await api("check", {
        method: "POST",
        body: { image: piece.dataUrl, assetId: piece.assetId, name: piece.name, notes },
      });
      setCurrent(check);
      if (check.id) setHistory((h) => [check, ...h].slice(0, 20));
    } catch (e) {
      toast({ type: "error", text: e.message });
    } finally {
      setRunning(false);
    }
  }

  const refs = (brand.moodboard?.asset_ids || []).length;

  return (
    <div className="mk-marca-stack">
      {!configured && (
        <div className="adm-alert adm-alert-error">
          Falta configurar <code>ANTHROPIC_API_KEY</code> en Vercel (proyecto databymilo-landingpage) para usar el chequeo con Claude. Creá la clave en{" "}
          <a href="https://platform.claude.com/settings/keys" target="_blank" rel="noopener noreferrer">
            platform.claude.com
          </a>
          , agregala como variable de entorno y volvé a deployar.
        </div>
      )}
      <div className="mk-marca-check">
        <section className="adm-card mk-marca-section">
          <h2 className="mk-marca-h2">Pieza a revisar</h2>
          <p className="mk-marca-hint">
            Claude la compara con la paleta, la tipografía, la voz, las reglas visuales y {refs ? `${Math.min(refs, 3)} imágenes del moodboard` : "el moodboard (todavía sin imágenes"}
            {refs ? "" : ")"}.{" "}
            <button className="adm-link-btn" onClick={() => goTab(refs ? "sistema" : "moodboard")}>
              {refs ? "Ver el sistema" : "Agregar referencias"}
            </button>
          </p>
          <div
            className="mk-marca-drop mk-marca-check-drop"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) onFile(f);
            }}
          >
            {piece ? (
              <img src={piece.preview} alt="Pieza a revisar" className="mk-marca-check-img" />
            ) : (
              <div>
                <strong>Arrastrá una imagen</strong>
                <p className="mk-marca-hint">o elegila de tu compu o de la biblioteca</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            <div className="mk-marca-row mk-marca-wrap">
              <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => fileRef.current?.click()}>
                Subir de la compu
              </button>
              <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setPicking(true)}>
                Elegir de la biblioteca
              </button>
            </div>
          </div>
          <label className="adm-form-group">
            <span className="adm-label">Contexto (opcional)</span>
            <input className="adm-input" placeholder="Ej. portada de carrusel para LinkedIn sobre SQL" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <button className="adm-btn adm-btn-primary" onClick={run} disabled={!piece || running || !configured}>
            {running ? "Revisando con Claude… (puede tardar un minuto)" : "Revisar coherencia"}
          </button>
        </section>

        <div className="mk-marca-stack">
          {current ? (
            <Result check={current} />
          ) : (
            <div className="adm-empty">
              <p>{running ? "Claude está mirando la pieza…" : "El checklist aparece acá."}</p>
            </div>
          )}
          {history.length > 0 && (
            <section className="adm-card mk-marca-section">
              <h2 className="mk-marca-h2">Chequeos anteriores</h2>
              <ul className="mk-marca-history">
                {history.map((h) => (
                  <li key={h.id}>
                    <button className="mk-marca-history-item" onClick={() => setCurrent(h)}>
                      <span className={`mk-marca-score-pill is-${scoreTone(h.score)}`}>{h.score}</span>
                      <span className="mk-marca-grow">{h.image_name || "Pieza sin nombre"}</span>
                      <span className="mk-marca-hint">{new Date(h.created_at).toLocaleDateString("es-AR")}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
      {picking && (
        <AssetPicker
          title="Elegí la pieza"
          onClose={() => setPicking(false)}
          onPick={(a) => {
            setPicking(false);
            setPiece({ preview: a.url, assetId: a.id, name: a.name });
            setCurrent(null);
          }}
        />
      )}
    </div>
  );
}
