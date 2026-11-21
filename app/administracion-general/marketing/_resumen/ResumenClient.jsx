"use client";
// Resumen de Marketing: qué viene, qué está atrasado, balance de pilares,
// últimas ideas y accesos a las demás áreas. Lee solo tablas compartidas.
import { useEffect, useState } from "react";
import Link from "next/link";
import { NETWORK_BY_ID } from "@/lib/marketing/constants";
import { api } from "../calendario/api";
import { byId, StatusBadge, whenText, FALLBACK_COLOR } from "../calendario/shared";
import PillarBalance from "../calendario/PillarBalance";
import "../calendario/calendario.css";

const BASE = "/administracion-general/marketing";

const AREAS = [
  { href: `${BASE}/calendario`, icon: "▦", label: "Calendario", desc: "Mes, semana, tablero por estado y series." },
  { href: `${BASE}/ideas`, icon: "✧", label: "Ideas", desc: "Banco de ideas con puntaje y etiquetas." },
  { href: `${BASE}/marca`, icon: "◐", label: "Marca y diseño", desc: "Paleta, tipografías, voz y bios." },
  { href: `${BASE}/metricas`, icon: "↗", label: "Métricas de redes", desc: "Seguidores y rendimiento por pieza." },
  { href: `${BASE}/links`, icon: "⌁", label: "Links", desc: "Links con seguimiento y embudo a ventas." },
  { href: `${BASE}/lanzamientos`, icon: "➶", label: "Lanzamientos", desc: "Plan y checklist de cada lanzamiento." },
  { href: `${BASE}/sponsors`, icon: "◇", label: "Sponsors", desc: "Marcas, propuestas y media kit." },
  { href: `${BASE}/comunidad`, icon: "❦", label: "Comunidad", desc: "Preguntas, testimonios y casos." },
];

function PieceList({ pieces, pillarsById, empty, late = false }) {
  if (!pieces.length) return <p className="adm-card-note">{empty}</p>;
  return (
    <ul className="mk-cal-sum-list">
      {pieces.map((p) => (
        <li key={p.id} className="mk-cal-sum-item">
          <span className="mk-cal-sum-bar" style={{ background: NETWORK_BY_ID[p.network]?.color || FALLBACK_COLOR }} />
          <span className={`mk-cal-sum-when${late ? " mk-cal-late" : ""}`}>{whenText(p.scheduled_at)}</span>
          <Link href={`${BASE}/calendario?vista=lista`} className="mk-cal-sum-title" title={p.title}>
            {p.title}
          </Link>
          {pillarsById[p.pillar_id] && (
            <span className="mk-cal-dot-label" title={pillarsById[p.pillar_id].name}>
              <i style={{ background: pillarsById[p.pillar_id].color }} />
            </span>
          )}
          <StatusBadge status={p.status} />
        </li>
      ))}
    </ul>
  );
}

export default function ResumenClient() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.summary().then(setData).catch((err) => setError(err.message));
  }, []);

  const pillarsById = byId(data?.pillars);

  return (
    <>
      <div className="adm-header">
        <h1>Marketing</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`${BASE}/ideas`} className="adm-btn adm-btn-secondary">
            + Idea
          </Link>
          <Link href={`${BASE}/calendario?nueva=1`} className="adm-btn adm-btn-primary">
            + Pieza
          </Link>
        </div>
      </div>

      <div className="adm-content">
        {error && <div className="adm-alert adm-alert-error">No se pudo cargar el resumen: {error}</div>}

        <div className="adm-stats-grid">
          <div className="adm-stat-card">
            <div className="adm-stat-label">Próximos 7 días</div>
            <div className="adm-stat-value">{data ? data.weekCount : "—"}</div>
            <div className="adm-stat-sub">piezas en el calendario</div>
          </div>
          <div className="adm-stat-card">
            <div className="adm-stat-label">Atrasadas</div>
            <div className="adm-stat-value" style={data?.overdue.length ? { color: "#b82020" } : undefined}>
              {data ? data.overdue.length : "—"}
            </div>
            <div className="adm-stat-sub">con fecha pasada y sin publicar</div>
          </div>
          <div className="adm-stat-card">
            <div className="adm-stat-label">Publicadas</div>
            <div className="adm-stat-value">{data ? data.publishedLast30 : "—"}</div>
            <div className="adm-stat-sub">en los últimos 30 días</div>
          </div>
          <div className="adm-stat-card">
            <div className="adm-stat-label">Ideas</div>
            <div className="adm-stat-value">{data ? data.ideasCount : "—"}</div>
            <div className="adm-stat-sub">en el banco</div>
          </div>
        </div>

        <div className="adm-dash-row adm-dash-row-main">
          <section className="adm-card">
            <div className="adm-card-head">
              <h2 className="adm-card-title">Próximas piezas</h2>
              <Link href={`${BASE}/calendario?vista=semana`} className="adm-card-link">
                Ver calendario →
              </Link>
            </div>
            {data ? (
              <PieceList pieces={data.upcoming} pillarsById={pillarsById} empty="No hay nada en el calendario de hoy en adelante. Pasá una idea o generá una serie." />
            ) : (
              <div className="adm-skel" style={{ height: 180 }} />
            )}
          </section>

          <section className="adm-card">
            <div className="adm-card-head">
              <h2 className="adm-card-title">Balance de pilares</h2>
              <Link href={`${BASE}/calendario?vista=pilares`} className="adm-card-link">
                Pilares →
              </Link>
            </div>
            {data ? <PillarBalance balance={data.balance} compact /> : <div className="adm-skel" style={{ height: 180 }} />}
          </section>
        </div>

        <div className="adm-dash-row adm-dash-row-main">
          <section className="adm-card">
            <div className="adm-card-head">
              <h2 className="adm-card-title">Atrasadas</h2>
              <span className="adm-card-hint">publicalas, cambiales la fecha o descartalas</span>
            </div>
            {data ? (
              <PieceList pieces={data.overdue.slice(0, 8)} pillarsById={pillarsById} empty="Nada atrasado. ✦" late />
            ) : (
              <div className="adm-skel" style={{ height: 120 }} />
            )}
          </section>

          <section className="adm-card">
            <div className="adm-card-head">
              <h2 className="adm-card-title">Últimas ideas</h2>
              <Link href={`${BASE}/ideas`} className="adm-card-link">
                Banco de ideas →
              </Link>
            </div>
            {data ? (
              data.ideas.length ? (
                <ul className="mk-cal-sum-list">
                  {data.ideas.map((i) => (
                    <li key={i.id} className="mk-cal-sum-item">
                      <span className="mk-cal-sum-bar" style={{ background: pillarsById[i.pillar_id]?.color || FALLBACK_COLOR }} />
                      <Link href={`${BASE}/ideas`} className="mk-cal-sum-title" title={i.title}>
                        {i.title}
                      </Link>
                      {i.score ? <span className="mk-cal-dot-label">{"★".repeat(i.score)}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="adm-card-note">Todavía no anotaste ideas.</p>
              )
            ) : (
              <div className="adm-skel" style={{ height: 120 }} />
            )}
          </section>
        </div>

        <h2 className="adm-section-title">Áreas</h2>
        <div className="adm-quick-grid">
          {AREAS.map((a) => (
            <Link key={a.href} href={a.href} className="adm-quick-card">
              <span className="adm-quick-icon">{a.icon}</span>
              <span className="adm-quick-label">{a.label}</span>
              <span className="adm-quick-desc">{a.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
