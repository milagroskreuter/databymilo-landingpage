"use client";

import { useEffect, useRef } from "react";

// Barra de progreso de lectura. Se actualiza directo en el DOM (una vez por
// frame, con transform) en vez de re-renderizar React en cada evento de scroll.
export default function ScrollProgress() {
  const bar = useRef(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const max = scrollHeight - clientHeight;
      const pct = max > 0 ? Math.min(1, Math.max(0, scrollTop / max)) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${pct})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={bar}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: 3,
        background: "var(--rosa)",
        zIndex: 50,
        transform: "scaleX(0)",
        transformOrigin: "left",
        willChange: "transform",
        pointerEvents: "none",
      }}
    />
  );
}
