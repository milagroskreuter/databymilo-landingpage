"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NETWORK_BY_ID, FORMAT_BY_ID, networkLabel } from "@/lib/marketing/constants";
import { interactions, audience, engagementRate, arWeekdayHour } from "@/lib/marketing/metrics/calc";
import ComoConectar from "./ComoConectar";
import LinkedinManual from "./LinkedinManual";
import "./metricas.css";

const API = "/api/admin/marketing/metrics";
const DAY_MS = 86400000;

const nf = (n, d = 0) =>
  n == null || Number.isNaN(n) ? "—" : Number(n).toLocaleString("es-AR", { maximumFractionDigits: d, minimumFractionDigits: 0 });
const compact = (n) => {
  if (n == null) return "—";
  const a = Math.abs(n);
  if (a >= 1e6) return `${(n / 1e6).toFixed(1).replace(".", ",")} M`;
  if (a >= 1e4) return `${Math.round(n / 1e3)} k`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(1).replace(".", ",")} k`;
  return nf(n);
};
const signed = (n) => (n == null ? "—" : `${n > 0 ? "+" : ""}${nf(n)}`);
const dayLabel = (day) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("es-AR", { day: "numeric", month: "short", timeZone: "UTC" });
const dateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("es-AR", {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires",
      })
    : "—";
const shortDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })
    : "—";
const ago = (iso) => {
  if (!iso) return null;
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);
  return d <= 0 ? "hoy" : d === 1 ? "ayer" : `hace ${d} días`;
};
const daysLeft = (iso) => (iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / DAY_MS) : null);
const netColor = (id) => NETWORK_BY_ID[id]?.color || "#9a8a90";
const monthKey = (day) => day.slice(0, 7);
const monthName = (ym) =>
  new Date(`${ym}-15T12:00:00Z`).toLocaleDateString("es-AR", { month: "long", timeZone: "UTC" });

async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    cache: "no-store",
    ...opts,
    headers: opts.body && !(opts.body instanceof FormData) ? { "Content-Type": "application/json" } : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

// ─── Gráfico de seguidores ───────────────────────────────────────────────────
function FollowersChart({ points, color, goal }) {
  const [hover, setHover] = useState(null);
  const ref = useRef(null);
  if (points.length < 2) {
    return <div className="mk-metricas-chart-empty">{points.length ? "Hace falta más de un día de datos para el gráfico." : "Sin datos en este período."}</div>;
  }
  const W = 600, H = 150, padX = 6, padTop = 12, padBottom = 22;
  const vals = points.map((p) => p.followers);
  let min = Math.min(...vals), max = Math.max(...vals);
  // La meta entra en la escala solo si está cerca (si no, aplastaría la línea).
  if (goal && goal <= max * 1.25 && goal >= min * 0.8) {
    max = Math.max(max, goal);
    min = Math.min(min, goal);
  }
  if (max === min) {
    max += 1;
    min -= 1;
  }
  const t0 = new Date(points[0].day).getTime();
  const t1 = new Date(points[points.length - 1].day).getTime();
  const x = (day) => padX + ((new Date(day).getTime() - t0) / Math.max(1, t1 - t0)) * (W - padX * 2);
  const y = (v) => padTop + (1 - (v - min) / (max - min)) * (H - padTop - padBottom);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(p.day).toFixed(1)},${y(p.followers).toFixed(1)}`).join(" ");
  const showGoal = goal && goal >= min && goal <= max;

  function onMove(e) {
    const rect = ref.current.getBoundingClientRect();
    const rx = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    points.forEach((p, i) => {
      if (Math.abs(x(p.day) - rx) < Math.abs(x(points[best].day) - rx)) best = i;
    });
    setHover(points[best]);
  }

  return (
    <div className="mk-metricas-chart">
      {hover && (
        <div className="mk-metricas-chart-tip" style={{ left: `${(x(hover.day) / W) * 100}%` }}>
          {dayLabel(hover.day)} · <strong>{nf(hover.followers)}</strong>
        </div>
      )}
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        {showGoal && (
          <>
            <line x1={padX} x2={W - padX} y1={y(goal)} y2={y(goal)} className="mk-metricas-goal-line" />
            <text x={W - padX} y={y(goal) - 4} textAnchor="end" className="mk-metricas-axis">meta {compact(goal)}</text>
          </>
        )}
        <path d={path} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {hover && <circle cx={x(hover.day)} cy={y(hover.followers)} r="4" fill={color} />}
        <text x={padX} y={H - 6} className="mk-metricas-axis">{dayLabel(points[0].day)}</text>
        <text x={W - padX} y={H - 6} textAnchor="end" className="mk-metricas-axis">{dayLabel(points[points.length - 1].day)}</text>
      </svg>
    </div>
  );
}

