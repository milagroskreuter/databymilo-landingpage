import Hero from "./components/sections/Hero";
import About from "./components/sections/About";
import Highlights from "./components/sections/Highlights";
import Resources from "./components/sections/Resources";
import Newsletter from "./components/sections/Newsletter";
import Redes from "./components/sections/Redes";
import Footer from "./components/sections/Footer";
import Marquee from "./components/Marquee";
import SectionDivider from "./components/SectionDivider";

export default function Page() {
  return (
    <>
      <main>
        <div className="journal">
          <Hero />
        </div>
        <Marquee />
        <div className="journal">
          <About />
          <SectionDivider />
          <Highlights />
          <SectionDivider />
          <Resources />
          <SectionDivider />
          <Newsletter />
          <SectionDivider />
          <Redes />
        </div>
      </main>
      <Footer />
    </>
  );
}
