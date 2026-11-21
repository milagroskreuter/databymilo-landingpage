"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "../../AdminToast";
import { nf, compact, ago, shortDate, signed, MARK_COLOR } from "../metricas/fmt";
import { HBars } from "../metricas/charts";
import { enrich, accountStats, groupAvg, WEEKDAYS, SLOTS, LENGTHS } from "./calc";
import "../metricas/metricas.css";
import "../metricas/metricas-charts.css";
import "./espia.css";

const API = "/api/admin/marketing/competitors";
const FORMAT_LABEL = { reel: "Reel", carrusel: "Carrusel", post: "Post", video: "Video" };
const PERIODS = [
  { id: 30, label: "30 días" },
  { id: 90, label: "90 días" },
  { id: 365, label: "1 año" },
];
const SORTS = [
  { id: "mult", label: "Veces su promedio" },
  { id: "inter", label: "Interacciones" },
  { id: "rate", label: "Tasa" },
  { id: "recent", label: "Más nuevos" },
];
const x = (v) => (v == null ? "—" : `${nf(v, 1)}×`);

async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    cache: "no-store",
    ...opts,
    headers: opts.body ? { "Content-Type": "application/json" } : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

// ─── Cuentas ────────────────────────────────────────────────────────────────
function AccountCard({ c, stats, growth, busy, onSync, onRemove, selected, onSelect }) {
  return (
    <article className={`mk-espia-acc${selected ? " on" : ""}`}>
      <header className="mk-espia-acc-head">
        {c.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="mk-espia-avatar" src={c.avatar_url} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span className="mk-espia-avatar mk-espia-avatar-empty">{c.username.charAt(0).toUpperCase()}</span>
        )}
        <div className="mk-espia-acc-id">
          <a href={`https://www.instagram.com/${c.username}/`} target="_blank" rel="noopener noreferrer" className="mk-espia-acc-user">
            @{c.username}
          </a>
          {c.display_name && <span className="mk-metricas-muted">{c.display_name}</span>}
        </div>
      </header>

      {c.last_error ? (
        <p className="mk-metricas-status-error">{c.last_error}</p>
      ) : !c.last_sync_at ? (
        <p className="mk-metricas-muted">Todavía no se leyó.</p>
      ) : (
        <dl className="mk-espia-acc-stats">
          <div><dt>Seguidores</dt><dd>{compact(c.followers)}{growth ? <small className={growth > 0 ? "up" : "down"}> {signed(growth)}</small> : null}</dd></div>
          <div><dt>Interacciones típicas</dt><dd>{nf(stats.median)}</dd></div>
          <div><dt>Tasa típica</dt><dd>{stats.rate == null ? "—" : `${nf(stats.rate, 2)}%`}</dd></div>
          <div><dt>Publica</dt><dd>{nf(stats.perWeek, 1)} / semana</dd></div>
          {stats.bestFormat && (
            <div className="wide"><dt>Le rinde más</dt><dd>{FORMAT_LABEL[stats.bestFormat.key] || stats.bestFormat.key} ({x(stats.bestFormat.avg)})</dd></div>
          )}
        </dl>
      )}

      <footer className="mk-metricas-status-actions">
        <button className={`adm-btn adm-btn-sm ${selected ? "adm-btn-primary" : "adm-btn-secondary"}`} onClick={() => onSelect(c.id)}>
          {selected ? "Viendo solo esta" : "Ver solo esta"}
        </button>
        <button className="adm-btn adm-btn-sm adm-btn-secondary" disabled={busy} onClick={() => onSync(c.id)}>
          Actualizar
        </button>
        <button className="mk-metricas-link" onClick={() => onRemove(c)}>Quitar</button>
        <span className="mk-metricas-muted mk-espia-acc-when">{c.last_sync_at ? `Leída ${ago(c.last_sync_at)}` : ""}</span>
      </footer>
    </article>
  );
}

