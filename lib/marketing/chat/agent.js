// Bucle de herramientas con la API de Claude (Messages API + streaming).
//
// Arquitectura: bucle manual alojado en la función de Vercel. Todas las herramientas
// son propias y escriben en Supabase con la service key, y el bucle tiene que poder
// pausarse entre dos requests HTTP cuando una acción espera la confirmación de la
// usuaria: el estado queda en mk_chat_threads.pending y el request de /confirm retoma.

import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./prompt";
import { TOOL_DEFINITIONS, checkToolCall, needsConfirmation, describeCall, executeTool } from "./tools";
import { appendMessage, loadMessages, setPending, toApiMessages, danglingToolResults } from "./history";

export const MODEL = "claude-opus-5-5";
const FALLBACK_BETA = "server-side-fallback-2026-07-01";
const MAX_STEPS = 12; // vueltas de herramientas por mensaje
const MAX_STREAM_RETRIES = 2;

export const MISSING_KEY_MESSAGE =
  "Falta configurar ANTHROPIC_API_KEY. Cargala en Vercel (Settings → Environment Variables) y volvé a deployar para usar el chat.";

export class MissingKeyError extends Error {
  constructor() {
    super(MISSING_KEY_MESSAGE);
  }
}

export function isConfigured() {
  return !!process.env.ANTHROPIC_API_KEY;
}

function getClient() {
  if (!isConfigured()) throw new MissingKeyError();
  return new Anthropic();
}

export function errorMessage(err) {
  if (err instanceof MissingKeyError) return MISSING_KEY_MESSAGE;
  if (err instanceof Anthropic.AuthenticationError) return "La clave ANTHROPIC_API_KEY no es válida. Revisala en Vercel.";
  if (err instanceof Anthropic.PermissionDeniedError) return "La clave de la API no tiene permiso para usar este modelo.";
  if (err instanceof Anthropic.RateLimitError) return "Se alcanzó el límite de uso de la API de Claude. Probá de nuevo en un rato.";
  if (err instanceof Anthropic.BadRequestError) return `La API de Claude rechazó el pedido: ${err.message}`;
  if (err instanceof Anthropic.InternalServerError) return "La API de Claude tuvo un problema. Probá de nuevo en un momento.";
  if (err instanceof Anthropic.APIConnectionError) return "No se pudo conectar con la API de Claude. Probá de nuevo.";
  if (err instanceof Anthropic.APIError) return `Error de la API de Claude (${err.status}): ${err.message}`;
  return err?.message || "Error inesperado.";
}

const CANCELLED = "CANCELADO: la usuaria no confirmó esta acción. No se hizo ningún cambio.";
export const cancelledResult = (id) => ({ type: "tool_result", tool_use_id: id, content: CANCELLED });

// Corre el modelo hasta que termina, pide confirmación o llega al límite de pasos.
// emit(evento) manda eventos a la UI.
export async function runAgent({ sb, threadId, emit }) {
  const client = getClient();
  const rows = await loadMessages(sb, threadId);

  // Si quedó un pedido de herramientas sin respuesta (función cortada), se cierra con error.
  const dangling = danglingToolResults(rows, "La ejecución se interrumpió antes de terminar esta acción. No se aplicó.");
  if (dangling) {
    await appendMessage(sb, threadId, "user", dangling);
    rows.push({ role: "user", content: dangling });
  }
  const messages = toApiMessages(rows);

  for (let step = 0; step < MAX_STEPS; step++) {
    emit({ type: "turn_start" });
    const message = await streamTurn(client, messages, emit);

    await appendMessage(sb, threadId, "assistant", message.content, message.usage || null);
    messages.push({ role: "assistant", content: message.content });

    if (message.stop_reason === "refusal") {
      emit({ type: "notice", text: "Claude no pudo responder este pedido. Probá reformularlo." });
      return;
    }

    const toolUses = message.content.filter((b) => b.type === "tool_use");
    if (!toolUses.length) {
      if (message.stop_reason === "max_tokens") emit({ type: "notice", text: "La respuesta se cortó por largo. Pedile que siga." });
      return;
    }

    // Una entrada de herramienta cortada por max_tokens puede parecer válida: no se ejecuta.
    if (message.stop_reason === "max_tokens") {
      const results = toolUses.map((u) => ({
        type: "tool_result",
        tool_use_id: u.id,
        is_error: true,
        content: "La entrada de la herramienta se cortó por largo y no se ejecutó. Probá con menos contenido por llamada.",
      }));
      results.forEach((r) => emit({ type: "tool_done", id: r.tool_use_id, status: "error" }));
      await appendMessage(sb, threadId, "user", results);
      messages.push({ role: "user", content: results });
      continue;
    }

    const results = [];
    const pendingCalls = [];
    for (const use of toolUses) {
      const { errors } = checkToolCall(use.name, use.input);
      if (!errors.length && needsConfirmation(use.name, use.input)) {
        const { summary, items } = await describeCall(sb, use.name, use.input);
        pendingCalls.push({ id: use.id, name: use.name, input: use.input, summary, items });
        continue;
      }
      const result = await executeTool(sb, use.id, use.name, use.input);
      emit({ type: "tool_done", id: use.id, status: result.is_error ? "error" : "ok" });
      results.push(result);
    }

    if (pendingCalls.length) {
      await setPending(sb, threadId, { calls: pendingCalls, results });
      emit({ type: "confirm", calls: pendingCalls.map(({ id, name, summary, items }) => ({ id, name, summary, items })) });
      return;
    }

    await appendMessage(sb, threadId, "user", results);
    messages.push({ role: "user", content: results });
  }
  emit({ type: "notice", text: "Llegué al límite de pasos para este mensaje. Escribime para seguir." });
}

// Un request en streaming. Reintenta si la conexión se corta o la entrada de una
// herramienta no se puede parsear (no son errores de la API); los errores de la API se propagan.
async function streamTurn(client, messages, emit) {
  for (let attempt = 0; ; attempt++) {
    try {
      const stream = client.beta.messages.stream({
        model: MODEL,
        max_tokens: 64000,
        betas: [FALLBACK_BETA],
        fallbacks: "default", // si el modelo declina por seguridad, la API reintenta con otro modelo
        thinking: { type: "adaptive" },
        output_config: { effort: "medium" },
        cache_control: { type: "ephemeral" }, // cachea el historial hasta el último bloque
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        tools: TOOL_DEFINITIONS,
        messages,
      });
      for await (const event of stream) {
        if (event.type === "content_block_start" && event.content_block.type === "tool_use") {
          emit({ type: "tool_start", id: event.content_block.id, name: event.content_block.name });
        } else if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          emit({ type: "text", delta: event.delta.text });
        }
      }
      return await stream.finalMessage();
    } catch (err) {
      if (err instanceof Anthropic.APIError || attempt >= MAX_STREAM_RETRIES) throw err;
      emit({ type: "retry" });
    }
  }
}