// ─── Tarjetas de estado ──────────────────────────────────────────────────────
function StatusCard({ acc, alerts, busy, onSync, onDisconnect, onLinkedin, onLinkedinManual, onYoutube, onInstagramToken }) {
  const label = networkLabel(acc.network);
  const left = daysLeft(acc.token_expires_at);
  const fileRef = useRef(null);
  const [channel, setChannel] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [igToken, setIgToken] = useState("");
  const issue = alerts.find((a) => a.network === acc.network);

  let state = { cls: "off", text: "No conectado" };
  if (acc.connected) state = { cls: "ok", text: acc.network === "linkedin" ? "Con datos" : "Conectado" };
  if (acc.connected && (acc.last_error || issue)) state = { cls: "warn", text: "Con problemas" };
  if (acc.connected && left != null && left <= 0) state = { cls: "err", text: "Venció" };

  const lastData = acc.last_snapshot
    ? `${nf(acc.last_snapshot.followers)} seguidores · ${dayLabel(acc.last_snapshot.day)}`
    : "Todavía sin datos";

  return (
    <div className="mk-metricas-status" style={{ "--net": netColor(acc.network) }}>
      <div className="mk-metricas-status-head">
        <span className="mk-metricas-status-name">{label}</span>
        <span className={`mk-metricas-pill mk-metricas-pill-${state.cls}`}>{state.text}</span>
      </div>
      {acc.handle && <div className="mk-metricas-status-handle">@{String(acc.handle).replace(/^@/, "")}</div>}
      <dl className="mk-metricas-status-list">
        <dt>Último dato</dt>
        <dd>{lastData}</dd>
        {acc.network === "linkedin" ? (
          <>
            <dt>Última importación</dt>
            <dd>{acc.last_import_at ? `${shortDate(acc.last_import_at)} (${ago(acc.last_import_at)})` : "Nunca"}</dd>
          </>
        ) : (
          <>
            <dt>Última lectura</dt>
            <dd>{acc.last_sync_at ? dateTime(acc.last_sync_at) : "—"}</dd>
          </>
        )}
        {acc.token_expires_at && (
          <>
            <dt>Token vence</dt>
            <dd className={left != null && left <= 7 ? "mk-metricas-danger" : ""}>
              {shortDate(acc.token_expires_at)} {left != null && `(${left > 0 ? `en ${left} días` : "vencido"})`}
              {left > 15 && <span className="mk-metricas-muted"> · se renueva solo</span>}
            </dd>
          </>
        )}
      </dl>
      {(acc.last_error || issue) && <p className="mk-metricas-status-error">{issue?.message || acc.last_error}</p>}
      {acc.followers_error && acc.network === "threads" && (
        <p className="mk-metricas-status-error">No se pudieron leer los seguidores: {acc.followers_error}</p>
      )}

      <div className="mk-metricas-status-actions">
        {acc.network === "instagram" && (
          <>
            {acc.connected && (
              <button className="adm-btn adm-btn-sm adm-btn-secondary" disabled={busy} onClick={() => onSync("instagram")}>
                Actualizar
              </button>
            )}
            <form
              className="mk-metricas-inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (igToken.trim()) onInstagramToken(igToken.trim()).then((ok) => ok && setIgToken(""));
              }}
            >
              <input
                className="adm-input"
                type="password"
                autoComplete="off"
                placeholder={acc.connected ? "Pegar un token nuevo" : "Pegá el token de Instagram"}
                value={igToken}
                onChange={(e) => setIgToken(e.target.value)}
              />
              <button className="adm-btn adm-btn-sm adm-btn-primary" disabled={busy || !igToken.trim()}>
                Guardar
              </button>
            </form>
            {!acc.connected && (
              <p className="mk-metricas-hint">
                El token sale del panel de Meta. <a href="#como-conectar">Cómo conseguirlo</a>
              </p>
            )}
            {acc.connected && (
              <button className="mk-metricas-link" disabled={busy} onClick={() => onDisconnect("instagram")}>
                Desconectar
              </button>
            )}
          </>
        )}

        {acc.network === "threads" &&
          (acc.configured ? (
            <>
              <a className="adm-btn adm-btn-sm adm-btn-primary" href={`${API}/oauth/${acc.network}`}>
                {acc.connected ? "Reconectar" : `Conectar ${label}`}
              </a>
              {acc.connected && (
                <>
                  <button className="adm-btn adm-btn-sm adm-btn-secondary" disabled={busy} onClick={() => onSync(acc.network)}>
                    Actualizar
                  </button>
                  <button className="mk-metricas-link" disabled={busy} onClick={() => onDisconnect(acc.network)}>
                    Desconectar
                  </button>
                </>
              )}
            </>
          ) : (
            <p className="mk-metricas-hint">
              Falta crear la app en Meta y cargar {acc.network === "instagram" ? "INSTAGRAM" : "THREADS"}_APP_ID y _APP_SECRET en Vercel.{" "}
              <a href="#como-conectar">Cómo conectarlo</a>
            </p>
          ))}

        {acc.network === "youtube" &&
          (!acc.configured ? (
            <p className="mk-metricas-hint">
              Falta la API key de YouTube (YOUTUBE_API_KEY en Vercel). <a href="#como-conectar">Cómo conectarlo</a>
            </p>
          ) : (
            <>
              {!acc.connected || !acc.channel ? null : (
                <button className="adm-btn adm-btn-sm adm-btn-secondary" disabled={busy} onClick={() => onSync("youtube")}>
                  Actualizar
                </button>
              )}
              <form
                className="mk-metricas-inline-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (channel.trim()) onYoutube(channel.trim()).then(() => setChannel(""));
                }}
              >
                <input
                  className="adm-input"
                  placeholder={acc.channel ? "Cambiar canal (@usuario)" : "@usuario o id del canal"}
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                />
                <button className="adm-btn adm-btn-sm adm-btn-primary" disabled={busy || !channel.trim()}>
                  Guardar
                </button>
              </form>
              {acc.connected && (
                <button className="mk-metricas-link" disabled={busy} onClick={() => onDisconnect("youtube")}>
                  Desconectar
                </button>
              )}
            </>
          ))}

        {acc.network === "linkedin" && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) onLinkedin(f);
              }}
            />
            <button className="adm-btn adm-btn-sm adm-btn-primary" disabled={busy} onClick={() => fileRef.current?.click()}>
              Subir archivo de LinkedIn
            </button>
            <button className="adm-btn adm-btn-sm adm-btn-secondary" disabled={busy} onClick={() => setManualOpen(true)}>
              Cargar a mano
            </button>
            {manualOpen && (
              <LinkedinManual
                busy={busy}
                onClose={() => setManualOpen(false)}
                onSave={async (data) => {
                  await onLinkedinManual(data);
                  setManualOpen(false);
                }}
              />
            )}
            <details className="mk-metricas-howto">
              <summary>¿De dónde lo saco?</summary>
              <ol>
                <li>Entrá a tu perfil de LinkedIn y abrí <strong>Analytics</strong> (Estadísticas) → <strong>Impresiones de publicaciones</strong>.</li>
                <li>Elegí el período más largo (<strong>últimos 365 días</strong>) y tocá <strong>Exportar</strong>.</li>
                <li>Se baja un .xlsx: subilo acá. Podés subirlo todas las semanas; no se duplica nada.</li>
                <li>Si LinkedIn no te deja exportar, usá <strong>Cargar a mano</strong>: copiás los números de Rendimiento una vez por semana.</li>
              </ol>
            </details>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Seguidores + metas ──────────────────────────────────────────────────────
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
        <input
          className="adm-input"
          type="number"
          min="0"
          inputMode="numeric"
          placeholder="Sin meta"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
      </label>
      {changed && (
        <button className="adm-btn adm-btn-sm adm-btn-primary" disabled={busy}>
          Guardar
        </button>
      )}
    </form>
  );
}

