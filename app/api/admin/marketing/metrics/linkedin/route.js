import { getSupabaseAdmin } from "@/lib/supabase";
import { parseLinkedinExport } from "@/lib/marketing/metrics/linkedin";
import { saveLinkedinImport } from "@/lib/marketing/metrics/linkedinImport";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// Sube el XLSX de estadísticas de LinkedIn (campo "file" de un form-data).
export async function POST(request) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "No llegó ningún archivo" }, { status: 400 });
  }
  const file = form.get("file");
  if (!file || typeof file === "string") return Response.json({ error: "No llegó ningún archivo" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return Response.json({ error: "El archivo es muy grande (máximo 5 MB)" }, { status: 400 });

  let parsed;
  try {
    parsed = await parseLinkedinExport(Buffer.from(await file.arrayBuffer()));
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 });
  }
  try {
    const result = await saveLinkedinImport(getSupabaseAdmin(), parsed, file.name);
    return Response.json({ ok: true, ...result });
  } catch (err) {
    console.error("linkedin import:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
