import Link from "next/link";
import Footer from "./sections/Footer";
import TypeEyebrow from "./primitives/TypeEyebrow";
import ListSignupForm from "./ListSignupForm";

// "Interesadas en SQL" → ["Interesadas en", "SQL"]: la última palabra va en cursiva rosa, como en los títulos del sitio.
function splitTitle(name) {
  const clean = name.trim().replace(/[.!?¡¿\s]+$/g, "");
  const i = clean.lastIndexOf(" ");
  return i === -1 ? ["", clean] : [clean.slice(0, i), clean.slice(i + 1)];
}

// Página pública de una lista (parte visual). La usa /listas/[slug].
export default function ListLanding({ list }) {
  const [first, last] = splitTitle(list.name);

  return (
    <>
      <main>
        <div className="journal">
          <section className="section" style={{ maxWidth: 760, margin: "0 auto" }}>
            <div className="section-head">
              <TypeEyebrow className="eyebrow-j">Lista</TypeEyebrow>
              <div className="rule"></div>
              <div className="pagenum">✦</div>
            </div>

            <h1 className="section-title">
              {first && <>{first} </>}
              <em>{last}</em>.
            </h1>

            {list.description && <p className="section-sub">{list.description}</p>}

            {list.active ? (
              <ListSignupForm
                listSlug={list.slug}
                eyebrow={`lista · ${list.name}`}
                title="Dejá tu mail y te sumo."
                subtitle="Cero spam. Te vas cuando quieras, con un solo clic."
                buttonLabel={list.button_label || "Sumame →"}
                successText="¡Listo! Ya estás en la lista ✦"
                askName
                marginTop={40}
                headingLevel={2}
              />
            ) : (
              <div
                style={{
                  marginTop: 40,
                  padding: "32px 28px",
                  borderRadius: 14,
                  background: "var(--rosa-50)",
                  border: "1px dashed rgba(139,26,74,.3)",
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: 20,
                  color: "var(--ink)",
                  lineHeight: 1.45,
                }}
              >
                Esta lista no está recibiendo suscripciones por ahora.
                <div style={{ marginTop: 16 }}>
                  <Link
                    href="/"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontStyle: "normal",
                      fontWeight: 700,
                      fontSize: 13,
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                      color: "var(--vino)",
                      textDecoration: "none",
                      borderBottom: "1.5px solid var(--vino)",
                      paddingBottom: 2,
                    }}
                  >
                    Volver al inicio →
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
