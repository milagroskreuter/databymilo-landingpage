"use client";
import ListSignupForm from "./ListSignupForm";

// Suscripción solo a los avisos de notas nuevas del blog (lista Edición Corpo).
export default function EdicionCorpoForm({ maxWidth = "100%" }) {
  return (
    <ListSignupForm
      listSlug="corpo"
      eyebrow="edición corpo · avisos"
      title="¿Te aviso cuando suba una nota nueva?"
      subtitle="Un mail cortito por cada nota, solo cuando publico. Nada más."
      buttonLabel="Avisame →"
      successText="¡Listo! Te aviso apenas suba una nota nueva ✦"
      maxWidth={maxWidth}
    />
  );
}
