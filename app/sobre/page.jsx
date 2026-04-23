import About from "../components/sections/About";
import CTABlock from "../components/sections/CTABlock";
import Footer from "../components/sections/Footer";
import SectionDivider from "../components/SectionDivider";

export const metadata = {
  title: "Sobre Milo",
  description:
    "La historia detrás de Data by Milo: de no entender nada en mi primer trabajo de analista a escribir todo lo que aprendí en español, sin jerga.",
  alternates: { canonical: "https://databymilo.me/sobre" },
  openGraph: {
    title: "Sobre Milo | Data by Milo",
    description:
      "La historia detrás de Data by Milo: análisis de datos en español, sin tecnicismos.",
    url: "https://databymilo.me/sobre",
  },
};

export default function SobrePage() {
  return (
    <>
      <main>
        <div className="journal">
          <About />
          <SectionDivider />
          <CTABlock />
        </div>
      </main>
      <Footer />
    </>
  );
}
