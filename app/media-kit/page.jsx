import Link from "next/link";
import Reveal from "../components/primitives/Reveal";
import SectionDivider from "../components/SectionDivider";
import Footer from "../components/sections/Footer";
import { getMediaKitData } from "@/lib/marketing/sponsors/mediaKit";
import { formatMoney } from "@/lib/marketing/sponsors/constants";
import "./media-kit.css";

// Se vuelve a calcular cada 6 horas, o apenas se edita desde el hub.
export const revalidate = 21600;

const PAGE_URL = "https://databymilo.me/media-kit";
const nf = (n) => Number(n).toLocaleString("es-AR");
const compact = (n) =>
  n >= 10000 ? `${(n / 1000).toLocaleString("es-AR", { maximumFractionDigits: 1 })} mil` : nf(n);
const pct = (n) => `${(n * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`;

export async function generateMetadata() {
  const { config } = await getMediaKitData();
  const description = config.hero_sub || "Media kit de Data by Milo: audiencia, formatos de colaboración y contacto.";
  return {
    title: "Media kit",
    description,
    alternates: { canonical: PAGE_URL },
    robots: config.indexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title: "Media kit | Data by Milo",
      description,
      url: PAGE_URL,
      images: [{ url: "/og?title=Media%20kit&type=data%20by%20milo", width: 1200, height: 630, alt: "Media kit | Data by Milo" }],
    },
  };
}

function priceText(r) {
  if (r.price === null || r.price === undefined) return "A consultar";
  const from = formatMoney(r.price, r.currency);
  return r.price_to ? `${from} – ${formatMoney(r.price_to, r.currency).replace(`${r.currency} `, "")}` : from;
}

