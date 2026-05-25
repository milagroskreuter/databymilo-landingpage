import Link from "next/link";
import FAQAccordion from "./FAQAccordion";
import Footer from "../../components/sections/Footer";

export const metadata = {
  title: "Cómo presentar data a stakeholders no técnicos | Data by Milo",
  description:
    "La guía de 35 páginas con el sistema concreto para que tu próximo readout sea entendido a la primera, accionado por tu equipo y recordado después de la reunión.",
  alternates: { canonical: "https://databymilo.me/recursos/presentar-a-stakeholders" },
  openGraph: {
    title: "Cómo presentar data a stakeholders no técnicos | Data by Milo",
    description:
      "35 páginas. Framework, estructura BLUF, slides antes/después, prompts de IA y checklist imprimible. USD 15.",
    url: "https://databymilo.me/recursos/presentar-a-stakeholders",
  },
};

const PAYMENT_URL = "https://pay.hotmart.com/V105982887R";
const D = "var(--font-display)";
const B = "var(--font-body)";
const A = "var(--font-accent)";

export default function Page() {
  return (
    <>
      <main style={{ background: "var(--cream)" }}>
        <HeroSection />
        <ProblemSection />
        <ForYouSection />
        <LearnSection />
        <ContentsSection />
        <AboutSection />
        <PricingSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
    </>
  );
}

