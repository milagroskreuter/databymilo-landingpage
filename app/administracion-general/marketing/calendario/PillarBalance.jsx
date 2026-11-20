"use client";
// Gráfico de balance de pilares: % real (barra) contra % objetivo (marca).
// Recibe el resultado de pillarBalance() de lib/marketing/content/pillars.

export default function PillarBalance({ balance, compact = false }) {
  if (!balance) return null;
  const { rows, total, withoutPillar, salesOver, sales } = balance;
  const max = Math.max(100, ...rows.map((r) => Math.max(r.pct, r.target || 0)));
  const scale = (v) => `${(v / max) * 100}%`;

  return (
    <div className={`mk-cal-balance${compact ? " is-compact" : ""}`}>
      {salesOver && (
        <div className="mk-cal-warn" role="status">
          <strong>Venta está en {sales.pct}%</strong>, por encima de su objetivo de {sales.target}%. Sumá piezas educativas o de comunidad antes de
          vender de nuevo.
        </div>
      )}
      {!total ? (
        <p className="adm-card-note">Todavía no hay piezas con fecha en los últimos 30 días ni próximas.</p>
      ) : (
        <ul className="mk-cal-balance-list">
          {rows.map((r) => {
            const off = r.target != null && Math.abs(r.diff) >= 10;
            return (
              <li key={r.id}>
                <div className="mk-cal-balance-label">
                  <span className="mk-cal-dot-label">
                    <i style={{ background: r.color }} />
                    {r.name}
                  </span>
                  <span className={`mk-cal-balance-num${off ? " is-off" : ""}`}>
                    {r.pct}%{r.target != null && <span className="mk-cal-balance-target"> / obj. {r.target}%</span>}
                  </span>
                </div>
                <div className="mk-cal-balance-track" aria-hidden="true">
                  <div className="mk-cal-balance-bar" style={{ width: scale(r.pct), background: r.color }} />
                  {r.target != null && <div className="mk-cal-balance-mark" style={{ left: scale(r.target) }} />}
                </div>
                <span className="mk-cal-sr">
                  {r.name}: {r.count} piezas, {r.pct}% real{r.target != null ? `, objetivo ${r.target}%` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {total > 0 && (
        <p className="mk-cal-balance-foot">
          {total} piezas (últimos 30 días + próximas)
          {withoutPillar ? ` · ${withoutPillar} sin pilar, no cuentan en el %` : ""}. La línea marca el objetivo.
        </p>
      )}
    </div>
  );
}
