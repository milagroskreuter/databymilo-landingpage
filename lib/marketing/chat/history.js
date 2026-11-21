// Lectura y escritura del historial de conversaciones (mk_chat_threads / mk_chat_messages).
// El historial se guarda en el formato de la API y se reenvía tal cual (solo se agregan
// mensajes al final): así el caché del prompt sirve y los bloques de thinking siguen siendo válidos.

import { toolLabel } from "./labels";

export const DEFAULT_TITLE = "Nueva conversación";

export async function listThreads(sb) {
  const { data, error } = await sb
    .from("mk_chat_threads")
    .select("id, title, created_at, updated_at, pending")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data || []).map((t) => ({ id: t.id, title: t.title, updated_at: t.updated_at, pending: !!t.pending }));
}

export async function getThread(sb, id) {
  const { data, error } = await sb.from("mk_chat_threads").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function loadMessages(sb, threadId) {
  const { data, error } = await sb
    .from("mk_chat_messages")
    .select("id, role, content")
    .eq("thread_id", threadId)
    .order("id", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function appendMessage(sb, threadId, role, content, usage = null) {
  const { error } = await sb.from("mk_chat_messages").insert({ thread_id: threadId, role, content, usage });
  if (error) throw new Error(error.message);
  await touchThread(sb, threadId);
}

export async function touchThread(sb, threadId, extra = {}) {
  const { error } = await sb
    .from("mk_chat_threads")
    .update({ updated_at: new Date().toISOString(), ...extra })
    .eq("id", threadId);
  if (error) throw new Error(error.message);
}

export async function setPending(sb, threadId, pending) {
  await touchThread(sb, threadId, { pending });
}

export function toApiMessages(rows) {
  return rows.map((r) => ({ role: r.role, content: r.content }));
}

const blocks = (content) => (Array.isArray(content) ? content : [{ type: "text", text: String(content || "") }]);

// Si el último mensaje del asistente pidió herramientas y no hay respuesta guardada
// (por ejemplo, se cortó la función), devuelve los tool_result de error para cerrarlo.
export function danglingToolResults(rows, reason) {
  const last = rows[rows.length - 1];
  if (!last || last.role !== "assistant") return null;
  const uses = blocks(last.content).filter((b) => b.type === "tool_use");
  if (!uses.length) return null;
  return uses.map((u) => ({ type: "tool_result", tool_use_id: u.id, is_error: true, content: reason }));
}

// Convierte el historial en lo que muestra la UI:
// [{ kind: "user", text } | { kind: "assistant", parts: [{type:"text",text} | {type:"tool",id,name,label,status}] }]
export function toDisplay(rows, pending) {
  const items = [];
  const status = {}; // tool_use_id → ok | error | declined | pending
  for (const r of rows) {
    if (r.role !== "user") continue;
    for (const b of blocks(r.content)) {
      if (b.type === "tool_result") {
        const declined = typeof b.content === "string" && b.content.startsWith("CANCELADO");
        status[b.tool_use_id] = declined ? "declined" : b.is_error ? "error" : "ok";
      }
    }
  }
  for (const c of pending?.calls || []) status[c.id] = "pending";

  let current = null;
  for (const r of rows) {
    if (r.role === "system") continue;
    if (r.role === "user") {
      const text = blocks(r.content)
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      if (text) {
        items.push({ kind: "user", text });
        current = null;
      }
      continue;
    }
    if (!current) {
      current = { kind: "assistant", parts: [] };
      items.push(current);
    }
    for (const b of blocks(r.content)) {
      if (b.type === "text" && b.text) current.parts.push({ type: "text", text: b.text });
      else if (b.type === "tool_use") current.parts.push({ type: "tool", id: b.id, name: b.name, label: toolLabel(b.name), status: status[b.id] || "ok" });
    }
  }
  return items.filter((i) => i.kind === "user" || i.parts.length);
}
