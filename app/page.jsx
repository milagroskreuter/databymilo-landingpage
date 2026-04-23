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
          En 2021 entré a mi primer trabajo de analista y no entendía nada. Todos hablaban
          en siglas — SQL, KPI, ETL — y yo asentía como si supiera. Así empecé a escribir
          lo que iba aprendiendo, en español, como si le explicara a una amiga.
        </p>
        <Link href="/sobre" className="btn btn-ghost">
          Leer la historia completa →
        </Link>
      </Reveal>
    </section>
  );
}

function ResourcesTeaser() {
  const featured = resources.slice(0, 3);
  return (
    <section className="section">
      <div className="section-head">
        <TypeEyebrow className="eyebrow-j">Capítulo 03</TypeEyebrow>
        <div className="rule"></div>
        <div className="pagenum">pág. 20</div>
      </div>
      <Reveal>
        <h2 className="section-title">
          La <em>biblioteca</em>.
        </h2>
        <p className="section-sub">Cheatsheets, plantillas y guías — todo gratis, todo en español.</p>
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
            <div
              style={{
                background: r.color,
                borderRadius: 14,
                padding: "28px 24px",
                border: "1px solid rgba(139,26,74,.1)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
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
                  margin: 0,
                }}
              >
                {r.desc}
              </p>
            </div>
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
  return (
    <section className="section">
      <Reveal>
        <div
          style={{
            background: "var(--rosa-50)",
            borderRadius: 16,
            padding: "44px 36px",
            textAlign: "center",
            border: "1px dashed rgba(139,26,74,.18)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-caveat)",
              fontSize: 24,
              color: "var(--vino)",
              transform: "rotate(-2deg)",
              marginBottom: 6,
            }}
          >
            ✦ próximamente ✦
          </div>
          <h2
            className="display italic"
            style={{
              fontSize: "clamp(28px, 3.2vw, 36px)",
              color: "var(--vino)",
              margin: "0 0 12px",
              lineHeight: 1.15,
            }}
          >
            Historias largas <em>en el blog</em>.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 17,
              color: "var(--ink)",
              margin: "0 auto 24px",
              maxWidth: 520,
              lineHeight: 1.55,
            }}
          >
            Explicaciones que no entran en un reel. Casos reales, errores que cometí y data traducida.
          </p>
          <Link href="/blog" className="btn btn-ghost">
            Ver el blog →
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
