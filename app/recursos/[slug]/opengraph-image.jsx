import { ImageResponse } from "next/og";
import { getResourceBySlug, getAvailableResources } from "../../lib/resources";

export const alt = "Data by Milo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAvailableResources().map((r) => ({ slug: r.slug }));
}

export default function OgImage({ params }) {
  const resource = getResourceBySlug(params.slug);
  const title = resource?.title ?? "La biblioteca";
  const type = resource?.type ?? "Recurso";
  const desc = resource?.desc ?? "Cheatsheets y guías de datos en español.";

  const fontSize = title.length > 40 ? 62 : 72;

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
        {/* Radial gradient accent */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 80% 20%, rgba(212,68,122,0.35) 0%, transparent 55%)",
          }}
        />

        {/* Eyebrow: resource type */}
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
          DATA BY MILO · {type.toUpperCase()}
        </div>

        {/* Resource title */}
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

        {/* Description */}
        <div
          style={{
            fontSize: 24,
            color: "#fdf5ec",
            opacity: 0.8,
            fontStyle: "normal",
            maxWidth: 680,
            lineHeight: 1.5,
            fontFamily: "sans-serif",
            fontWeight: 400,
          }}
        >
          {desc}
        </div>

        {/* URL badge */}
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
    { ...size }
  );
}
