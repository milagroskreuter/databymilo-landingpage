import { ImageResponse } from "next/og";

// Plantilla de las imágenes para compartir (WhatsApp, LinkedIn, X...).
// Usa las mismas tipografías del sitio en versión estática: el generador de
// imágenes no maneja bien las fuentes variables de /public/fonts.

export const OG_SIZE = { width: 1200, height: 630 };
export const TAGLINE = "Tech, data e IA contado desde adentro.";

const VINO = "#8b1a4a";
const ROSA = "#f2b7d1";
const CREAM = "#fdf5ec";
const AMARILLO = "#fbe7a8";

let fontsPromise;
function loadFonts() {
  fontsPromise ??= Promise.all([
    fetch(new URL("./PlayfairDisplay-BoldItalic.ttf", import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL("./Montserrat-SemiBold.ttf", import.meta.url)).then((r) => r.arrayBuffer()),
  ]).then(([playfair, montserrat]) => [
    { name: "Playfair", data: playfair, weight: 700, style: "italic" },
    { name: "Montserrat", data: montserrat, weight: 600, style: "normal" },
  ]);
  return fontsPromise;
}

/**
 * @param {object} o
 * @param {string} [o.eyebrow]  texto chico de arriba (sección)
 * @param {import("react").ReactNode} o.title
 * @param {number} [o.titleSize]
 */
export async function renderOg({ eyebrow, title, titleSize = 72 }) {
  const fonts = await loadFonts().catch(() => undefined);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 88px 64px",
          background: VINO,
          backgroundImage:
            "radial-gradient(ellipse at 85% 10%, rgba(212,68,122,0.55) 0%, rgba(139,26,74,0) 55%), radial-gradient(ellipse at 0% 100%, rgba(26,10,16,0.35) 0%, rgba(139,26,74,0) 50%)",
          color: CREAM,
          fontFamily: "Montserrat",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: ROSA,
          }}
        >
          {eyebrow ? `Data by Milo · ${eyebrow}` : "Data by Milo"}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontFamily: "Playfair",
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: titleSize,
              lineHeight: 1.08,
              maxWidth: 1000,
              color: CREAM,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 26,
              fontWeight: 600,
              color: CREAM,
              opacity: 0.8,
            }}
          >
            {TAGLINE}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontFamily: "Playfair", fontStyle: "italic", fontWeight: 700, fontSize: 34 }}>
            <span>data</span>
            <span style={{ color: AMARILLO, margin: "0 12px" }}>·</span>
            <span>by milo</span>
          </div>
          <div style={{ display: "flex", fontSize: 20, fontWeight: 600, color: ROSA, letterSpacing: "0.04em" }}>
            databymilo.me
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts }
  );
}

/** Tamaño de letra del título según el largo, para que entre en dos o tres líneas. */
export function titleSizeFor(text) {
  const n = text.length;
  if (n > 70) return 52;
  if (n > 50) return 60;
  if (n > 32) return 68;
  return 80;
}
