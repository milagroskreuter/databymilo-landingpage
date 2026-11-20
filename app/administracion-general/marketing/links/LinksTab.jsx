"use client";
import { useMemo, useState } from "react";
import { DEST_TYPES } from "@/lib/marketing/links/shared";
import { copyText, fmt, fmtDate, netColor, netLabel } from "./util";

const DEST_LABEL = Object.fromEntries(DEST_TYPES.map((d) => [d.id, d.label]));

function destText(l, options) {
  if (l.dest_type === "url") return l.url;
  if (l.dest_type === "list") {
    const list = options.lists.find((x) => x.slug === l.list_slug);
    return `Lista: ${list?.name || l.list_slug}`;
  }
  const r = options.resources.find((x) => x.slug === l.resource_slug);
  return `${l.dest_type === "resource_checkout" ? "Pago: " : "Recurso: "}${r?.title || l.resource_slug}`;
}

export default function LinksTab({ links, options, onEdit, onPatch, onRemove, onStats, onCopied }) {
  const [q, setQ] = useState("");
  const [campaign, setCampaign] = useState("");
  const [scope, setScope] = useState("all"); // all | short | bio

  const campaigns = useMemo(() => [...new Set((links ?? []).map((l) => l.campaign).filter(Boolean))].sort(), [links]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (links ?? [])
      .filter((l) => (scope === "bio" ? l.in_bio : scope === "short" ? !l.in_bio : true))
      .filter((l) => !campaign || l.campaign === campaign)
      .filter(
        (l) =>
          !s ||
          [l.title, l.slug, l.campaign, l.keyword, l.url].filter(Boolean).some((v) => String(v).toLowerCase().includes(s))
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [links, q, campaign, scope]);

  const copyLink = async (l) => {
    await copyText(l.short_url);
    onCopied(`Copiado: ${l.short_url.replace("https://", "")}`);
  };

  const copyDm = async (l) => {
    const text = `¡Hola! Acá tenés el link 💌 ${l.short_url.replace("https://", "")}`;
    await copyText(text);
    onCopied("Mensaje para el DM copiado");
  };

  return (
    <>
      <div className="adm-alert adm-alert-info" style={{ marginBottom: 16, lineHeight: 1.6 }}>
        Cada link corto (<strong>databymilo.me/go/…</strong>) cuenta los clicks y, si lleva al sitio, suma UTM con la red y la
        campaña. Para el “comentá <strong>PALABRA</strong> y te mando el link”: creá un link con destino a un recurso o a una
        lista, ponele la palabra y usá “Copiar DM” para responder.
      </div>

      <div className="mk-links-a-filters">
        <input className="adm-input adm-search" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="adm-input" value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="all">Todos</option>
          <option value="short">Solo links cortos</option>
          <option value="bio">Solo botones de /links</option>
        </select>
        <select className="adm-input" value={campaign} onChange={(e) => setCampaign(e.target.value)}>
          <option value="">Todas las campañas</option>
          {campaigns.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {links == null ? (
        <div className="adm-skel" style={{ height: 200 }} />
      ) : rows.length === 0 ? (
        <div className="adm-empty">
          <p>{links.length === 0 ? "Todavía no hay links. Creá el primero con “+ Nuevo link”." : "Nada coincide con el filtro."}</p>
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table mk-links-a-table">
            <thead>
              <tr>
                <th>Link</th>
                <th>Destino</th>
                <th>Red · campaña</th>
                <th style={{ textAlign: "right" }}>Clicks 30 d</th>
                <th style={{ textAlign: "right" }}>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className={l.active ? "" : "is-off"}>
                  <td>
                    <div className="mk-links-a-cell-title">
                      {l.title}
                      {l.in_bio && <span className="adm-badge adm-badge-free">bio</span>}
                      {!l.active && <span className="adm-badge adm-badge-inactive">pausado</span>}
                    </div>
                    <button type="button" className="mk-links-a-short" onClick={() => copyLink(l)} title="Copiar link">
                      /go/{l.slug} ⧉
                    </button>
                    {l.keyword && <span className="mk-links-a-kw">comentá {l.keyword}</span>}
                  </td>
                  <td className="mk-links-a-dest" title={DEST_LABEL[l.dest_type]}>
                    {destText(l, options)}
                  </td>
                  <td>
                    {l.network ? (
                      <span className="mk-links-a-net">
                        <i style={{ background: netColor(l.network) }} />
                        {netLabel(l.network)}
                      </span>
                    ) : (
                      <span className="mk-links-a-muted">auto</span>
                    )}
                    {l.campaign && <div className="mk-links-a-muted">{l.campaign}</div>}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(l.clicks_30d)}</td>
                  <td style={{ textAlign: "right" }}>
                    {fmt(l.clicks_total)}
                    {l.last_click && <div className="mk-links-a-muted">último {fmtDate(l.last_click)}</div>}
                  </td>
                  <td>
                    <div className="mk-links-a-actions">
                      {l.keyword && (
                        <button type="button" className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => copyDm(l)}>
                          Copiar DM
                        </button>
                      )}
                      <button type="button" className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => onStats(l)}>
                        Stats
                      </button>
                      <button type="button" className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => onEdit(l)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="adm-btn adm-btn-sm adm-btn-secondary"
                        onClick={() => onPatch(l, { active: !l.active }, l.active ? "Link pausado: ahora lleva a /links" : "Link activado")}
                      >
                        {l.active ? "Pausar" : "Activar"}
                      </button>
                      <button type="button" className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => onRemove(l)} aria-label="Borrar">
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
