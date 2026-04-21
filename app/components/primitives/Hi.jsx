"use client";

import { useInView } from "./useInView";

export default function Hi({ children, color }) {
  const [ref, inView] = useInView(0.6);
  return (
    <span
      ref={ref}
      className={"highlight" + (inView ? " in" : "")}
      style={color ? { "--hl-color": color } : undefined}
    >
      <span className="hi-stroke" />
      {children}
    </span>
  );
}
