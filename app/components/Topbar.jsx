"use client";
import { useRef, useState, useEffect } from "react";

function burst(x, y) {
  const chars = ["✦", "✧", "♥", "✿", "·"];
  const colors = ["#d4447a", "#8b1a4a", "#f2b7d1", "#fbe7a8", "#fadbe8"];
  for (let i = 0; i < 28; i++) {
    const el = document.createElement("span");
    el.textContent = chars[Math.floor(Math.random() * chars.length)];
    const angle = (Math.PI * 2 * i) / 28 + Math.random() * 0.4;
    const speed = 60 + Math.random() * 120;
    el.style.cssText = `
      position:fixed;pointer-events:none;z-index:9999;
      font-size:${10 + Math.random() * 10}px;
      color:${colors[Math.floor(Math.random() * colors.length)]};
      left:${x}px;top:${y}px;
      --tx:${Math.cos(angle) * speed}px;
      --ty:${Math.sin(angle) * speed - 50}px;
      --rot:${Math.random() * 720 - 360}deg;
      animation:confetti-fall ${500 + Math.random() * 400}ms ease-out forwards;
      user-select:none;font-family:serif;
    `;
    document.body.appendChild(el);
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }
}

export default function Topbar() {
  const clicks = useRef(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogoClick = (e) => {
    clicks.current++;
    if (clicks.current >= 3) {
      clicks.current = 0;
      const rect = e.currentTarget.getBoundingClientRect();
      burst(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div
          onClick={handleLogoClick}
          style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}
        >
          <img src="/assets/logo-monogram.svg" alt="Data by Milo logo" width={32} height={32} />
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 700,
                fontSize: 20,
                color: "#1a1a1a",
                lineHeight: 1,
              }}
            >
              data by milo
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 10,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                color: "#8b1a4a",
                marginTop: 2,
              }}
            >
              data, pero cutie.
            </div>
          </div>
        </div>
        <nav>
          <a href="/portfolio">Portfolio</a>
          <a href="#sobre">Sobre</a>
          <a href="#recursos">Recursos</a>
          <a href="#newsletter">Newsletter</a>
          <a href="#ig">Redes</a>
        </nav>
        <button
          type="button"
          className="topbar-burger"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className={`burger-icon ${menuOpen ? "is-open" : ""}`} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>
      <div
        id="mobile-menu"
        className={`topbar-mobile-menu ${menuOpen ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!menuOpen}
      >
        <nav onClick={closeMenu}>
          <a href="/portfolio">Portfolio</a>
          <a href="#sobre">Sobre</a>
          <a href="#recursos">Recursos</a>
          <a href="#newsletter">Newsletter</a>
          <a href="#ig">Redes</a>
        </nav>
      </div>
      {menuOpen && (
        <div
          className="topbar-mobile-backdrop"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </header>
  );
}
