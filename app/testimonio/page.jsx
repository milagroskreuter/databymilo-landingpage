import Footer from "../components/sections/Footer";
import TestimonioForm from "./TestimonioForm";
import { getSupabaseAdmin } from "@/lib/supabase";
import "./testimonio.css";

export const metadata = {
  title: "Dejame tu testimonio",
  description: "Contame qué te pareció lo que leíste, compraste o aprendiste conmigo. Dos minutos y me alegrás la semana.",
  alternates: { canonical: "https://databymilo.me/testimonio" },
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

// /testimonio?producto=<slug> deja el testimonio etiquetado con ese recurso
// (sirve para el link del mail post-compra).
async function findProduct(slug) {
  if (typeof slug !== "string" || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(slug)) return null;
  try {
    const { data } = await getSupabaseAdmin()
      .from("resources")
      .select("slug, title")
      .eq("slug", slug)
      .maybeSingle();
    return data ? { slug: data.slug, title: data.title } : null;
  } catch {
    return null;
  }
}

export default async function TestimonioPage({ searchParams }) {
  const product = await findProduct(searchParams?.producto);

  return (
    <>
      <main>
        <div className="journal">
          <section className="mk-comunidad-tform-section">
            <div className="mk-comunidad-tform-intro">
              <span className="eyebrow-j">Tu voz · Data by Milo</span>
              <h1 className="mk-comunidad-tform-title">
                ¿Te sirvió? <em>Contámelo.</em>
              </h1>
              <p className="mk-comunidad-tform-sub">
                {product
                  ? `Me encantaría saber qué te pareció “${product.title}”. Dos minutos y me alegrás la semana.`
                  : "Si algo de lo que escribo, comparto o vendo te ayudó, me encantaría saberlo. Dos minutos y me alegrás la semana."}
              </p>
              <p className="hand mk-comunidad-tform-hand">gracias de verdad 🩷</p>
            </div>

            <TestimonioForm product={product} />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
