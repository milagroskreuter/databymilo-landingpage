"use client";
import { useMemo } from "react";
import { networkLabel } from "@/lib/marketing/constants";
import { nf, compact, signed, netColor, periodStart, DAY_MS } from "./fmt";
import { HBars, Legend, Sparkline } from "./charts";

// ─── Cálculos compartidos ───────────────────────────────────────────────────

/** Snapshots ordenados por red: { instagram: [{day, followers}], ... } */
export function snapshotsByNetwork(data) {
  const m = {};
  for (const s of data.snapshots) (m[s.network] ||= []).push(s);
  for (const k of Object.keys(m)) m[k].sort((a, b) => (a.day < b.day ? -1 : 1));
  return m;
}

/** Cambio de seguidores en el período: último valor menos el valor al inicio (o el primer dato disponible). */
export function followerChange(list, today, days) {
  if (!list?.length) return null;
  const last = list[list.length - 1];
  const since = periodStart(today, days);
  const before = [...list].reverse().find((s) => s.day <= since);
  const base = before || list.find((s) => s.day > since);
  if (!base || base.day === last.day) return null;
  return { delta: last.followers - base.followers, from: base.followers, fromDay: base.day };
}

const sum = (arr) => arr.reduce((a, v) => a + (v || 0), 0);

function rateOf(posts) {
  const withBoth = posts.filter((p) => p._audience && p._interactions != null);
  const aud = sum(withBoth.map((p) => p._audience));
  return aud ? (sum(withBoth.map((p) => p._interactions)) / aud) * 100 : null;
}

function Delta({ now, before, unit = "", unitFmt = nf, label }) {
  if (before == null || before === 0 || now == null) {
    return <span className="mk-metricas-delta flat">Sin período anterior para comparar</span>;
  }
  const diff = now - before;
  const pct = (diff / before) * 100;
  const dir = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  const arrow = diff > 0 ? "▲" : diff < 0 ? "▼" : "■";
  return (
    <span className={`mk-metricas-delta ${dir}`}>
      <span aria-hidden="true">{arrow}</span> {signed(diff)}
      {unit}{before >= 10 && ` (${signed(pct, 0)}%)`} <span className="mk-metricas-delta-ref">{label}</span>
    </span>
  );
}

function Tile({ label, hint, value, children, spark, sparkColor }) {
  return (
    <div className="mk-metricas-tile">
      <div className="mk-metricas-tile-label" title={hint}>{label}</div>
      <div className="mk-metricas-tile-main">
        <div className="mk-metricas-tile-value">{value}</div>
        {spark && <Sparkline points={spark} color={sparkColor} />}
      </div>
      <div className="mk-metricas-tile-sub">{children}</div>
    </div>
  );
}

// ─── Tarjetas de resumen ────────────────────────────────────────────────────
export function ResumenTiles({ data, nets, posts, prevPosts, days }) {
  const snaps = useMemo(() => snapshotsByNetwork(data), [data]);
  const withFollowers = nets.filter((n) => snaps[n]?.length);

  const total = sum(withFollowers.map((n) => snaps[n][snaps[n].length - 1].followers));
  const changes = withFollowers.map((n) => followerChange(snaps[n], data.today, days)).filter(Boolean);
  const delta = changes.length ? sum(changes.map((c) => c.delta)) : null;
  const base = changes.length ? sum(changes.map((c) => c.from)) : null;

  // Serie combinada: suma de los últimos valores conocidos por día (sólo si hay historial)
  const spark = useMemo(() => {
    const since = periodStart(data.today, days);
    const allDays = [...new Set(withFollowers.flatMap((n) => snaps[n].filter((s) => s.day >= since).map((s) => s.day)))].sort();
    if (allDays.length < 2) return null;
    return allDays.map((day) => ({
      day,
      v: sum(
        withFollowers.map((n) => {
          const upto = snaps[n].filter((s) => s.day <= day);
          return upto.length ? upto[upto.length - 1].followers : 0;
        })
      ),
    }));
  }, [data.today, days, snaps, withFollowers]);

  const audienceNow = sum(posts.map((p) => p._audience));
  const audiencePrev = sum(prevPosts.map((p) => p._audience));
  const interNow = sum(posts.map((p) => p._interactions));
  const interPrev = sum(prevPosts.map((p) => p._interactions));
  const rate = rateOf(posts);
  const ref = `vs. ${days === 365 ? "el año" : `los ${days} días`} anteriores`;

  return (
    <div className="mk-metricas-tiles">
      <Tile
        label="Seguidores"
        hint="Suma de los seguidores de las redes elegidas"
        value={withFollowers.length ? nf(total) : "—"}
        spark={spark}
        sparkColor="#8b1a4a"
      >
        {delta != null ? (
          <Delta now={total} before={base} label={`en ${days === 365 ? "el año" : `${days} días`}`} />
        ) : (
          <span className="mk-metricas-delta flat">El cambio aparece desde el segundo día de datos</span>
        )}
        <span className="mk-metricas-breakdown">
          {withFollowers.map((n) => (
            <span key={n}>
              <i style={{ background: netColor(n) }} />
              {networkLabel(n)} {nf(snaps[n][snaps[n].length - 1].followers)}
            </span>
          ))}
        </span>
      </Tile>

      <Tile label="Publicaciones" hint="Cantidad de publicaciones con métricas en el período" value={nf(posts.length)}>
        <Delta now={posts.length} before={prevPosts.length} label={ref} />
      </Tile>

      <Tile
        label="Alcance sumado"
        hint="Suma de las personas que vieron cada publicación (alcance, vistas o impresiones según la red). Una misma persona puede contarse más de una vez."
        value={posts.length ? compact(audienceNow) : "—"}
      >
        <Delta now={audienceNow} before={audiencePrev} label={ref} />
      </Tile>

      <Tile
        label="Interacciones"
        hint="Likes, comentarios, guardados y compartidos sumados"
        value={posts.length ? compact(interNow) : "—"}
      >
        <Delta now={interNow} before={interPrev} label={ref} />
        {rate != null && (
          <span className="mk-metricas-breakdown" title="Interacciones sobre alcance">
            <span>Tasa de interacción: {nf(rate, 1)}%</span>
          </span>
        )}
      </Tile>
    </div>
  );
}

