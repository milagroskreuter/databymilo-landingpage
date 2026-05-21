import Reveal from "../primitives/Reveal";
import TypeEyebrow from "../primitives/TypeEyebrow";

export default function Highlights() {
  const items = [
    {
      tag: "Vida en la corpo",
      title: "Desde adentro, sin editar",
      body: "Anécdotas, reuniones que podrían haber sido un mail, dinámicas internas. La diferencia entre cómo se vende trabajar en tech y cómo se vive.",
    },
    {
      tag: "Reflexión generacional",
      title: "Cosas que no se dicen en LinkedIn",
      body: "La presión de definir carrera ahora. Ver amigos que se van afuera. Qué significa tener un buen trabajo hoy.",
    },
    {
      tag: "Explicativo accesible",
      title: "Cuando vale la pena explicar",
      body: "SQL, BI, Python, IA: conceptos explicados como a una amiga en un café, no como en un tutorial de YouTube.",
    },
  ];

  return (
    <section className="section">
      <div className="section-head">
        <TypeEyebrow className="eyebrow-j">En este cuaderno</TypeEyebrow>
        <div className="rule"></div>
        <div className="pagenum">pág. 12</div>
      </div>

      <Reveal>
        <h2 className="section-title">
          Lo que vive <em>en este cuaderno</em>.
        </h2>
        <p className="section-sub">
          Cuatro líneas de contenido. Todas sobre tech, data e IA. Todas en español latinoamericano.
        </p>
      </Reveal>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 24,
          marginTop: 64,
        }}
      >
        {items.map((it, i) => (
          <Reveal key={i} delay={i * 80}>
            <div className="card" style={{ padding: 32, height: "100%" }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 700,
                  fontSize: 44,
                  color: "var(--rosa-200)",
                  lineHeight: 1,
                  marginBottom: 20,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="eyebrow-j" style={{ marginBottom: 10 }}>
                {it.tag}
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 22,
                  color: "var(--ink)",
                  margin: "0 0 12px",
                  lineHeight: 1.2,
                }}
              >
                {it.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "var(--fg-2)",
                  margin: 0,
                }}
              >
                {it.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