export default async function MediaKitPage() {
  const { config: c, stats, rates, brands, generatedAt } = await getMediaKitData();
  const show = c.show;

  // Tarjetas de números: solo las que tienen datos.
  const cards = [];
  if (stats.totalFollowers && stats.followers?.length > 1) {
    cards.push({ key: "total", value: compact(stats.totalFollowers), label: "Seguidores en total", sub: `en ${stats.followers.length} redes` });
  }
  for (const f of stats.followers || []) {
    cards.push({
      key: f.network,
      value: compact(f.followers),
      label: `Seguidores en ${f.label}`,
      sub: f.growth30 !== null && f.growth30 > 0 ? `+${pct(f.growth30)} en 30 días` : null,
    });
  }
  if (stats.engagement) {
    cards.push({
      key: "eng",
      value: pct(stats.engagement.rate),
      label: "Engagement promedio",
      sub: `${stats.engagement.posts} publicaciones, últimos ${stats.engagement.days} días`,
    });
  }
  if (stats.newsletter) {
    cards.push({ key: "nl", value: compact(stats.newsletter.subscribers), label: "Suscriptoras a la newsletter", sub: "La carta del domingo y más" });
  }
  if (stats.visits) {
    cards.push({
      key: "visits",
      value: compact(stats.visits.visitors),
      label: "Visitantes al sitio",
      sub: `últimos ${stats.visits.days} días`,
    });
  }

  const contactHref = c.contact_email
    ? `mailto:${c.contact_email}?subject=${encodeURIComponent("Colaboración con Data by Milo")}`
    : null;
  const hasAudience = show.audience && (c.audience_text || c.audience_points.length);
  const hasFormats = show.collab_formats && c.collab_formats.length > 0;
  const hasRates = show.rates && rates.length > 0;
  const hasBrands = show.brands && brands.length > 0;

  return (
    <>
      <main className="mk-kit">
        <div className="journal">
          <section className="section">
            <div className="pag-label">media kit</div>
            <Reveal>
              <h1 className="section-title">{c.hero_title}</h1>
              {c.hero_sub && <p className="section-intro" style={{ marginBottom: 28 }}>{c.hero_sub}</p>}
            </Reveal>
            <div className="mk-kit-cta">
              {contactHref && <a className="btn btn-primary" href={contactHref}>{c.contact_cta || "Escribime"} →</a>}
              {c.booking_url && <a className="btn btn-ghost" href={c.booking_url} target="_blank" rel="noopener noreferrer">Agendar una llamada</a>}
            </div>
          </section>

          {cards.length > 0 && (
            <section className="mk-kit-block" aria-label="Números">
              <div className="mk-kit-stats">
                {cards.map((s, i) => (
                  <Reveal key={s.key} delay={i * 40}>
                    <div className="mk-kit-stat">
                      <b>{s.value}</b>
                      <span>{s.label}</span>
                      {s.sub && <em>{s.sub}</em>}
                    </div>
                  </Reveal>
                ))}
              </div>
              <p className="mk-kit-updated">
                Números actualizados el {new Date(generatedAt).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" })}.
              </p>
            </section>
          )}

          {c.about && (
            <section className="mk-kit-block">
              <div className="pag-label">quién soy</div>
              <Reveal><p className="mk-kit-about">{c.about}</p></Reveal>
            </section>
          )}

          {c.topics.length > 0 && (
            <section className="mk-kit-block">
              <div className="pag-label">de qué hablo</div>
              <div className="mk-kit-grid">
                {c.topics.map((t, i) => (
                  <Reveal key={t.title} delay={i * 50}>
                    <div className="linea">
                      <div className="linea-num">{String(i + 1).padStart(2, "0")}</div>
                      <h4>{t.title}</h4>
                      {t.desc && <p>{t.desc}</p>}
                    </div>
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          {hasAudience && (
            <section className="mk-kit-block">
              <div className="pag-label">la audiencia</div>
              <Reveal>
                {c.audience_text && <p className="mk-kit-about">{c.audience_text}</p>}
                {c.audience_points.length > 0 && (
                  <ul className="mk-kit-points">
                    {c.audience_points.map((p) => <li key={p}>{p}</li>)}
                  </ul>
                )}
              </Reveal>
            </section>
          )}

          {hasFormats && (
            <section className="mk-kit-block">
              <div className="pag-label">cómo podemos trabajar juntas</div>
              <div className="mk-kit-grid">
                {c.collab_formats.map((f, i) => (
                  <Reveal key={f.title} delay={i * 50}>
                    <div className="card mk-kit-format">
                      <h4>{f.title}</h4>
                      {f.desc && <p>{f.desc}</p>}
                    </div>
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          {hasRates && (
            <section className="mk-kit-block">
              <div className="pag-label">tarifas</div>
              <Reveal>
                <div className="card mk-kit-rates">
                  {rates.map((r) => (
                    <div key={r.id} className="mk-kit-rate">
                      <div>
                        <strong>{r.name}</strong>
                        {r.description && <p>{r.description}</p>}
                      </div>
                      <span>{priceText(r)}</span>
                    </div>
                  ))}
                </div>
                {c.rates_note && <p className="mk-kit-updated" style={{ textAlign: "left" }}>{c.rates_note}</p>}
              </Reveal>
            </section>
          )}

          {hasBrands && (
            <section className="mk-kit-block">
              <div className="pag-label">marcas con las que trabajé</div>
              <Reveal>
                <ul className="mk-kit-brands">
                  {brands.map((b) => (
                    <li key={b.name}>
                      {b.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.logo} alt={b.name} loading="lazy" />
                      ) : (
                        <span>{b.name}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </section>
          )}

          {(contactHref || c.contact_text) && (
            <>
              <SectionDivider />
              <section className="mk-kit-block mk-kit-contact">
                <Reveal>
                  <h2 className="section-title">Hablemos<em>.</em></h2>
                  {c.contact_text && <p className="section-intro" style={{ marginBottom: 24 }}>{c.contact_text}</p>}
                  <div className="mk-kit-cta">
                    {contactHref && <a className="btn btn-primary" href={contactHref}>{c.contact_cta || "Escribime"} →</a>}
                    {c.booking_url && <a className="btn btn-ghost" href={c.booking_url} target="_blank" rel="noopener noreferrer">Agendar una llamada</a>}
                    <Link href="/sobre" className="link-arrow">Conocer más sobre Milo →</Link>
                  </div>
                  {c.contact_email && <p className="mk-kit-updated" style={{ textAlign: "left", marginTop: 14 }}>{c.contact_email}</p>}
                </Reveal>
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