function FollowersSection({ data, busy, onSaveGoal }) {
  const [range, setRange] = useState(90);
  const today = data.today;
  const month = monthKey(today);
  const since = new Date(new Date(`${today}T00:00:00Z`).getTime() - range * DAY_MS).toISOString().slice(0, 10);

  const byNet = useMemo(() => {
    const m = {};
    for (const s of data.snapshots) (m[s.network] ||= []).push(s);
    return m;
  }, [data.snapshots]);
  const goals = useMemo(() => {
    const m = {};
    for (const g of data.goals) m[`${g.network}|${g.month.slice(0, 7)}`] = g.target_followers;
    return m;
  }, [data.goals]);

  const networks = data.accounts.filter((a) => a.connected || byNet[a.network]?.length).map((a) => a.network);

  return (
    <section className="adm-card mk-metricas-section">
      <div className="mk-metricas-section-head">
        <h2 className="adm-card-title">Seguidores</h2>
        <div className="mk-metricas-seg">
          {[30, 90, 180, 365].map((d) => (
            <button key={d} className={range === d ? "on" : ""} onClick={() => setRange(d)}>
              {d} días
            </button>
          ))}
        </div>
      </div>
      {!networks.length ? (
        <p className="mk-metricas-muted">Cuando conectes una red o importes LinkedIn, acá vas a ver cómo crecen tus seguidores.</p>
      ) : (
        <div className="mk-metricas-follow-grid">
          {networks.map((network) => {
            const all = byNet[network] || [];
            const points = all.filter((s) => s.day >= since);
            const last = all[all.length - 1];
            const first = points[0];
            const monthStart = [...all].reverse().find((s) => s.day < `${month}-01`) || all.find((s) => monthKey(s.day) === month);
            const goal = goals[`${network}|${month}`];
            const pct = goal && last ? Math.min(100, Math.round((last.followers / goal) * 100)) : null;
            const lastDayOfMonth = new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7), 0)).getUTCDate();
            const remainingDays = Math.max(1, lastDayOfMonth - Number(today.slice(8, 10)) + 1);
            const missing = goal && last ? goal - last.followers : null;
            return (
              <div key={network} className="mk-metricas-follow" style={{ "--net": netColor(network) }}>
                <div className="mk-metricas-follow-head">
                  <span className="mk-metricas-dot" />
                  <span className="mk-metricas-follow-name">{networkLabel(network)}</span>
                  <span className="mk-metricas-follow-value">{last ? nf(last.followers) : "—"}</span>
                </div>
                <div className="mk-metricas-follow-sub">
                  {first && last && <span>{signed(last.followers - first.followers)} en {range} días</span>}
                  {monthStart && last && <span> · {signed(last.followers - monthStart.followers)} este mes</span>}
                </div>
                <FollowersChart points={points} color={netColor(network)} goal={goal} />
                <div className="mk-metricas-goal">
                  <GoalEditor network={network} month={month} goal={goal} onSave={onSaveGoal} busy={busy} />
                  {pct != null && (
                    <div className="mk-metricas-goal-progress">
                      <div className="mk-metricas-bar">
                        <span style={{ width: `${pct}%` }} />
                      </div>
                      <span className="mk-metricas-muted">
                        {missing > 0
                          ? `Faltan ${nf(missing)} (≈ ${nf(Math.ceil(missing / remainingDays))} por día)`
                          : "¡Meta cumplida!"}
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

// ─── Publicaciones ───────────────────────────────────────────────────────────
const COLS = [
  { id: "posted_at", label: "Fecha", get: (p) => p.posted_at },
  { id: "network", label: "Red", get: (p) => p.network },
  { id: "title", label: "Publicación", get: (p) => p._title },
  { id: "format", label: "Formato", get: (p) => p._format },
  { id: "pillar", label: "Pilar", get: (p) => p._pillar?.name || "" },
  { id: "audience", label: "Alcance", num: true, get: (p) => p._audience, title: "Alcance (o vistas / impresiones si la red no da alcance)" },
  { id: "likes", label: "Likes", num: true, get: (p) => p.likes },
  { id: "comments", label: "Coment.", num: true, get: (p) => p.comments },
  { id: "saves", label: "Guard.", num: true, get: (p) => p.saves },
  { id: "shares", label: "Compart.", num: true, get: (p) => p.shares },
  { id: "interactions", label: "Interacc.", num: true, get: (p) => p._interactions },
  { id: "rate", label: "Tasa", num: true, get: (p) => p._rate, title: "Interacciones sobre alcance" },
];

function PostsTable({ posts }) {
  const [sort, setSort] = useState({ id: "posted_at", dir: -1 });
  const [limit, setLimit] = useState(30);
  const col = COLS.find((c) => c.id === sort.id);
  const sorted = useMemo(() => {
    return [...posts].sort((a, b) => {
      const va = col.get(a), vb = col.get(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return (va > vb ? 1 : va < vb ? -1 : 0) * sort.dir;
    });
  }, [posts, col, sort.dir]);

  if (!posts.length) return <p className="mk-metricas-muted">No hay publicaciones con métricas en este período.</p>;

  return (
    <>
      <div className="adm-table-wrap mk-metricas-table-wrap">
        <table className="adm-table mk-metricas-table">
          <thead>
            <tr>
              {COLS.map((c) => (
                <th
                  key={c.id}
                  className={c.num ? "num" : ""}
                  title={c.title}
                  onClick={() => setSort((s) => ({ id: c.id, dir: s.id === c.id ? -s.dir : c.num || c.id === "posted_at" ? -1 : 1 }))}
                >
                  {c.label}
                  {sort.id === c.id ? (sort.dir < 0 ? " ↓" : " ↑") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, limit).map((p) => (
              <tr key={p.id}>
                <td className="nowrap">{shortDate(p.posted_at)}</td>
                <td>
                  <span className="mk-metricas-net" style={{ "--net": netColor(p.network) }}>
                    {networkLabel(p.network)}
                  </span>
                </td>
                <td className="mk-metricas-title-cell">
                  {p.permalink ? (
                    <a href={p.permalink} target="_blank" rel="noopener noreferrer">{p._title}</a>
                  ) : (
                    p._title
                  )}
                  {!p.content_id && <span className="mk-metricas-unlinked" title="No está vinculada a una pieza del calendario">sin pieza</span>}
                </td>
                <td>{FORMAT_BY_ID[p._format]?.label || p._format || "—"}</td>
                <td>
                  {p._pillar ? (
                    <span className="mk-metricas-pillar" style={{ "--pc": p._pillar.color }}>{p._pillar.name}</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="num">{compact(p._audience)}</td>
                <td className="num">{compact(p.likes)}</td>
                <td className="num">{compact(p.comments)}</td>
                <td className="num">{compact(p.saves)}</td>
                <td className="num">{compact(p.shares)}</td>
                <td className="num strong">{compact(p._interactions)}</td>
                <td className="num">{p._rate == null ? "—" : `${nf(p._rate, 1)}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length > limit && (
        <button className="adm-btn adm-btn-sm adm-btn-secondary mk-metricas-more" onClick={() => setLimit((l) => l + 50)}>
          Ver más ({sorted.length - limit})
        </button>
      )}
    </>
  );
}

// ─── Qué funciona ────────────────────────────────────────────────────────────
const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const HOUR_SLOTS = [
  { id: 0, label: "Madrugada (0–6)", from: 0, to: 6 },
  { id: 1, label: "Mañana (6–9)", from: 6, to: 9 },
  { id: 2, label: "Media mañana (9–12)", from: 9, to: 12 },
  { id: 3, label: "Mediodía (12–15)", from: 12, to: 15 },
  { id: 4, label: "Tarde (15–18)", from: 15, to: 18 },
  { id: 5, label: "Tardecita (18–21)", from: 18, to: 21 },
  { id: 6, label: "Noche (21–24)", from: 21, to: 24 },
];
const METRICS = [
  { id: "interactions", label: "Interacciones promedio", get: (p) => p._interactions, fmt: (v) => nf(v, 0) },
  { id: "audience", label: "Alcance promedio", get: (p) => p._audience, fmt: (v) => compact(Math.round(v)) },
  { id: "rate", label: "Tasa de interacción", get: (p) => p._rate, fmt: (v) => `${nf(v, 1)}%` },
];

function rank(posts, keyFn, labelFn, metric) {
  const groups = new Map();
  for (const p of posts) {
    const k = keyFn(p);
    const v = metric.get(p);
    if (k == null || v == null) continue;
    const g = groups.get(k) || { key: k, sum: 0, n: 0 };
    g.sum += v;
    g.n += 1;
    groups.set(k, g);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, label: labelFn(g.key), avg: g.sum / g.n }))
    .sort((a, b) => b.avg - a.avg);
}

function RankBlock({ title, rows, metric, colorFn, note }) {
  const max = Math.max(...rows.map((r) => r.avg), 0);
  return (
    <div className="mk-metricas-rank">
      <h3>{title}</h3>
      {!rows.length ? (
        <p className="mk-metricas-muted">Sin datos suficientes.</p>
      ) : (
        rows.map((r, i) => (
          <div key={r.key} className="mk-metricas-rank-row" title={`${r.n} publicaci${r.n === 1 ? "ón" : "ones"}`}>
            <span className="mk-metricas-rank-label">
              {i === 0 && rows.length > 1 && <span className="mk-metricas-star">★</span>}
              {r.label}
            </span>
            <span className="mk-metricas-bar">
              <span style={{ width: `${max ? (r.avg / max) * 100 : 0}%`, background: colorFn?.(r.key) }} />
            </span>
            <span className="mk-metricas-rank-val">{metric.fmt(r.avg)}</span>
            <span className="mk-metricas-rank-n">{r.n}</span>
          </div>
        ))
      )}
      {note && <p className="mk-metricas-note">{note}</p>}
    </div>
  );
}

function WhatWorks({ posts, pillars }) {
  const [metricId, setMetricId] = useState("interactions");
  const metric = METRICS.find((m) => m.id === metricId);
  const pillarById = Object.fromEntries(pillars.map((p) => [p.id, p]));
  const linked = posts.filter((p) => p._pillar).length;
  const timed = posts.filter((p) => !p.extra?.time_unknown);

  return (
    <section className="adm-card mk-metricas-section">
      <div className="mk-metricas-section-head">
        <h2 className="adm-card-title">Qué funciona</h2>
        <div className="mk-metricas-seg">
          {METRICS.map((m) => (
            <button key={m.id} className={metricId === m.id ? "on" : ""} onClick={() => setMetricId(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>
      {posts.length < 3 ? (
        <p className="mk-metricas-muted">Con unas pocas publicaciones más con métricas, acá vas a ver qué formatos, pilares, días y horarios te rinden mejor.</p>
      ) : (
        <div className="mk-metricas-rank-grid">
          <RankBlock title="Por formato" metric={metric} rows={rank(posts, (p) => p._format, (k) => FORMAT_BY_ID[k]?.label || k, metric)} />
          <RankBlock
            title="Por pilar"
            metric={metric}
            rows={rank(posts, (p) => p._pillar?.id, (k) => pillarById[k]?.name || "—", metric)}
            colorFn={(k) => pillarById[k]?.color}
            note={linked < posts.length ? `${posts.length - linked} publicaciones no tienen pieza o pilar asignado en el calendario.` : null}
          />
          <RankBlock title="Por red" metric={metric} rows={rank(posts, (p) => p.network, networkLabel, metric)} colorFn={netColor} />
          <RankBlock
            title="Por día de publicación"
            metric={metric}
            rows={rank(posts, (p) => (p.posted_at ? arWeekdayHour(p.posted_at).weekday : null), (k) => WEEKDAYS[k], metric)}
          />
          <RankBlock
            title="Por horario (hora de Argentina)"
            metric={metric}
            rows={rank(
              timed,
              (p) => {
                if (!p.posted_at) return null;
                const h = arWeekdayHour(p.posted_at).hour;
                return HOUR_SLOTS.find((s) => h >= s.from && h < s.to)?.id ?? null;
              },
              (k) => HOUR_SLOTS[k].label,
              metric
            )}
            note={timed.length < posts.length ? "LinkedIn no informa la hora, así que no entra en este ranking." : null}
          />
        </div>
      )}
      <p className="mk-metricas-note">La última columna es la cantidad de publicaciones. Con pocas publicaciones por grupo, tomalo como pista y no como regla.</p>
    </section>
  );
}

// ─── Página ──────────────────────────────────────────────────────────────────
export default function MetricasClient() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [flash, setFlash] = useState(null); // { type, text }
  const [busy, setBusy] = useState(false);
  const [netFilter, setNetFilter] = useState("all");
  const [days, setDays] = useState(90);

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
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("connected")) setFlash({ type: "success", text: `${networkLabel(sp.get("connected"))} quedó conectado. Ya se leyeron los primeros datos.` });
    else if (sp.get("error")) setFlash({ type: "error", text: sp.get("error") });
    if (sp.toString()) window.history.replaceState(null, "", window.location.pathname);
  }, [load]);

  const run = useCallback(
    async (fn, okText) => {
      setBusy(true);
      setFlash(null);
      try {
        const r = await fn();
        const text = typeof okText === "function" ? okText(r) : okText;
        if (text) setFlash({ type: r?.warning ? "info" : "success", text: r?.warning ? `${text} ${r.warning}` : text });
      } catch (err) {
        setFlash({ type: "error", text: err.message });
      } finally {
        await load();
        setBusy(false);
      }
    },
    [load]
  );

  const onSync = (network) =>
    run(
      () => api("/sync", { method: "POST", body: JSON.stringify(network ? { network } : {}) }),
      (r) => {
        const failed = r.results.filter((x) => !x.ok);
        if (failed.length) throw new Error(failed.map((f) => `${networkLabel(f.network)}: ${f.error}`).join(" · "));
        const done = r.results.filter((x) => !x.skipped);
        return done.length ? `Listo: ${done.map((d) => `${networkLabel(d.network)} (${d.posts ?? 0} publicaciones)`).join(", ")}.` : "No hay redes conectadas para leer.";
      }
    );
  const onDisconnect = (network) => {
    if (!window.confirm(`¿Desconectar ${networkLabel(network)}? Los datos guardados se conservan.`)) return;
    run(() => api("/disconnect", { method: "POST", body: JSON.stringify({ network }) }), `${networkLabel(network)} quedó desconectado.`);
  };
  const onLinkedin = (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return run(
      () => api("/linkedin", { method: "POST", body: fd }),
      (r) =>
        `LinkedIn importado: ${r.follower_days} días de seguidores y ${r.posts} publicaciones${
          r.period_start ? ` (${dayLabel(r.period_start)} al ${dayLabel(r.period_end)})` : ""
        }.`
    );
  };
  const onYoutube = (channel) =>
    run(
      () => api("/youtube", { method: "POST", body: JSON.stringify({ channel }) }),
      (r) => {
        const bad = (r.sync?.results || []).find((x) => x.network === "youtube" && x.ok === false);
        if (bad) throw new Error(`Canal guardado (${r.channel.title}), pero no se pudo leer: ${bad.error}`);
        return `Canal guardado: ${r.channel.title}.`;
      }
    );
  // Devuelve true si Meta aceptó el token (para vaciar el campo).
  const onInstagramToken = async (token) => {
    setBusy(true);
    setFlash(null);
    let ok = false;
    try {
      const r = await api("/instagram/token", { method: "POST", body: JSON.stringify({ token }) });
      const bad = (r.sync?.results || []).find((x) => x.network === "instagram" && x.ok === false);
      if (bad) throw new Error(`Token guardado, pero no se pudo leer: ${bad.error}`);
      ok = true;
      setFlash({
        type: "success",
        text: `Instagram conectado${r.account?.username ? `: @${r.account.username}` : ""}${
          r.account?.followers != null ? ` (${r.account.followers} seguidores)` : ""
        }.`,
      });
    } catch (err) {
      setFlash({ type: "error", text: err.message });
    } finally {
      await load();
      setBusy(false);
    }
    return ok;
  };
  // Falla si el servidor rechaza los datos, así la ventana muestra el error y sigue abierta.
  const onLinkedinManual = async (data) => {
    setBusy(true);
    try {
      const r = await api("/linkedin/manual", { method: "POST", body: JSON.stringify(data) });
      const parts = [];
      if (r.followers) parts.push(`${r.followers.followers} seguidores al ${dayLabel(r.followers.day)}`);
      if (r.posts) parts.push(`${r.posts} ${r.posts === 1 ? "publicación" : "publicaciones"}`);
      setFlash({ type: "success", text: `LinkedIn guardado: ${parts.join(" y ")}.` });
    } finally {
      await load();
      setBusy(false);
    }
  };
  const onSaveGoal = (network, month, target) =>
    run(() => api("/goals", { method: "PUT", body: JSON.stringify({ network, month, target_followers: target }) }), "Meta guardada.");

  const pillarById = useMemo(() => Object.fromEntries((data?.pillars || []).map((p) => [p.id, p])), [data]);
  const posts = useMemo(() => {
    if (!data) return [];
    const since = Date.now() - days * DAY_MS;
    return data.posts
      .filter((p) => (netFilter === "all" || p.network === netFilter) && p.posted_at && new Date(p.posted_at).getTime() >= since)
      .map((p) => ({
        ...p,
        _title: p.content?.title || (p.caption || "").split("\n")[0].slice(0, 90) || "(sin texto)",
        _format: p.content?.format || p.media_type || null,
        _pillar: pillarById[p.content?.pillar_id] || null,
        _audience: audience(p),
        _interactions: interactions(p),
        _rate: engagementRate(p),
      }));
  }, [data, days, netFilter, pillarById]);

  const postNetworks = useMemo(() => [...new Set((data?.posts || []).map((p) => p.network))], [data]);

  return (
    <>
      <div className="adm-header">
        <h1>Métricas de redes</h1>
        <div className="mk-metricas-header-actions">
          <a className="adm-btn adm-btn-sm adm-btn-secondary" href={`${API}/weekly`} target="_blank" rel="noopener noreferrer">
            Ver resumen semanal
          </a>
          <button className="adm-btn adm-btn-sm adm-btn-primary" disabled={busy || !data} onClick={() => onSync(null)}>
            {busy ? "Trabajando…" : "Actualizar ahora"}
          </button>
        </div>
      </div>
      <div className="adm-content mk-metricas">
        {flash && (
          <div className={`adm-alert adm-alert-${flash.type}`} role="status">
            {flash.text}
            <button className="mk-metricas-flash-x" onClick={() => setFlash(null)} aria-label="Cerrar">×</button>
          </div>
        )}
        {error && <div className="adm-alert adm-alert-error">No se pudieron cargar las métricas: {error}</div>}

        {!data && !error && <div className="adm-skel mk-metricas-skel" />}

        {data && (
          <>
            <div className="mk-metricas-status-grid">
              {data.accounts.map((acc) => (
                <StatusCard
                  key={acc.network}
                  acc={acc}
                  alerts={data.alerts}
                  busy={busy}
                  onSync={onSync}
                  onDisconnect={onDisconnect}
                  onLinkedin={onLinkedin}
                  onLinkedinManual={onLinkedinManual}
                  onYoutube={onYoutube}
                  onInstagramToken={onInstagramToken}
                />
              ))}
            </div>

            <FollowersSection data={data} busy={busy} onSaveGoal={onSaveGoal} />

            <div className="mk-metricas-filters">
              <label>
                Red
                <select className="adm-input" value={netFilter} onChange={(e) => setNetFilter(e.target.value)}>
                  <option value="all">Todas</option>
                  {postNetworks.map((n) => (
                    <option key={n} value={n}>{networkLabel(n)}</option>
                  ))}
                </select>
              </label>
              <label>
                Publicadas en
                <select className="adm-input" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                  <option value={30}>Últimos 30 días</option>
                  <option value={90}>Últimos 90 días</option>
                  <option value={180}>Últimos 6 meses</option>
                  <option value={365}>Último año</option>
                </select>
              </label>
              <span className="mk-metricas-muted">{posts.length} publicaciones</span>
            </div>

            <section className="adm-card mk-metricas-section">
              <div className="mk-metricas-section-head">
                <h2 className="adm-card-title">Rendimiento por publicación</h2>
                <span className="mk-metricas-muted">Tocá un encabezado para ordenar</span>
              </div>
              <PostsTable posts={posts} />
            </section>

            <WhatWorks posts={posts} pillars={data.pillars} />

            <ComoConectar accounts={data.accounts} env={data.env} />
          </>
        )}
      </div>
    </>
  );
}
