import Reveal from "../primitives/Reveal";
import Hi from "../primitives/Hi";
import TypeEyebrow from "../primitives/TypeEyebrow";
import MarginNote from "../primitives/MarginNote";

export default function About() {
  const values = [
    {
      n: "01",
      t: "En español real",
      b: "Nada de traducciones literales. Hablamos como hablás vos: con vos, con che, con memes.",
    },
    {
      n: "02",
      t: "Sin condescendencia",
      b: "No te trato de tonta. Explico las cosas desde adentro, no desde arriba.",
    },
    {
      n: "03",
      t: "Para usar, no para guardar",
      b: "Cada recurso está hecho para abrirlo mientras trabajás. No para que quede archivado en una carpeta de descargas.",
    },
  ];

  const workflow = [
    {
      n: "01",
      t: "Primero entender, después explicar",
      b: "No publico sobre algo que apenas uso. Cada cheatsheet salió de una tarea real donde me hacía falta.",
    },
    {
      n: "02",
      t: "Ejemplos antes que teoría",
      b: "La fórmula importa menos que cuándo usarla. Siempre arranco con un caso concreto y después voy a lo abstracto.",
    },
    {
      n: "03",
      t: "Lo corto antes que lo completo",
      b: "Prefiero decir tres cosas bien que diez a medias. Si algo no cabe en dos páginas, probablemente no lo entendí bien.",
    },
  ];

  const stack = [
    "Excel",
    "Google Sheets",
    "SQL",
    "BigQuery",
    "Python",
    "Pandas",
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
            <MarginNote top={80}>← esto me cambió todo</MarginNote>
            <MarginNote top={220}>ojo acá ✦</MarginNote>
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
                En 2021 entré a mi primer trabajo de analista y <Hi color="#fadbe8">no entendía nada</Hi>. Todos hablaban en siglas (SQL, KPI, ETL) y yo asentía como si supiera.
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
                Los tutoriales asumían cosas que nadie me había enseñado. Los bootcamps costaban lo que tres alquileres. Los foros en inglés daban miedo.
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
                Así que empecé a escribir lo que iba aprendiendo, en español, como si le explicara a una amiga. Eso es Data by Milo.
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
            Tres cosas que trato de cumplir en cada recurso.
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
