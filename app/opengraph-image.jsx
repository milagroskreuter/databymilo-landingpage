import { renderOg, OG_SIZE } from "@/lib/og/template";

export const runtime = "edge";
export const alt = "Data by Milo · la corpo no te lo cuenta, pero yo sí";
export const size = OG_SIZE;
export const contentType = "image/png";

// Imagen general del sitio (home y páginas sin imagen propia), con el titular del hero.
export default function OgImage() {
  return renderOg({
    titleSize: 88,
    title: (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span>la corpo no te lo cuenta,</span>
        <div style={{ display: "flex" }}>
          <span style={{ color: "#f2b7d1", marginRight: 22 }}>pero</span>
          <span>yo sí.</span>
        </div>
      </div>
    ),
  });
}
