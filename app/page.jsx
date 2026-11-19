import Link from "next/link";
import Hero from "./components/sections/Hero";
import Newsletter from "./components/sections/Newsletter";
import Footer from "./components/sections/Footer";
import Marquee from "./components/Marquee";
import SectionDivider from "./components/SectionDivider";
import Reveal from "./components/primitives/Reveal";
import { getResources } from "./lib/resources";
import { getAllPosts } from "./lib/blog";

function AboutTeaser() {
  return (
    <section className="section">
      <div className="pag-label">pág. 04 · sobre</div>
      <Reveal>
        <h2 className="section-title">
          De no entender nada, <em>a escribirlo todo</em>.
        </h2>
      </Reveal>
      <div className="about-grid">
        <Reveal>
          <div className="about-quote">
            "Soy alguien que está adentro y tiene ganas de <em>contarlo sin filtro</em>."
          </div>
        </Reveal>
        <Reveal delay={80}>
          <p className="about-body">
            Hoy trabajo en data para una fintech del exterior, desde Buenos Aires. Antes pasé
            por una de las corpos tech más grandes de LATAM — el cuaderno nació ahí. No soy
            docente, no soy gurú. Soy alguien que está acá y tiene ganas de contarlo sin filtro
            corporativo ni motivacional.
          </p>
          <Link href="/sobre" className="link-arrow">
            Leer la historia completa →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

const lineas = [
  {
    num: "01",
    eyebrow: "Desde adentro, sin editar",
    title: "Vida en la corpo",
    desc: "Anécdotas, reuniones que podrían haber sido un mail, dinámicas internas. La diferencia entre cómo se vende trabajar en tech y cómo se vive.",
  },
  {
    num: "02",
    eyebrow: "Cosas que no se dicen en LinkedIn",
    title: "Reflexión generacional",
    desc: "La presión de definir carrera ahora. Ver amigos que se van afuera. Qué significa tener un buen trabajo hoy.",
  },
  {
    num: "03",
    eyebrow: "Cuando vale la pena explicar",
    title: "Explicativo accesible",
    desc: "SQL, BI, Python, IA: conceptos explicados como a una amiga en un café, no como en un tutorial de YouTube.",
  },
  {
    num: "04",
    eyebrow: "Para abrir el lunes",
    title: "Herramientas & data",
    desc: "Lo que tengo abierto en la compu, lo que probé y descarté, y lo que vale la pena aprender antes de tu próxima entrevista.",
  },
];

function LineasSection() {
  return (
    /* full-bleed: fuera del journal wrapper */
    <section className="lineas-section" style={{ padding: "80px 0" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 40px" }}>
        <div className="pag-label">pág. 12 · las cuatro líneas</div>
        <Reveal>
          <h2 className="section-title">
            Lo que vive en <em>este cuaderno</em>.
          </h2>
          <p className="section-intro">Todo lo que cuento acá cae en alguna de estas cuatro.</p>
        </Reveal>
        <div className="lineas-grid">
          {lineas.map((l, i) => (
            <Reveal key={i} delay={i * 60}>
              <div className="linea">
                <div className="linea-num">{l.num}</div>
                <div className="linea-eyebrow">{l.eyebrow}</div>
                <h4>{l.title}</h4>
                <p>{l.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

async function ResourcesTeaser() {
  let featured = [];
  try { featured = (await getResources()).filter((r) => r.slug).slice(0, 3); } catch { return null; }
  const nums = ["01", "02", "03"];
  return (
    <section className="section">
      <div className="pag-label">pág. 20 · la biblioteca</div>
      <Reveal>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            La <em>biblioteca</em>.
          </h2>
          <div className="guarda-stamp">★ GUARDA ESTO</div>
        </div>
        <p className="section-intro" style={{ marginTop: 20 }}>
          Tres descargas para empezar. Sin mail, sin pop-up, sin letra chica.
        </p>
      </Reveal>
      <div className="biblioteca-grid">
        {featured.map((r, i) => (
          <Reveal key={i} delay={i * 60}>
            <Link href={`/recursos/${r.slug}`} style={{ textDecoration: "none", display: "block", height: "100%" }}>
              <div className="recurso">
                <div className="recurso-ribbon"><span>GRATIS</span></div>
                <div className="recurso-header">
                  <div className="recurso-num-badge">{nums[i]}</div>
                  <div className="recurso-meta">
                    <div className="recurso-type">{r.type || "Guía"}</div>
                    <div className="recurso-pages">{r.pages || "PDF"}</div>
                  </div>
                </div>
                <div className="recurso-body">
                  <div className="recurso-title">{r.title}</div>
                  <p className="recurso-desc">{r.desc}</p>
                  <span className="recurso-cta">Ver recurso →</span>
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
      <Reveal delay={180}>
        <div style={{ marginTop: 32, display: "flex", justifyContent: "center" }}>
          <Link href="/recursos" className="btn btn-ghost">
            Ver toda la biblioteca →
          </Link>
        </div>
      </Reveal>

      {/* Destacados — recurso pago destacado */}
      <div className="destacados">
        <div className="destacados-header">
          <div className="destacados-eyebrow">✦ Destacados ✦</div>
          <div className="destacados-label">NUEVA GUÍA</div>
        </div>
        <div className="destacado-card">
          <div className="destacado-visual">
            <div className="destacado-type">Guía · PDF · 35 páginas</div>
            <div className="destacado-vtitle">
              Presentar data<br />sin <em>morir</em>.
            </div>
            <div className="destacado-vbottom">
              <span>Nº 04</span>
              <span>USD 7</span>
            </div>
          </div>
          <div className="destacado-body">
            <div className="destacado-meta">★ Nueva guía</div>
            <h3 className="destacado-title">
              Cómo presentar data a stakeholders no técnicos sin morir en el intento.
            </h3>
            <p className="destacado-desc" style={{ color: "var(--rosa)" }}>
              El sistema concreto para que tu próximo readout sea entendido a la primera, accionado por tu equipo y recordado después de la reunión.
            </p>
            <Link href="/recursos/presentar-a-stakeholders" className="destacado-cta">
              Ver la guía →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

async function BlogTeaser() {
  let latestPosts = [];
  try { latestPosts = (await getAllPosts()).slice(0, 3); } catch { return null; }
  return (
    <section className="section">
      <div className="pag-label">pág. 36 · el blog</div>
      <Reveal>
        <h2 className="section-title">
          Historias largas <em>en el blog</em>.
        </h2>
        <p className="section-intro">
          Cuando algo no entra en un post. Sobre la corpo, la IA en las empresas y la carrera en tech.
        </p>
      </Reveal>
      {latestPosts.length > 0 && (
        <Reveal delay={80}>
          <div className="blog-list">
            {latestPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-entry">
                <div className="blog-entry-meta">
                  <span className="num">Nº {post.entradaStr}</span>
                  {post.date && (
                    <span>
                      {new Date(post.date).toLocaleDateString("es-AR", { day: "numeric", month: "long" })}
                    </span>
                  )}
                </div>
                <div>
                  <h3>{post.title}</h3>
                  {post.excerpt && <p>{post.excerpt}</p>}
                </div>
                <span className="blog-arrow">Leer →</span>
              </Link>
            ))}
          </div>
        </Reveal>
      )}
      <Reveal delay={180}>
        <div style={{ marginTop: 40 }}>
          <Link href="/blog" className="link-arrow">
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
        {/* Hero: full-bleed (fuera del journal) */}
        <Hero />
        <Marquee />
        <div className="journal">
          <AboutTeaser />
          <SectionDivider />
        </div>
        {/* LineasSection: full-bleed (fuera del journal) */}
        <LineasSection />
        <div className="journal">
          <SectionDivider />
          <ResourcesTeaser />
          <SectionDivider />
          <Newsletter />
          <SectionDivider />
          <BlogTeaser />
        </div>
      </main>
      <Footer />
    </>
  );
}