function AddForm({ busy, onAdd }) {
  const [value, setValue] = useState("");
  return (
    <form
      className="mk-espia-add"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onAdd(value.trim()).then((ok) => ok && setValue(""));
      }}
    >
      <input
        className="adm-input"
        placeholder="@usuario o link de Instagram"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Cuenta de Instagram para seguir"
      />
      <button className="adm-btn adm-btn-sm adm-btn-primary" disabled={busy || !value.trim()}>Seguir cuenta</button>
    </form>
  );
}

// ─── Publicaciones destacadas ───────────────────────────────────────────────
function PostCard({ p, onStar, onIdea, busy }) {
  const [open, setOpen] = useState(false);
  const rest = (p.caption || "").slice(p._hook.length).trim();
  const hot = p._mult != null && p._mult >= 2;
  return (
    <article className="mk-espia-post">
      <header className="mk-espia-post-head">
        <span className="mk-espia-post-who">@{p._c?.username}</span>
        <span className="mk-metricas-pill mk-metricas-pill-off">{FORMAT_LABEL[p.format] || p.format}</span>
        <span className="mk-metricas-muted">{shortDate(p.posted_at)}</span>
        {p._fresh && <span className="mk-metricas-pill mk-metricas-pill-warn" title="Tiene menos de 2 días: todavía está sumando">nuevo</span>}
        <span className={`mk-espia-mult${hot ? " hot" : ""}`} title="Interacciones comparadas con lo típico de esa cuenta">
          {x(p._mult)} <small>su promedio</small>
        </span>
      </header>
      {p._hook ? <p className="mk-espia-hook">{p._hook}</p> : <p className="mk-metricas-muted">(sin texto)</p>}
      {rest && (
        <>
          {open && <p className="mk-espia-caption">{rest}</p>}
          <button className="mk-metricas-link" onClick={() => setOpen((v) => !v)}>{open ? "Ocultar texto" : "Ver texto completo"}</button>
        </>
      )}
      <footer className="mk-espia-post-foot">
        <span className="mk-espia-nums">
          {p.likes == null ? "likes ocultos" : `♥ ${nf(p.likes)}`} · 💬 {nf(p.comments)}
          {p.views != null && ` · ▶ ${compact(p.views)}`}
          {p._rate != null && <span className="mk-metricas-muted"> · {nf(p._rate, 2)}% de sus seguidores</span>}
        </span>
        <span className="mk-espia-actions">
          {p.permalink && (
            <a className="adm-btn adm-btn-sm adm-btn-secondary" href={p.permalink} target="_blank" rel="noopener noreferrer">Ver</a>
          )}
          <button
            className={`mk-espia-star${p.starred ? " on" : ""}`}
            onClick={() => onStar(p)}
            aria-pressed={p.starred}
            title={p.starred ? "Quitar de inspiración" : "Guardar como inspiración"}
          >
            {p.starred ? "★" : "☆"}
          </button>
          {p.content_id ? (
            <a className="adm-btn adm-btn-sm adm-btn-secondary" href="/administracion-general/marketing/ideas">Ya en Ideas</a>
          ) : (
            <button className="adm-btn adm-btn-sm adm-btn-primary" disabled={busy} onClick={() => onIdea(p)}>→ Idea</button>
          )}
        </span>
      </footer>
    </article>
  );
}

// ─── Qué les funciona ───────────────────────────────────────────────────────
function Pattern({ title, question, rows, advice }) {
  const best = rows.find((r) => r.n >= 3 && r.avg != null);
  return (
    <div className="mk-espia-pattern">
      <h3 className="mk-espia-pattern-title">{title}</h3>
      <p className="mk-metricas-muted">{question}</p>
      <HBars
        rows={rows.map((r) => ({
          key: String(r.key),
          label: r.label,
          sub: `${r.n} ${r.n === 1 ? "posteo" : "posteos"}`,
          value: r.n ? r.avg : null,
          color: best && r.key === best.key ? MARK_COLOR : "#cdbfc5",
          tip: [{ text: x(r.avg), strong: true }, { text: `${r.label}: ${r.n} posteos`, muted: true }],
        }))}
        format={x}
        mark={{ value: 1, label: "1× = lo típico" }}
        empty="Sin datos todavía."
      />
      {best && best.avg > 1.15 && <p className="mk-espia-advice">{advice(best)}</p>}
    </div>
  );
}

