import { FAQ_ITEMS, faqPlainText } from "./faqItems";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const DESCRIPTION =
  "Klient otwiera link w przeglądarce — bez konta i bez aplikacji. Po treningu masz serie i rekordy. Piszesz pierwszy, zanim odejdzie.";

function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function LandingJsonLd() {
  const organizationId = `${SITE_URL}/#organization`;
  const websiteId = `${SITE_URL}/#website`;

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "RepMaxer",
        url: SITE_URL,
        logo: `${SITE_URL}/icons/512`,
        email: "kontakt@repmaxer.pl",
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: "RepMaxer",
        url: SITE_URL,
        inLanguage: "pl-PL",
        publisher: { "@id": organizationId },
      },
      {
        "@type": "SoftwareApplication",
        name: "RepMaxer",
        applicationCategory: "HealthApplication",
        operatingSystem: "Web",
        url: SITE_URL,
        description: DESCRIPTION,
        publisher: { "@id": organizationId },
        offers: [
          {
            "@type": "Offer",
            name: "Do 5 osób",
            price: "0",
            priceCurrency: "PLN",
          },
          {
            "@type": "Offer",
            name: "Do 15 osób",
            price: "39",
            priceCurrency: "PLN",
          },
          {
            "@type": "Offer",
            name: "Do 30 osób",
            price: "99",
            priceCurrency: "PLN",
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ_ITEMS.map((item) => ({
          "@type": "Question",
          name: faqPlainText(item.q),
          acceptedAnswer: {
            "@type": "Answer",
            text: faqPlainText(item.a),
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLd(graph) }}
    />
  );
}
