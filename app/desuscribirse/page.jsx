import Link from "next/link";
import Footer from "../components/sections/Footer";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getList } from "@/lib/lists";

export const metadata = {
  title: "Te diste de baja",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function DesuscribirsePage({ searchParams }) {
  const slug = typeof searchParams?.l === "string" ? searchParams.l : "";
  const isCorpo = slug === "corpo";

  // Listas personalizadas: se muestra el nombre de la lista de la que se dio de baja
  let customName = null;
  if (slug && slug !== "carta" && !isCorpo && slug.length <= 40) {
    try {
      const list = await getList(getSupabaseAdmin(), slug);
      customName = list?.name ?? null;
    } catch {}
  }

  const message = isCorpo
    ? "Listo, no te aviso más cuando suba una nota nueva. Si seguís en la carta del domingo, esos mails siguen llegando."
    : customName
      ? `Listo, saliste de "${customName}". Si seguís en otras listas, esos mails siguen llegando.`
      : "No más mails de mi parte. Hasta cuando quieras — los recursos siguen disponibles sin necesidad de nada.";
  const href = isCorpo ? "/blog" : customName ? "/" : "/recursos";
  const cta = isCorpo
    ? "Ir a la edición corpo →"
    : customName
      ? "Volver al inicio →"
      : "Ver la biblioteca de recursos →";

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
              {message}
            </p>

            <Link
              href={href}
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
              {cta}
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
