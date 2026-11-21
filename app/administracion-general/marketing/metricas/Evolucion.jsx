"use client";
import { useEffect, useMemo, useState } from "react";
import { networkLabel } from "@/lib/marketing/constants";
import { nf, signed, dayLabel, netColor, periodStart, DAY_MS } from "./fmt";
import { LineChart, Legend } from "./charts";
import { snapshotsByNetwork, followerChange } from "./Resumen";

const monthKey = (day) => day.slice(0, 7);
const monthName = (ym) => new Date(`${ym}-15T12:00:00Z`).toLocaleDateString("es-AR", { month: "long", timeZone: "UTC" });

function GoalEditor({ network, month, goal, onSave, busy }) {
  const [val, setVal] = useState(goal ?? "");
  useEffect(() => setVal(goal ?? ""), [goal]);
  const changed = String(val) !== String(goal ?? "");
  return (
    <form
      className="mk-metricas-goal-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(network, month, val === "" ? 0 : Number(val));
      }}
    >
      <label>
        Meta de {monthName(month)}
        <input className="adm-input" type="number" min="0" inputMode="numeric" placeholder="Sin meta" value={val} onChange={(e) => setVal(e.target.value)} />
      </label>
      {changed && (
        <button className="adm-btn adm-btn-sm adm-btn-primary" disabled={busy}>
          Guardar
        </button>
      )}
    </form>
  );
}

export default function Evolucion({ data, nets, days, busy, onSaveGoal }) {
  const [mode, setMode] = useState("growth"); // growth | each
  const snaps = useMemo(() => snapshotsByNetwork(data), [data]);
  const today = data.today;
  const since = periodStart(today, days);
  const month = monthKey(today);

  const goals = useMemo(() => {
    const m = {};
    for (const g of data.goals) m[`${g.network}|${g.month.slice(0, 7)}`] = g.target_followers;
    return m;
  }, [data.goals]);

  const active = nets.filter((n) => snaps[n]?.length);
  const inPeriod = (n) => snaps[n].filter((s) => s.day >= since);
  const withHistory = active.filter((n) => inPeriod(n).length >= 2);

  const growthSeries = withHistory.map((n) => {
    const pts = inPeriod(n);
    const v0 = pts[0].followers || 1;
    return { key: n, label: networkLabel(n), color: netColor(n), points: pts.map((s) => ({ day: s.day, v: ((s.followers - pts[0].followers) / v0) * 100 })) };
  });

  const lastDayOfMonth = new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7), 0)).getUTCDate();
  const remainingDays = Math.max(1, lastDayOfMonth - Number(today.slice(8, 10)) + 1);

  return (
    <section className="adm-card mk-metricas-section">
      <div className="mk-metricas-section-head">
        <div>
          <h2 className="adm-card-title">Cómo crecen tus seguidores</h2>
          <p className="mk-metricas-sub">Guardamos un dato por día por red. El gráfico se va armando solo.</p>
        </div>
        <div className="mk-metricas-seg">
          <button className={mode === "growth" ? "on" : ""} onClick={() => setMode("growth")}>Comparar crecimiento</button>
          <button className={mode === "each" ? "on" : ""} onClick={() => setMode("each")}>Cada red por separado</button>
        </div>
      </div>

      {!active.length ? (
        <p className="mk-metricas-muted">Cuando conectes una red o cargues LinkedIn, acá vas a ver cuántos seguidores tenés y cómo cambian.</p>
      ) : mode === "growth" ? (
        <>
          {growthSeries.length ? (
            <>
              <p className="mk-metricas-cmp-hint">
                Cada línea muestra cuánto creció esa red <strong>en porcentaje</strong> desde el inicio del período. Así se pueden comparar redes de distinto
                tamaño: una con 70 seguidores y otra con 1.600 en la misma escala.
              </p>
              <Legend items={growthSeries} />
              <LineChart series={growthSeries} format={(v) => `${nf(v, Math.abs(v) < 10 && v % 1 ? 1 : 0)}%`} yLabel="Crecimiento de seguidores en porcentaje desde el inicio del período" />
            </>
          ) : (
            <div className="mk-metricas-empty">
              <strong>Todavía no hay dos días de datos para dibujar una línea.</strong>
              <span>
                Hoy tenemos un solo dato por red. Desde mañana el gráfico empieza a mostrarse.{" "}
                {active.includes("linkedin") && "Para LinkedIn podés acelerarlo cargando a mano los seguidores de semanas anteriores (con “Cargar a mano” en la tarjeta de LinkedIn, arriba, eligiendo la fecha)."}
              </span>
            </div>
          )}
          {active.length > withHistory.length && withHistory.length > 0 && (
            <p className="mk-metricas-note">
              Sin historial todavía: {active.filter((n) => !withHistory.includes(n)).map(networkLabel).join(", ")}.
            </p>
          )}
        </>
      ) : (
        <div className="mk-metricas-follow-grid">
          {active.map((n) => {
            const all = snaps[n];
            const pts = inPeriod(n);
            const last = all[all.length - 1];
            const ch = followerChange(all, today, days);
            const monthStart = [...all].reverse().find((s) => s.day < `${month}-01`) || all.find((s) => monthKey(s.day) === month);
            const goal = goals[`${n}|${month}`];
            const pct = goal && last ? Math.min(100, Math.round((last.followers / goal) * 100)) : null;
            const missing = goal && last ? goal - last.followers : null;
            return (
              <div key={n} className="mk-metricas-follow" style={{ "--net": netColor(n) }}>
                <div className="mk-metricas-follow-head">
                  <span className="mk-metricas-dot" />
                  <span className="mk-metricas-follow-name">{networkLabel(n)}</span>
                  <span className="mk-metricas-follow-value">{nf(last.followers)}</span>
                </div>
                <div className="mk-metricas-follow-sub">
                  {ch ? <span>{signed(ch.delta)} en {days === 365 ? "el año" : `${days} días`}</span> : <span>Dato del {dayLabel(last.day)}</span>}
                  {monthStart && monthStart.day !== last.day && <span> · {signed(last.followers - monthStart.followers)} este mes</span>}
                </div>
                {pts.length >= 2 ? (
                  <LineChart series={[{ key: n, label: networkLabel(n), color: netColor(n), points: pts.map((s) => ({ day: s.day, v: s.followers })) }]} height={150} yLabel={`Seguidores de ${networkLabel(n)}`} />
                ) : (
                  <p className="mk-metricas-muted">Un solo dato por ahora. La línea aparece desde el segundo día.</p>
                )}
                <div className="mk-metricas-goal">
                  <GoalEditor network={n} month={month} goal={goal} onSave={onSaveGoal} busy={busy} />
                  {pct != null && (
                    <div className="mk-metricas-goal-progress">
                      <div className="mk-metricas-bar">
                        <span style={{ width: `${pct}%` }} />
                      </div>
                      <span className="mk-metricas-muted">
                        {missing > 0 ? `Faltan ${nf(missing)} (≈ ${nf(Math.ceil(missing / remainingDays))} por día)` : "¡Meta cumplida!"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export { DAY_MS };
