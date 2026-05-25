export const resources = [
  {
    type: "Guía · PDF",
    pages: "17 páginas",
    title: "Tu primer análisis",
    desc: "De una tabla cualquiera a un insight presentable. Con capturas de cada paso.",
    color: "#fadbe8",
    href: "/primer-analisis.pdf",
    slug: "primer-analisis",
    bullets: [
      "Cómo explorar un dataset nuevo sin saber por dónde empezar",
      "Limpieza básica: qué hacer con los vacíos, los duplicados y los formatos raros",
      "Las preguntas que tenés que hacerte antes de tocar una sola fórmula",
      "Cómo pasar de números sueltos a una conclusión que se entienda",
      "Capturas de cada paso para que puedas replicarlo con tu propia tabla",
    ],
    forWho:
      "Este recurso es para vos si nunca hiciste un análisis de datos completo y querés un camino claro, sin saltear pasos ni perderte en la teoría.",
    note:
      "La guía que me hubiera gustado tener cuando arranqué. Sin asumir que ya sabés qué hacer con una tabla llena de datos.",
  },
  {
    type: "Cheatsheet · PDF",
    pages: "10 páginas",
    title: "SQL desde cero",
    desc: "SELECT, WHERE, JOIN: las queries que te sacan del ochenta por ciento de los apuros.",
    color: "#fbe7a8",
    href: "/sql-desde-cero.pdf",
    slug: "sql-desde-cero",
    bullets: [
      "SELECT, WHERE, GROUP BY y JOIN explicados con ejemplos reales",
      "Las queries que resuelven el 80% de los pedidos del trabajo",
      "Funciones de texto, fecha y agregación en una sola hoja",
      "Errores frecuentes y cómo evitarlos",
      "Referencia rápida para no googlear lo mismo dos veces",
    ],
    forWho:
      "Este recurso es para vos si empezás desde cero en SQL o querés un recordatorio rápido sin tener que buscar en Stack Overflow cada vez.",
    note:
      "Lo armé porque cuando empecé no encontraba nada en español que fuera directo al punto. Todo era o muy teórico o en inglés.",
  },
  {
    type: "Glosario · PDF",
    pages: "41 páginas",
    title: "Diccionario anti-jerga",
    desc: "Doscientos términos de datos traducidos al español, con ejemplos cotidianos.",
    color: "var(--cream-200)",
    href: "/diccionario-anti-jerga.pdf",
    slug: "diccionario-anti-jerga",
    bullets: [
      "200 términos de datos y estadística traducidos al español sin condescendencia",
      "Cada entrada tiene un ejemplo cotidiano, no un paper académico",
      "Cubre machine learning, BI, bases de datos y análisis estadístico",
      "Ordenado alfabéticamente para encontrar lo que buscás en segundos",
      "Diseñado para leer de corrido o consultar cuando alguien te tire un término raro en una reunión",
    ],
    forWho:
      "Este recurso es para vos si estás aprendiendo análisis de datos y el idioma del sector todavía te resulta críptico. También sirve como referencia cuando alguien en el trabajo usa un término que no conocés.",
    note:
      "Empecé a armarlo cuando me di cuenta de que el glosario que buscaba no existía en español. Tardé meses. Valió la pena.",
  },
];

export const paidResources = [
  {
    type: "Guía · PDF",
    pages: "35 páginas",
    title: "Cómo presentar data a stakeholders no técnicos sin morir en el intento",
    desc: "El sistema concreto para que tu próximo readout sea entendido a la primera, accionado por tu equipo y recordado después de la reunión. Para mujeres en tech y data cansadas de armar análisis que después nadie usa.",
    price: "USD 15",
    priceNote: "Precio de lanzamiento",
    color: "#fadbe8",
    slug: "presentar-a-stakeholders",
    paymentUrl: "https://pay.hotmart.com/V105982887R",
    badge: "Nueva guía",
    bullets: [
      "Las 3 preguntas que cambian todo antes de abrir PowerPoint",
      "La estructura BLUF que usan McKinsey y los mejores PMs",
      "8 comparaciones antes/después de slides reales",
      "4 prompts de IA listos para copiar y usar",
      "Checklist imprimible de 10 puntos para cada presentación",
    ],
  },
];

export function getResourceBySlug(slug) {
  return resources.find((r) => r.slug === slug) ?? null;
}

export function getAvailableResources() {
  return resources.filter((r) => r.href);
}
