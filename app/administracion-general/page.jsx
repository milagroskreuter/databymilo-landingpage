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
        : { total: "â€”" };
      const posts = postsRes.status === "fulfilled" && postsRes.value.ok
        ? await postsRes.value.json()
        : { total: "â€”" };
      setStats({ contacts, posts });
    }
    load();
  }, []);

  const shortcuts = [
    { href: "/administracion-general/newsletter/compose", label: "Escribir newsletter", icon: "âœ¦", desc: "Redactar y enviar a toda la lista" },
    { href: "/administracion-general/blog/new", label: "Nueva entrada de blog", icon: "âœ", desc: "Crear un post nuevo" },
    { href: "/administracion-general/recursos/new", label: "Nuevo recurso", icon: "â¬¡", desc: "Agregar un recurso gratuito" },
    { href: "/administracion-general/newsletter", label: "Ver suscriptores", icon: "âœ‰", desc: "Gestionar la lista" },
  ];

  return (
    <>
      <div className="adm-header">
        <div>
          <h1>Dashboard</h1>
        </div>
        <div style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>
          {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </div>

      <div className="adm-content">
        <div className="adm-stats-grid">
          <div className="adm-stat-card">
            <div className="adm-stat-label">Suscriptoras</div>
            <div className="adm-stat-value">
              {stats ? (stats.contacts.total ?? stats.contacts.data?.length ?? "â€”") : "â€¦"}
            </div>
            <div className="adm-stat-sub">en la lista</div>
          </div>
          <div className="adm-stat-card">
            <div className="adm-stat-label">Posts publicados</div>
            <div className="adm-stat-value">
              {stats ? (stats.posts.total ?? stats.posts.length ?? "â€”") : "â€¦"}
            </div>
            <div className="adm-stat-sub">en el blog</div>
          </div>
        </div>

        <div className="adm-card">
          <div className="adm-card-title">Accesos rÃ¡pidos</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {shortcuts.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                style={{
                  display: "block",
                  padding: "16px",
                  background: "rgba(139, 26, 74, 0.08)",
                  border: "1px solid var(--adm-border)",
                  borderRadius: 8,
                  textDecoration: "none",
                  transition: "all 0.15s",
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "rgba(139, 26, 74, 0.18)"}
                onMouseOut={(e) => e.currentTarget.style.background = "rgba(139, 26, 74, 0.08)"}
              >
                <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontWeight: 600, color: "var(--adm-text)", marginBottom: 4, fontSize: 13 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>{s.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="adm-alert adm-alert-info" style={{ marginBottom: 0 }}>
          ðŸ’¡ Los cambios en blog y recursos se guardan en archivos locales. HacÃ© <code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: 4 }}>git push</code> para que aparezcan en producciÃ³n.
        </div>
      </div>
    </>
  );
}
