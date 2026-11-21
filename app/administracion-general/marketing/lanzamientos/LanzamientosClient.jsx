"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { addDays, daysUntil, formatDate, relativeDays, todayAR } from "@/lib/marketing/launches/dates";
import { effectiveDates } from "@/lib/marketing/launches/schedule";
import { BASE, KindDot, Progress, StatusBadge, Tabs, api } from "./ui";
import { LaunchFormModal, PlanKeyDateModal } from "./forms";

// Texto de cuenta regresiva según en qué etapa está el lanzamiento.
export function countdown(launch, today = todayAR()) {
  const { launchOn, endsOn } = effectiveDates(launch);
  if (!launchOn) return { big: "—", sub: "sin fecha" };
  if (launch.status === "canceled") return { big: "—", sub: "cancelado" };
  const toOpen = daysUntil(launchOn, today);
  if (toOpen > 0) return { big: toOpen, sub: toOpen === 1 ? "día para abrir" : "días para abrir" };
  if (toOpen === 0) return { big: "Hoy", sub: "abre hoy" };
  const toClose = daysUntil(endsOn, today);
  if (toClose > 0) return { big: toClose, sub: toClose === 1 ? "día para cerrar" : "días para cerrar" };
  if (toClose === 0) return { big: "Hoy", sub: "cierra hoy" };
  return { big: "✓", sub: `cerró ${relativeDays(toClose)}` };
}

export default function LanzamientosClient() {
  const [data, setData] = useState(null);
  const [keydates, setKeydates] = useState(null);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [planning, setPlanning] = useState(null);

  async function load() {
    try {
      const today = todayAR();
      const [l, k] = await Promise.all([
        api(""),
        api(`/keydates?from=${today}&to=${addDays(today, 150)}`),
      ]);
      setData(l);
      setKeydates(k.keydates);
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => { load(); }, []);

  const today = todayAR();
  const launches = data?.launches || [];
  const current = launches.filter((l) => l.status === "planning" || l.status === "active");
  const past = launches.filter((l) => l.status === "done" || l.status === "canceled");
  // Próximos primero (por fecha de apertura ascendente).
  current.sort((a, b) => (a.launch_on || "9999").localeCompare(b.launch_on || "9999"));

  return (
    <>
      <div className="adm-header">
        <div>
          <h1>Lanzamientos</h1>
        </div>
        <button className="adm-btn adm-btn-primary" onClick={() => setCreating(true)} disabled={!data}>
          + Nuevo lanzamiento
        </button>
      </div>

      <div className="adm-content">
        <Tabs />
        {error && <div className="adm-alert adm-alert-error">{error}</div>}

        <div className="mk-lanzamientos-grid">
          <div className="adm-card">
            <div className="adm-card-head">
              <span className="adm-card-title">En marcha</span>
              <span className="adm-card-hint">{current.length ? `${current.length} lanzamiento${current.length > 1 ? "s" : ""}` : ""}</span>
            </div>
            {!data ? (
              <div className="adm-skel" style={{ height: 120 }} />
            ) : current.length === 0 ? (
              <div className="adm-empty" style={{ padding: "30px 10px" }}>
                <p>No tenés lanzamientos en marcha.</p>
                <p style={{ marginTop: 6 }}>Creá uno o planificá alguna de las próximas fechas clave.</p>
              </div>
            ) : (
              <LaunchList launches={current} resources={data.resources} today={today} />
            )}

            {past.length > 0 && (
              <>
                <div className="adm-mini-label" style={{ marginTop: 24 }}>Anteriores</div>
                <LaunchList launches={past} resources={data.resources} today={today} />
              </>
            )}
          </div>

          <div className="adm-card">
            <div className="adm-card-head">
              <span className="adm-card-title">Próximas fechas clave</span>
              <Link href={`${BASE}/fechas`} className="adm-card-link">Ver todas →</Link>
            </div>
            {!keydates ? (
              <div className="adm-skel" style={{ height: 200 }} />
            ) : keydates.length === 0 ? (
              <p className="adm-card-note">No hay fechas en los próximos meses. Sumalas en Fechas clave.</p>
            ) : (
              <div className="mk-lanzamientos-kd">
                {keydates.slice(0, 10).map((k) => (
                  <KeyDateRow key={k.id} k={k} onPlan={() => setPlanning(k)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {creating && <LaunchFormModal resources={data.resources} onClose={() => setCreating(false)} />}
      {planning && (
        <PlanKeyDateModal keydate={planning} resources={data?.resources || []} onClose={() => setPlanning(null)} onDone={load} />
      )}
    </>
  );
}

function LaunchList({ launches, resources, today }) {
  const titleOf = (slug) => resources.find((r) => r.slug === slug)?.title || slug;
  return (
    <div className="mk-lanzamientos-list">
      {launches.map((l) => {
        const c = countdown(l, today);
        return (
          <Link key={l.id} href={`${BASE}/${l.id}`} className="mk-lanzamientos-item">
            <div>
              <div className="mk-lanzamientos-item-name">{l.name}</div>
              <div className="mk-lanzamientos-item-meta">
                <StatusBadge status={l.status} />
                {l.resource_slug && <span>📘 {titleOf(l.resource_slug)}</span>}
                {l.launch_on && (
                  <span>
                    Abre {formatDate(l.launch_on, { weekday: true })}
                    {l.ends_on && ` · cierra ${formatDate(l.ends_on)}`}
                  </span>
                )}
                {l.stats.pieces > 0 && <span>{l.stats.pieces} piezas</span>}
              </div>
            </div>
            <div className="mk-lanzamientos-item-side">
              <div className="mk-lanzamientos-count">{c.big}</div>
              <div className="mk-lanzamientos-count-sub">{c.sub}</div>
            </div>
            {l.stats.tasks > 0 && (
              <div className="mk-lanzamientos-item-foot">
                <Progress done={l.stats.done} total={l.stats.tasks} />
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export function KeyDateRow({ k, onPlan }) {
  const inProgress = k.days_left < 0;
  const isToday = k.days_left === 0;
  return (
    <div className="mk-lanzamientos-kd-row">
      <div className="mk-lanzamientos-kd-days">
        <b>{inProgress || isToday ? "●" : k.days_left}</b>
        <small>{inProgress ? "en curso" : isToday ? "hoy" : k.days_left === 1 ? "día" : "días"}</small>
      </div>
      <div>
        <div className="mk-lanzamientos-kd-name">{k.name}</div>
        <div className="mk-lanzamientos-kd-meta">
          <KindDot kind={k.kind} />
          <span>
            {formatDate(k.starts_on, { weekday: true })}
            {k.ends_on && k.ends_on !== k.starts_on && ` al ${formatDate(k.ends_on)}`}
          </span>
          <span>{k.region}</span>
          {k.approximate && <span className="mk-lanzamientos-approx">aprox.</span>}
          {k.launches?.map((l) => (
            <Link key={l.id} href={`${BASE}/${l.id}`} className="mk-lanzamientos-chip">➶ {l.name}</Link>
          ))}
        </div>
      </div>
      <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={onPlan}>Planificar</button>
    </div>
  );
}
