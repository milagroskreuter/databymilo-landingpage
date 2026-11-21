// Respuesta en streaming NDJSON (una línea JSON por evento) para la UI del chat.
import { errorMessage } from "./agent";

export function ndjsonResponse(work) {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      let open = true;
      const emit = (event) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        } catch {
          open = false; // la usuaria cerró la pestaña: se sigue trabajando y guardando igual
        }
      };
      try {
        await work(emit);
      } catch (err) {
        console.error("[mk-chat]", err);
        emit({ type: "error", message: errorMessage(err) });
      }
      emit({ type: "done" });
      if (open) {
        try {
          controller.close();
        } catch {}
      }
    },
  });
  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
