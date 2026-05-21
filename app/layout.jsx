import localFont from "next/font/local";
import { Caveat } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Topbar from "./components/Topbar";
import ScrollProgress from "./components/ScrollProgress";
import CursorSparkles from "./components/CursorSparkles";
import JsonLd from "./components/JsonLd";
import WelcomeConfetti from "./components/WelcomeConfetti";
import NewsletterPopup from "./components/NewsletterPopup";
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
    default: "Data by Milo · Tech, data e IA contado desde adentro",
    template: "%s | Data by Milo",
  },
  description:
    "Tech, data e IA contado desde adentro de una corpo grande. Vida en la corpo, IA aplicada y reflexiones de carrera, para mujeres latinoamericanas que trabajan o quieren trabajar en tech.",
  keywords: [
    "vida en la corpo tech",
    "trabajar en data LATAM",
    "IA en empresas",
    "carrera en tech latam",
    "data analytics español",
    "trabajo en tech mujer",
    "reflexion carrera tech",
    "data by milo",
  ],
  authors: [{ name: "Milo", url: "https://databymilo.me" }],
  creator: "Milo",
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://databymilo.me",
    siteName: "Data by Milo",
    title: "Data by Milo · Tech, data e IA contado desde adentro",
    description:
      "Tech, data e IA contado desde adentro de una corpo grande. Para mujeres latinoamericanas que trabajan o quieren trabajar en tech.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Data by Milo · análisis de datos en español",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Data by Milo · Tech, data e IA contado desde adentro",
    description:
      "Tech, data e IA contado desde adentro de una corpo grande. Para mujeres latinoamericanas que trabajan o quieren trabajar en tech.",
    creator: "@databymilo",
    images: ["/opengraph-image"],
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
    types: {
      "application/rss+xml": "https://databymilo.me/feed.xml",
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${playfair.variable} ${montserrat.variable} ${caveat.variable}`}>
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-TJFMZ3JG');`,
          }}
        />
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-G8FD6CSP2G" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-G8FD6CSP2G');`,
          }}
        />
      </head>
      <body data-paper="aged" data-density="balanced" data-mood="day">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TJFMZ3JG"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <JsonLd />
        <WelcomeConfetti />
        <NewsletterPopup />
        <ScrollProgress />
        <CursorSparkles />
        <div className="paper-bg" style={{ position: "fixed", inset: 0, zIndex: 0 }} />
        <Topbar />
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
