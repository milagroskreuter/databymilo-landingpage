const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://databymilo.me/#website",
      url: "https://databymilo.me",
      name: "Data by Milo",
      description:
        "Cheatsheets, plantillas y guías de análisis de datos en español para mujeres en LATAM.",
      inLanguage: "es",
      publisher: { "@id": "https://databymilo.me/#person" },
    },
    {
      "@type": "Person",
      "@id": "https://databymilo.me/#person",
      name: "Milo",
      url: "https://databymilo.me",
      sameAs: [
        "https://www.instagram.com/databymilo",
        "https://ar.pinterest.com/databymilo/",
        "https://www.linkedin.com/in/milagroskreuter/",
      ],
      knowsAbout: [
        "Análisis de datos",
        "Excel",
        "SQL",
        "Python",
        "Pandas",
        "Data Analytics",
      ],
    },
    {
      "@type": "WebPage",
      "@id": "https://databymilo.me/#webpage",
      url: "https://databymilo.me",
      name: "Data by Milo · Análisis de datos en español, sin tecnicismos",
      isPartOf: { "@id": "https://databymilo.me/#website" },
      about: { "@id": "https://databymilo.me/#person" },
      description:
        "Cheatsheets, plantillas y guías de análisis de datos en español para mujeres en LATAM. Aprendé Excel, SQL y Python.",
      inLanguage: "es",
      audience: {
        "@type": "Audience",
        audienceType:
          "Mujeres hispanohablantes aprendiendo análisis de datos",
        geographicArea: {
          "@type": "GeoShape",
          name: "América Latina",
        },
      },
    },
  ],
};

export default function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
