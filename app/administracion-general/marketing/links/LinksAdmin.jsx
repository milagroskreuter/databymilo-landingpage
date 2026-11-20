"use client";
import { useCallback, useEffect, useState } from "react";
import BioTab from "./BioTab";
import LinksTab from "./LinksTab";
import StatsTab from "./StatsTab";
import FunnelTab from "./FunnelTab";
import LinkForm from "./LinkForm";
import { api } from "./util";

const TABS = [
  { id: "bio", label: "Página de bio" },
  { id: "links", label: "Links cortos" },
  { id: "stats", label: "Estadísticas" },
  { id: "funnel", label: "Embudo" },
];

export default function LinksAdmin() {
  const [tab, setTab] = useState("bio");
  const [links, setLinks] = useState(null);
  const [options, setOptions] = useState({ resources: [], lists: [], content: [] });
  const [error, setError] = useState("");
  const [msg, setMsg] = useState(null);
  const [editing, setEditing] = useState(null); // null | link (con o sin id)
  const [statsLink, setStatsLink] = useState(null);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    const h = window.location.hash.replace("#", "");
    if (TABS.some((t) => t.id === h)) setTab(h);
  }, []);

  const changeTab = (id) => {
    setTab(id);
    try {
      history.replaceState(null, "", `#${id}`);
    } catch {}
  };

  const load = useCallback(async () => {
    setError("");
    try {
      const d = await api("");
      setLinks(d.links);
    } catch (err) {
      setError(err.message);
      setLinks([]);
    }
  }, []);

  useEffect(() => {
    load();
    api("/options").then(setOptions).catch(() => {});
  }, [load]);

  const flash = (type, text) => setMsg({ type, text });

  const onSaved = (text) => {
    setEditing(null);
    flash("success", text);
    load();
    setPreviewKey((k) => k + 1);
  };

  const patch = async (link, body, okText) => {
    try {
      await api(`/${link.id}`, { method: "PATCH", body: JSON.stringify(body) });
      if (okText) flash("success", okText);
      await load();
      setPreviewKey((k) => k + 1);
    } catch (err) {
      flash("error", err.message);
    }
  };

  const remove = async (link) => {
    const warn = link.clicks_total
      ? `¿Borrar "${link.title}"? El link corto deja de funcionar. Sus ${link.clicks_total} clicks quedan en las estadísticas.`
      : `¿Borrar "${link.title}"? El link corto deja de funcionar.`;
    if (!confirm(warn)) return;
    try {
      await api(`/${link.id}`, { method: "DELETE" });
      flash("success", "Link borrado");
      load();
      setPreviewKey((k) => k + 1);
    } catch (err) {
      flash("error", err.message);
    }
  };

  const reorder = async (ids) => {
    // Orden optimista
    setLinks((cur) => {
      const pos = Object.fromEntries(ids.map((id, i) => [id, i + 1]));
      return cur.map((l) => (pos[l.id] ? { ...l, bio_order: pos[l.id] } : l));
    });
    try {
      await api("/reorder", { method: "POST", body: JSON.stringify({ ids }) });
      setPreviewKey((k) => k + 1);
    } catch (err) {
      flash("error", err.message);
      load();
    }
  };

  const showStats = (link) => {
    setStatsLink(link);
    changeTab("stats");
  };

  const campaigns = [...new Set((links ?? []).map((l) => l.campaign).filter(Boolean))].sort();

  return (
    <>
      <div className="adm-header">
        <h1>Links y embudo</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a className="adm-btn adm-btn-secondary" href="/links" target="_blank" rel="noopener noreferrer">
            Ver /links ↗
          </a>
          <button
            className="adm-btn adm-btn-primary"
            onClick={() => setEditing({ in_bio: tab === "bio", dest_type: "url", add_utm: true, active: true })}
          >
            {tab === "bio" ? "+ Nuevo botón" : "+ Nuevo link"}
          </button>
        </div>
      </div>

      <div className="adm-content">
        <div className="mk-links-a-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`mk-links-a-tab${tab === t.id ? " is-active" : ""}`}
              onClick={() => changeTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {msg && (
          <div className={`adm-alert adm-alert-${msg.type}`} style={{ marginBottom: 16 }}>
            {msg.text}
            <button onClick={() => setMsg(null)} className="mk-links-a-x" aria-label="Cerrar">
              ✕
            </button>
          </div>
        )}
        {error && (
          <div className="adm-alert adm-alert-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        {tab === "bio" && (
          <BioTab
            links={links}
            previewKey={previewKey}
            onEdit={setEditing}
            onPatch={patch}
            onReorder={reorder}
            onRemove={remove}
            onSavedSettings={() => {
              flash("success", "Página de bio guardada ✓");
              setPreviewKey((k) => k + 1);
            }}
            onError={(t) => flash("error", t)}
          />
        )}
        {tab === "links" && (
          <LinksTab
            links={links}
            options={options}
            onEdit={setEditing}
            onPatch={patch}
            onRemove={remove}
            onStats={showStats}
            onCopied={(t) => flash("success", t)}
          />
        )}
        {tab === "stats" && (
          <StatsTab links={links ?? []} linkFilter={statsLink} onClearFilter={() => setStatsLink(null)} onPickLink={setStatsLink} />
        )}
        {tab === "funnel" && <FunnelTab />}
      </div>

      {editing && (
        <LinkForm
          initial={editing}
          options={options}
          campaigns={campaigns}
          onCancel={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}
    </>
  );
}
