"use client";
import { useEffect, useState } from "react";
import DealsBoard from "./DealsBoard";
import SlotsPanel from "./SlotsPanel";
import CollabsPanel from "./CollabsPanel";
import MediaKitEditor from "./MediaKitEditor";
import "./sponsors.css";

const TABS = [
  { id: "marcas", label: "Marcas" },
  { id: "espacios", label: "Espacios y tarifas" },
  { id: "colaboraciones", label: "Colaboraciones" },
  { id: "mediakit", label: "Media kit" },
];

export default function SponsorsApp() {
  const [tab, setTab] = useState("marcas");

  useEffect(() => {
    const fromHash = window.location.hash.replace("#", "");
    if (TABS.some((t) => t.id === fromHash)) setTab(fromHash);
  }, []);

  function pick(id) {
    setTab(id);
    window.history.replaceState(null, "", `#${id}`);
  }

  return (
    <>
      <div className="adm-header">
        <h1>Sponsors</h1>
        <a className="adm-btn adm-btn-secondary" href="/media-kit" target="_blank" rel="noreferrer">Ver media kit →</a>
      </div>
      <div className="adm-content">
        <div className="mk-sponsors-tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? "on" : ""} onClick={() => pick(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        {tab === "marcas" && <DealsBoard />}
        {tab === "espacios" && <SlotsPanel />}
        {tab === "colaboraciones" && <CollabsPanel />}
        {tab === "mediakit" && <MediaKitEditor />}
      </div>
    </>
  );
}
