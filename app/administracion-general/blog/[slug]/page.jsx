"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BlogEditorForm from "../BlogEditorForm";

export default function EditBlogPost() {
  const { slug } = useParams();
  const router = useRouter();
  const [initial, setInitial] = useState(null);

  useEffect(() => {
    fetch(`/api/admin/blog/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        const p = data.post || data;
        setInitial({
          title: p.title || "",
          date: p.date || new Date().toISOString().split("T")[0],
          excerpt: p.excerpt || "",
          tags: p.tags || [],
          content: p.content || "",
          published: p.published ?? true,
        });
      });
  }, [slug]);

  async function handleSubmit(form) {
    const res = await fetch(`/api/admin/blog/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Error al guardar");
  }

  if (!initial) {
    return (
      <>
        <div className="adm-header"><h1>Editar entrada</h1></div>
        <div className="adm-content" style={{ color: "var(--adm-fg-muted)" }}>Cargando…</div>
      </>
    );
  }

  return (
    <BlogEditorForm
      initial={initial}
      submitLabel="Guardar cambios"
      onSubmit={handleSubmit}
      slug={slug}
      backHref="/administracion-general/blog"
    />
  );
}
