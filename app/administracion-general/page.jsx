"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function load() {
      const [contactsRes, postsRes] = await Promise.allSettled([
        fetch("/api/admin/newsletter/contacts"),
        fetch("/api/admin/blog"),
      ]);
      const contacts = contactsRes.status === "fulfilled" && contactsRes.value.ok
        ? await contactsRes.value.json()
        : { total: "—" };
      const posts = postsRes.status === "fulfilled" && postsRes.value.ok
        ? await postsRes.value.json()
        : { total: "—" };
      setStats({ contacts, posts });
    }
    load();
  }, []);

  const shortcuts = [
    { href: "/administracion-general/newsletter/compose", label: "Escribir newsletter", icon: "✦", desc: "Redactar y enviar a toda la lista" },
    { href: "/administracion-general/blog/new", label: "Nueva entrada de blog", icon: "✎", desc: "Crear un post nuevo" },
    { href: "/administracion-general/recursos/new", label: "Nuevo recurso", icon: "⬡", desc: "Agregar un recurso gratuito" },
    { href: "/administracion-general/newsletter", label: "Ver suscriptoras", icon: "✉", desc: "Gestionar la lista" },
  ];

  return (
    <>
      <div className="adm-header">
        <h1>Dashboard</h1>
        <div style={{ fontSize: 12, color: "var(--adm-fg-muted)", fontFamily: "var(--adm-font-body)" }}>
          {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </div>

      <div className="adm-content">
        <div className="adm-stats-grid">
          <div className="adm-stat-card">
            <div className="adm-stat-label">Suscriptoras</div>
            <div className="adm-stat-value">
              {stats ? (stats.contacts.total ?? stats.contacts.data?.length ?? "—") : "…"}
            </div>
            <div className="adm-stat-sub">en la lista</div>
          </div>
          <div className="adm-stat-card">
            <div className="adm-stat-label">Posts publicados</div>
            <div className="adm-stat-value">
              {stats ? (stats.posts.total ?? stats.posts.length ?? "—") : "…"}
            </div>
            <div className="adm-stat-sub">en el blog</div>
          </div>
        </div>

        <div>
          <div className="adm-section-title">Accesos r&aacute;pidos</div>
          <div className="adm-quick-grid">
            {shortcuts.map((s) => (
              <Link key={s.href} href={s.href} className="adm-quick-card">
                <span className="adm-quick-icon">{s.icon}</span>
                <span className="adm-quick-label">{s.label}</span>
                <span className="adm-quick-desc">{s.desc}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="adm-alert adm-alert-info">
          Los cambios en blog y recursos se guardan en archivos locales. Hac&eacute; <code style={{ background: "rgba(139,26,74,.1)", padding: "1px 6px", borderRadius: 4 }}>git push</code> para que aparezcan en producci&oacute;n.
        </div>
      </div>
    </>
  );
}
