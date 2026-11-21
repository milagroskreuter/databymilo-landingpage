"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "../../AdminToast";
import Markdown from "./Markdown";
import { SUGGESTIONS, repurposePrompt, toolLabel } from "@/lib/marketing/chat/labels";
import "./chat.css";

const API = "/api/admin/marketing/chat/threads";

// Lee una respuesta NDJSON y llama a onEvent por cada línea.
async function consume(res, onEvent) {
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || `Error ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (line) onEvent(JSON.parse(line));
    }
  }
}

function timeAgo(iso) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "recién";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

const STATUS_ICON = { running: "…", ok: "✓", error: "!", declined: "✕", pending: "?" };

export default function ChatApp() {
  const toast = useToast();
  const params = useSearchParams();
  const [threads, setThreads] = useState([]);
  const [configured, setConfigured] = useState(true);
  const [configMessage, setConfigMessage] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [title, setTitle] = useState("");
  const [items, setItems] = useState([]);
  const [pending, setPending] = useState(null);
  const [selected, setSelected] = useState({});
  const [streaming, setStreaming] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [input, setInput] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [showList, setShowList] = useState(false);
  const [pendingBoot, setPendingBoot] = useState(null); // mensaje a mandar al abrir desde el blog
  const turnStart = useRef(0);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const bootRef = useRef(false);

  const loadThreads = useCallback(async () => {
    const res = await fetch(API);
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "No se pudieron cargar las conversaciones");
    setThreads(j.threads);
    setConfigured(j.configured);
    setConfigMessage(j.configMessage);
    return j;
  }, []);

  const openThread = useCallback(async (id) => {
    setActiveId(id);
    setShowList(false);
    setLoadingThread(true);
    try {
      const res = await fetch(`${API}/${id}`);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setTitle(j.thread.title);
      setItems(j.items);
      setPending(j.pending);
      setSelected(Object.fromEntries((j.pending || []).map((c) => [c.id, true])));
      window.history.replaceState(null, "", `?thread=${id}`);
    } catch (err) {
      toast({ type: "error", text: err.message || "No se pudo abrir la conversación" });
    } finally {
      setLoadingThread(false);
    }
  }, [toast]);

  const createThread = useCallback(async () => {
    const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "No se pudo crear la conversación");
    setThreads((t) => [{ ...j.thread, pending: false }, ...t]);
    setActiveId(j.thread.id);
    setTitle(j.thread.title);
    setItems([]);
    setPending(null);
    window.history.replaceState(null, "", `?thread=${j.thread.id}`);
    return j.thread.id;
  }, []);

  // Actualiza las partes del último mensaje del asistente (o crea uno).
  const updateAssistant = useCallback((fn) => {
    setItems((prev) => {
      const copy = [...prev];
      let last = copy[copy.length - 1];
      if (!last || last.kind !== "assistant") {
        last = { kind: "assistant", parts: [] };
        copy.push(last);
      }
      copy[copy.length - 1] = { ...last, parts: fn(last.parts) };
      return copy;
    });
  }, []);

  const handleEvent = useCallback(
    (ev) => {
      switch (ev.type) {
        case "turn_start":
          updateAssistant((parts) => {
            turnStart.current = parts.length;
            return parts;
          });
          break;
        case "retry":
          updateAssistant((parts) => parts.slice(0, turnStart.current));
          break;
        case "text":
          updateAssistant((parts) => {
            const last = parts[parts.length - 1];
            if (last?.type === "text") return [...parts.slice(0, -1), { ...last, text: last.text + ev.delta }];
            return [...parts, { type: "text", text: ev.delta }];
          });
          break;
        case "tool_start":
          updateAssistant((parts) => [...parts, { type: "tool", id: ev.id, name: ev.name, label: toolLabel(ev.name), status: "running" }]);
          break;
        case "tool_done":
          setItems((prev) =>
            prev.map((it) =>
              it.kind === "assistant" ? { ...it, parts: it.parts.map((p) => (p.type === "tool" && p.id === ev.id ? { ...p, status: ev.status } : p)) } : it
            )
          );
          break;
        case "confirm": {
          const ids = new Set(ev.calls.map((c) => c.id));
          updateAssistant((parts) => parts.map((p) => (p.type === "tool" && ids.has(p.id) ? { ...p, status: "pending" } : p)));
          setPending(ev.calls);
          setSelected(Object.fromEntries(ev.calls.map((c) => [c.id, true])));
          break;
        }
        case "notice":
          updateAssistant((parts) => [...parts, { type: "notice", text: ev.text }]);
          break;
        case "error":
          updateAssistant((parts) => [...parts, { type: "error", text: ev.message }]);
          break;
        default:
          break;
      }
    },
    [updateAssistant]
  );

  const runStream = useCallback(
    async (request) => {
      setStreaming(true);
      try {
        await consume(await request(), handleEvent);
      } catch (err) {
        updateAssistant((parts) => [...parts, { type: "error", text: err.message || "Se cortó la conexión." }]);
      } finally {
        setStreaming(false);
        loadThreads().catch(() => {});
        inputRef.current?.focus();
      }
    },
    [handleEvent, updateAssistant, loadThreads]
  );

  const send = useCallback(
    async (rawText) => {
      const text = rawText.trim();
      if (!text || streaming) return;
      if (!configured) {
        toast({ type: "error", text: configMessage });
        return;
      }
      let id = activeId;
      try {
        if (!id) id = await createThread();
      } catch (err) {
        toast({ type: "error", text: err.message });
        return;
      }
      setInput("");
      // Si había acciones pendientes, escribir otra cosa las cancela.
      if (pending) {
        const ids = new Set(pending.map((c) => c.id));
        setItems((prev) =>
          prev.map((it) =>
            it.kind === "assistant" ? { ...it, parts: it.parts.map((p) => (p.type === "tool" && ids.has(p.id) ? { ...p, status: "declined" } : p)) } : it
          )
        );
        setPending(null);
      }
      setItems((prev) => [...prev, { kind: "user", text }, { kind: "assistant", parts: [] }]);
      await runStream(() =>
        fetch(`${API}/${id}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) })
      );
    },
    [activeId, configured, configMessage, createThread, pending, runStream, streaming, toast]
  );

  const resolvePending = useCallback(
    async (approveAll) => {
      if (!pending || streaming) return;
      const approve = approveAll === false ? false : pending.length === 1 ? true : selected;
      setPending(null);
      await runStream(() =>
        fetch(`${API}/${activeId}/confirm`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approve }) })
      );
    },
    [activeId, pending, runStream, selected, streaming]
  );

  async function saveTitle() {
    const t = titleDraft.trim();
    setEditingTitle(false);
    if (!t || t === title) return;
    const res = await fetch(`${API}/${activeId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: t }) });
    const j = await res.json();
    if (!res.ok) return toast({ type: "error", text: j.error });
    setTitle(j.thread.title);
    setThreads((list) => list.map((x) => (x.id === activeId ? { ...x, title: j.thread.title } : x)));
  }

  async function deleteThread(id) {
    const t = threads.find((x) => x.id === id);
    if (!window.confirm(`¿Borrar la conversación "${t?.title || ""}"? No se puede deshacer.`)) return;
    const res = await fetch(`${API}/${id}`, { method: "DELETE" });
    if (!res.ok) return toast({ type: "error", text: "No se pudo borrar" });
    setThreads((list) => list.filter((x) => x.id !== id));
    if (id === activeId) {
      setActiveId(null);
      setItems([]);
      setPending(null);
      setTitle("");
      window.history.replaceState(null, "", window.location.pathname);
    }
    toast({ text: "Conversación borrada" });
  }

  function newChat() {
    if (streaming) return;
    setActiveId(null);
    setItems([]);
    setPending(null);
    setTitle("");
    setShowList(false);
    window.history.replaceState(null, "", window.location.pathname);
    inputRef.current?.focus();
  }

  // Arranque: lista, conversación de la URL o "Reutilizar en redes" desde el blog.
  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;
    (async () => {
      try {
        const j = await loadThreads();
        const repurpose = params.get("repurpose");
        const threadId = params.get("thread");
        if (repurpose && j.configured) {
          window.history.replaceState(null, "", window.location.pathname);
          setPendingBoot(repurposePrompt(repurpose));
        } else if (threadId && j.threads.some((t) => t.id === threadId)) {
          openThread(threadId);
        }
      } catch (err) {
        toast({ type: "error", text: err.message });
      } finally {
        setLoadingList(false);
      }
    })();
  }, [loadThreads, openThread, params, toast]);

  // El mensaje del blog se manda cuando el estado inicial ya está listo.
  useEffect(() => {
    if (pendingBoot && !loadingList) {
      const text = pendingBoot;
      setPendingBoot(null);
      send(text);
    }
  }, [pendingBoot, loadingList, send]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items, pending]);

  const empty = !items.length && !loadingThread;

  return (
    <div className="mk-chat">
      <aside className={`mk-chat-threads${showList ? " is-open" : ""}`}>
        <button type="button" className="adm-btn adm-btn-primary mk-chat-new" onClick={newChat} disabled={streaming}>
          + Nueva conversación
        </button>
        <div className="mk-chat-thread-list">
          {loadingList && <p className="mk-chat-muted">Cargando…</p>}
          {!loadingList && !threads.length && <p className="mk-chat-muted">Todavía no hay conversaciones.</p>}
          {threads.map((t) => (
            <div key={t.id} className={`mk-chat-thread${t.id === activeId ? " is-active" : ""}`}>
              <button type="button" className="mk-chat-thread-open" onClick={() => !streaming && openThread(t.id)} disabled={streaming && t.id !== activeId}>
                <span className="mk-chat-thread-title">{t.title}</span>
                <span className="mk-chat-thread-meta">
                  {t.pending && <span className="mk-chat-dot" title="Espera tu confirmación" />}
                  {timeAgo(t.updated_at)}
                </span>
              </button>
              <button type="button" className="mk-chat-icon-btn" title="Borrar conversación" aria-label="Borrar conversación" onClick={() => deleteThread(t.id)} disabled={streaming}>
                ×
              </button>
            </div>
          ))}
        </div>
      </aside>

      <section className="mk-chat-main">
        <div className="mk-chat-bar">
          <button type="button" className="adm-btn adm-btn-secondary adm-btn-sm mk-chat-list-toggle" onClick={() => setShowList((v) => !v)}>
            ☰ Conversaciones
          </button>
          {activeId && !editingTitle && (
            <>
              <h2 className="mk-chat-title">{title}</h2>
              <button type="button" className="mk-chat-icon-btn" title="Renombrar" aria-label="Renombrar conversación" onClick={() => { setTitleDraft(title); setEditingTitle(true); }}>
                ✎
              </button>
            </>
          )}
          {activeId && editingTitle && (
            <input
              className="adm-input mk-chat-title-input"
              value={titleDraft}
              autoFocus
              maxLength={120}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle();
                if (e.key === "Escape") setEditingTitle(false);
              }}
            />
          )}
          {!activeId && <h2 className="mk-chat-title">Nueva conversación</h2>}
        </div>

        {!configured && <div className="mk-chat-config">{configMessage}</div>}

        <div className="mk-chat-scroll" ref={scrollRef}>
          {loadingThread && <p className="mk-chat-muted mk-chat-center">Cargando conversación…</p>}

          {empty && (
            <div className="mk-chat-empty">
              <p className="mk-chat-empty-title">¿En qué te ayudo hoy?</p>
              <p className="mk-chat-muted">Puedo revisar y mover piezas del calendario, ordenar ideas y pilares, y escribir ganchos, captions y guiones con tu voz de marca.</p>
              <div className="mk-chat-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s.label} type="button" className="mk-chat-suggestion" onClick={() => send(s.prompt)} disabled={streaming || !configured}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {items.map((it, i) =>
            it.kind === "user" ? (
              <div key={i} className="mk-chat-msg mk-chat-msg-user">
                <div className="mk-chat-bubble">{it.text}</div>
              </div>
            ) : (
              <div key={i} className="mk-chat-msg mk-chat-msg-assistant">
                {it.parts.map((p, j) => {
                  if (p.type === "text") return <Markdown key={j} text={p.text} />;
                  if (p.type === "tool")
                    return (
                      <span key={j} className={`mk-chat-tool is-${p.status}`}>
                        <span className="mk-chat-tool-icon">{STATUS_ICON[p.status] || "·"}</span>
                        {p.label}
                        {p.status === "declined" && " (cancelado)"}
                        {p.status === "pending" && " (espera tu confirmación)"}
                      </span>
                    );
                  if (p.type === "notice") return <p key={j} className="mk-chat-notice">{p.text}</p>;
                  if (p.type === "error") return <p key={j} className="mk-chat-error">{p.text}</p>;
                  return null;
                })}
                {streaming && i === items.length - 1 && <span className="mk-chat-typing" aria-label="Escribiendo"><i /><i /><i /></span>}
              </div>
            )
          )}

          {pending && (
            <div className="mk-chat-confirm" role="group" aria-label="Acciones que esperan confirmación">
              <p className="mk-chat-confirm-title">Antes de seguir, confirmá:</p>
              {pending.map((c) => (
                <div key={c.id} className="mk-chat-confirm-call">
                  <label className="mk-chat-confirm-head">
                    {pending.length > 1 && (
                      <input type="checkbox" checked={!!selected[c.id]} onChange={(e) => setSelected((s) => ({ ...s, [c.id]: e.target.checked }))} />
                    )}
                    <span>{c.summary}</span>
                  </label>
                  {c.items?.length > 0 && (
                    <ul className="mk-chat-confirm-items">
                      {c.items.map((x, k) => <li key={k}>{x}</li>)}
                    </ul>
                  )}
                </div>
              ))}
              <div className="mk-chat-confirm-actions">
                <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => resolvePending(true)} disabled={streaming || (pending.length > 1 && !Object.values(selected).some(Boolean))}>
                  {pending.length > 1 ? "Confirmar seleccionadas" : "Confirmar"}
                </button>
                <button type="button" className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => resolvePending(false)} disabled={streaming}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        <form
          className="mk-chat-composer"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <textarea
            ref={inputRef}
            className="adm-textarea mk-chat-input"
            placeholder={configured ? "Escribile a Claude… (Enter para enviar, Shift+Enter para salto de línea)" : "El chat se activa cuando esté configurada la clave de la API."}
            value={input}
            maxLength={8000}
            rows={2}
            disabled={!configured}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(input);
              }
            }}
          />
          <button type="submit" className="adm-btn adm-btn-primary" disabled={streaming || !input.trim() || !configured}>
            {streaming ? "…" : "Enviar"}
          </button>
        </form>
      </section>
    </div>
  );
}
