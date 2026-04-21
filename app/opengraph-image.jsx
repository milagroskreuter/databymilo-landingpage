import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Data by Milo — análisis de datos en español";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#8b1a4a",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px 96px",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        {/* Noise texture via radial gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 80% 20%, rgba(212,68,122,0.35) 0%, transparent 55%)",
          }}
        />

        {/* Eyebrow */}
        <div
          style={{
            fontSize: 18,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#f2b7d1",
            marginBottom: 28,
            fontFamily: "sans-serif",
            fontWeight: 700,
          }}
        >
          DATA BY MILO
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 700,
            color: "#fdf5ec",
            lineHeight: 1.05,
            marginBottom: 28,
            maxWidth: 820,
          }}
        >
          Los datos,{" "}
          <span style={{ fontStyle: "italic", color: "#f2b7d1" }}>
            sin llorar
          </span>
          {" "}en el intento.
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: 26,
            color: "#fdf5ec",
            opacity: 0.82,
            fontStyle: "italic",
            maxWidth: 680,
            lineHeight: 1.5,
            fontFamily: "serif",
          }}
        >
          Cheatsheets, plantillas y guías de datos en español — gratis.
        </div>

        {/* Bottom badge */}
        <div
          style={{
            position: "absolute",
            bottom: 64,
            right: 96,
            fontSize: 20,
            color: "#f2b7d1",
            fontStyle: "italic",
            fontFamily: "serif",
            letterSpacing: "0.04em",
          }}
        >
          databymilo.com
        </div>
      </div>
    ),
    { ...size }
  );
}
