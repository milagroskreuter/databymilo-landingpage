// Marca en el navegador que esta persona ya se suscribió desde cualquier
// formulario, para no mostrarle después el popup pidiéndole lo mismo.
export function markSubscribed() {
  try {
    localStorage.setItem("popup_subscribed", "1");
  } catch {}
}
