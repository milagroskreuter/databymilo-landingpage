"use client";
import { useEffect, useState } from "react";
import { api, fmt, netColor, netLabel, PERIODS } from "./util";
import { bucketize, RankList, StackedBars } from "./charts";

const DEVICE_LABEL = { mobile: "Celular", desktop: "Compu", tablet: "Tablet" };
const VIA_LABEL = { bio: "Desde /links", direct: "Link corto directo" };

export default function StatsTab({ links, linkFilter, onClearFilter, onPickLink }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setData(null);
    setError("");
    const qs = new URLSearchParams({ days: String(days) });
    if (linkFilter?.id) qs.set("link", linkFilter.id);
    api(`/stats?${qs}`)
      .then((d) => alive && setData(d))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [days, linkFilter]);

  const order = data ? data.byNetwork.map((n) => n.key || "sin-red") : [];
  const rows = data ? bucketize(data.byDay, ["networks"]) : [];

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
        <select
          className="adm-input"
          value={linkFilter?.id || ""}
          onChange={(e) => {
            const l = links.find((x) => x.id === e.target.value);
            if (l) onPickLink(l);
            else onClearFilter();
          }}
        >
          <option value="">Todos los links</option>
          {links.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title} (/go/{l.slug})
            </option>
          ))}
        </select>
      </div>

      {error && <div className="adm-alert adm-alert-error">{error}</div>}
      {!data && !error && <div className="adm-skel" style={{ height: 260 }} />}

      {data && (
        <>
          <div className="adm-stats-grid mk-links-a-kpis">
            <div className="adm-stat-card">
              <div className="adm-stat-label">Clicks</div>
              <div className="adm-stat-value">{fmt(data.total)}</div>
              <div className="adm-stat-sub">últimos {data.days} días</div>
            </div>
            <div className="adm-stat-card">
              <div className="adm-stat-label">Personas</div>
              <div className="adm-stat-value">{fmt(data.unique)}</div>
              <div className="adm-stat-sub">únicas por día</div>
            </div>
            <div className="adm-stat-card">
              <div className="adm-stat-label">Red principal</div>
              <div className="adm-stat-value" style={{ fontSize: 22 }}>
                {data.byNetwork[0] ? netLabel(data.byNetwork[0].key) : "—"}
              </div>
              <div className="adm-stat-sub">
                {data.byNetwork[0] && data.total ? `${Math.round((data.byNetwork[0].count / data.total) * 100)}% de los clicks` : ""}
              </div>
            </div>
            <div className="adm-stat-card">
              <div className="adm-stat-label">Bots descartados</div>
              <div className="adm-stat-value">{fmt(data.bots)}</div>
              <div className="adm-stat-sub">vistas previas de redes, crawlers</div>
            </div>
          </div>

          <section className="adm-card" style={{ marginBottom: 16 }}>
            <div className="mk-links-a-card-head">
              <div className="adm-section-title" style={{ margin: 0 }}>
                Clicks en el tiempo {linkFilter ? `· ${linkFilter.title}` : ""}
              </div>
              <div className="adm-legend">
                {order.map((n) => (
                  <span key={n} className="adm-legend-item">
                    <span className="adm-legend-swatch" style={{ background: netColor(n === "sin-red" ? null : n) }} />
                    {netLabel(n === "sin-red" ? null : n)}
                  </span>
                ))}
              </div>
            </div>
            {data.total === 0 ? (
              <p className="mk-links-a-muted">Todavía no hay clicks en este período.</p>
            ) : (
              <StackedBars
                rows={rows}
                order={order}
                colorOf={(n) => netColor(n === "sin-red" ? null : n)}
                labelOf={(n) => netLabel(n === "sin-red" ? null : n)}
              />
            )}
          </section>

          <div className="mk-links-a-grid3">
            {!linkFilter && (
              <section className="adm-card">
                <div className="adm-section-title" style={{ marginTop: 0 }}>
                  Top links
                </div>
                <RankList
                  items={data.byLink.slice(0, 10).map((l) => ({
                    key: l.link_id || l.slug,
                    label: l.title,
                    value: l.clicks,
                    sub: `· ${l.unique} pers.`,
                    link: l,
                  }))}
                  onPick={(it) => {
                    const l = links.find((x) => x.id === it.link.link_id);
                    if (l) onPickLink(l);
                  }}
                />
              </section>
            )}
            <section className="adm-card">
              <div className="adm-section-title" style={{ marginTop: 0 }}>
                Por red
              </div>
              <RankList
                items={data.byNetwork.map((n) => ({ key: n.key, label: netLabel(n.key), value: n.count, color: netColor(n.key) }))}
              />
            </section>
            <section className="adm-card">
              <div className="adm-section-title" style={{ marginTop: 0 }}>
                Por campaña
              </div>
              <RankList items={data.byCampaign.map((n) => ({ key: n.key, label: n.key || "Sin campaña", value: n.count }))} />
            </section>
            <section className="adm-card">
              <div className="adm-section-title" style={{ marginTop: 0 }}>
                Dispositivo y origen
              </div>
              <RankList items={data.byDevice.map((n) => ({ key: n.key, label: DEVICE_LABEL[n.key] || n.key || "—", value: n.count }))} />
              <div style={{ height: 12 }} />
              <RankList
                items={data.byVia.map((n) => ({ key: n.key, label: VIA_LABEL[n.key] || n.key, value: n.count, color: "var(--adm-primary)" }))}
              />
            </section>
            <section className="adm-card">
              <div className="adm-section-title" style={{ marginTop: 0 }}>
                Países
              </div>
              <RankList items={data.byCountry.map((n) => ({ key: n.key, label: n.key || "Sin dato", value: n.count }))} />
            </section>
          </div>
        </>
      )}
    </>
  );
}
