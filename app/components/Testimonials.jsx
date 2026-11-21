// Testimonios aprobados (área Comunidad de Marketing). Server component.
//
//   <Testimonials />                                  → los últimos, destacados primero
//   <Testimonials product="presentar-a-stakeholders" /> → solo los de ese recurso
//   <Testimonials items={lista} />                    → si ya los leíste con getApprovedTestimonials()
//
// Si no hay ninguno aprobado no muestra nada (no deja una sección vacía).
import { getApprovedTestimonials } from "@/lib/marketing/community/testimonials";
import "./Testimonials.css";

const ROTATIONS = ["-1.2deg", "0.8deg", "-0.4deg", "1.4deg", "-0.9deg", "0.5deg"];

export default async function Testimonials({
  items,
  product,
  featuredOnly = false,
  limit = 6,
  eyebrow = "Lo que dicen",
  title = "Palabras de",
  titleAccent = "la comunidad",
  showCta = true,
}) {
  const list = items ?? (await getApprovedTestimonials({ product, featuredOnly, limit }));
  if (!list?.length) return null;

  return (
    <section className="mk-comunidad-tst" aria-label="Testimonios">
      <div className="mk-comunidad-tst-head">
        <span className="eyebrow-j">{eyebrow}</span>
        <h2 className="mk-comunidad-tst-title">
          {title} <em>{titleAccent}</em>
        </h2>
      </div>

      <div className="mk-comunidad-tst-grid">
        {list.map((t, i) => (
          <figure
            key={t.id}
            className={`mk-comunidad-tst-card${t.featured ? " is-featured" : ""}`}
            style={{ "--tst-rot": ROTATIONS[i % ROTATIONS.length] }}
          >
            <span className="mk-comunidad-tst-mark" aria-hidden="true">“</span>
            <blockquote className="mk-comunidad-tst-quote">{t.text}</blockquote>
            <figcaption className="mk-comunidad-tst-who">
              {t.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="mk-comunidad-tst-photo" src={t.photoUrl} alt="" loading="lazy" width={44} height={44} />
              ) : (
                <span className="mk-comunidad-tst-photo is-initial" aria-hidden="true">
                  {t.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="mk-comunidad-tst-meta">
                {t.socialUrl ? (
                  <a href={t.socialUrl} target="_blank" rel="noopener noreferrer nofollow" className="mk-comunidad-tst-name">
                    {t.name}
                  </a>
                ) : (
                  <span className="mk-comunidad-tst-name">{t.name}</span>
                )}
                {t.relation && <span className="mk-comunidad-tst-rel">{t.relation}</span>}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      {showCta && (
        <p className="mk-comunidad-tst-cta">
          ¿Te sirvió algo de lo que hago? <a href="/testimonio">Dejame tu testimonio →</a>
        </p>
      )}
    </section>
  );
}
