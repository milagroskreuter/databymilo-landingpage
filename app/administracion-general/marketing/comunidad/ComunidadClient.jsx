"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import TestimoniosTab from "./TestimoniosTab";
import PreguntasTab from "./PreguntasTab";
import MencionesTab from "./MencionesTab";

const TABS = [
  { id: "testimonios", label: "Testimonios", countKey: "pendingTestimonials", countHint: "pendientes" },
  { id: "preguntas", label: "Preguntas", countKey: "unusedQuestions", countHint: "sin usar" },
  { id: "menciones", label: "Menciones", countKey: "unsharedMentions", countHint: "para compartir" },
];

export default function ComunidadClient() {
  const [tab, setTab] = useState("testimonios");
  const [summary, setSummary] = useState(null);
  const [copied, setCopied] = useState(false);

  // ?tab=preguntas abre directo esa pestaña (ej. desde el aviso de la campana).
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (TABS.some((x) => x.id === t)) setTab(t);
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await api("/summary"));
    } catch {
      setSummary(null);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  function selectTab(id) {
    setTab(id);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.replaceState(null, "", url);
  }

  async function copyFormLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/testimonio`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  return (
    <>
      <div className="adm-header">
        <h1>Comunidad</h1>
        <div className="mk-comunidad-head-actions">
          <button type="button" className="adm-btn adm-btn-secondary adm-btn-sm" onClick={copyFormLink}>
            {copied ? "¡Copiado!" : "Copiar link del formulario"}
          </button>
          <a href="/testimonio" target="_blank" rel="noreferrer" className="adm-btn adm-btn-secondary adm-btn-sm">
            Ver formulario ↗
          </a>
        </div>
      </div>

      <div className="adm-content">
        <div className="mk-comunidad-tabs" role="tablist">
          {TABS.map((t) => {
            const count = summary?.[t.countKey] ?? 0;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`mk-comunidad-tab${tab === t.id ? " is-active" : ""}`}
                onClick={() => selectTab(t.id)}
                title={summary ? `${count} ${t.countHint}` : undefined}
              >
                {t.label}
                {count > 0 && (
                  <span className="mk-comunidad-count" aria-label={`${count} ${t.countHint}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {tab === "testimonios" && <TestimoniosTab summary={summary} onChange={loadSummary} />}
        {tab === "preguntas" && <PreguntasTab onChange={loadSummary} />}
        {tab === "menciones" && <MencionesTab onChange={loadSummary} />}
      </div>
    </>
  );
}
