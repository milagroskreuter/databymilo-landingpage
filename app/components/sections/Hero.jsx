"use client";

import { useState, useEffect, useRef } from "react";

const FULL_TEXT = "sin llorar";

export default function Hero() {
  const [typed, setTyped] = useState("");
  const [typingDone, setTypingDone] = useState(false);
  const headlineRef = useRef(null);
  const subtextRef = useRef(null);

  // Typewriter
  useEffect(() => {
    let i = 0;
    const id = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setTyped(FULL_TEXT.slice(0, i));
        if (i >= FULL_TEXT.length) {
          clearInterval(interval);
          setTimeout(() => setTypingDone(true), 900);
        }
      }, 75);
      return () => clearInterval(interval);
    }, 500);
    return () => clearTimeout(id);
  }, []);

  // Parallax (direct DOM — no re-renders)
  useEffect(() => {
    const handler = () => {
      const y = window.scrollY;
      if (headlineRef.current) headlineRef.current.style.transform = `translateY(${y * 0.13}px)`;
      if (subtextRef.current) subtextRef.current.style.transform = `translateY(${y * 0.06}px)`;
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      className="section"
      style={{ paddingTop: 72, paddingBottom: 80, borderTop: "none" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 44,
        }}
      >
        <div className="eyebrow-j">Entrada Nº 001</div>
        <div className="eyebrow-j" style={{ color: "var(--fg-3)" }}>pág. 01</div>
      </div>

      <div style={{ maxWidth: 760 }}>
        <h1
          ref={headlineRef}
          className="display"
          style={{
            fontSize: "clamp(52px, 7vw, 92px)",
            margin: 0,
            lineHeight: 1.02,
            willChange: "transform",
          }}
        >
          aprende de datos, <br />
          <em style={{ fontStyle: "italic", color: "var(--vino)" }}>
            {typed}
            {!typingDone && (
              <span style={{ animation: "cursor-blink 0.65s step-end infinite", fontStyle: "normal", fontWeight: 300 }}>
                |
              </span>
            )}
          </em>
          <br />
          en el intento.
        </h1>

        <p
          ref={subtextRef}
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: 22,
            color: "var(--fg-2)",
            lineHeight: 1.55,
            marginTop: 32,
            maxWidth: 520,
            willChange: "transform",
          }}
        >
          Data by Milo es el cuaderno donde junto cheatsheets, plantillas y guías para mujeres que están aprendiendo análisis de datos en español, sin tecnicismos y sin condescendencia.
        </p>

        <div style={{ display: "flex", gap: 14, marginTop: 44, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={() => scrollTo("recursos")}>
            Ver recursos gratis →
          </button>
          <button className="btn btn-ghost" onClick={() => scrollTo("sobre")}>
            Sobre Milo
          </button>
        </div>
      </div>
    </section>
  );
}
