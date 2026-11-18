"use client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import "./admin.css";

const NAV = [
  { href: "/administracion-general", label: "Dashboard", icon: "◆" },
  { section: "Newsletter" },
  { href: "/administracion-general/newsletter", label: "Suscriptores", icon: "✉" },
  { href: "/administracion-general/newsletter/compose", label: "Escribir email", icon: "✦" },
  { section: "Contenido" },
  { href: "/administracion-general/blog", label: "Blog", icon: "✎" },
  { href: "/administracion-general/recursos", label: "Recursos", icon: "⬡" },
  { section: "Analítica" },
  { href: "/administracion-general/stats", label: "Estadísticas", icon: "▲" },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/administracion-general/login");
  }

  if (pathname === "/administracion-general/login") return <>{children}</>;

  return (
    <div className="adm-root">
      <aside className="adm-sidebar">
        <div className="adm-logo">
          <span className="adm-logo-brand">Data by Milo</span>
          <span className="adm-logo-label">Hub de admin</span>
        </div>

        <nav className="adm-nav">
          {NAV.map((item, i) => {
            if (item.section) {
              return <div key={i} className="adm-nav-section">{item.section}</div>;
            }
            const isActive =
              item.href === "/administracion-general"
                ? pathname === "/administracion-general"
                : pathname.startsWith(item.href);
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
  );
}
