"use client";

import { useInView } from "./useInView";

export default function Reveal({ children, delay = 0, y = 24 }) {
  const [ref, inView] = useInView(0.15);
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : `translateY(${y}px)`,
        transition: `opacity 700ms ${delay}ms ease, transform 900ms ${delay}ms cubic-bezier(.2,.8,.2,1)`,
      }}
    >
      {children}
    </div>
  );
}
