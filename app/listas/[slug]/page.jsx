import { notFound } from "next/navigation";
import ListLanding from "../../components/ListLanding";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getList } from "@/lib/lists";

export const dynamic = "force-dynamic";

async function loadList(slug) {
  try {
    return await getList(getSupabaseAdmin(), slug);
  } catch (err) {
    console.error("listas page error:", err);
    return null;
  }
}

// Página pensada para compartir por link: no se indexa ni aparece en el sitemap.
export async function generateMetadata({ params }) {
  const list = await loadList(params.slug);
  return {
    title: list ? list.name : "Lista",
    robots: { index: false, follow: false },
  };
}

export default async function ListaPublicPage({ params }) {
  const list = await loadList(params.slug);
  if (!list) notFound();
  return <ListLanding list={list} />;
}
