import { ImageResponse } from "next/og";
import { colorByRole } from "./defaults";
import { DESIGN_BY_ID, SIZES } from "./designs";

// Generador de placas y carruseles en PNG con los tokens del sistema de marca.
// Igual que lib/og: usa las fuentes estáticas de lib/og (el generador no maneja
// bien las variables). Pensado para runtime edge.

let fontsPromise;
function loadFonts() {
  fontsPromise ??= Promise.all([
    fetch(new URL("../../og/PlayfairDisplay-BoldItalic.ttf", import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL("../../og/Montserrat-SemiBold.ttf", import.meta.url)).then((r) => r.arrayBuffer()),
  ]).then(([playfair, montserrat]) => [
    { name: "Playfair", data: playfair, weight: 700, style: "italic" },
    { name: "Montserrat", data: montserrat, weight: 600, style: "normal" },
  ]);
  return fontsPromise;
}

/** Colores de la pieza según el tema, tomados de la paleta guardada. */
export function themeColors(brand, theme) {
  const p = brand.palette;
  const principal = colorByRole(p, "principal", "#8b1a4a");
  const acento = colorByRole(p, "acento", "#d4447a");
  const fondo = colorByRole(p, "fondo", "#fdf5ec");
  const texto = colorByRole(p, "texto", "#1a1a1a");
  const suave = colorByRole(p, "suave", "#f2b7d1");
  const destacado = colorByRole(p, "destacado", "#fbe7a8");
  if (theme === "claro") {
    return { bg: fondo, title: principal, body: texto, accent: acento, soft: principal, dot: acento, chipBg: principal, chipFg: fondo, glow: false };
  }
  return { bg: principal, title: fondo, body: fondo, accent: suave, soft: suave, dot: destacado, chipBg: fondo, chipFg: principal, glow: true, acento };
}

/** Texto con *resaltados*: cada palabra es un span para que corte bien de línea. */
function rich({ text, color, accent, gap = "0.26em" }) {
  const parts = String(text || "").split(/(\*[^*]+\*)/g).filter(Boolean);
  const words = [];
  for (const part of parts) {
    const hl = part.startsWith("*") && part.endsWith("*");
    const clean = hl ? part.slice(1, -1) : part;
    for (const w of clean.split(/\s+/).filter(Boolean)) words.push({ w, hl });
  }
  return words.map(({ w, hl }, i) => (
    <span key={i} style={{ color: hl ? accent : color, marginRight: i === words.length - 1 ? 0 : gap }}>
      {w}
    </span>
  ));
}

function fit(text, steps) {
  const n = String(text || "").replace(/\*/g, "").length;
  for (const [max, size] of steps) if (n <= max) return size;
  return steps[steps.length - 1][1];
}

function Wordmark({ c, size = 34 }) {
  return (
    <div style={{ display: "flex", fontFamily: "Playfair", fontStyle: "italic", fontWeight: 700, fontSize: size, color: c.title }}>
      <span>data</span>
      <span style={{ color: c.dot, margin: "0 10px" }}>·</span>
      <span>by milo</span>
    </div>
  );
}

function Eyebrow({ c, text }) {
  return (
    <div
      style={{
        display: "flex",
        fontSize: 24,
        fontWeight: 600,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: c.soft,
      }}
    >
      {text ? `Data by Milo · ${text}` : "Data by Milo"}
    </div>
  );
}

function Footer({ c, page, total, handle }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
      <Wordmark c={c} />
      <div style={{ display: "flex", fontSize: 22, fontWeight: 600, color: c.soft, letterSpacing: "0.06em" }}>
        {page && total ? `${page} / ${total}` : handle || "databymilo.me"}
      </div>
    </div>
  );
}