// ─── Comparar redes ─────────────────────────────────────────────────────────
export function CompararRedes({ data, nets, posts }) {
  const snaps = useMemo(() => snapshotsByNetwork(data), [data]);
  const active = nets.filter((n) => snaps[n]?.length || posts.some((p) => p.network === n));
  if (active.length < 2) {
    return (
      <section className="adm-card mk-metricas-section">
        <div className="mk-metricas-section-head">
          <h2 className="adm-card-title">Comparar redes</h2>
        </div>
        <p className="mk-metricas-muted">
          Para comparar redes entre sí necesito datos de al menos dos. Conectá otra red o cargá LinkedIn y acá vas a ver quién crece más y dónde
          rinde mejor cada publicación.
        </p>
      </section>
    );
  }

  const stats = active.map((n) => {
    const mine = posts.filter((p) => p.network === n);
    const aud = mine.filter((p) => p._audience != null);
    const last = snaps[n]?.[snaps[n].length - 1];
    return {
      network: n,
      followers: last ? last.followers : null,
      posts: mine.length,
      avgAudience: aud.length ? sum(aud.map((p) => p._audience)) / aud.length : null,
      rate: rateOf(mine),
    };
  });

  const block = (title, hint, getter, fmt, tipExtra) => {
    const rows = stats
      .map((s) => ({
        key: s.network,
        label: networkLabel(s.network),
        value: getter(s),
        color: netColor(s.network),
        tip: [
          { text: fmt(getter(s)), strong: true },
          { text: `${title} · ${networkLabel(s.network)}`, muted: true },
          ...(tipExtra ? tipExtra(s) : []),
        ],
      }))
      .sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
    return (
      <div className="mk-metricas-cmp">
        <h3>{title}</h3>
        <p className="mk-metricas-cmp-hint">{hint}</p>
        <HBars rows={rows} format={fmt} />
      </div>
    );
  };

  return (
    <section className="adm-card mk-metricas-section">
      <div className="mk-metricas-section-head">
        <h2 className="adm-card-title">Comparar redes</h2>
        <Legend items={active.map((n) => ({ key: n, label: networkLabel(n), color: netColor(n) }))} />
      </div>
      <div className="mk-metricas-cmp-grid">
        {block("Seguidores", "Cuántas personas te siguen hoy.", (s) => s.followers, nf)}
        {block("Publicaciones", "Cuántas publicaste en el período.", (s) => (s.posts ? s.posts : s.followers != null ? 0 : null), nf)}
        {block("Alcance por publicación", "Cuánta gente ve, en promedio, cada publicación.", (s) => s.avgAudience, (v) => (v == null ? "—" : compact(Math.round(v))))}
        {block("Tasa de interacción", "De cada 100 personas que ven una publicación, cuántas interactúan.", (s) => s.rate, (v) => (v == null ? "—" : `${nf(v, 1)}%`))}
      </div>
      <p className="mk-metricas-note">
        Instagram mide alcance (personas distintas); LinkedIn y YouTube miden impresiones o vistas. Sirven para ver tendencias y diferencias grandes,
        no para comparar un valor exacto.
      </p>
    </section>
  );
}

export { DAY_MS };
