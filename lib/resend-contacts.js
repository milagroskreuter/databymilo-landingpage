// Resend devuelve solo 20 contactos por defecto (máximo 100 por página).
// Este helper recorre todas las páginas para no trabajar con una lista incompleta.

const PAGE_SIZE = 100;
const MAX_PAGES = 100; // tope de seguridad: 10.000 contactos

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function listAllContacts(resend, audienceId) {
  const all = [];
  let after;

  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await resend.contacts.list({
      audienceId,
      limit: PAGE_SIZE,
      ...(after ? { after } : {}),
    });
    if (error) throw new Error(error.message || "No se pudo leer la lista de Resend");

    const batch = data?.data ?? [];
    all.push(...batch);

    if (!data?.has_more || batch.length === 0) break;
    after = batch[batch.length - 1].id;
    // Resend permite pocas llamadas por segundo
    await sleep(550);
  }

  return all;
}
