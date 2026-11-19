import Link from "next/link";
import FAQAccordion from "../../components/FAQAccordion";
import CTABlock from "../../components/sections/CTABlock";
import Footer from "../../components/sections/Footer";
import { getResources } from "../../lib/resources";

const TITLE = "Método Imán: aprendé a usar LinkedIn para conseguir tu trabajo soñado";
const DESCRIPTION =
  "La guía de 84 páginas con el método que usé para conseguir mis primeros 3 trabajos como analista: un perfil que los reclutadores encuentran, entienden y quieren contactar.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://databymilo.me/recursos/metodo-iman" },
  openGraph: {
    title: `${TITLE} | Data by Milo`,
    description: DESCRIPTION,
    url: "https://databymilo.me/recursos/metodo-iman",
    images: [{ url: "/metodo-iman/portada.webp", width: 909, height: 1286, alt: "Portada del ebook Método Imán" }],
  },
};

const PAYMENT_URL = "https://pay.hotmart.com/T108565657M";
const PRICE = "USD 15";
const CTA_LABEL = "¡QUIERO EL MÉTODO IMÁN!";

const D = "var(--font-display)";
const B = "var(--font-body)";

export default async function Page() {
  const resources = await getResources().catch(() => []);
  return (
    <>
      <main style={{ background: "var(--cream)" }}>
        <HeroSection />
        <TrustBar />
        <ProblemSection />
        <BeforeAfterSection />
        <StorySection />
        <ForYouSection />
        <LearnSection />
        <InsideSection />
        <ContentsSection />
        <AboutSection />
        <PricingSection />
        <GuaranteeSection />
        <FAQSection />
        <FinalCTASection />
        <FreeResourcesSection resources={resources} />
      </main>
      <div className="journal">
        <CTABlock />
      </div>
      <Footer />
      <a href={PAYMENT_URL} target="_blank" rel="noopener noreferrer" className="iman-sticky-cta">
        {CTA_LABEL} · {PRICE}
      </a>
    </>
  );
}