/* ─────────────────────────────────────────
   1. HERO
───────────────────────────────────────── */
function HeroSection() {
  return (
    <section style={{
      background: "linear-gradient(160deg, var(--cream-50) 0%, var(--rosa-50) 100%)",
      borderBottom: "1px solid rgba(139,26,74,.1)",
      padding: "20px 0 80px",
    }}>
      <div className="journal">
        <div style={{ paddingTop: 24, marginBottom: 48 }}>
          <Link href="/recursos" style={{
            fontFamily: B, fontSize: 13, fontWeight: 700,
            color: "var(--vino)", textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 6,
            letterSpacing: ".04em",
          }}>
            ← Volver a recursos
          </Link>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "48px 64px",
          alignItems: "center",
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
              <span style={{
                fontFamily: B, fontWeight: 800, fontSize: 10, letterSpacing: ".18em",
                textTransform: "uppercase", background: "var(--vino)", color: "#fff",
                padding: "5px 14px", borderRadius: 999,
              }}>
                ✦ Nueva guía
              </span>
              <span style={{
                fontFamily: B, fontWeight: 700, fontSize: 10, letterSpacing: ".14em",
                textTransform: "uppercase", color: "var(--vino)",
                border: "1.5px solid rgba(139,26,74,.3)", padding: "4px 12px", borderRadius: 999,
              }}>
                Guía · PDF · 35 páginas
              </span>
            </div>

            <h1 style={{
              fontFamily: D, fontWeight: 800,
              fontSize: "clamp(32px, 4.5vw, 58px)",
              lineHeight: 1.08, letterSpacing: "-.02em",
              color: "var(--ink)", margin: "0 0 24px",
            }}>
              Cómo presentar data a stakeholders no técnicos{" "}
              <em style={{ fontStyle: "italic", color: "var(--vino)" }}>
                sin morir en el intento
              </em>
            </h1>

            <p style={{
              fontFamily: D, fontStyle: "italic", fontSize: "clamp(17px, 2vw, 21px)",
              lineHeight: 1.55, color: "var(--fg-2)", margin: "0 0 36px", maxWidth: 560,
            }}>
              Una guía de 35 páginas con el sistema concreto para que tu próximo readout sea
              entendido a la primera, accionado por tu equipo y recordado después de la reunión.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
              <a
                href={PAYMENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ fontSize: 15, padding: "15px 32px", fontWeight: 800, letterSpacing: ".03em" }}
              >
                ¡QUIERO MI GUÍA!
              </a>
              <span style={{
                fontFamily: B, fontSize: 13, color: "var(--fg-3)", lineHeight: 1.6,
              }}>
                Descarga inmediata.<br />
                Pagás una vez, la usás siempre.<br />
                Garantía de devolución de 7 días.
              </span>
            </div>
          </div>

          {/* Mockup image — guardá el archivo en /public/mockup-guia.png */}
          <div style={{ flexShrink: 0, maxWidth: 420 }}>
            <img
              src="/mockup-guia.png"
              alt="Vista previa de la guía en laptop y tablet"
              style={{ width: "100%", borderRadius: 12, display: "block" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   2. EL PROBLEMA
───────────────────────────────────────── */
function ProblemSection() {
  return (
    <section style={{ padding: "100px 0" }}>
      <div className="journal">
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{
            fontFamily: D, fontWeight: 700,
            fontSize: "clamp(24px, 3vw, 38px)",
            lineHeight: 1.2, color: "var(--ink)",
            margin: "0 0 36px", letterSpacing: "-.02em",
          }}>
            Pasaste tres días armando el análisis. La reunión duró 20 minutos.{" "}
            <em style={{ fontStyle: "italic", color: "var(--vino)" }}>
              Tu jefe te miró como si fueras un menú en chino.
            </em>
          </h2>
          <p style={bodyP}>
            Conocés esta escena. Te dedicaste medio fin de semana a limpiar la data, escribiste el
            SQL más prolijo de tu vida, armaste el dashboard con los filtros buenos, las paletas
            alineadas. Llegás a la reunión, lo mostrás, y en el otro lado de la pantalla ves esa
            cara. La de alguien que está esperando que vos le digas qué hacer y vos le estás
            mostrando un mapa enorme con cinco rutas.
          </p>
          <p style={bodyP}>
            Después viene lo peor: las preguntas que te tiran sin filtro.{" "}
            <em>"¿Y por qué cayó tanto?"</em>.{" "}
            <em>"¿Estás segura de este número?"</em>.{" "}
            <em>"¿Podemos cortar esto por canal?"</em>. Y vos, que tenías la respuesta, no la
            lograste hacer aparecer en el momento.
          </p>
          <p style={{ ...bodyP, marginBottom: 0 }}>
            Esto pasa todo el tiempo en data, BI, IT y cualquier rol técnico de una corpo.{" "}
            <strong style={{ color: "var(--ink)" }}>
              La buena noticia es que no es tu trabajo el que está mal.
            </strong>{" "}
            Lo que falta es un sistema para presentarlo bien. Eso es lo que está adentro de este PDF.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   3. PARA VOS / NO ES PARA VOS
───────────────────────────────────────── */
function ForYouSection() {
  const forYou = [
    "Trabajás (o querés trabajar) en data, BI, analytics, IT o cualquier rol técnico dentro de una corpo",
    "Tenés que presentar resultados a tu jefe, a un líder de negocio, a un cliente o a un comité que no es técnico",
    "Sentís que armás análisis copados que después nadie usa para decidir nada",
    "Te cuesta hacerte entender sin que te tilden de \"muy detallista\" o \"muy en la maleza\"",
    "Pasaste por la situación de preparar una hora antes de un readout con un nudo en el estómago",
    "Querés invertir 15 USD en algo concreto antes de pagar 500 USD por un curso",
  ];
  const notForYou = [
    "Presentás solo a un equipo de data senior que ya habla tu mismo idioma",
    "Buscás un libro académico sobre visualización de datos. Esto es práctico, no teoría.",
    "Querés trucos para venderle humo a alguien. La guía es para contar bien lo que es.",
    "Llevás muchos años haciendo esto y ya tenés tu propio sistema afilado",
    "Esperás contenido sobre cómo escribir SQL o usar Power BI. Esto es sobre comunicación.",
  ];

  return (
    <section style={{ padding: "0 0 100px" }}>
      <div className="journal">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{
            background: "#f0f9f0", border: "1px solid rgba(34,100,34,.15)",
            borderRadius: 12, padding: "32px",
          }}>
            <h3 style={{ fontFamily: D, fontWeight: 700, fontSize: 22, color: "#1a5c1a", margin: "0 0 24px" }}>
              Esto es para vos si
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {forYou.map((item, i) => (
                <li key={i} style={{ fontFamily: B, fontSize: 14, lineHeight: 1.65, color: "#2a472a", display: "flex", gap: 10 }}>
                  <span style={{ color: "#1a8c1a", fontWeight: 800, flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div style={{
            background: "var(--cream-100)", border: "1px solid rgba(139,26,74,.1)",
            borderRadius: 12, padding: "32px",
          }}>
            <h3 style={{ fontFamily: D, fontWeight: 700, fontSize: 22, color: "var(--fg-2)", margin: "0 0 24px" }}>
              Esto no es para vos si
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {notForYou.map((item, i) => (
                <li key={i} style={{ fontFamily: B, fontSize: 14, lineHeight: 1.65, color: "var(--fg-3)", display: "flex", gap: 10 }}>
                  <span style={{ color: "var(--fg-muted)", fontWeight: 800, flexShrink: 0 }}>—</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   4. QUÉ VAS A APRENDER
───────────────────────────────────────── */
const learnCards = [
  { title: "Las 3 preguntas que cambian todo", desc: "El framework para definir qué tiene que decir tu presentación antes de abrir PowerPoint. Funciona para cualquier tipo de readout." },
  { title: "La estructura BLUF", desc: "La fórmula que usan McKinsey y los mejores PMs de tech para que la conclusión llegue primero. Aplicable a slides, mails y mensajes de Slack." },
  { title: "8 comparaciones antes y después", desc: "La galería visual con ejemplos reales de slides tóxicas vs. slides claras. Vas a saber qué cambiar sin tener que adivinar." },
  { title: "Respuestas para las 5 preguntas más comunes", desc: "Frases preparadas para cuando te tiran \"y por qué cayó tanto\" o \"estás segura de este número\". Sin pánico, sin ponerse a la defensiva." },
  { title: "4 prompts de IA para preparar tu readout", desc: "Cómo usar IA para anticipar objeciones, reescribir títulos y simular a tu stakeholder. Con la advertencia de qué cosas IA no puede hacer." },
  { title: "Checklist de 10 puntos imprimible", desc: "La hoja que vas a tener al lado de la compu cada vez que armás una presentación. Screenshot-eable como wallpaper." },
];

function LearnSection() {
  return (
    <section style={{ padding: "0 0 100px" }}>
      <div className="journal">
        <SectionHeader eyebrow="Lo concreto que te llevás" title={<>Lo concreto <em>que te llevás</em></>} />
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20, marginTop: 48,
        }}>
          {learnCards.map((card, i) => (
            <div key={i} style={{
              background: "#fffcf6", border: "1px solid rgba(139,26,74,.08)",
              borderRadius: 10, padding: "28px 24px",
              boxShadow: "0 4px 16px rgba(139,26,74,.06)",
            }}>
              <div style={{
                fontFamily: D, fontStyle: "italic", fontWeight: 800,
                fontSize: 36, color: "var(--rosa-200)", lineHeight: 1, marginBottom: 16,
              }}>
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

/* ─────────────────────────────────────────
   5. ÍNDICE COMPLETO — formato 2 columnas
───────────────────────────────────────── */
const chapters = [
  { title: "La verdad que nadie te dijo",           sub: "Tu jefe no quiere ver tu Tableau.",              page: "04" },
  { title: "Las 3 preguntas que cambian todo",       sub: "Workbook imprimible incluido.",                 page: "06" },
  { title: "BLUF · la estructura que funciona",      sub: "Bottom Line Up Front en 4 bloques.",           page: "09" },
  { title: "Qué números mostrar (y cuáles esconder)",sub: "La regla del 3 · contexto · nulos.",           page: "12" },
  { title: "La galería: slide bueno vs tóxico",      sub: "8 comparaciones · el capítulo más largo.",     page: "15" },
  { title: "La historia (sin TED talk)",             sub: "SCQA en 5 slides.",                            page: "24" },
  { title: "Sobrevivir a las objeciones",            sub: "5 preguntas comunes · appendix.",              page: "27" },
  { title: "Usar IA sin perder autoría",             sub: "4 prompts útiles · lo que no puede.",          page: "30" },
  { title: "8 errores que cometés sin darte cuenta", sub: "Los más comunes y cómo arreglarlos.",          page: "33" },
  { title: "Checklist de 10 puntos",                 sub: "Imprimible · la página que más vas a usar.",   page: "35" },
];

function ContentsSection() {
  return (
    <section style={{ padding: "0 0 100px" }}>
      <div className="journal">
        <SectionHeader eyebrow="El índice completo" title={<>El índice <em>completo</em></>} />
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0 48px",
          marginTop: 48,
        }}>
          {chapters.map((ch, i) => (
            <div key={i} style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 16,
              padding: "18px 0",
              borderBottom: "1px solid rgba(139,26,74,.08)",
            }}>
              <span style={{
                fontFamily: D, fontStyle: "italic", fontWeight: 800,
                fontSize: 34, color: "var(--rosa-300)",
                lineHeight: 1.1, flexShrink: 0, width: 46,
              }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: D, fontWeight: 700, fontSize: 15,
                  color: "var(--ink)", lineHeight: 1.3,
                }}>
                  {ch.title}
                </div>
                <div style={{
                  fontFamily: B, fontSize: 11.5,
                  color: "var(--rosa)", marginTop: 3, lineHeight: 1.4,
                }}>
                  {ch.sub}
                </div>
              </div>
              <span style={{
                fontFamily: D, fontStyle: "italic", fontWeight: 700,
                fontSize: 22, color: "var(--rosa-300)",
                flexShrink: 0, lineHeight: 1.1,
              }}>
                {ch.page}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   6. QUIÉN SOY YO
───────────────────────────────────────── */
function AboutSection() {
  return (
    <section style={{ padding: "100px 0", background: "var(--cream-100)" }}>
      <div className="journal">
        <div style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: "40px 64px",
          alignItems: "start",
        }}>
          <div style={{
            width: 200, height: 200, borderRadius: 16,
            overflow: "hidden",
            border: "3px solid var(--rosa-200)",
            flexShrink: 0,
            background: "var(--rosa-100)",
          }}>
            <img
              src="/milo-foto.png"
              alt="Milo, Data Analyst"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }}
            />
          </div>

          <div>
            <span className="eyebrow-j" style={{ display: "block", marginBottom: 16 }}>
              Hola, soy Milo
            </span>
            <h2 style={{
              fontFamily: D, fontWeight: 700, fontSize: "clamp(22px, 3vw, 34px)",
              color: "var(--ink)", margin: "0 0 20px", lineHeight: 1.2,
            }}>
              Lo que te puedo dar es{" "}
              <em style={{ fontStyle: "italic", color: "var(--vino)" }}>
                lo que estoy aprendiendo desde adentro.
              </em>
            </h2>
            <p style={bodyP}>
              Tengo 25, soy argentina, y trabajo como Data Analyst y BI Developer en una corpo tech
              grande de LATAM. No soy experta, ni coach, ni profe. No te vengo a vender
              "transformá tu carrera en data".
            </p>
            <p style={bodyP}>
              Esta guía la armé entre presentación y presentación, porque cada vez que armaba una me
              daba cuenta de las mismas cosas que ojalá alguien me hubiera dicho dos años antes.{" "}
              <strong style={{ color: "var(--ink)" }}>
                Es la versión que me hubiera ahorrado las primeras 20 reuniones de readout que terminaron mal.
              </strong>
            </p>
            <p style={{ ...bodyP, marginBottom: 0 }}>
              Si querés saber más sobre lo que escribo sobre tech, data e IA desde adentro del laburo
              real, encontrame en Instagram como{" "}
              <a href="https://instagram.com/databymilo" target="_blank" rel="noopener noreferrer"
                style={{ color: "var(--vino)", fontWeight: 700 }}>
                @databymilo
              </a>{" "}
              o suscribite a mi newsletter.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   7. PRECIO
───────────────────────────────────────── */
const includes = [
  "PDF de 35 páginas con los 10 capítulos completos",
  "Workbook imprimible con las 3 preguntas del Cap 2",
  "Checklist imprimible de 10 puntos del Cap 10",
  "Cheat sheet de 5 preguntas y respuestas del Cap 7",
  "4 prompts de IA listos para copiar del Cap 8",
  "Actualizaciones gratis de futuras versiones",
];

function PricingSection() {
  return (
    <section style={{ padding: "100px 0" }}>
      <div className="journal">
        <SectionHeader eyebrow="Una sola compra" title={<>Una sola compra. <em>Sin suscripción.</em></>} />
        <div style={{ maxWidth: 480, margin: "48px auto 0" }}>
          <div style={{
            background: "#fffcf6",
            border: "1px solid rgba(139,26,74,.12)",
            borderRadius: 16, overflow: "hidden",
            boxShadow: "0 16px 48px rgba(139,26,74,.14)",
            borderTop: "4px solid var(--vino)",
          }}>
            <div style={{ padding: "40px 40px 32px", textAlign: "center" }}>
              <div style={{ fontFamily: D, fontWeight: 800, fontSize: 60, color: "var(--vino)", lineHeight: 1 }}>
                USD 15
              </div>
              <div style={{ fontFamily: B, fontSize: 14, color: "var(--fg-3)", marginTop: 8 }}>
                Pagás una vez, la guía es tuya para siempre.
              </div>
            </div>

            <div style={{ padding: "0 40px 32px", borderBottom: "1px solid rgba(139,26,74,.1)" }}>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {includes.map((item, i) => (
                  <li key={i} style={{ fontFamily: B, fontSize: 14, color: "var(--fg-2)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "var(--vino)", fontWeight: 800, flexShrink: 0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ padding: "32px 40px", textAlign: "center" }}>
              <a
                href={PAYMENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", fontSize: 16, padding: "16px 24px", fontWeight: 800, letterSpacing: ".03em" }}
              >
                ¡QUIERO MI GUÍA!
              </a>
              <p style={{ fontFamily: B, fontSize: 12, color: "var(--fg-3)", margin: "16px 0 0", lineHeight: 1.6 }}>
                Pago seguro por Hotmart. Descarga inmediata después del pago.<br />
                Garantía de devolución de 7 días sin preguntas.
              </p>
            </div>
          </div>

          <div style={{
            marginTop: 24, textAlign: "center",
            fontFamily: A, fontSize: 18, color: "var(--vino)",
            transform: "rotate(-1deg)", display: "block",
          }}>
            Solo necesitás que una sola presentación salga bien para recuperar lo que invertiste.
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   8. FAQ
───────────────────────────────────────── */
function FAQSection() {
  return (
    <section style={{ padding: "0 0 100px" }}>
      <div className="journal">
        <SectionHeader eyebrow="Preguntas frecuentes" title={<>Preguntas <em>frecuentes</em></>} />
        <div style={{ marginTop: 48 }}>
          <FAQAccordion />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   9. CTA FINAL
───────────────────────────────────────── */
function FinalCTASection() {
  return (
    <section style={{ background: "var(--vino)", padding: "100px 0" }}>
      <div className="journal" style={{ textAlign: "center" }}>
        <span style={{
          fontFamily: B, fontWeight: 800, fontSize: 10, letterSpacing: ".22em",
          textTransform: "uppercase", color: "rgba(255,255,255,.6)",
          display: "block", marginBottom: 24,
        }}>
          ✦ ¿Cuándo es tu próxima presentación?
        </span>
        <h2 style={{
          fontFamily: D, fontWeight: 800,
          fontSize: "clamp(30px, 4.5vw, 54px)",
          lineHeight: 1.1, letterSpacing: "-.02em",
          color: "#fff", margin: "0 0 20px",
        }}>
          Tu próximo readout puede salir distinto.
        </h2>
        <p style={{
          fontFamily: D, fontStyle: "italic",
          fontSize: "clamp(16px, 2vw, 22px)",
          color: "rgba(255,255,255,.8)", lineHeight: 1.5,
          margin: "0 auto 40px", maxWidth: 540,
        }}>
          Por menos de lo que sale un almuerzo, te llevás un sistema que vas a usar el resto de tu carrera.
        </p>
        <a
          href={PAYMENT_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: B, fontWeight: 800, fontSize: 16,
            padding: "16px 40px", borderRadius: 999,
            background: "#fff", color: "var(--vino)",
            textDecoration: "none", display: "inline-block",
            boxShadow: "0 8px 24px rgba(0,0,0,.2)",
            letterSpacing: ".04em",
          }}
        >
          ¡QUIERO MI GUÍA!
        </a>
        <p style={{ fontFamily: B, fontSize: 13, color: "rgba(255,255,255,.55)", margin: "16px 0 0" }}>
          Descarga inmediata · Garantía de devolución de 7 días sin preguntas.
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function SectionHeader({ eyebrow, title }) {
  return (
    <div>
      <span className="eyebrow-j" style={{ display: "block", marginBottom: 12 }}>{eyebrow}</span>
      <h2 style={{
        fontFamily: D, fontWeight: 700,
        fontSize: "clamp(28px, 3.5vw, 44px)",
        lineHeight: 1.1, letterSpacing: "-.02em",
        color: "var(--ink)", margin: 0,
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