export default function EspiaClient() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [only, setOnly] = useState(null); // id de cuenta o null = todas
  const [period, setPeriod] = useState(90);
  const [format, setFormat] = useState("all");
  const [sort, setSort] = useState("mult");
  const [starredOnly, setStarredOnly] = useState(false);
  const [limit, setLimit] = useState(12);

  const load = useCallback(async () => {
    try {
      setData(await api(""));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const competitors = useMemo(() => data?.competitors || [], [data]);
  const all = useMemo(() => (data ? enrich(data.posts, competitors) : []), [data, competitors]);

  const growthById = useMemo(() => {
    const out = {};
    for (const c of competitors) {
      const snaps = (data?.snapshots || []).filter((s) => s.competitor_id === c.id && s.followers != null);
      if (snaps.length > 1) out[c.id] = snaps[snaps.length - 1].followers - snaps[0].followers;
    }
    return out;
  }, [data, competitors]);

  const inPeriod = useMemo(
    () => all.filter((p) => (!only || p.competitor_id === only) && p._age != null && p._age <= period),
    [all, only, period]
  );
  const shown = useMemo(() => {
    let list = inPeriod.filter((p) => (format === "all" || p.format === format) && (!starredOnly || p.starred));
    const key = { mult: "_mult", inter: "_inter", rate: "_rate" }[sort];
    list = [...list].sort((a, b) =>
      sort === "recent" ? new Date(b.posted_at) - new Date(a.posted_at) : (b[key] ?? -1) - (a[key] ?? -1)
    );
    return list;
  }, [inPeriod, format, sort, starredOnly]);

  const ripe = useMemo(() => inPeriod.filter((p) => !p._fresh), [inPeriod]);
  const patterns = useMemo(() => {
    const m = (p) => p._mult;
    return {
      format: groupAvg(ripe, (p) => p.format, m).map((r) => ({ ...r, label: FORMAT_LABEL[r.key] || r.key })),
      day: groupAvg(ripe, (p) => p._weekday, m, [0, 1, 2, 3, 4, 5, 6]).map((r) => ({ ...r, label: WEEKDAYS[r.key] })),
      slot: groupAvg(ripe, (p) => p._slot, m, SLOTS.map((s) => s.id)).map((r) => ({ ...r, label: SLOTS[r.key].label })),
      length: groupAvg(ripe, (p) => p._length, m, LENGTHS.map((l) => l.id)).map((r) => ({
        ...r,
        label: LENGTHS.find((l) => l.id === r.key).label,
      })),
    };
  }, [ripe]);
  const hooks = useMemo(
    () => ripe.filter((p) => p._hook && p._mult != null).sort((a, b) => b._mult - a._mult).slice(0, 10),
    [ripe]
  );

  async function onAdd(username) {
    setBusy(true);
    try {
      const res = await api("", { method: "POST", body: JSON.stringify({ username }) });
      if (res.result?.ok) toast?.({ text: `Siguiendo a @${res.item.username}: ${res.result.posts} posteos leídos` });
      else toast?.({ type: "warn", text: res.result?.error || "Se agregó, pero no se pudo leer todavía" });
      await load();
      return true;
    } catch (err) {
      toast?.({ type: "error", text: err.message });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function onSync(id) {
    setBusy(true);
    try {
      const { results } = await api("/sync", { method: "POST", body: JSON.stringify(id ? { id } : {}) });
      const bad = results.filter((r) => !r.ok);
      if (!results.length) toast?.({ type: "warn", text: "No hay cuentas activas para leer" });
      else if (bad.length) toast?.({ type: "warn", text: `${results.length - bad.length} leídas, ${bad.length} con error (mirá la tarjeta)` });
      else toast?.({ text: results.length === 1 ? `@${results[0].username} al día` : `${results.length} cuentas al día` });
      await load();
    } catch (err) {
      toast?.({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(c) {
    if (!window.confirm(`¿Dejar de seguir a @${c.username}? Se borran sus publicaciones guardadas.`)) return;
    try {
      await api(`/${c.id}`, { method: "DELETE" });
      if (only === c.id) setOnly(null);
      await load();
    } catch (err) {
      toast?.({ type: "error", text: err.message });
    }
  }

  async function onStar(p) {
    const starred = !p.starred;
    setData((d) => ({ ...d, posts: d.posts.map((q) => (q.id === p.id ? { ...q, starred } : q)) }));
    try {
      await api(`/posts/${p.id}`, { method: "PATCH", body: JSON.stringify({ starred }) });
    } catch (err) {
      toast?.({ type: "error", text: err.message });
      await load();
    }
  }

  async function onIdea(p) {
    setBusy(true);
    try {
      const { content } = await api(`/posts/${p.id}/idea`, { method: "POST", body: JSON.stringify({ multiplier: p._mult }) });
      setData((d) => ({ ...d, posts: d.posts.map((q) => (q.id === p.id ? { ...q, content_id: content.id, starred: true } : q)) }));
      toast?.({ text: "Idea creada en tu tablero de Ideas" });
    } catch (err) {
      toast?.({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  const onlyName = only ? `@${competitors.find((c) => c.id === only)?.username}` : "todas las cuentas";

  return (
    <>
      <div className="adm-header">
        <h1>Espía de competencia</h1>
        <div className="mk-metricas-header-actions">
          <button className="adm-btn adm-btn-sm adm-btn-primary" disabled={busy || !competitors.length} onClick={() => onSync(null)}>
            {busy ? "Leyendo…" : "Actualizar todo"}
          </button>
        </div>
      </div>

      <div className="adm-content mk-metricas mk-espia">
        {error && <div className="adm-alert adm-alert-error">{error}</div>}
        {!data && !error && <div className="adm-skel mk-metricas-skel" />}

        {data && (
          <>
            <section className="adm-card mk-metricas-section">
              <div className="mk-metricas-section-head">
                <div>
                  <h2 className="adm-card-title">Cuentas que seguís</h2>
                  <p className="mk-metricas-muted">
                    Se leen solas todos los días. Solo cuentas Business o Creator de Instagram (las personales no se pueden leer).
                  </p>
                </div>
                <AddForm busy={busy} onAdd={onAdd} />
              </div>
              {competitors.length ? (
                <div className="mk-espia-acc-grid">
                  {competitors.map((c) => (
                    <AccountCard
                      key={c.id}
                      c={c}
                      stats={accountStats(c, all)}
                      growth={growthById[c.id]}
                      busy={busy}
                      onSync={onSync}
                      onRemove={onRemove}
                      selected={only === c.id}
                      onSelect={(id) => setOnly((v) => (v === id ? null : id))}
                    />
                  ))}
                </div>
              ) : (
                <p className="mk-metricas-muted">Todavía no seguís ninguna cuenta. Agregá la primera con su @usuario.</p>
              )}
            </section>

            <section className="adm-card mk-metricas-section">
              <div className="mk-metricas-section-head">
                <div>
                  <h2 className="adm-card-title">Lo que la rompió</h2>
                  <p className="mk-metricas-muted">
                    Publicaciones de {onlyName} ordenadas por cuántas veces superaron lo típico de su propia cuenta.
                  </p>
                </div>
                {only && <button className="mk-metricas-link" onClick={() => setOnly(null)}>Ver todas las cuentas</button>}
              </div>
              <div className="mk-espia-filters">
                <div className="mk-metricas-seg" role="group" aria-label="Período">
                  {PERIODS.map((p) => (
                    <button key={p.id} className={period === p.id ? "on" : ""} onClick={() => setPeriod(p.id)}>{p.label}</button>
                  ))}
                </div>
                <div className="mk-metricas-seg" role="group" aria-label="Formato">
                  {[["all", "Todos"], ["reel", "Reels"], ["carrusel", "Carruseles"], ["post", "Posts"]].map(([id, label]) => (
                    <button key={id} className={format === id ? "on" : ""} onClick={() => setFormat(id)}>{label}</button>
                  ))}
                </div>
                <label className="mk-espia-sort">
                  Ordenar por{" "}
                  <select className="adm-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                    {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </label>
                <label className="mk-espia-check">
                  <input type="checkbox" checked={starredOnly} onChange={(e) => setStarredOnly(e.target.checked)} /> Solo guardadas ★
                </label>
              </div>
              {shown.length ? (
                <>
                  <div className="mk-espia-posts">
                    {shown.slice(0, limit).map((p) => (
                      <PostCard key={p.id} p={p} onStar={onStar} onIdea={onIdea} busy={busy} />
                    ))}
                  </div>
                  {shown.length > limit && (
                    <button className="adm-btn adm-btn-sm adm-btn-secondary mk-espia-more" onClick={() => setLimit((l) => l + 12)}>
                      Ver más ({shown.length - limit} restantes)
                    </button>
                  )}
                </>
              ) : (
                <p className="mk-metricas-muted">No hay publicaciones con estos filtros.</p>
              )}
            </section>

            <section className="adm-card mk-metricas-section">
              <h2 className="adm-card-title">Qué les funciona</h2>
              <p className="mk-metricas-muted">
                Promedio de “veces su promedio” de {onlyName} en {PERIODS.find((p) => p.id === period).label}
                {" "}({ripe.length} posteos, sin contar los de menos de 2 días). La línea marca 1×: lo típico.
              </p>
              <div className="mk-espia-patterns">
                <Pattern title="Formato" question="¿Qué tipo de publicación rinde más?" rows={patterns.format} advice={(r) => `Los ${r.label.toLowerCase()}s rinden ${x(r.avg)} lo normal: probá más de ese formato.`} />
                <Pattern title="Largo del texto" question="¿Textos cortos o largos?" rows={patterns.length} advice={(r) => `Les funciona el texto ${r.label.split(" (")[0].toLowerCase()}.`} />
                <Pattern title="Día" question="¿Qué día les va mejor? (hora de Argentina)" rows={patterns.day} advice={(r) => `Los ${r.label.toLowerCase()} les rinden ${x(r.avg)}.`} />
                <Pattern title="Horario" question="¿A qué hora publican lo que mejor funciona?" rows={patterns.slot} advice={(r) => `Mejor franja: ${r.label.toLowerCase()}.`} />
              </div>
            </section>

            <section className="adm-card mk-metricas-section">
              <h2 className="adm-card-title">Ganchos que más funcionaron</h2>
              <p className="mk-metricas-muted">La primera línea de las publicaciones que más superaron su promedio. Mirá la estructura, no las palabras.</p>
              {hooks.length ? (
                <ol className="mk-espia-hooks">
                  {hooks.map((p) => (
                    <li key={p.id}>
                      <span className="mk-espia-hooks-text">{p._hook}</span>
                      <span className="mk-metricas-muted">@{p._c?.username} · {FORMAT_LABEL[p.format]} · {x(p._mult)}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mk-metricas-muted">Sin datos todavía.</p>
              )}
              <p className="mk-metricas-note">
                Instagram solo deja ver likes y comentarios de otras cuentas: las vistas, el alcance y los guardados solo los ve la dueña.
                Para un análisis más profundo (por qué funcionó y cómo adaptarlo a tu voz), pedíselo a Claude Code: lee estas tablas y te deja las ideas cargadas.
              </p>
            </section>
          </>
        )}
      </div>
    </>
  );
}
