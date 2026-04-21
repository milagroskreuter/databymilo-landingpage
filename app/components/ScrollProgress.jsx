"use client";

import { useState, useEffect } from "react";

export default function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      setPct(scrollTop / (scrollHeight - clientHeight));
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: `${pct * 100}%`,
        height: 3,
        background: "var(--rosa)",
        zIndex: 50,
        transition: "width 60ms linear",
        transformOrigin: "left",
        pointerEvents: "none",
      }}
    />
  );
}
