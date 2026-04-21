"use client";

import { useEffect } from "react";

const COLORS = ["#d4447a", "#8b1a4a", "#f2b7d1", "#fbe7a8"];
const CHARS = ["✦", "✧", "✦", "✧", "·"];

export default function CursorSparkles() {
  useEffect(() => {
    let last = 0;

    const spawn = (e) => {
      const now = Date.now();
      if (now - last < 80) return;
      last = now;

      const count = Math.random() > 0.6 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const el = document.createElement("span");
        el.textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
        const size = 10 + Math.random() * 8;
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const dx = (Math.random() - 0.5) * 28;
        const dy = (Math.random() - 0.5) * 28;
        el.style.cssText = `
          position: fixed;
          pointer-events: none;
          z-index: 9999;
          font-size: ${size}px;
          color: ${color};
          left: ${e.clientX + dx}px;
          top: ${e.clientY + dy}px;
          animation: sparkle-pop 650ms ease forwards;
          user-select: none;
          line-height: 1;
          font-family: serif;
        `;
        document.body.appendChild(el);
        el.addEventListener("animationend", () => el.remove(), { once: true });
      }
    };

    window.addEventListener("mousemove", spawn, { passive: true });
    return () => window.removeEventListener("mousemove", spawn);
  }, []);

  return null;
}
