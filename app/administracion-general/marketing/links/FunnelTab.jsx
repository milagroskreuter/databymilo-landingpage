"use client";
import { useEffect, useState } from "react";
import { api, fmt, netColor, netLabel, PERIODS } from "./util";
import { bucketize, MultiLine } from "./charts";

function Tag({ kind }) {
  return kind === "direct" ? (
    <span className="mk-links-a-tag is-direct" title="Se sabe exactamente de dónde vino">
      directo
    </span>
  ) : kind === "mixed" ? (
    <span className="mk-links-a-tag is-mixed" title="Una parte es directa y otra estimada">
      directo + estimado
    </span>
  ) : (
    <span className="mk-links-a-tag is-est" title="Repartido según las visitas por red: es una aproximación">
      estimado
    </span>
  );
}

const SERIES = [
  { key: "clicks", label: "Clicks", color: "#d4447a" },
  { key: "visits", label: "Visitas", color: "#b797cf" },
  { key: "subs", label: "Suscriptoras", color: "#d99a3e" },
  { key: "sales", label: "Ventas", color: "#17663e" },
];

function money(revenue) {
  const parts = Object.entries(revenue || {}).map(
    ([cur, v]) => `${cur} ${Number(v).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`
  );
  return parts.length ? parts.join(" · ") : "";
}

function rate(a, b) {
  if (!a || b == null) return null;
  return `${((b / a) * 100).toFixed(b / a < 0.1 ? 1 : 0)}%`;
}

