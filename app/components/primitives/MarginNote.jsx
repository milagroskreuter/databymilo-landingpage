"use client";
import { useInView } from "./useInView";

export default function MarginNote({ children, top = 0, side = "right" }) {
  const [ref, inView] = useInView(0.3);
  return (
    <div
      ref={ref}
      className="margin-note"
      style={{
        position: "absolute",
        [side]: side === "right" ? "-112px" : "-112px",
        top,
        opacity: inView ? 0.7 : 0,
        transform: `rotate(-4deg) translateX(${inView ? 0 : (side === "right" ? 12 : -12)}px)`,
        transition: "opacity 600ms ease, transform 600ms ease",
        fontFamily: "var(--font-accent)",
        fontSize: 13,
        color: "var(--vino)",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        zIndex: 2,
        lineHeight: 1.4,
      }}
    >
      {children}
    </div>
  );
}
