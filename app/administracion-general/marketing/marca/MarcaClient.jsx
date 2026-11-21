"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import SistemaTab from "./SistemaTab";
import BibliotecaTab from "./BibliotecaTab";
import PlantillasTab from "./PlantillasTab";
import FotosTab from "./FotosTab";
import MoodboardTab from "./MoodboardTab";
import CanvaTab from "./CanvaTab";
import CoherenciaTab from "./CoherenciaTab";
import "./marca.css";

const TABS = [
  { id: "sistema", label: "Sistema de marca", Comp: SistemaTab },
  { id: "biblioteca", label: "Biblioteca", Comp: BibliotecaTab },
  { id: "plantillas", label: "Plantillas", Comp: PlantillasTab },
  { id: "fotos", label: "Fotos", Comp: FotosTab },
  { id: "moodboard", label: "Moodboard", Comp: MoodboardTab },
  { id: "canva", label: "Canva", Comp: CanvaTab },
  { id: "coherencia", label: "Chequeo de coherencia", Comp: CoherenciaTab },
];

export default function MarcaClient() {
  const [tab, setTab] = useState("sistema");
  const [brand, setBrand] = useState(null);
  const [error, setError] = useState("");

  // La pestaña vive en la URL (?tab=) para poder volver directo, ej. desde el login de Canva.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (TABS.some((x) => x.id === t)) setTab(t);
  }, []);

  const loadBrand = useCallback(async () => {
    try {
      const data = await api("");
      setBrand(data.brand);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    loadBrand();
  }, [loadBrand]);

  function go(id) {
    setTab(id);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    for (const k of ["canva", "msg"]) url.searchParams.delete(k);
    window.history.replaceState(null, "", url);
  }

  // Guarda una clave del sistema de marca y actualiza el estado local.
  const saveKey = useCallback(async (key, value) => {
    await api("", { method: "PUT", body: { key, value } });
    setBrand((b) => ({ ...b, [key]: value }));
  }, []);

  const Active = TABS.find((t) => t.id === tab)?.Comp || SistemaTab;

  return (
    <>
      <div className="adm-header">
        <h1>Marca y diseño</h1>
      </div>
      <div className="adm-content mk-marca">
        <nav className="mk-marca-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`mk-marca-tab${tab === t.id ? " is-active" : ""}`}
              onClick={() => go(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        {error && <div className="adm-alert adm-alert-error">No se pudo cargar el sistema de marca: {error}</div>}
        {!brand && !error ? (
          <div className="mk-marca-loading">Cargando…</div>
        ) : brand ? (
          <Active brand={brand} saveKey={saveKey} reloadBrand={loadBrand} goTab={go} />
        ) : null}
      </div>
    </>
  );
}
