/** Jedno źródło pytań — UI (`Faq`) i JSON-LD (`LandingJsonLd`). */
export const FAQ_ITEMS = [
  {
    q: "Ile czasu mi to zajmie?",
    a: "Tyle, co wysłanie maila. Załączasz arkusz, PDF albo zrzuty — w formie, jaką masz dziś.",
  },
  {
    q: "Podopieczni nie lubią nowych aplikacji.",
    a: "Nie dostają aplikacji. Otwierają link, widzą plan pod Twoim imieniem i odhaczają serie.",
  },
  {
    q: "Czym to się różni od innych programów?",
    a: "Nic nie konfigurujesz, zanim nie zobaczysz efektu. Najpierw raport z Twoich danych, potem decyzja.",
  },
  {
    q: "Co się dzieje z danymi podopiecznych?",
    a: "Służą tylko do złożenia raportu. Wyjmiesz je do pliku w każdej chwili, a na prośbę usuwam wszystko.",
  },
  {
    q: "Ile ostatecznie zapłacę?",
    a: "Pierwszy raport 0 zł, potem 90 dni bez opłat. Później 39 zł do 15 podopiecznych albo 99 zł do 30. Podopieczny zawsze 0 zł.",
  },
] as const;

export function faqPlainText(value: string): string {
  return value.replace(/\u00A0/g, " ");
}
