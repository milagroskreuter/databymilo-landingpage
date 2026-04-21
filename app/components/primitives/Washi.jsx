"use client";

import { useInView } from "./useInView";

export default function Washi({ variant = "stripe-rosa", style, rotation = 0 }) {
  const [ref, inView] = useInView(0.2);
  return (
    <div
      ref={ref}
      className={"washi " + variant + (inView ? " in" : "")}
      style={{ ...style, "--rot": rotation + "deg" }}
    />
  );
}
