import Resources from "../components/sections/Resources";
import CTABlock from "../components/sections/CTABlock";
import Footer from "../components/sections/Footer";
import SectionDivider from "../components/SectionDivider";

export const metadata = {
  title: "Recursos gratis",
  description:
    "Cheatsheets, plantillas y guías de análisis de datos en español — todas gratuitas. Excel, SQL, Python y más, sin tecnicismos.",
  alternates: { canonical: "https://databymilo.me/recursos" },
  openGraph: {
    title: "Recursos gratis | Data by Milo",
    description:
      "Cheatsheets, plantillas y guías de análisis de datos en español — todas gratuitas.",
    url: "https://databymilo.me/recursos",
  },
};

export default function RecursosPage() {
  return (
    <>
      <main>
        <div className="journal">
          <Resources />
          <SectionDivider />
          <CTABlock />
        </div>
      </main>
      <Footer />
    </>
  );
}