function Portada({ c, d, h }) {
  const size = fit(d.title, [[30, h > 1100 ? 108 : 96], [55, h > 1100 ? 92 : 80], [85, h > 1100 ? 78 : 68], [999, h > 1100 ? 66 : 58]]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
      <div style={{ display: "flex", flexWrap: "wrap", fontFamily: "Playfair", fontStyle: "italic", fontWeight: 700, fontSize: size, lineHeight: 1.08 }}>
        {rich({ text: d.title, color: c.title, accent: c.accent })}
      </div>
      {d.subtitle ? (
        <div style={{ display: "flex", flexWrap: "wrap", fontSize: 36, color: c.body, opacity: 0.85, lineHeight: 1.35 }}>
          {rich({ text: d.subtitle, color: c.body, accent: c.accent })}
        </div>
      ) : null}
      {d.swipe !== "-" ? (
        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              marginTop: 18,
              padding: "16px 34px",
              borderRadius: 999,
              background: c.chipBg,
              color: c.chipFg,
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: "0.08em",
            }}
          >
            {d.swipe || "Deslizá →"}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Dato({ c, d, h }) {
  const numSize = fit(d.number, [[4, h > 1100 ? 300 : 250], [7, h > 1100 ? 220 : 190], [999, 150]]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      <div style={{ display: "flex", fontFamily: "Playfair", fontStyle: "italic", fontWeight: 700, fontSize: numSize, lineHeight: 1, color: c.accent }}>
        {d.number || "—"}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", fontSize: fit(d.label, [[60, 50], [110, 42], [999, 36]]), color: c.body, lineHeight: 1.3, maxWidth: 860 }}>
        {rich({ text: d.label, color: c.body, accent: c.accent })}
      </div>
      {d.source ? <div style={{ display: "flex", fontSize: 22, color: c.soft, marginTop: 10 }}>{d.source}</div> : null}
    </div>
  );
}

function Lista({ c, d, h }) {
  const items = String(d.items || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
  const itemSize = items.length > 4 ? 38 : h > 1100 ? 46 : 40;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      <div style={{ display: "flex", flexWrap: "wrap", fontFamily: "Playfair", fontStyle: "italic", fontWeight: 700, fontSize: fit(d.title, [[25, 84], [50, 70], [999, 58]]), lineHeight: 1.08 }}>
        {rich({ text: d.title, color: c.title, accent: c.accent })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: h > 1100 ? 30 : 22 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 26 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 64,
                height: 64,
                flexShrink: 0,
                borderRadius: 999,
                background: c.chipBg,
                color: c.chipFg,
                fontFamily: "Playfair",
                fontStyle: "italic",
                fontWeight: 700,
                fontSize: 34,
              }}
            >
              {i + 1}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", fontSize: itemSize, color: c.body, lineHeight: 1.3, paddingTop: 6, maxWidth: 800 }}>
              {rich({ text: it, color: c.body, accent: c.accent })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Cita({ c, d, h }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", fontFamily: "Playfair", fontStyle: "italic", fontWeight: 700, fontSize: 220, lineHeight: 0.8, color: c.accent, height: 140 }}>“</div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          fontFamily: "Playfair",
          fontStyle: "italic",
          fontWeight: 700,
          fontSize: fit(d.quote, [[50, h > 1100 ? 86 : 78], [100, h > 1100 ? 70 : 62], [999, 54]]),
          lineHeight: 1.15,
        }}
      >
        {rich({ text: d.quote, color: c.title, accent: c.accent })}
      </div>
      {d.author ? <div style={{ display: "flex", marginTop: 34, fontSize: 30, color: c.soft, letterSpacing: "0.06em" }}>{d.author}</div> : null}
    </div>
  );
}

function Cta({ c, d }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      <div style={{ display: "flex", flexWrap: "wrap", fontFamily: "Playfair", fontStyle: "italic", fontWeight: 700, fontSize: fit(d.title, [[25, 104], [50, 86], [999, 70]]), lineHeight: 1.08 }}>
        {rich({ text: d.title, color: c.title, accent: c.accent })}
      </div>
      {d.action ? (
        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              padding: "26px 40px",
              borderRadius: 28,
              background: c.chipBg,
              color: c.chipFg,
              fontSize: 36,
              lineHeight: 1.3,
              maxWidth: 880,
            }}
          >
            {d.action}
          </div>
        </div>
      ) : null}
      <div style={{ display: "flex", fontSize: 34, color: c.soft, letterSpacing: "0.04em" }}>{d.handle || "@databymilo"}</div>
    </div>
  );
}

const BODIES = { portada: Portada, dato: Dato, lista: Lista, cita: Cita, cta: Cta };

/**
 * @param {object} o
 * @param {object} o.brand  sistema de marca (getBrand().brand)
 * @param {string} o.design id de lib/marketing/brand/designs.js
 * @param {string} o.size   "1080x1350" | "1080x1080"
 * @param {string} o.theme  "oscuro" | "claro"
 * @param {object} o.data   campos del diseño
 * @param {number} [o.page] número de slide
 * @param {number} [o.total] total de slides
 */
export async function renderSlide({ brand, design, size, theme, data = {}, page, total }) {
  const dims = SIZES.find((s) => s.id === size) || SIZES[0];
  const Body = BODIES[design] || BODIES.portada;
  const c = themeColors(brand, theme);
  const fonts = await loadFonts().catch(() => undefined);
  const showEyebrow = design === "portada" || design === "dato";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "88px 88px 76px",
          background: c.bg,
          backgroundImage: c.glow
            ? "radial-gradient(ellipse at 85% 8%, rgba(212,68,122,0.5) 0%, rgba(139,26,74,0) 55%), radial-gradient(ellipse at 0% 100%, rgba(26,10,16,0.32) 0%, rgba(139,26,74,0) 50%)"
            : "radial-gradient(ellipse at 90% 0%, rgba(250,219,232,0.9) 0%, rgba(253,245,236,0) 55%)",
          color: c.body,
          fontFamily: "Montserrat",
        }}
      >
        {showEyebrow ? <Eyebrow c={c} text={data.eyebrow} /> : <div style={{ display: "flex", height: 24 }} />}
        <Body c={c} d={data} h={dims.height} />
        <Footer c={c} page={page} total={total} handle={brand.logo?.handle} />
      </div>
    ),
    { width: dims.width, height: dims.height, fonts }
  );
}

/** Lee los parámetros del generador desde una query string. */
export function parseRenderParams(sp) {
  const design = DESIGN_BY_ID[sp.get("design")] ? sp.get("design") : "portada";
  const data = {};
  for (const [k, v] of sp.entries()) if (k.startsWith("f_")) data[k.slice(2)] = v.slice(0, 600);
  return {
    design,
    size: sp.get("size") === "1080x1080" ? "1080x1080" : "1080x1350",
    theme: sp.get("theme") === "claro" ? "claro" : "oscuro",
    page: Number(sp.get("page")) || undefined,
    total: Number(sp.get("total")) || undefined,
    data,
  };
}
