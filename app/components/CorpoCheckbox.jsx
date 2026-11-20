"use client";

// Casilla opcional para sumarse también a los avisos de notas nuevas (Edición Corpo).
export default function CorpoCheckbox({ checked, onChange, tone = "light", style }) {
  const dark = tone === "dark";
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        fontSize: 13,
        lineHeight: 1.45,
        color: dark ? "rgba(253,245,236,.82)" : "var(--fg-2)",
        ...style,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          width: 16,
          height: 16,
          marginTop: 2,
          flexShrink: 0,
          accentColor: dark ? "#f2b7d1" : "#8b1a4a",
          cursor: "pointer",
        }}
      />
      <span>
        Avisame también cuando suba una nota nueva al blog{" "}
        <em style={{ opacity: dark ? 0.75 : 0.7 }}>(edición corpo)</em>
      </span>
    </label>
  );
}
