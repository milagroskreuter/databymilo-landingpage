"use client";
import { createContext, useCallback, useContext, useState } from "react";

const ToastCtx = createContext(null);

export function useToast() {
  return useContext(ToastCtx);
}

export function AdminToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ type = "success", text }) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 9999,
        display: "flex", flexDirection: "column", gap: 10,
        pointerEvents: "none",
      }}>
        {toasts.map(({ id, type, text }) => (
          <div key={id} style={{
            background: type === "error" ? "#c0392b" : type === "warn" ? "#e67e22" : "#1a7a4a",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 10,
            fontFamily: "var(--adm-font-body)",
            fontSize: 14,
            fontWeight: 600,
            boxShadow: "0 4px 20px rgba(0,0,0,.18)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            animation: "toastIn 220ms cubic-bezier(.2,.8,.2,1)",
            pointerEvents: "auto",
            maxWidth: 360,
          }}>
            <span style={{ fontSize: 16 }}>
              {type === "error" ? "✕" : type === "warn" ? "⚠" : "✓"}
            </span>
            {text}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px) scale(.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </ToastCtx.Provider>
  );
}
