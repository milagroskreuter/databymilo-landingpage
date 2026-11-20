export const TYPE_META = {
  subscribe: { icon: "✦", label: "Suscripción", color: "#1a7a4a" },
  unsubscribe: { icon: "✕", label: "Baja", color: "#c0392b" },
  post_notified: { icon: "✎", label: "Nota avisada", color: "#7c3aed" },
};

export function typeMeta(type) {
  return TYPE_META[type] || { icon: "•", label: type, color: "#888" };
}

export function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "hace un momento";
  if (diff < 3_600_000) return `hace ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `hace ${Math.floor(diff / 3_600_000)} h`;
  if (diff < 7 * 86_400_000) return `hace ${Math.floor(diff / 86_400_000)} d`;
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}
