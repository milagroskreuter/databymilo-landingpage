"use client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminToastProvider } from "./AdminToast";
import NotificationBell from "./NotificationBell";
import "./admin.css";

const NAV = [
  { href: "/administracion-general", label: "Dashboard", icon: "◆" },
  { href: "/administracion-general/notificaciones", label: "Notificaciones", icon: "◈" },
  { section: "Newsletter" },
  { href: "/administracion-general/newsletter", label: "Suscriptores", icon: "✉" },
  { href: "/administracion-general/listas", label: "Listas", icon: "☰" },
  { href: "/administracion-general/newsletter/compose", label: "Escribir email", icon: "✦" },
  { section: "Contenido" },
  { href: "/administracion-general/blog", label: "Blog", icon: "✎" },
  { href: "/administracion-general/recursos", label: "Recursos", icon: "⬡" },
  { section: "Marketing" },
  { href: "/administracion-general/marketing", label: "Resumen", icon: "✺" },
  { href: "/administracion-general/marketing/calendario", label: "Calendario", icon: "▦" },
  { href: "/administracion-general/marketing/ideas", label: "Ideas", icon: "✧" },
  { href: "/administracion-general/marketing/chat", label: "Chat IA", icon: "✴" },
  { href: "/administracion-general/marketing/marca", label: "Marca y diseño", icon: "◐" },
  { href: "/administracion-general/marketing/metricas", label: "Métricas de redes", icon: "↗" },
  { href: "/administracion-general/marketing/links", label: "Links", icon: "⌁" },
  { href: "/administracion-general/marketing/lanzamientos", label: "Lanzamientos", icon: "➶" },
  { href: "/administracion-general/marketing/sponsors", label: "Sponsors", icon: "◇" },
  { href: "/administracion-general/marketing/comunidad", label: "Comunidad", icon: "❦" },
  { section: "Analítica" },
  { href: "/administracion-general/stats", label: "Estadísticas", icon: "▲" },
  { href: "/administracion-general/actividad", label: "Log de actividad", icon: "◎" },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/administracion-general/login");
  }

  if (pathname === "/administracion-general/login") return <>{children}</>;

  // Solo un item activo: el de la ruta más específica que coincida
  // (así /newsletter/compose no marca también /newsletter).
  const activeHref = NAV.filter(
    (item) =>
      item.href &&
      (pathname === item.href ||
        (item.href !== "/administracion-general" && pathname.startsWith(item.href + "/")))
  ).reduce((best, item) => (item.href.length > best.length ? item.href : best), "");

  return (
    <AdminToastProvider>
    <div className="adm-root">
      <aside className="adm-sidebar">
        <div className="adm-logo">
          <div>
            <span className="adm-logo-brand">Data by Milo</span>
            <span className="adm-logo-label">Hub de admin</span>
          </div>
          <NotificationBell />
        </div>

        <nav className="adm-nav">
          {NAV.map((item, i) => {
            if (item.section) {
              return <div key={i} className="adm-nav-section">{item.section}</div>;
            }
            const isActive = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "active" : ""}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="adm-sidebar-footer">
          <button className="adm-logout-btn" onClick={handleLogout}>
            Cerrar sesi&oacute;n
          </button>
        </div>
      </aside>

      <main className="adm-main">
        {children}
      </main>
    </div>
    </AdminToastProvider>
  );
}
