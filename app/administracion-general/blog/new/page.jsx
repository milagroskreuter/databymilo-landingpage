"use client";
import { useRouter } from "next/navigation";
import BlogEditorForm from "../BlogEditorForm";

export default function NewBlogPost() {
  const router = useRouter();

  async function handleSubmit(form) {
    const res = await fetch("/api/admin/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Error al guardar");
    router.push("/administracion-general/blog");
  }

  return (
    <BlogEditorForm
      submitLabel="Publicar entrada"
      onSubmit={handleSubmit}
      backHref="/administracion-general/blog"
    />
  );
}
