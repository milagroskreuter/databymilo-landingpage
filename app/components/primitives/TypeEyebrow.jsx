"use client";

import { useState, useEffect } from "react";
import { useInView } from "./useInView";

export default function TypeEyebrow({ children, className, style }) {
  const [ref, inView] = useInView(0.5);
  const [typed, setTyped] = useState("");
  const text = typeof children === "string" ? children : "";

  useEffect(() => {
    if (!inView || !text) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTyped(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 42);
    return () => clearInterval(interval);
  }, [inView, text]);

  return (
    <div ref={ref} className={className} style={style}>
      {typed}
      {typed.length > 0 && typed.length < text.length && (
        <span style={{ opacity: 0.35, fontStyle: "normal" }}>|</span>
      )}
    </div>
  );
}
