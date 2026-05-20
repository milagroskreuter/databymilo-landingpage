import Link from "next/link";
import Footer from "../components/sections/Footer";

export const metadata = {
  title: "Te diste de baja",
  robots: { index: false },
};

export default function DesuscribirsePage() {
  return (
    <>
      <main>
        <div className="journal">
          <section className="section" style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: 80, paddingBottom: 80 }}>
            <div style={{
              fontFamily: "var(--font-body)",
              fontSize: 10,
              letterSpacing: ".18em",
              textTransform: "uppercase",
              color: "var(--vino)",
              marginBottom: 24,
              opacity: 0.7,
            }}>
              Data by Milo
            </div>

            <div style={{
              fontSize: 48,
              marginBottom: 24,
              lineHeight: 1,
            }}>
              🩷
            </div>

            <h1 style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: "clamp(28px, 4vw, 38px)",
              color: "var(--ink)",
              margin: "0 0 16px",
              lineHeight: 1.15,
            }}>
              Te diste de baja.
            </h1>

            <p style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 18,
              color: "var(--fg-2)",
              lineHeight: 1.6,
              margin: "0 0 40px",
            }}>
              No más mails de mi parte. Hasta cuando quieras — los recursos siguen disponibles sin necesidad de nada.
            </p>

            <Link
              href="/recursos"
              style={{
                fontFamily: "var(--font-body)",
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
              Ver la biblioteca de recursos →
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
