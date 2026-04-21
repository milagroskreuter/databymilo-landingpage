import Reveal from "../primitives/Reveal";
import Hi from "../primitives/Hi";
import TypeEyebrow from "../primitives/TypeEyebrow";

export default function About() {
  const values = [
    {
      n: "01",
      t: "En español real",
      b: "Nada de traducciones literales. Hablamos como hablás vos — con vos, con che, con memes.",
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
            <div className="tape" style={{ top: -10, left: 40, transform: "rotate(-4deg)" }}></div>
            <div className="tape" style={{ top: -10, right: 40, transform: "rotate(4deg)" }}></div>
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
                En 2021 entré a mi primer trabajo de analista y <Hi color="#fadbe8">no entendía nada</Hi>. Todos hablaban en siglas — SQL, KPI, ETL — y yo asentía como si supiera.
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
                  fontSize: 22,
                  color: "var(--vino)",
                  textAlign: "right",
                }}
              >
                — milo
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
    </section>
  );
}
