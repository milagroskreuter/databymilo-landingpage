import Link from "next/link";
import { notFound } from "next/navigation";
import CTABlock from "../../components/sections/CTABlock";
import Footer from "../../components/sections/Footer";
import SectionDivider from "../../components/SectionDivider";
import TypeEyebrow from "../../components/primitives/TypeEyebrow";
import { getResourceBySlug, getAvailableResources } from "../../lib/resources";
import DownloadButton from "../../components/DownloadButton";

export async function generateStaticParams() {
  return getAvailableResources().map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }) {
  const resource = getResourceBySlug(params.slug);
  if (!resource) return {};
  return {
    title: resource.title,
    description: resource.desc,
    alternates: { canonical: `https://databymilo.me/recursos/${resource.slug}` },
    openGraph: {
      title: `${resource.title} | Data by Milo`,
      description: resource.desc,
      url: `https://databymilo.me/recursos/${resource.slug}`,
      images: [
        {
          url: `/og?title=${encodeURIComponent(resource.title)}&type=recurso`,
          width: 1200,
          height: 630,
          alt: `${resource.title} | Data by Milo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: [`/og?title=${encodeURIComponent(resource.title)}&type=recurso`],
    },
  };
}

function OtherResources({ currentSlug }) {
  const others = getAvailableResources().filter((r) => r.slug !== currentSlug);
  if (others.length === 0) return null;
  return (
    <aside style={{ marginTop: 72 }}>
      <div className="eyebrow-j" style={{ color: "var(--vino)", marginBottom: 18 }}>
        Otros recursos
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 18,
        }}
      >
        {others.map((r) => (
          <Link key={r.slug} href={`/recursos/${r.slug}`} style={{ textDecoration: "none" }}>
            <article
              style={{
                background: r.color || "var(--cream)",
                borderRadius: 12,
                padding: "22px 20px",
                border: "1px solid rgba(139,26,74,.12)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  color: "var(--vino)",
                  opacity: 0.7,
                }}
              >
                {r.type} · {r.pages}
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 700,
                  fontSize: 20,
                  color: "var(--ink)",
                  margin: 0,
                  lineHeight: 1.25,
                }}
              >
                {r.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "var(--fg-2)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {r.desc}
              </p>
              <span
                style={{
                  marginTop: "auto",
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: ".06em",
                  color: "var(--vino)",
                  textTransform: "uppercase",
                }}
              >
                Ver recurso →
              </span>
            </article>
          </Link>
        ))}
      </div>
    </aside>
  );
}

function ResourceJsonLd({ resource }) {
  const base = "https://databymilo.me";
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": `${base}/recursos/${resource.slug}`,
        url: `${base}/recursos/${resource.slug}`,
        name: resource.title,
        description: resource.desc,
        inLanguage: "es",
        author: {
          "@type": "Person",
          "@id": `${base}/#person`,
          name: "Milo",
          url: base,
        },
        publisher: { "@id": `${base}/#person` },
        isPartOf: { "@id": `${base}/#website` },
        ...(resource.href && {
          associatedMedia: {
            "@type": "MediaObject",
            contentUrl: `${base}${resource.href}`,
            encodingFormat: "application/pdf",
          },
        }),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: base },
          { "@type": "ListItem", position: 2, name: "La biblioteca", item: `${base}/recursos` },
          { "@type": "ListItem", position: 3, name: resource.title, item: `${base}/recursos/${resource.slug}` },
        ],
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function ResourcePage({ params }) {
  const resource = getResourceBySlug(params.slug);
  if (!resource) notFound();

  return (
    <>
      <ResourceJsonLd resource={resource} />
      <main>
        <div className="journal">
          <article className="section" style={{ maxWidth: 760, margin: "0 auto" }}>
            <Link
              href="/recursos"
              style={{
                display: "inline-block",
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: "var(--vino)",
                textDecoration: "none",
                marginBottom: 32,
              }}
            >
              ← La biblioteca
            </Link>

            <div className="section-head">
              <TypeEyebrow className="eyebrow-j">{resource.type}</TypeEyebrow>
              <div className="rule" />
              <div className="pagenum">{resource.pages}</div>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 700,
                fontSize: "clamp(36px, 5vw, 52px)",
                color: "var(--ink)",
                margin: "16px 0 32px",
                lineHeight: 1.1,
              }}
            >
              {resource.title}
            </h1>

            {resource.bullets?.length > 0 && (
              <section style={{ marginBottom: 40 }}>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: ".16em",
                    textTransform: "uppercase",
                    color: "var(--vino)",
                    marginBottom: 16,
                  }}
                >
                  Qué encontrás adentro
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                  {resource.bullets.map((b, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        gap: 12,
                        fontFamily: "var(--font-body)",
                        fontSize: 16,
                        color: "var(--ink)",
                        lineHeight: 1.55,
                      }}
                    >
                      <span style={{ color: "var(--rosa)", fontWeight: 700, flexShrink: 0, marginTop: 2 }}>✦</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {resource.forWho && (
              <section
                style={{
                  marginBottom: 40,
                  padding: "20px 24px",
                  background: "var(--rosa-50)",
                  borderRadius: 10,
                  border: "1px dashed rgba(139,26,74,.2)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: ".16em",
                    textTransform: "uppercase",
                    color: "var(--vino)",
                    marginBottom: 10,
                  }}
                >
                  Para quién es
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: 17,
                    color: "var(--ink)",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  {resource.forWho}
                </p>
              </section>
            )}

            {resource.note && (
              <blockquote
                style={{
                  borderLeft: "3px solid var(--rosa)",
                  paddingLeft: 20,
                  margin: "0 0 40px",
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: 17,
                  color: "var(--fg-2)",
                  lineHeight: 1.6,
                }}
              >
                {resource.note}
              </blockquote>
            )}

            <DownloadButton href={resource.href} title={resource.title} slug={resource.slug} />

            <div
              style={{
                marginTop: 12,
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "var(--fg-3)",
              }}
            >
              Sin registro. Sin mail. Sin letra chica.
            </div>

            <OtherResources currentSlug={resource.slug} />
          </article>

          <SectionDivider />
          <CTABlock />
        </div>
      </main>
      <Footer />
    </>
  );
}
