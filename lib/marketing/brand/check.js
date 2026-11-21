// Chequeo de coherencia: Claude mira una pieza y la compara con el sistema de marca.
import Anthropic from "@anthropic-ai/sdk";

export const CHECK_MODEL = "claude-opus-5-5";

export const CHECK_AREAS = ["paleta", "tipografia", "reglas", "texto", "moodboard", "logo", "composicion"];

const RESULT_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", description: "Veredicto general en 1 o 2 frases." },
    score: { type: "integer", description: "Coherencia con la marca de 0 a 100." },
    colors_detected: { type: "array", items: { type: "string" }, description: "Colores dominantes de la pieza en hex." },
    words_counted: { type: "integer", description: "Cantidad aproximada de palabras visibles en la pieza." },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          area: { type: "string", enum: CHECK_AREAS },
          rule: { type: "string", description: "La regla o el criterio de la marca que se chequea." },
          ok: { type: "boolean" },
          detail: { type: "string", description: "Qué se ve en la pieza." },
          fix: { type: "string", description: "Qué cambiar si no cumple; vacío si cumple." },
        },
        required: ["area", "rule", "ok", "detail", "fix"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "score", "colors_detected", "words_counted", "items"],
  additionalProperties: false,
};

const SYSTEM = `Sos la directora de arte de Data by Milo, una marca personal de contenido sobre tech, data e IA. Revisás piezas para redes (placas, carruseles, portadas) antes de publicarlas y decís con precisión si respetan el sistema de marca.

Cómo trabajás:
- Te basás solo en lo que se ve en la imagen y en el sistema de marca que te pasan. Si algo no se puede saber desde la imagen (por ejemplo, la fuente exacta), decilo en el detalle y juzgá por el estilo visible (serif itálica para títulos, sans para cuerpo).
- Chequeás cada regla visual del sistema (número de colores, cantidad de palabras, firma, márgenes, una idea por pieza), la paleta (los colores dominantes ¿están en la paleta?), la tipografía, el texto contra la voz (palabras sí / no, tono, español rioplatense con vos), el logo o la firma, la composición y, si hay imágenes de referencia del moodboard, el parecido de estética.
- Un ítem por regla o criterio, con un detalle concreto ("hay 4 colores: vino, rosa, celeste y verde") y un arreglo accionable cuando no cumple. Sin relleno.
- El puntaje refleja cuánto se nota que la pieza es de la marca: 90+ lista para publicar, 70-89 detalles menores, menos de 70 hay que rehacer partes.
- Escribís en español rioplatense, con vos, frases cortas.`;

function brandForPrompt(brand) {
  const { palette, typography, voice, rules, logo, moodboard } = brand;
  return JSON.stringify({ palette, typography, voice, rules, logo, moodboard: { notes: moodboard?.notes || "" } }, null, 2);
}

/**
 * @param {object} o
 * @param {object} o.brand sistema de marca
 * @param {{ data: string, mediaType: string }} o.image pieza a revisar (base64)
 * @param {{ data: string, mediaType: string }[]} [o.references] imágenes del moodboard
 * @param {string} [o.notes] contexto de la pieza (red, objetivo)
 */
export async function runBrandCheck({ brand, image, references = [], notes }) {
  const client = new Anthropic(); // usa ANTHROPIC_API_KEY

  const content = [];
  if (references.length) {
    content.push({ type: "text", text: `Imágenes de referencia del moodboard de la marca (${references.length}):` });
    for (const r of references) content.push({ type: "image", source: { type: "base64", media_type: r.mediaType, data: r.data } });
  }
  content.push({ type: "text", text: "Pieza a revisar:" });
  content.push({ type: "image", source: { type: "base64", media_type: image.mediaType, data: image.data } });
  content.push({
    type: "text",
    text: `Sistema de marca (fuente de verdad):\n<brand>\n${brandForPrompt(brand)}\n</brand>\n${
      notes ? `\nContexto de la pieza: ${notes}\n` : ""
    }\nDevolvé el checklist de coherencia de la pieza con este sistema de marca.`,
  });

  const response = await client.beta.messages.create({
    model: CHECK_MODEL,
    max_tokens: 16000,
    // Si el modelo declina por seguridad, la API reintenta sola con el modelo de respaldo recomendado.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: RESULT_SCHEMA },
    },
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Claude no pudo revisar esta imagen. Probá con otra pieza.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("La respuesta quedó cortada. Probá de nuevo.");
  }
  const text = response.content.find((b) => b.type === "text")?.text || "";
  let result;
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error("No pude leer la respuesta de Claude. Probá de nuevo.");
  }
  result.score = Math.max(0, Math.min(100, Math.round(Number(result.score) || 0)));
  return { result, model: response.model || CHECK_MODEL };
}

/** Mensaje claro para los errores de la API. */
export function checkErrorMessage(err) {
  if (err instanceof Anthropic.AuthenticationError) return { status: 400, message: "La clave ANTHROPIC_API_KEY no es válida. Revisala en Vercel." };
  if (err instanceof Anthropic.RateLimitError) return { status: 429, message: "Claude está con mucho uso ahora. Probá en un minuto." };
  if (err instanceof Anthropic.BadRequestError) return { status: 400, message: `Claude rechazó el pedido: ${err.message}` };
  if (err instanceof Anthropic.APIError) return { status: 502, message: `Error de la API de Claude (${err.status ?? "sin estado"}): ${err.message}` };
  return { status: 500, message: err?.message || "Error inesperado" };
}