/* 1. HERO */
function HeroSection() {
  return (
    <section className="stake-hero" style={{
      background: "linear-gradient(160deg, var(--cream-50) 0%, var(--rosa-50) 100%)",
      borderBottom: "1px solid rgba(139,26,74,.1)",
      padding: "20px 0 80px",
      overflow: "hidden",
    }}>
      <div className="journal">
        <div style={{ paddingTop: 24, marginBottom: 48 }}>
          <Link href="/recursos" style={{
            fontFamily: B, fontSize: 13, fontWeight: 700, color: "var(--vino)",
            textDecoration: "none", letterSpacing: ".04em",
          }}>
            ← Volver a recursos
          </Link>
        </div>

        <div className="stake-hero-grid" style={{
          display: "grid", gridTemplateColumns: "1fr auto", gap: "48px 64px", alignItems: "center",
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
              <Pill solid>✦ Nuevo</Pill>
              <Pill>Ebook · PDF · 84 páginas</Pill>
            </div>

            <h1 style={{
              fontFamily: D, fontWeight: 800, fontSize: "clamp(34px, 4.8vw, 62px)",
              lineHeight: 1.05, letterSpacing: "-.02em", color: "var(--ink)", margin: "0 0 24px",
            }}>
              Método Imán:{" "}
              <em style={{ fontStyle: "italic", color: "var(--vino)" }}>
                aprendé a usar LinkedIn para conseguir tu trabajo soñado
              </em>
            </h1>

            <p style={{
              fontFamily: D, fontStyle: "italic", fontSize: "clamp(17px, 2vw, 21px)",
              lineHeight: 1.55, color: "var(--fg-2)", margin: "0 0 28px", maxWidth: 580,
            }}>
              El método que usé para conseguir mis primeros 3 trabajos como analista. Convertí tu
              perfil en uno que los reclutadores encuentran, entienden y quieren contactar, sección
              por sección y con ejemplos reales.
            </p>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 36px", display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                "13 capítulos paso a paso, del perfil en blanco al perfil que trabaja por vos",
                "Más de 40 ejemplos, plantillas de mensajes y prompts listos para copiar",
                "Plan de acción de 30 días para que pase de verdad",
              ].map((t) => (
                <li key={t} style={{ fontFamily: B, fontSize: 15, color: "var(--fg-2)", display: "flex", gap: 10 }}>
                  <span style={{ color: "var(--vino)", fontWeight: 800, flexShrink: 0 }}>✓</span>{t}
                </li>
              ))}
            </ul>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
              <BuyButton large />
              <span style={{ fontFamily: B, fontSize: 13, color: "var(--fg-3)", lineHeight: 1.6 }}>
                {PRICE} · Descarga inmediata.<br />
                Pagás una vez, es tuyo para siempre.<br />
                Garantía de devolución de 7 días.
              </span>
            </div>
          </div>

          <div className="stake-hero-img iman-stack" style={{ flexShrink: 0, width: 400, maxWidth: "100%" }}>
            <img src="/metodo-iman/encabezado.webp" alt="Página del ebook con un ejemplo real de perfil" className="iman-stack-back" />
            <img src="/metodo-iman/headlines.webp" alt="Página del ebook con 20 ejemplos de headline" className="iman-stack-mid" />
            <img src="/metodo-iman/portada.webp" alt="Portada del ebook Método Imán" className="iman-stack-front" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* BARRA DE CONFIANZA */
function TrustBar() {
  const items = ["🔒 Pago seguro por Hotmart", "⚡ Descarga inmediata", "🛡️ Garantía de 7 días", "🌎 Pagás en tu moneda local"];
  return (
    <div style={{ background: "#fffcf6", borderBottom: "1px solid rgba(139,26,74,.1)", padding: "18px 0" }}>
      <div className="journal" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px 32px" }}>
        {items.map((t) => (
          <span key={t} style={{ fontFamily: B, fontSize: 13, fontWeight: 700, color: "var(--fg-2)" }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ANTES / DESPUÉS */
const beforeAfter = [
  { label: "Headline", before: "Estudiante | Buscando nuevas oportunidades", after: "Data Analyst | SQL · Power BI · Python | Convierto datos en decisiones de negocio" },
  { label: "About", before: "Soy una persona proactiva, responsable y con ganas de aprender.", after: "Un párrafo que dice qué problema resolvés, con qué herramientas y un resultado con números." },
  { label: "Experiencia", before: "Encargada de hacer reportes semanales.", after: "Automaticé el reporte semanal en Power BI y bajé de 6 a 1 hora el tiempo de armado." },
  { label: "Resultado", before: "Postulás a 40 ofertas y nadie responde.", after: "Aparecés en las búsquedas y los reclutadores te escriben a vos." },
];

function BeforeAfterSection() {
  return (
    <section className="stake-section stake-section-top0" style={{ padding: "0 0 100px" }}>
      <div className="journal">
        <SectionHeader eyebrow="La diferencia" title={<>Mismo talento. <em>Otro perfil.</em></>} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 40 }}>
          {beforeAfter.map((row) => (
            <div key={row.label} className="stake-for-grid" style={{ display: "grid", gridTemplateColumns: "140px 1fr 1fr", gap: 14, alignItems: "stretch" }}>
              <div style={{ fontFamily: B, fontWeight: 800, fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--vino)", alignSelf: "center" }}>
                {row.label}
              </div>
              <div style={{ background: "var(--cream-100)", border: "1px solid rgba(139,26,74,.08)", borderRadius: 10, padding: "16px 18px", fontFamily: B, fontSize: 14, lineHeight: 1.6, color: "var(--fg-3)" }}>
                <span style={{ fontWeight: 800, marginRight: 6 }}>✕</span>{row.before}
              </div>
              <div style={{ background: "#f0f9f0", border: "1px solid rgba(34,100,34,.18)", borderRadius: 10, padding: "16px 18px", fontFamily: B, fontSize: 14, lineHeight: 1.6, color: "#2a472a" }}>
                <span style={{ fontWeight: 800, color: "#1a8c1a", marginRight: 6 }}>✓</span>{row.after}
              </div>
            </div>
          ))}
        </div>
        <MiniCTA
          headline="La guía te lleva de la columna izquierda a la derecha, sección por sección."
          note={`${PRICE} · Descarga inmediata · Garantía de 7 días`}
        />
      </div>
    </section>
  );
}

/* GARANTÍA */
function GuaranteeSection() {
  return (
    <section className="stake-section stake-section-top0" style={{ padding: "0 0 100px" }}>
      <div className="journal">
        <div className="stake-about-grid" style={{
          maxWidth: 760, margin: "0 auto", display: "grid", gridTemplateColumns: "auto 1fr", gap: "24px 36px", alignItems: "center",
          background: "var(--rosa-50)", border: "1px dashed rgba(139,26,74,.3)", borderRadius: 16, padding: "36px 40px",
        }}>
          <div style={{
            width: 110, height: 110, borderRadius: "50%", border: "3px solid var(--vino)", margin: "0 auto",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--vino)",
          }}>
            <span style={{ fontFamily: D, fontWeight: 800, fontSize: 40, lineHeight: 1 }}>7</span>
            <span style={{ fontFamily: B, fontWeight: 800, fontSize: 10, letterSpacing: ".16em" }}>DÍAS</span>
          </div>
          <div>
            <h3 style={{ fontFamily: D, fontWeight: 700, fontSize: 24, color: "var(--ink)", margin: "0 0 10px" }}>
              El riesgo es todo mío.
            </h3>
            <p style={{ ...bodyP, margin: 0 }}>
              Comprala, leela y aplicala. Si en 7 días sentís que no te sirvió, pedís la devolución desde
              Hotmart y te devuelven el 100%. Sin preguntas y sin vueltas.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 2. LA HISTORIA */
function StorySection() {
  return (
    <section className="stake-section" style={{ padding: "90px 0", background: "var(--vino)" }}>
      <div className="journal">
        <div className="stake-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px 64px", alignItems: "center" }}>
          <div style={{ minWidth: 0 }}>
            <span style={{
              fontFamily: B, fontWeight: 800, fontSize: 11, letterSpacing: ".2em",
              textTransform: "uppercase", color: "var(--rosa-100)", display: "block", marginBottom: 20,
            }}>
              ✦ Por qué existe esta guía
            </span>
            <h2 style={{
              fontFamily: D, fontWeight: 800, fontSize: "clamp(28px, 3.8vw, 48px)",
              lineHeight: 1.1, letterSpacing: "-.02em", color: "#fff", margin: "0 0 24px",
            }}>
              Mis primeros 3 trabajos como analista{" "}
              <em style={{ fontStyle: "italic", color: "var(--rosa-100)" }}>llegaron por LinkedIn.</em>
            </h2>
            <p style={{ ...bodyP, color: "rgba(255,255,255,.82)" }}>
              No tenía contactos en el mundo de los datos ni a alguien que me recomendara. Tenía un
              perfil de LinkedIn y muchas ganas de que alguien lo viera.
            </p>
            <p style={{ ...bodyP, color: "rgba(255,255,255,.82)", marginBottom: 0 }}>
              Con prueba y error fui armando un sistema: qué poner en cada sección, qué palabras
              buscan los reclutadores, cómo escribirles sin sonar desesperada. Ese sistema es el
              Método Imán, y{" "}
              <strong style={{ color: "#fff" }}>con él conseguí mis primeros 3 trabajos en mi área.</strong>{" "}
              Esta guía es todo eso, ordenado y explicado para que no tengas que adivinar.
            </p>
          </div>
          <figure style={{ margin: 0 }}>
            <img
              src="/metodo-iman/encabezado.webp"
              alt="Página del ebook que muestra el perfil real de Milo como ejemplo"
              style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto", borderRadius: 10, boxShadow: "0 24px 60px rgba(0,0,0,.35)" }}
            />
            <figcaption style={{ fontFamily: B, fontSize: 12, color: "rgba(255,255,255,.6)", textAlign: "center", marginTop: 14 }}>
              Adentro vas a ver capturas de mi propio perfil como ejemplo de cada sección.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

/* 3. EL PROBLEMA */
function ProblemSection() {
  return (
    <section className="stake-section" style={{ padding: "100px 0" }}>
      <div className="journal">
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{
            fontFamily: D, fontWeight: 700, fontSize: "clamp(24px, 3vw, 38px)",
            lineHeight: 1.2, color: "var(--ink)", margin: "0 0 36px", letterSpacing: "-.02em",
          }}>
            Postulaste a 40 ofertas. Te respondieron dos.{" "}
            <em style={{ fontStyle: "italic", color: "var(--vino)" }}>Una era para decirte que no.</em>
          </h2>
          <p style={bodyP}>
            Tenés el título, hiciste los cursos, armaste proyectos. Entrás a LinkedIn, apretás
            "Solicitud sencilla" una y otra vez, y del otro lado no pasa nada. Mientras tanto ves
            cómo a otras personas, con menos experiencia que vos, les escriben reclutadores de
            empresas de afuera.
          </p>
          <p style={bodyP}>
            La diferencia casi nunca es el talento. Es que{" "}
            <strong style={{ color: "var(--ink)" }}>más del 90% de los reclutadores busca candidatos en LinkedIn</strong>,
            y lo hacen con palabras clave y filtros. Si tu perfil no tiene las palabras correctas en
            los lugares correctos, no aparecés. Y si aparecés pero en cinco segundos no se entiende
            qué hacés, pasan al siguiente.
          </p>
          <p style={{ ...bodyP, marginBottom: 0 }}>
            <strong style={{ color: "var(--ink)" }}>Tu perfil no está mal: está completo, pero no optimizado.</strong>{" "}
            El Método Imán te enseña a convertirlo en un perfil que trabaja por vos, incluso cuando
            no estás postulando.
          </p>
        </div>
      </div>
    </section>
  );
}

/* 4. PARA VOS / NO ES PARA VOS */
function ForYouSection() {
  const forYou = [
    "Estás buscando trabajo (o querés cambiar) y sentís que LinkedIn no te está sirviendo",
    "Querés trabajar remoto para empresas de afuera y no sabés cómo hacer que te encuentren",
    "Recién empezás en tu área, o estás haciendo un cambio de carrera, y no sabés cómo mostrar lo que sabés",
    "Tu perfil está \"completo\" pero nunca te escribe ningún reclutador",
    "Te da vergüenza escribirle a desconocidos y querés mensajes que no suenen a spam",
    "Querés un paso a paso concreto, no consejos sueltos de TikTok",
  ];
  const notForYou = [
    "Buscás una fórmula mágica para conseguir trabajo sin hacer nada. El método funciona si lo aplicás.",
    "Querés aprender a ser influencer o vender en LinkedIn. Esto es para conseguir trabajo.",
    "Ya tenés reclutadores escribiéndote todas las semanas y tu perfil está optimizado.",
    "Buscás contenido técnico de tu profesión. Esto es sobre cómo mostrar lo que ya sabés.",
  ];
  return (
    <section className="stake-section stake-section-top0" style={{ padding: "0 0 100px" }}>
      <div className="journal">
        <div className="stake-for-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{ background: "#f0f9f0", border: "1px solid rgba(34,100,34,.15)", borderRadius: 12, padding: 32 }}>
            <h3 style={{ fontFamily: D, fontWeight: 700, fontSize: 22, color: "#1a5c1a", margin: "0 0 24px" }}>
              Esto es para vos si
            </h3>
            <List items={forYou} mark="✓" color="#2a472a" markColor="#1a8c1a" />
          </div>
          <div style={{ background: "var(--cream-100)", border: "1px solid rgba(139,26,74,.1)", borderRadius: 12, padding: 32 }}>
            <h3 style={{ fontFamily: D, fontWeight: 700, fontSize: 22, color: "var(--fg-2)", margin: "0 0 24px" }}>
              Esto no es para vos si
            </h3>
            <List items={notForYou} mark="—" color="var(--fg-3)" markColor="var(--fg-muted)" />
          </div>
        </div>
        <MiniCTA
          headline="¿Te reconociste? El próximo mensaje de un reclutador puede ser para vos."
          note={`${PRICE} · Precio de lanzamiento · Descarga inmediata`}
        />
      </div>
    </section>
  );
}

/* 5. QUÉ VAS A APRENDER */
const learnCards = [
  { title: "Cómo te busca un reclutador", desc: "Qué ve primero, qué filtros usa y qué pesa en el buscador. Cuando entendés cómo buscan, entendés cómo aparecer." },
  { title: "El headline que trabaja por vos", desc: "La fórmula rol | skill | valor, el método de las 5 ofertas para encontrar tus keywords y 20 ejemplos por profesión." },
  { title: "Un About y una experiencia que convencen", desc: "La estructura en 4 párrafos, cómo cuantificar logros aunque creas que no tenés números y antes/después en 3 rubros." },
  { title: "Perfil bilingüe y ajustes ocultos", desc: "Tu perfil en inglés y español, Open to Work solo para reclutadores, URL personalizada y la ubicación que no te deja afuera." },
  { title: "Mensajes que reciben respuesta", desc: "Más de 15 plantillas: conexión, seguimiento, pedir recomendaciones, escribirle a un reclutador y responder un InMail." },
  { title: "Hacks para llegar primero", desc: "Ver ofertas de la última hora, búsquedas booleanas, encontrar posts de \"estamos contratando\" y alertas que trabajan solas." },
];

function LearnSection() {
  return (
    <section className="stake-section stake-section-top0" style={{ padding: "0 0 100px" }}>
      <div className="journal">
        <SectionHeader eyebrow="Lo que te llevás" title={<>Lo concreto <em>que te llevás</em></>} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginTop: 48 }}>
          {learnCards.map((card, i) => (
            <div key={card.title} style={{
              background: "#fffcf6", border: "1px solid rgba(139,26,74,.08)", borderRadius: 10,
              padding: "28px 24px", boxShadow: "0 4px 16px rgba(139,26,74,.06)",
            }}>
              <div style={{ fontFamily: D, fontStyle: "italic", fontWeight: 800, fontSize: 36, color: "var(--rosa-200)", lineHeight: 1, marginBottom: 16 }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 style={{ fontFamily: D, fontWeight: 700, fontSize: 17, color: "var(--ink)", margin: "0 0 10px", lineHeight: 1.3 }}>
                {card.title}
              </h3>
              <p style={{ fontFamily: B, fontSize: 13.5, lineHeight: 1.65, color: "var(--fg-2)", margin: 0 }}>
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 6. MIRÁ ADENTRO */
const insidePages = [
  { src: "/metodo-iman/encabezado.webp", caption: "Ejemplos reales de perfil en cada sección" },
  { src: "/metodo-iman/headlines.webp", caption: "20 headlines listos por profesión" },
  { src: "/metodo-iman/about.webp", caption: "3 About completos para adaptar" },
  { src: "/metodo-iman/experiencia.webp", caption: "Antes y después de experiencias reales" },
  { src: "/metodo-iman/mensajes.webp", caption: "Plantillas de mensajes que no suenan a spam" },
  { src: "/metodo-iman/plan.webp", caption: "Plan de 30 días con casilleros para tachar" },
];

function InsideSection() {
  return (
    <section className="stake-section" style={{ padding: "100px 0", background: "var(--cream-100)" }}>
      <div className="journal">
        <SectionHeader eyebrow="Mirá adentro" title={<>Así se ve <em>por dentro</em></>} />
        <p style={{ ...bodyP, maxWidth: 620, margin: "20px 0 0" }}>
          Nada de bloques de texto interminables: cada capítulo tiene ejemplos, comparaciones,
          plantillas y un ejercicio para aplicarlo en tu perfil en el momento.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 28, marginTop: 48 }}>
          {insidePages.map((p) => (
            <figure key={p.src} style={{ margin: 0 }}>
              <a href={p.src} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
                <img
                  src={p.src}
                  alt={p.caption}
                  loading="lazy"
                  style={{
                    width: "100%", display: "block", borderRadius: 8,
                    border: "1px solid rgba(139,26,74,.12)", boxShadow: "0 12px 32px rgba(139,26,74,.14)",
                  }}
                />
              </a>
              <figcaption style={{ fontFamily: B, fontSize: 13, fontWeight: 600, color: "var(--fg-2)", marginTop: 12, textAlign: "center" }}>
                {p.caption}
              </figcaption>
            </figure>
          ))}
        </div>
        <MiniCTA
          accent
          headline="84 páginas para tener un perfil que los reclutadores quieran contactar."
          note={`${PRICE} · Un solo pago · Sin suscripción`}
        />
      </div>
    </section>
  );
}

/* 7. ÍNDICE */
const chapters = [
  { title: "Antes de arrancar", sub: "Cómo te buscan los reclutadores y el método imán" },
  { title: "Ajustes de base", sub: "Perfil bilingüe, URL, ubicación y Open to Work" },
  { title: "Foto y banner", sub: "La primera impresión en dos segundos" },
  { title: "Headline", sub: "Fórmula, keywords y 20 ejemplos" },
  { title: "About", sub: "4 párrafos, 3 ejemplos y prompt de IA" },
  { title: "Experience", sub: "De lista de tareas a evidencia de resultados" },
  { title: "Skills y endorsements", sub: "Tu repositorio de 50 keywords" },
  { title: "Featured, educación y recomendaciones", sub: "Las secciones que prueban lo que decís" },
  { title: "Contenido que atrae reclutadores", sub: "Ideas, 3 posts de ejemplo y calendario" },
  { title: "Networking inteligente", sub: "8 plantillas y reto de 7 días" },
  { title: "Hacks avanzados", sub: "Ofertas de la última hora y búsqueda booleana" },
  { title: "Checklist y mantenimiento", sub: "Tu rutina semanal de 30 minutos" },
  { title: "Recursos y plantillas", sub: "Mensajes, verbos de acción y herramientas" },
  { title: "Plan de 30 días", sub: "Semana a semana, para que pase de verdad" },
];

function ContentsSection() {
  return (
    <section className="stake-section" style={{ padding: "100px 0" }}>
      <div className="journal">
        <SectionHeader eyebrow="El índice completo" title={<>El índice <em>completo</em></>} />
        <div className="stake-contents-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 48px", marginTop: 48 }}>
          {chapters.map((ch, i) => (
            <div key={ch.title} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "18px 0", borderBottom: "1px solid rgba(139,26,74,.08)" }}>
              <span style={{ fontFamily: D, fontStyle: "italic", fontWeight: 800, fontSize: 34, color: "var(--rosa-300)", lineHeight: 1.1, flexShrink: 0, width: 46 }}>
                {String(i).padStart(2, "0")}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: D, fontWeight: 700, fontSize: 15, color: "var(--ink)", lineHeight: 1.3 }}>{ch.title}</div>
                <div style={{ fontFamily: B, fontSize: 11.5, color: "var(--rosa)", marginTop: 3, lineHeight: 1.4 }}>{ch.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <MiniCTA
          headline="Ya viste lo que hay adentro. ¿Arrancás hoy con tu perfil?"
          note={`${PRICE} · Precio de lanzamiento`}
        />
      </div>
    </section>
  );
}

/* 8. QUIÉN SOY */
function AboutSection() {
  return (
    <section className="stake-section" style={{ padding: "100px 0", background: "var(--cream-100)" }}>
      <div className="journal">
        <div className="stake-about-grid" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "40px 64px", alignItems: "start" }}>
          <div className="stake-about-photo" style={{
            width: 200, height: 200, borderRadius: 16, overflow: "hidden",
            border: "3px solid var(--rosa-200)", flexShrink: 0, background: "var(--rosa-100)",
          }}>
            <img src="/milo-foto.png" alt="Milo, Data Analyst" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
          </div>
          <div>
            <span className="eyebrow-j" style={{ display: "block", marginBottom: 16 }}>Hola, soy Milo</span>
            <h2 style={{ fontFamily: D, fontWeight: 700, fontSize: "clamp(22px, 3vw, 34px)", color: "var(--ink)", margin: "0 0 20px", lineHeight: 1.2 }}>
              No te vendo una teoría.{" "}
              <em style={{ fontStyle: "italic", color: "var(--vino)" }}>Te comparto lo que me funcionó a mí.</em>
            </h2>
            <p style={bodyP}>
              Soy argentina y trabajo como Senior Data Analyst y BI Developer en una fintech de LATAM.
              No soy coach ni reclutadora: soy alguien que estuvo del otro lado, mandando
              postulaciones que nadie contestaba.
            </p>
            <p style={bodyP}>
              Cuando cambié la forma de usar LinkedIn, empezaron a llegar las conversaciones. Así
              conseguí mis primeros 3 trabajos como analista.{" "}
              <strong style={{ color: "var(--ink)" }}>Esta guía es el paso a paso que me hubiera ahorrado meses de prueba y error.</strong>
            </p>
            <p style={{ ...bodyP, marginBottom: 0 }}>
              Si querés ver lo que comparto sobre tech, data e IA, encontrame en Instagram como{" "}
              <a href="https://instagram.com/databymilo" target="_blank" rel="noopener noreferrer" style={{ color: "var(--vino)", fontWeight: 700 }}>
                @databymilo
              </a>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 9. PRECIO */
const includes = [
  "Ebook PDF de 84 páginas con los 13 capítulos completos",
  "Más de 40 ejemplos de perfiles, headlines, About y experiencias",
  "Más de 15 plantillas de mensajes para reclutadores y networking",
  "Prompts de IA para escribir tu About y tus publicaciones",
  "Checklist del perfil y plan de 30 días imprimibles",
  "Actualizaciones gratis de futuras versiones",
];

function PricingSection() {
  return (
    <section id="comprar" className="stake-section" style={{ padding: "100px 0" }}>
      <div className="journal">
        <SectionHeader eyebrow="Una sola compra" title={<>Una sola compra. <em>Sin suscripción.</em></>} />
        <div style={{ maxWidth: 480, margin: "48px auto 0" }}>
          <div className="stake-pricing-card" style={{
            background: "#fffcf6", border: "1px solid rgba(139,26,74,.12)", borderRadius: 16,
            overflow: "hidden", boxShadow: "0 16px 48px rgba(139,26,74,.14)",
            borderTop: "4px solid var(--vino)", position: "relative",
          }}>
            <div style={{
              position: "absolute", top: 18, right: 18, background: "var(--rosa)", color: "#fff",
              fontFamily: B, fontWeight: 800, fontSize: 9, letterSpacing: ".16em", textTransform: "uppercase",
              padding: "5px 13px", borderRadius: 999, boxShadow: "0 3px 10px rgba(139,26,74,.32)",
              whiteSpace: "nowrap", pointerEvents: "none",
            }}>
              ✦ Pago en tu moneda local
            </div>
            <div style={{ padding: "40px 40px 32px", textAlign: "center" }}>
              <div style={{ fontFamily: D, fontWeight: 800, fontSize: 60, color: "var(--vino)", lineHeight: 1 }}>{PRICE}</div>
              <div style={{ fontFamily: B, fontSize: 14, color: "var(--fg-3)", marginTop: 8 }}>
                Pagás una vez, la guía es tuya para siempre.
              </div>
            </div>
            <div style={{ padding: "0 40px 32px", borderBottom: "1px solid rgba(139,26,74,.1)" }}>
              <List items={includes} mark="✓" color="var(--fg-2)" markColor="var(--vino)" />
            </div>
            <div style={{ padding: "32px 40px", textAlign: "center" }}>
              <BuyButton block />
              <p style={{ fontFamily: B, fontSize: 12, color: "var(--fg-3)", margin: "16px 0 0", lineHeight: 1.6 }}>
                Pago seguro por Hotmart. Descarga inmediata después del pago.<br />
                Garantía de devolución de 7 días sin preguntas.
              </p>
            </div>
          </div>
          <p style={{ marginTop: 24, textAlign: "center", fontFamily: D, fontStyle: "italic", fontSize: 18, color: "var(--vino)", lineHeight: 1.4 }}>
            Con que un solo reclutador te escriba, la guía ya se pagó sola.
          </p>
          <ol style={{ listStyle: "none", padding: 0, margin: "32px 0 0", display: "grid", gap: 12 }}>
            {[
              "Hacés clic en el botón y pagás en Hotmart con tarjeta, transferencia o el medio de tu país.",
              "En minutos te llega un mail con el link para descargar el PDF.",
              "Abrís el capítulo 1 y hoy mismo empezás a cambiar tu perfil.",
            ].map((t, i) => (
              <li key={t} style={{ display: "flex", gap: 14, alignItems: "flex-start", fontFamily: B, fontSize: 14, lineHeight: 1.6, color: "var(--fg-2)" }}>
                <span style={{
                  flexShrink: 0, width: 26, height: 26, borderRadius: "50%", background: "var(--vino)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12,
                }}>{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* 10. FAQ */
const FAQS = [
  { q: "¿Sirve para cualquier profesión o solo para data?", a: "Sirve para cualquier profesión. Yo vengo de data, pero los ejemplos cubren customer success, marketing, diseño UX, proyectos, traducción, desarrollo y más. El método es el mismo: cambia el contenido que ponés en cada sección." },
  { q: "¿Necesito LinkedIn Premium?", a: "No. Todo lo de la guía funciona con una cuenta gratuita, incluidos los hacks de búsqueda y las alertas de empleo." },
  { q: "¿Mi perfil tiene que estar en inglés?", a: "Si querés trabajar para empresas de afuera, sí, y la guía te explica cómo tener tu perfil en inglés y en español a la vez. Los ejemplos están en inglés y todas las explicaciones en español." },
  { q: "Estoy empezando y no tengo experiencia. ¿Me sirve?", a: "Sí. Hay secciones específicas para quienes recién empiezan o están cambiando de carrera: cómo mostrar proyectos, formación y habilidades transferibles cuando todavía no tenés años de experiencia." },
  { q: "¿Me garantiza conseguir trabajo?", a: "No, y desconfiá de quien te lo garantice. Lo que sí te da es un perfil optimizado y un sistema para que te encuentren y te contacten más. A mí me funcionó para conseguir mis primeros 3 trabajos, pero el resultado depende de que lo apliques." },
  { q: "¿En qué formato lo recibo?", a: "PDF descargable de 84 páginas. Lo abrís en compu, tablet o celular, y las páginas de checklist y plan de 30 días están pensadas para imprimir." },
  { q: "¿Cómo me llega después de pagar?", a: "Apenas se confirma el pago, te llega un mail de Hotmart con el link de descarga. Acceso inmediato." },
  { q: "¿Y si no me sirve?", a: "Tenés 7 días desde la compra para pedir la devolución sin justificar nada. Te devolvemos el 100%." },
  { q: "¿Quién está atrás de esto?", a: "Yo, Milo. Trabajo como Data Analyst y BI Developer en una fintech de LATAM. Si tenés cualquier duda antes o después de comprar, escribime a Instagram (@databymilo)." },
];

function FAQSection() {
  return (
    <section className="stake-section stake-section-top0" style={{ padding: "0 0 100px" }}>
      <div className="journal">
        <SectionHeader eyebrow="Preguntas frecuentes" title={<>Preguntas <em>frecuentes</em></>} />
        <div style={{ marginTop: 48 }}>
          <FAQAccordion faqs={FAQS} />
        </div>
        <MiniCTA
          headline="¿Se fueron las dudas? Si comprás y no es lo que esperabas, te devuelvo el 100%."
          note="Garantía de 7 días sin preguntas · Descarga inmediata"
        />
      </div>
    </section>
  );
}

/* 11. CTA FINAL */
function FinalCTASection() {
  return (
    <section className="stake-section" style={{ background: "var(--vino)", padding: "100px 0" }}>
      <div className="journal" style={{ textAlign: "center" }}>
        <span style={{
          fontFamily: B, fontWeight: 800, fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase",
          color: "rgba(255,255,255,.6)", display: "block", marginBottom: 24,
        }}>
          ✦ Tu próximo trabajo te está buscando
        </span>
        <h2 style={{
          fontFamily: D, fontWeight: 800, fontSize: "clamp(30px, 4.5vw, 54px)",
          lineHeight: 1.1, letterSpacing: "-.02em", color: "#fff", margin: "0 0 20px",
        }}>
          Hacé que te encuentre.
        </h2>
        <p style={{
          fontFamily: D, fontStyle: "italic", fontSize: "clamp(16px, 2vw, 22px)",
          color: "rgba(255,255,255,.8)", lineHeight: 1.5, margin: "0 auto 40px", maxWidth: 560,
        }}>
          Por menos de lo que sale una salida a comer, te llevás el método que me abrió las puertas
          de mis primeros 3 trabajos.
        </p>
        <a href={PAYMENT_URL} target="_blank" rel="noopener noreferrer" style={{
          fontFamily: B, fontWeight: 800, fontSize: 16, padding: "16px 40px", borderRadius: 999,
          background: "#fff", color: "var(--vino)", textDecoration: "none", display: "inline-block",
          boxShadow: "0 8px 24px rgba(0,0,0,.2)", letterSpacing: ".04em",
        }}>
          {CTA_LABEL}
        </a>
        <p style={{ fontFamily: B, fontSize: 13, color: "rgba(255,255,255,.55)", margin: "16px 0 0" }}>
          {PRICE} · Descarga inmediata · Garantía de devolución de 7 días
        </p>
      </div>
    </section>
  );
}

/* 12. RECURSOS GRATIS */
function FreeResourcesSection({ resources }) {
  if (resources.length === 0) return null;
  return (
    <section className="stake-section" style={{ padding: "80px 0", background: "#fffcf6" }}>
      <div className="journal">
        <h2 style={{ fontFamily: D, fontWeight: 700, fontSize: "clamp(24px, 3vw, 36px)", lineHeight: 1.1, color: "var(--ink)", margin: "0 0 40px" }}>
          ¿Todavía no? <em>Llevate algo gratis.</em>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {resources.map((r) => (
            <Link key={r.slug} href={`/recursos/${r.slug}`} style={{ textDecoration: "none" }}>
              <article style={{
                background: r.color || "var(--cream)", borderRadius: 12, padding: "22px 20px",
                border: "1px solid rgba(139,26,74,.12)", height: "100%", display: "flex", flexDirection: "column", gap: 8,
              }}>
                <div style={{ fontFamily: B, fontWeight: 700, fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--vino)", opacity: 0.7 }}>
                  {r.type} · {r.pages}
                </div>
                <h3 style={{ fontFamily: D, fontStyle: "italic", fontWeight: 700, fontSize: 20, color: "var(--ink)", margin: 0, lineHeight: 1.25 }}>
                  {r.title}
                </h3>
                <p style={{ fontFamily: B, fontSize: 13, color: "var(--fg-2)", margin: 0, lineHeight: 1.5, flex: 1 }}>{r.desc}</p>
                <span style={{ fontFamily: B, fontWeight: 700, fontSize: 11, letterSpacing: ".06em", color: "var(--vino)", textTransform: "uppercase" }}>
                  Descargar gratis →
                </span>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* HELPERS */
function BuyButton({ large, block }) {
  return (
    <a
      href={PAYMENT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-primary"
      style={{
        fontSize: large || block ? 16 : 15,
        padding: large ? "16px 34px" : block ? "16px 24px" : "14px 36px",
        fontWeight: 800,
        letterSpacing: ".03em",
        ...(block && { width: "100%", justifyContent: "center" }),
      }}
    >
      {CTA_LABEL}
    </a>
  );
}

function MiniCTA({ headline, note, accent }) {
  return (
    <div className="stake-mini-cta" style={{
      textAlign: "center", padding: "40px 24px", marginTop: 48,
      background: accent ? "var(--rosa-50)" : "transparent",
      borderRadius: accent ? 14 : 0,
      borderTop: !accent ? "1px solid rgba(139,26,74,.1)" : "none",
    }}>
      <p style={{
        fontFamily: D, fontStyle: "italic", fontSize: "clamp(16px, 2vw, 20px)",
        color: "var(--ink)", margin: "0 auto 24px", lineHeight: 1.4, maxWidth: 520,
      }}>
        {headline}
      </p>
      <BuyButton />
      <p style={{ fontFamily: B, fontSize: 12, color: "var(--fg-3)", margin: "12px 0 0", lineHeight: 1.5 }}>{note}</p>
    </div>
  );
}

function List({ items, mark, color, markColor }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((item) => (
        <li key={item} style={{ fontFamily: B, fontSize: 14, lineHeight: 1.65, color, display: "flex", gap: 10 }}>
          <span style={{ color: markColor, fontWeight: 800, flexShrink: 0 }}>{mark}</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function Pill({ children, solid }) {
  return (
    <span style={{
      fontFamily: B, fontWeight: solid ? 800 : 700, fontSize: 10,
      letterSpacing: solid ? ".18em" : ".14em", textTransform: "uppercase",
      ...(solid
        ? { background: "var(--vino)", color: "#fff", padding: "5px 14px" }
        : { color: "var(--vino)", border: "1.5px solid rgba(139,26,74,.3)", padding: "4px 12px" }),
      borderRadius: 999,
    }}>
      {children}
    </span>
  );
}

function SectionHeader({ eyebrow, title }) {
  return (
    <div>
      <span className="eyebrow-j" style={{ display: "block", marginBottom: 12 }}>{eyebrow}</span>
      <h2 style={{
        fontFamily: D, fontWeight: 700, fontSize: "clamp(28px, 3.5vw, 44px)",
        lineHeight: 1.1, letterSpacing: "-.02em", color: "var(--ink)", margin: 0,
      }}>
        {title}
      </h2>
    </div>
  );
}

const bodyP = {
  fontFamily: B,
  fontSize: 16,
  lineHeight: 1.75,
  color: "var(--fg-2)",
  margin: "0 0 20px",
};
