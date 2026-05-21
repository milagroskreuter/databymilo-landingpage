import About from "../components/sections/About";
import CTABlock from "../components/sections/CTABlock";
import Footer from "../components/sections/Footer";
import SectionDivider from "../components/SectionDivider";

export const metadata = {
  title: "Sobre Milo",
  description:
    "Trabajo en data dentro de una de las corpos tech más grandes de LATAM y cuento lo que veo desde adentro. Sin filtro corporativo, sin filtro motivacional. Eso es Data by Milo.",
  alternates: { canonical: "https://databymilo.me/sobre" },
  openGraph: {
    title: "Sobre Milo | Data by Milo",
    description:
      "Trabajo en data dentro de una de las corpos tech más grandes de LATAM y cuento lo que veo desde adentro. Sin filtro corporativo, sin filtro motivacional.",
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
