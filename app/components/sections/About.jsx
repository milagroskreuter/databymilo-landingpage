import Reveal from "../primitives/Reveal";
import Hi from "../primitives/Hi";
import TypeEyebrow from "../primitives/TypeEyebrow";

export default function About() {
  const values = [
    {
      n: "01",
      t: "Desde adentro, no desde el escritorio del coach",
      b: "Lo que cuento lo estoy viviendo. No lo adapto de un artículo ni lo pienso desde afuera.",
    },
    {
      n: "02",
      t: "Hablo como hablaría con una amiga",
      b: "Sin frases de coach, sin palabras que suenan bien pero no dicen nada. Si tengo una opinión, la tengo y la digo.",
    },
    {
      n: "03",
      t: "Sin filtro corporativo ni motivacional",
      b: "Ni la versión idealizada del trabajo en tech ni el burnout como badge. Lo que pasa, cómo pasa, sin moraleja al final.",
    },
  ];

  const workflow = [
    {
      n: "01",
      t: "Cuento lo que vi, no lo que leí",
      b: "Lo que escribo acá lo estoy observando o viviendo en primera mano. No adapto artículos ni resumo lo que ya está en todos lados.",
    },
    {
      n: "02",
      t: "Observación, no consejo",
      b: "Cuento lo que pasa, no lo que deberías hacer. El POV está, pero no disfrazado de consejo motivacional.",
    },
    {
      n: "03",
      t: "Honesto, aunque canse",
      b: "Si algo en la corpo me parece absurdo, lo digo. Sin suavizarlo para que baje mejor.",
    },
  ];

  const stack = [
    "Excel",
    "Google Sheets",
    "SQL",
    "BigQuery",
    "Python",
    "Pandas",
    "Power BI",
    "Tableau",
    "Looker Studio",
    "Notion",
    "Figma",
  ];

  return (
    <section id="sobre" className="section">
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

      <div
        className="grid-split"
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          gap: 64,
          marginTop: 72,
          alignItems: "start",
        }}
      >
        <Reveal delay={100}>
          <div style={{ position: "relative" }}>
            <div className="card" style={{ padding: 40 }}>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 19,
                  lineHeight: 1.65,
                  color: "var(--ink)",
                  margin: "0 0 18px",
                }}
              >
                Trabajo en una de las corporaciones tech más grandes de LATAM. Lo que escribo acá lo estoy viendo en tiempo real: las reuniones que no hacen falta, los proyectos de IA que nadie sabe bien para qué sirven, la diferencia entre cómo se presenta trabajar en tech y <Hi color="#fadbe8">cómo se vive</Hi>.
              </p>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 19,
                  lineHeight: 1.65,
                  color: "var(--ink)",
                  margin: "0 0 18px",
                }}
              >
                No soy docente, no soy gurú. Soy alguien que está ahí y tiene ganas de contarlo sin filtro corporativo ni filtro motivacional.
              </p>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: 19,
                  lineHeight: 1.65,
                  color: "var(--vino)",
                  margin: 0,
                }}
              >
                Así que abrí este cuaderno y empecé a escribir lo que veo. Eso es Data by Milo.
              </p>
              <div
                style={{
                  marginTop: 28,
                  fontFamily: "var(--font-accent)",
                  fontSize: 28,
                  color: "var(--vino)",
                  textAlign: "right",
                }}
              >
                milo
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {values.map((v, i) => (
              <div key={i} className="card" style={{ display: "flex", gap: 20, padding: 28 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    background: "var(--vino)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontWeight: 800,
                    fontSize: 17,
                    flexShrink: 0,
                  }}
                >
                  {v.n}
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: 22,
                      color: "var(--ink)",
                      margin: "0 0 8px",
                      lineHeight: 1.25,
                    }}
                  >
                    {v.t}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: "var(--fg-2)",
                      margin: 0,
                    }}
                  >
                    {v.b}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      <Reveal delay={80}>
        <div style={{ marginTop: 96 }}>
          <h2 className="section-title">
            Cómo <em>trabajo</em>.
          </h2>
          <p className="section-sub">
            Tres cosas que trato de cumplir en cada cosa que escribo.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 20,
              marginTop: 48,
            }}
          >
            {workflow.map((v, i) => (
              <div key={i} className="card" style={{ padding: 28 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    background: "var(--rosa-50)",
                    border: "1.5px solid var(--vino)",
                    color: "var(--vino)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontWeight: 800,
                    fontSize: 15,
                    marginBottom: 16,
                  }}
                >
                  {v.n}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 20,
                    color: "var(--ink)",
                    margin: "0 0 10px",
                    lineHeight: 1.25,
                  }}
                >
                  {v.t}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "var(--fg-2)",
                    margin: 0,
                  }}
                >
                  {v.b}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div style={{ marginTop: 96 }}>
          <h2 className="section-title">
            Qué <em>uso</em>.
          </h2>
          <p className="section-sub">
            El stack que aparece todos los días en mi trabajo y en lo que escribo.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 36,
            }}
          >
            {stack.map((tool) => (
              <span
                key={tool}
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: 14,
                  color: "var(--vino)",
                  background: "var(--rosa-50)",
                  border: "1px dashed rgba(139,26,74,.28)",
                  padding: "10px 18px",
                  borderRadius: 999,
                }}
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
