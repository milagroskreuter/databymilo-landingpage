import localFont from "next/font/local";
import { Caveat } from "next/font/google";
import Topbar from "./components/Topbar";
import ScrollProgress from "./components/ScrollProgress";
import CursorSparkles from "./components/CursorSparkles";
import JsonLd from "./components/JsonLd";
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
  metadataBase: new URL("https://databymilo.me"),
  title: {
    default: "Data by Milo — Análisis de datos en español, sin tecnicismos",
    template: "%s | Data by Milo",
  },
  description:
    "Cheatsheets, plantillas y guías de análisis de datos en español para mujeres en LATAM. Aprendé Excel, SQL y Python gratis — sin jerga y sin condescendencia.",
  keywords: [
    "análisis de datos en español",
    "aprender Excel gratis",
    "SQL para principiantes",
    "Python pandas tutorial",
    "cheatsheet datos",
    "recursos datos LATAM",
    "data analytics español",
    "aprender datos sin bootcamp",
  ],
  authors: [{ name: "Milo", url: "https://databymilo.me" }],
  creator: "Milo",
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://databymilo.me",
    siteName: "Data by Milo",
    title: "Data by Milo — Análisis de datos en español, sin tecnicismos",
    description:
      "Cheatsheets, plantillas y guías de análisis de datos en español para mujeres en LATAM. Excel, SQL, Python — gratis.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Data by Milo — análisis de datos en español",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Data by Milo — Análisis de datos en español",
    description:
      "Cheatsheets, plantillas y guías de análisis de datos en español para mujeres en LATAM. Excel, SQL, Python — gratis.",
    creator: "@databymilo",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://databymilo.me",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${playfair.variable} ${montserrat.variable} ${caveat.variable}`}>
      <body data-paper="aged" data-density="balanced" data-mood="day">
        <JsonLd />
        <ScrollProgress />
        <CursorSparkles />
        <div className="paper-bg" style={{ position: "fixed", inset: 0, zIndex: 0 }} />
        <Topbar />
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      </body>
    </html>
  );
}
