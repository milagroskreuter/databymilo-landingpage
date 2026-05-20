import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "Data by Milo";
  const type = searchParams.get("type") ?? "";

  const eyebrow = type
    ? `DATA BY MILO · ${type.toUpperCase()}`
    : "DATA BY MILO";

  const fontSize = title.length > 60 ? 48 : title.length > 40 ? 60 : 72;

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
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 80% 20%, rgba(212,68,122,0.35) 0%, transparent 55%)",
          }}
        />
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
          {eyebrow}
        </div>
        <div
          style={{
            fontSize: fontSize,
            fontWeight: 700,
            color: "#fdf5ec",
            lineHeight: 1.1,
            marginBottom: 28,
            maxWidth: 900,
            fontStyle: "italic",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 22,
            color: "#fdf5ec",
            opacity: 0.75,
            maxWidth: 640,
            lineHeight: 1.5,
            fontFamily: "sans-serif",
          }}
        >
          Análisis de datos en español, sin tecnicismos.
        </div>
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
          databymilo.me
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
