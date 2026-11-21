"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NETWORK_BY_ID, FORMAT_BY_ID, networkLabel } from "@/lib/marketing/constants";
import { interactions, audience, engagementRate, arWeekdayHour } from "@/lib/marketing/metrics/calc";
import ComoConectar from "./ComoConectar";
import LinkedinManual from "./LinkedinManual";
import { netColor, periodStart } from "./fmt";
import { ResumenTiles, CompararRedes } from "./Resumen";
import Evolucion from "./Evolucion";
import Posteos from "./Posteos";
import QueFunciona from "./QueFunciona";
import "./metricas.css";
import "./metricas-charts.css";

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

// ─── Página ──────────────────────────────────────────────────────────────────
export default function MetricasClient() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [flash, setFlash] = useState(null); // { type, text }
  const [busy, setBusy] = useState(false);
  const [pickedNets, setPickedNets] = useState([]); // vacío = todas
  const [days, setDays] = useState(30);

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

  // Todas las publicaciones ya con sus números calculados (alcance, interacciones, tasa).
  const enriched = useMemo(
    () =>
      (data?.posts || [])
        .filter((p) => p.posted_at)
        .map((p) => ({
          ...p,
          _t: new Date(p.posted_at).getTime(),
          _title: p.content?.title || (p.caption || "").split("\n")[0].slice(0, 90) || "(sin texto)",
          _format: p.content?.format || p.media_type || null,
          _pillar: pillarById[p.content?.pillar_id] || null,
          _audience: audience(p),
          _interactions: interactions(p),
          _rate: engagementRate(p),
        })),
    [data, pillarById]
  );

  // Redes con algún dato (seguidores o publicaciones), en el orden de las tarjetas.
  const dataNets = useMemo(() => {
    if (!data) return [];
    const has = new Set([...data.snapshots.map((s) => s.network), ...data.posts.map((p) => p.network)]);
    return data.accounts.map((a) => a.network).filter((n) => has.has(n));
  }, [data]);
  const nets = pickedNets.length ? dataNets.filter((n) => pickedNets.includes(n)) : dataNets;

  const posts = useMemo(() => {
    const since = Date.now() - days * DAY_MS;
    return enriched.filter((p) => nets.includes(p.network) && p._t >= since);
  }, [enriched, nets, days]);
  const prevPosts = useMemo(() => {
    const to = Date.now() - days * DAY_MS;
    const from = to - days * DAY_MS;
    return enriched.filter((p) => nets.includes(p.network) && p._t >= from && p._t < to);
  }, [enriched, nets, days]);

  const toggleNet = (n) => setPickedNets((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n]));

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
            {/* Una tarjeta por red: estado, último dato y acciones (pegar token, cargar LinkedIn a mano, etc.) */}
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

            {/* Filtros: valen para todo lo de abajo */}
            <div className="mk-metricas-filterbar">
              <div className="mk-metricas-filtergroup">
                <span className="mk-metricas-filterlabel">Período</span>
                <div className="mk-metricas-seg">
                  {[[7, "7 días"], [30, "30 días"], [90, "90 días"], [365, "1 año"]].map(([d, label]) => (
                    <button key={d} className={days === d ? "on" : ""} onClick={() => setDays(d)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {dataNets.length > 1 && (
                <div className="mk-metricas-filtergroup">
                  <span className="mk-metricas-filterlabel">Redes</span>
                  <div className="mk-metricas-chips">
                    {dataNets.map((n) => (
                      <button key={n} className={pickedNets.includes(n) ? "on" : ""} onClick={() => toggleNet(n)} aria-pressed={pickedNets.includes(n)}>
                        <i style={{ background: netColor(n) }} />
                        {networkLabel(n)}
                      </button>
                    ))}
                    {pickedNets.length > 0 && (
                      <button className="mk-metricas-clearchip" onClick={() => setPickedNets([])}>Ver todas</button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {!dataNets.length ? (
              <section className="adm-card mk-metricas-section">
                <h2 className="adm-card-title">Todavía no hay datos</h2>
                <p className="mk-metricas-muted">
                  Conectá una red o cargá LinkedIn en las tarjetas de cada red, arriba de todo. Apenas haya datos, acá
                  vas a ver los números, los gráficos y las comparaciones.
                </p>
              </section>
            ) : (
              <>
                <ResumenTiles data={data} nets={nets} posts={posts} prevPosts={prevPosts} days={days} />
                <CompararRedes data={data} nets={nets} posts={posts} />
                <Evolucion data={data} nets={nets} days={days} busy={busy} onSaveGoal={onSaveGoal} />
                <Posteos posts={posts} tableSlot={<PostsTable posts={posts} />} />
                <QueFunciona posts={posts} pillars={data.pillars} />

                <details className="mk-metricas-glossary">
                  <summary>¿Qué significa cada número?</summary>
                  <dl>
                    <dt>Alcance</dt>
                    <dd>Cuántas personas distintas vieron una publicación. En LinkedIn y YouTube la red informa impresiones o vistas, que cuentan cada vez que se mostró.</dd>
                    <dt>Interacciones</dt>
                    <dd>Likes, comentarios, guardados y compartidos sumados.</dd>
                    <dt>Tasa de interacción</dt>
                    <dd>Interacciones divididas por el alcance. Dice si la gente que te ve reacciona, sin importar cuántos te vean: sirve para comparar publicaciones grandes y chicas.</dd>
                    <dt>Guardados y compartidos</dt>
                    <dd>Son las señales más fuertes: alguien decidió volver a verlo o mandárselo a otra persona.</dd>
                  </dl>
                </details>
              </>
            )}

            <div id="conexiones">
              <ComoConectar accounts={data.accounts} env={data.env} />
            </div>
          </>
        )}
      </div>
    </>
  );
}
