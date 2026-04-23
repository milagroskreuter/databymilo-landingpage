import Link from "next/link";
import Footer from "./components/sections/Footer";

export const metadata = {
  title: "Página no encontrada",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <>
      <main>
        <div className="journal">
          <section
            className="section"
            style={{
              minHeight: "70vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              gap: 20,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: ".22em",
                textTransform: "uppercase",
                color: "var(--vino)",
                opacity: 0.6,
              }}
            >
              Error · Entrada Nº 404
            </div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 700,
                fontSize: "clamp(42px, 6vw, 72px)",
                color: "var(--ink)",
                margin: 0,
                lineHeight: 1.1,
                maxWidth: 680,
              }}
            >
              Esta página <em style={{ color: "var(--vino)" }}>no existe</em>.
            </h1>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: "clamp(17px, 2vw, 20px)",
                color: "var(--fg-2)",
                lineHeight: 1.6,
                maxWidth: 480,
                margin: 0,
              }}
            >
              Capaz buscabas un recurso, un post del blog, o llegaste por error.
              No pasa nada, esto le pasa a todo el mundo.
            </p>
            <div
              style={{
                fontFamily: "var(--font-accent)",
                fontSize: 52,
                color: "var(--rosa)",
                lineHeight: 1,
                marginTop: 4,
              }}
            >
              ✦
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
              <Link href="/" className="btn btn-primary">
                ← Volver al inicio
              </Link>
              <Link href="/blog" className="btn btn-ghost">
                Ver el blog
              </Link>
              <Link href="/recursos" className="btn btn-ghost">
                Ver recursos
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
