import About from "../components/sections/About";
import CTABlock from "../components/sections/CTABlock";
import Footer from "../components/sections/Footer";
import SectionDivider from "../components/SectionDivider";

export const metadata = {
  title: "Sobre Milo",
  description:
    "Trabajo en data para una fintech del exterior y antes estuve en una de las corpos tech más grandes de LATAM. Cuento lo que veo desde adentro, sin filtro.",
  alternates: { canonical: "https://databymilo.me/sobre" },
  openGraph: {
    title: "Sobre Milo | Data by Milo",
    description:
      "Trabajo en data para una fintech del exterior y antes estuve en una de las corpos tech más grandes de LATAM. Cuento lo que veo desde adentro, sin filtro.",
    url: "https://databymilo.me/sobre",
    images: [{ url: "/og?title=De%20no%20entender%20nada%2C%20a%20escribirlo%20todo&type=sobre%20milo", width: 1200, height: 630, alt: "De no entender nada, a escribirlo todo | Data by Milo" }],
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
