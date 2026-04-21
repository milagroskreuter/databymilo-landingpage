"use client";
import { useEffect } from "react";

export default function WelcomeConfetti() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("welcomed")) return;
    localStorage.setItem("welcomed", "1");

    const chars = ["✦", "✧", "♥", "✿", "·", "✦"];
    const colors = ["#d4447a", "#8b1a4a", "#f2b7d1", "#fbe7a8", "#fadbe8"];

    setTimeout(() => {
      const ox = window.innerWidth / 2;
      const oy = window.innerHeight * 0.3;
      for (let i = 0; i < 42; i++) {
        const el = document.createElement("span");
        el.textContent = chars[Math.floor(Math.random() * chars.length)];
        const angle = (Math.PI * 2 * i) / 42 + Math.random() * 0.5;
        const speed = 80 + Math.random() * 160;
        el.style.cssText = `
          position:fixed;pointer-events:none;z-index:9999;
          font-size:${11 + Math.random() * 13}px;
          color:${colors[Math.floor(Math.random() * colors.length)]};
          left:${ox}px;top:${oy}px;
          --tx:${Math.cos(angle) * speed}px;
          --ty:${Math.sin(angle) * speed - 60}px;
          --rot:${Math.random() * 720 - 360}deg;
          animation:confetti-fall ${600 + Math.random() * 500}ms ease-out forwards;
          user-select:none;font-family:serif;
        `;
        document.body.appendChild(el);
        el.addEventListener("animationend", () => el.remove(), { once: true });
      }
    }, 1000);
  }, []);

  return null;
}
