import localFont from "next/font/local";
import { Caveat } from "next/font/google";
import Topbar from "./components/Topbar";
import ScrollProgress from "./components/ScrollProgress";
import CursorSparkles from "./components/CursorSparkles";
import "./globals.css";

const playfair = localFont({
  src: [
    {
      path: "../public/fonts/PlayfairDisplay-VariableFont_wght.ttf",
      style: "normal",
      weight: "400 900",
    },
    {
      path: "../public/fonts/PlayfairDisplay-Italic-VariableFont_wght.ttf",
      style: "italic",
      weight: "400 900",
    },
  ],
  variable: "--font-playfair",
  display: "swap",
});

const montserrat = localFont({
  src: [
    {
      path: "../public/fonts/Montserrat-VariableFont_wght.ttf",
      style: "normal",
      weight: "100 900",
    },
    {
      path: "../public/fonts/Montserrat-Italic-VariableFont_wght.ttf",
      style: "italic",
      weight: "100 900",
    },
  ],
  variable: "--font-montserrat",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata = {
  title: "Data by Milo · querido diario",
  description:
    "El cuaderno de Milo: cheatsheets, plantillas y guías de análisis de datos en español, para las que están empezando.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${playfair.variable} ${montserrat.variable} ${caveat.variable}`}>
      <body data-paper="aged" data-density="balanced" data-mood="day">
        <ScrollProgress />
        <CursorSparkles />
        <div className="paper-bg" style={{ position: "fixed", inset: 0, zIndex: 0 }} />
        <Topbar />
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      </body>
    </html>
  );
}
