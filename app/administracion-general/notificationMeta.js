export const TYPE_META = {
  subscribe: { icon: "✦", label: "Suscripción", color: "#1a7a4a" },
  unsubscribe: { icon: "✕", label: "Baja", color: "#c0392b" },
  post_notified: { icon: "✎", label: "Nota avisada", color: "#7c3aed" },
  sale: { icon: "$", label: "Venta", color: "#17663e" },
  refund: { icon: "↩", label: "Reembolso", color: "#a3302a" },
  // Marketing
  marketing_reminder: { icon: "▦", label: "Calendario", color: "#0a66c2" },
  marketing_weekly: { icon: "↗", label: "Resumen semanal", color: "#8b1a4a" },
  metrics_issue: { icon: "!", label: "Métricas", color: "#c0392b" },
  testimonial: { icon: "❦", label: "Testimonio", color: "#d99a3e" },
  sponsor: { icon: "◇", label: "Sponsor", color: "#7c3aed" },
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
