export const resources = [
  {
    type: "Cheatsheet · PDF",
    pages: "2 páginas",
    title: "Excel para las que odian Excel",
    desc: "Las veinte fórmulas que uso todos los días, con ejemplos reales.",
    color: "var(--rosa-50)",
    slug: "excel-para-las-que-odian-excel",
  },
  {
    type: "Cheatsheet · PDF",
    pages: "10 páginas",
    title: "SQL desde cero",
    desc: "SELECT, WHERE, JOIN: las queries que te sacan del ochenta por ciento de los apuros.",
    color: "#fbe7a8",
    href: "/sql-desde-cero.pdf",
    slug: "sql-desde-cero",
  },
  {
    type: "Cheatsheet · PDF",
    pages: "4 páginas",
    title: "Python para análisis",
    desc: "Pandas sin morir en el intento. El pack que me hubiera gustado tener en el bootcamp.",
    color: "var(--lavender)",
    slug: "python-para-analisis",
  },
  {
    type: "Plantilla · XLSX",
    pages: "Excel · Sheets",
    title: "Dashboard de métricas personales",
    desc: "Mi tracker mensual (ingresos, gastos, hábitos) con fórmulas explicadas.",
    color: "#fdf0f6",
    slug: "dashboard-metricas-personales",
  },
  {
    type: "Guía · PDF",
    pages: "28 páginas",
    title: "Primer análisis paso a paso",
    desc: "De una tabla cualquiera a un insight presentable. Con capturas de cada paso.",
    color: "#fadbe8",
    slug: "primer-analisis-paso-a-paso",
  },
  {
    type: "Glosario · PDF",
    pages: "41 páginas",
    title: "Diccionario anti-jerga",
    desc: "Doscientos términos de datos traducidos al español, con ejemplos cotidianos.",
    color: "var(--cream-200)",
    href: "/diccionario-anti-jerga.pdf",
    slug: "diccionario-anti-jerga",
  },
];

export function getAvailableResources() {
  return resources.filter((r) => r.slug);
}

export function getResourceBySlug(slug) {
  return resources.find((r) => r.slug === slug);
}
