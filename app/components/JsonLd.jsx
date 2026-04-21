const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://databymilo.com/#website",
      url: "https://databymilo.com",
      name: "Data by Milo",
      description:
        "Cheatsheets, plantillas y guías de análisis de datos en español para mujeres en LATAM.",
      inLanguage: "es",
      publisher: { "@id": "https://databymilo.com/#person" },
      potentialAction: {
        "@type": "SearchAction",
        target: "https://databymilo.com/?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Person",
      "@id": "https://databymilo.com/#person",
      name: "Milo",
      url: "https://databymilo.com",
      sameAs: [
        "https://www.instagram.com/databymilo",
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
      "@id": "https://databymilo.com/#webpage",
      url: "https://databymilo.com",
      name: "Data by Milo — Análisis de datos en español, sin tecnicismos",
      isPartOf: { "@id": "https://databymilo.com/#website" },
      about: { "@id": "https://databymilo.com/#person" },
      description:
        "Cheatsheets, plantillas y guías de análisis de datos en español para mujeres en LATAM. Aprendé Excel, SQL y Python gratis.",
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
