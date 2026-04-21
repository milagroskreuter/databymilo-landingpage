export default function SectionDivider() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "4px 0",
        opacity: 0.55,
      }}
    >
      <div style={{ flex: 1, height: 1, background: "rgba(139,26,74,.2)" }} />
      <img src="/assets/sparkle-small.svg" alt="" width={13} height={13} />
      <div style={{ flex: 1, height: 1, background: "rgba(139,26,74,.2)" }} />
    </div>
  );
}