export default function FunnelTab() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setData(null);
    setError("");
    api(`/funnel?days=${days}`)
      .then((d) => alive && setData(d))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [days]);

  const t = data?.totals;
  const steps = t
    ? [
        { label: "Publicaciones", value: t.publications, sub: "marcadas como publicadas", kind: "direct" },
        { label: "Clicks en tus links", value: t.clicks, sub: "links cortos y /links, sin bots", kind: "direct" },
        {
          label: "Visitas al sitio",
          value: t.visits,
          sub: t.visits == null ? "falta conectar Vercel Analytics" : `${fmt(t.visits_social)} llegaron desde redes`,
          kind: "est",
        },
        { label: "Suscriptoras nuevas", value: t.subs, sub: "personas únicas en tus listas", kind: "est" },
        {
          label: "Ventas",
          value: t.sales,
          sub: `${money(t.revenue) || "sin ventas"}${t.sales ? ` · ${t.sales_attributed} con link atribuido` : ""}`,
          kind: t.sales_attributed ? "mixed" : "est",
        },
      ]
    : [];

  return (
    <>
      <div className="mk-links-a-filters">
        <div className="mk-links-a-seg">
          {PERIODS.map((p) => (
            <button key={p.days} type="button" className={days === p.days ? "is-active" : ""} onClick={() => setDays(p.days)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="adm-alert adm-alert-info" style={{ marginBottom: 16, lineHeight: 1.6 }}>
        <Tag kind="direct" /> se sabe exactamente de dónde vino (clicks en tus links; ventas que entraron por un link corto
        a Hotmart). <Tag kind="est" /> es una aproximación: las visitas por red salen del referer que informa Vercel, y las
        suscriptoras y ventas sin link se reparten entre redes según esas visitas.
      </div>

      {error && <div className="adm-alert adm-alert-error">{error}</div>}
      {!data && !error && <div className="adm-skel" style={{ height: 300 }} />}

      {data && (
        <>
          {data.warnings?.length > 0 && (
            <div className="adm-alert adm-alert-error" style={{ marginBottom: 16 }}>
              Algunos datos no se pudieron leer: {data.warnings.join(" · ")}
            </div>
          )}

          <div className="mk-links-a-funnel">
            {steps.map((s, i) => (
              <div key={s.label} className="mk-links-a-step">
                <div className="mk-links-a-step-head">
                  <span className="adm-stat-label">{s.label}</span>
                  <Tag kind={s.kind} />
                </div>
                <div className="mk-links-a-step-value">{fmt(s.value)}</div>
                <div className="mk-links-a-muted">{s.sub}</div>
                {i > 1 && rate(steps[i - 1].value, s.value) && (
                  <div className="mk-links-a-rate">
                    {rate(steps[i - 1].value, s.value)} del paso anterior
                  </div>
                )}
              </div>
            ))}
          </div>

          <section className="adm-card" style={{ marginBottom: 16 }}>
            <div className="mk-links-a-card-head">
              <div className="adm-section-title" style={{ margin: 0 }}>
                Cómo se mueve cada paso
              </div>
              <div className="adm-legend">
                {SERIES.map((s) => (
                  <span key={s.key} className="adm-legend-item">
                    <span className="adm-legend-swatch" style={{ background: s.color }} />
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
            <MultiLine rows={bucketize(data.byDay, ["clicks", "visits", "subs", "sales"])} series={SERIES} />
            <p className="mk-links-a-muted">Cada línea usa su propia escala: sirve para ver si suben y bajan juntas.</p>
          </section>

          <section className="adm-card" style={{ marginBottom: 16 }}>
            <div className="adm-section-title" style={{ marginTop: 0 }}>
              Por red
            </div>
            <div className="adm-table-wrap">
              <table className="adm-table mk-links-a-table">
                <thead>
                  <tr>
                    <th>Red</th>
                    <th style={{ textAlign: "right" }}>
                      Publicaciones <Tag kind="direct" />
                    </th>
                    <th style={{ textAlign: "right" }}>
                      Clicks <Tag kind="direct" />
                    </th>
                    <th style={{ textAlign: "right" }}>
                      Visitas <Tag kind="est" />
                    </th>
                    <th style={{ textAlign: "right" }}>
                      Suscriptoras <Tag kind="est" />
                    </th>
                    <th style={{ textAlign: "right" }}>
                      Ventas <Tag kind="direct" />
                    </th>
                    <th style={{ textAlign: "right" }}>
                      + ventas <Tag kind="est" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.byNetwork.map((r) => (
                    <tr key={r.network}>
                      <td>
                        <span className="mk-links-a-net">
                          <i style={{ background: netColor(r.network === "sin-red" ? null : r.network) }} />
                          {netLabel(r.network === "sin-red" ? null : r.network)}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>{fmt(r.publications)}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(r.clicks)}</td>
                      <td style={{ textAlign: "right" }}>{fmt(r.visits_est)}</td>
                      <td style={{ textAlign: "right" }}>{r.subs_est == null ? "—" : `≈ ${fmt(r.subs_est)}`}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(r.sales_direct)}</td>
                      <td style={{ textAlign: "right" }}>{r.sales_est == null ? "—" : `≈ ${fmt(r.sales_est)}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.utmBySource && (
              <p className="mk-links-a-muted" style={{ marginTop: 10 }}>
                Visitas con UTM (Vercel):{" "}
                {data.utmBySource.map((u) => `${netLabel(u.source)} ${fmt(u.count)}`).join(" · ")}
              </p>
            )}
          </section>

          <div className="mk-links-a-grid2 mk-links-a-grid2-cards">
            <section className="adm-card">
              <div className="adm-section-title" style={{ marginTop: 0 }}>
                Por link
              </div>
              {data.byLink.length === 0 ? (
                <p className="mk-links-a-muted">Sin clicks en este período.</p>
              ) : (
                <div className="adm-table-wrap">
                  <table className="adm-table mk-links-a-table">
                    <thead>
                      <tr>
                        <th>Link</th>
                        <th style={{ textAlign: "right" }}>Clicks</th>
                        <th style={{ textAlign: "right" }}>Altas en su lista</th>
                        <th style={{ textAlign: "right" }}>Ventas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byLink.slice(0, 15).map((l) => (
                        <tr key={l.slug}>
                          <td>
                            <div className="mk-links-a-cell-title">{l.title}</div>
                            <div className="mk-links-a-muted">
                              /go/{l.slug}
                              {l.target ? ` → ${l.target}` : ""}
                            </div>
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(l.clicks)}</td>
                          <td style={{ textAlign: "right" }} title="Altas nuevas en la lista del link en el período (pueden venir también de otros lados)">
                            {l.list_subs == null ? "—" : `${fmt(l.list_subs)} ${rate(l.clicks, l.list_subs) ? `(${rate(l.clicks, l.list_subs)})` : ""}`}
                          </td>
                          <td style={{ textAlign: "right" }}>{l.sales_direct ? fmt(l.sales_direct) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mk-links-a-muted" style={{ marginTop: 8 }}>
                Las ventas se atribuyen solas cuando el link va directo al pago de Hotmart. Las altas de la lista son del
                período completo: pueden incluir gente que llegó por otro lado.
              </p>
            </section>
            <section className="adm-card">
              <div className="adm-section-title" style={{ marginTop: 0 }}>
                Suscriptoras nuevas por lista
              </div>
              {data.subsByList.length === 0 ? (
                <p className="mk-links-a-muted">Sin altas en este período.</p>
              ) : (
                <ul className="mk-links-a-plain">
                  {data.subsByList.map((s) => (
                    <li key={s.slug}>
                      <span>{s.name}</span>
                      <strong>{fmt(s.count)}</strong>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mk-links-a-muted" style={{ marginTop: 8 }}>
                Una persona en dos listas suma en cada lista, pero una sola vez en el total del embudo.
              </p>
            </section>
          </div>
        </>
      )}
    </>
  );
}
