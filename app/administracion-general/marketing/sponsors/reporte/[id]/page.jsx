"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { networkLabel } from "@/lib/marketing/constants";
import { formatMoney, shortDate } from "@/lib/marketing/sponsors/constants";
import { api } from "../../ui";
import "../../sponsors.css";

const nf = (n) => (n === null || n === undefined ? "—" : Number(n).toLocaleString("es-AR"));
const pct = (n) => (n === null || n === undefined ? "—" : `${(n * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`);

export default function ReportPage() {
  const { id } = useParams();
  const [r, setR] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Reporte de campaña";
    api(`deals/${id}/report`).then((x) => { setR(x); document.title = `Reporte · ${x.deal.brand}`; }).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="adm-content"><div className="adm-alert adm-alert-error">{error}</div></div>;
  if (!r) return <div className="adm-content"><div className="adm-skel" style={{ height: 300 }} /></div>;

  const { deal, pieces, slots, totals, shortLinks } = r;
  const withData = pieces.filter((p) => p.hasMetrics);
  const dates = pieces.map((p) => p.published_at || p.scheduled_at).filter(Boolean).sort();
  const period = dates.length ? (dates[0].slice(0, 10) === dates[dates.length - 1].slice(0, 10) ? shortDate(dates[0]) : `${shortDate(dates[0])} – ${shortDate(dates[dates.length - 1])}`) : null;

  const cards = [
    { label: "Piezas", value: nf(pieces.length), show: true },
    { label: "Alcance", value: nf(totals.reach), show: totals.reach !== null },
    { label: "Impresiones", value: nf(totals.impressions), show: totals.impressions !== null },
    { label: "Reproducciones", value: nf(totals.views), show: totals.views !== null },
    { label: "Interacciones", value: nf(totals.interactions), show: totals.interactions !== null },
    { label: "Engagement", value: pct(totals.engagement), show: totals.engagement !== null },
    { label: "Clicks en links", value: nf(totals.linkClicks), show: totals.linkClicks !== undefined },
  ].filter((c) => c.show);

  const cols = [
    ["reach", "Alcance"], ["impressions", "Impr."], ["views", "Repr."], ["likes", "Likes"], ["comments", "Coment."], ["saves", "Guard."], ["shares", "Compart."], ["clicks", "Clicks"],
  ].filter(([k]) => totals[k] !== null && totals[k] !== undefined);

  return (
    <>
      <div className="adm-header">
        <h1>Reporte de campaña</h1>
      </div>
      <div className="adm-content">
        <div className="mk-sponsors-report-bar">
          <Link href="/administracion-general/marketing/sponsors" className="adm-btn adm-btn-secondary">← Volver a Sponsors</Link>
          <span className="mk-sponsors-hint">Para guardarlo como PDF: Imprimir → Destino “Guardar como PDF”.</span>
          <button className="adm-btn adm-btn-primary" onClick={() => window.print()}>Imprimir / guardar PDF</button>
        </div>

        <article className="mk-sponsors-report">
          <div className="eyebrow">Data by Milo · Reporte post-campaña</div>
          <h1>{deal.brand}</h1>
          <p className="period">
            {period ? `Campaña: ${period}` : "Sin fechas de publicación todavía"}
            {deal.amount !== null && deal.amount !== undefined ? ` · Acuerdo: ${formatMoney(deal.amount, deal.currency)}` : ""}
          </p>

          <h2>Resultados</h2>
          <div className="totals">
            {cards.map((c) => (
              <div key={c.label} className="total"><b>{c.value}</b><span>{c.label}</span></div>
            ))}
          </div>
          {!withData.length && pieces.length > 0 && (
            <p className="note">Todavía no hay métricas cargadas para estas piezas. Aparecen solas cuando se sincroniza la red o se importan las estadísticas.</p>
          )}

          <h2>Piezas publicadas</h2>
          {!pieces.length ? (
            <p className="note">No hay piezas asociadas a este acuerdo. Asocialas desde la ficha de la marca, en Sponsors.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Pieza</th><th>Red</th><th>Fecha</th>
                  {cols.map(([k, l]) => <th key={k} className="n">{l}</th>)}
                </tr>
              </thead>
              <tbody>
                {pieces.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.permalink ? <a href={p.permalink} target="_blank" rel="noreferrer">{p.title}</a> : p.title}
                      {!p.hasMetrics && <div className="mk-sponsors-sub">Sin métricas todavía</div>}
                    </td>
                    <td>{networkLabel(p.network)}</td>
                    <td>{p.published_at ? shortDate(p.published_at) : p.scheduled_at ? `Prog. ${shortDate(p.scheduled_at)}` : "—"}</td>
                    {cols.map(([k]) => <td key={k} className="n">{nf(p.metrics[k])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {shortLinks && shortLinks.length > 0 && (
            <>
              <h2>Clicks en links</h2>
              <table>
                <thead><tr><th>Link</th><th className="n">Clicks</th><th className="n">Personas únicas</th></tr></thead>
                <tbody>
                  {shortLinks.map((l) => (
                    <tr key={l.id}>
                      <td>{l.title} <span className="mk-sponsors-sub">databymilo.me/go/{l.slug}</span></td>
                      <td className="n">{nf(l.clicks)}</td>
                      <td className="n">{nf(l.unique)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="note">No se cuentan los clicks de bots.</p>
            </>
          )}

          {slots.length > 0 && (
            <>
              <h2>Espacios contratados</h2>
              <table>
                <thead><tr><th>Fecha</th><th>Canal</th><th>Formato</th><th className="n">Precio</th></tr></thead>
                <tbody>
                  {slots.map((s) => (
                    <tr key={s.id}>
                      <td>{shortDate(s.slot_date)}</td>
                      <td style={{ textTransform: "capitalize" }}>{s.channel}</td>
                      <td>{s.format || "—"}</td>
                      <td className="n">{s.price !== null ? formatMoney(s.price, s.currency) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <div className="foot">
            <span>databymilo.me</span>
            <span>Datos al {shortDate(r.generatedAt)}. Las métricas son las últimas registradas en cada red.</span>
          </div>
        </article>
      </div>
    </>
  );
}
