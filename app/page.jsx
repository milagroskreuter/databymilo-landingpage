import Link from "next/link";
import Hero from "./components/sections/Hero";
import Highlights from "./components/sections/Highlights";
import CTABlock from "./components/sections/CTABlock";
import Footer from "./components/sections/Footer";
import Marquee from "./components/Marquee";
import SectionDivider from "./components/SectionDivider";
import Reveal from "./components/primitives/Reveal";
import TypeEyebrow from "./components/primitives/TypeEyebrow";
import { resources } from "./lib/resources";
import { getAllPosts } from "./lib/blog";

function AboutTeaser() {
  return (
    <section className="section">
      <div className="section-head">
        <TypeEyebrow className="eyebrow-j">Capítulo 01</TypeEyebrow>
        <div className="rule"></div>
        <div className="pagenum">pág. 04</div>
      </div>
      <Reveal>
        <h2 className="section-title">
          De no entender nada, <em>a escribirlo todo</em>.
        </h2>
        <p className="section-sub">La historia corta de por qué existe este cuaderno.</p>
      </Reveal>
      <Reveal delay={100}>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: "clamp(18px, 2vw, 22px)",
            lineHeight: 1.6,
            maxWidth: 680,
            margin: "40px 0 28px",
            color: "var(--ink)",
          }}
        >
          Trabajo en una de las corporaciones tech más grandes de LATAM. Lo que escribo acá
          lo estoy viendo en tiempo real. No soy docente, no soy gurú. Soy alguien que está
          ahí y tiene ganas de contarlo sin filtro corporativo ni filtro motivacional.
        </p>
        <Link href="/sobre" className="btn btn-ghost">
          Leer la historia completa →
        </Link>
      </Reveal>
    </section>
  );
}

function ResourcesTeaser() {
  const featured = resources.filter((r) => r.slug).slice(0, 3);
  return (
    <section className="section">
      <div className="section-head">
        <TypeEyebrow className="eyebrow-j">Capítulo 02</TypeEyebrow>
        <div className="rule"></div>
        <div className="pagenum">pág. 20</div>
      </div>
      <Reveal>
        <h2 className="section-title">
          La <em>biblioteca</em>.
        </h2>
        <p className="section-sub">SQL, BI, Python, IA: conceptos explicados como a una amiga en un café. Todo en español, todo para descargar.</p>
      </Reveal>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
          marginTop: 48,
        }}
      >
        {featured.map((r, i) => (
          <Reveal key={i} delay={i * 60}>
            <Link
              href={`/recursos/${r.slug}`}
              style={{ textDecoration: "none", display: "block", height: "100%" }}
            >
              <div
                style={{
                  background: r.color,
                  borderRadius: 14,
                  padding: "28px 24px",
                  border: "1px solid rgba(139,26,74,.1)",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform .15s ease, box-shadow .15s ease",
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
                    opacity: 0.75,
                    marginBottom: 10,
                  }}
                >
                  {r.type} · {r.pages}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontWeight: 700,
                    fontSize: 22,
                    color: "var(--ink)",
                    margin: "0 0 10px",
                    lineHeight: 1.2,
                  }}
                >
                  {r.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    lineHeight: 1.55,
                    color: "var(--fg-2)",
                    margin: "0 0 auto",
                  }}
                >
                  {r.desc}
                </p>
                <span
                  style={{
                    marginTop: 16,
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
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
      <Reveal delay={240}>
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <Link href="/recursos" className="btn btn-primary">
            Ver todos los recursos →
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

function BlogTeaser() {
  const latestPosts = getAllPosts().slice(0, 2);
  return (
    <section className="section">
      <div className="section-head">
        <TypeEyebrow className="eyebrow-j">Capítulo 03</TypeEyebrow>
        <div className="rule"></div>
        <div className="pagenum">pág. 36</div>
      </div>
      <Reveal>
        <h2 className="section-title">
          Historias largas <em>en el blog</em>.
        </h2>
        <p className="section-sub">Cuando algo no entra en un post. Sobre la corpo, la IA en las empresas y la carrera en tech.</p>
      </Reveal>
      {latestPosts.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginTop: 48,
          }}
        >
          {latestPosts.map((post, i) => (
            <Reveal key={post.slug} delay={i * 80}>
              <Link href={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
                <article
                  style={{
                    background: "var(--cream)",
                    borderRadius: 14,
                    padding: "28px 32px",
                    border: "1px solid rgba(139,26,74,.12)",
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
                    Entrada Nº {post.entradaStr}
                    {post.date && (
                      <span style={{ opacity: 0.6, fontWeight: 400, marginLeft: 10 }}>
                        · {new Date(post.date).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    )}
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontWeight: 700,
                      fontSize: "clamp(20px, 2.2vw, 26px)",
                      color: "var(--ink)",
                      margin: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 14,
                        color: "var(--fg-2)",
                        margin: 0,
                        lineHeight: 1.6,
                      }}
                    >
                      {post.excerpt}
                    </p>
                  )}
                  <span
                    style={{
                      marginTop: 4,
                      fontFamily: "var(--font-body)",
                      fontWeight: 700,
                      fontSize: 11,
                      letterSpacing: ".06em",
                      color: "var(--vino)",
                      textTransform: "uppercase",
                    }}
                  >
                    Leer →
                  </span>
                </article>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
      <Reveal delay={200}>
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Link href="/blog" className="btn btn-ghost">
            Ver todas las entradas →
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

export default function Page() {
  return (
    <>
      <main>
        <div className="journal">
          <Hero />
        </div>
        <Marquee />
        <div className="journal">
          <AboutTeaser />
          <SectionDivider />
          <Highlights />
          <SectionDivider />
          <ResourcesTeaser />
          <SectionDivider />
          <BlogTeaser />
          <SectionDivider />
          <CTABlock />
        </div>
      </main>
      <Footer />
    </>
  );
}
