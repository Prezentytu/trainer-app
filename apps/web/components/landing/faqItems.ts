/** Jedno źródło pytań — UI (`Faq`) i JSON-LD (`LandingJsonLd`). */
export const FAQ_ITEMS = [
  {
    q: "Czy klient musi coś instalować?",
    a: "Nie. Otwiera link w\u00A0przeglądarce — bez konta i\u00A0bez aplikacji.",
  },
  {
    q: "Ile to kosztuje?",
    a: "Do 5 podopiecznych: 0 zł na zawsze, bez karty. Przy większej liczbie: 39 zł za 15 osób albo 99 zł za 30. Płacisz Ty. Podopieczny zawsze 0 zł. Na start: 10 miejsc w\u00A0miesiącu na rozmowę — 90 dni za 0 zł, do 15 osób. Albo 390 zł raz za rok przy 15 osobach (dwa miesiące w cenie); potem 39 zł za 15 — ta kwota nie rośnie.",
  },
  {
    q: "Dla kogo to jest?",
    a: "Dla trenera personalnego, który układa plany siłowe i\u00A0wysyła je klientom na telefon. Nie do zarządzania klubem, grafikiem sesji ani bieganiem. Jadłospis zostaw w\u00A0swoim PDF — my robimy trening.",
  },
  {
    q: "Co z\u00A0moimi danymi?",
    a: "Są Twoje. Eksport JSON i\u00A0CSV z\u00A0panelu. Klient nie zakłada konta — po współpracy nie zostaje mu aplikacja w\u00A0sklepie.",
  },
  {
    q: "Skąd wiem, że klient trenuje?",
    a: "Zakończony trening, serie i\u00A0rekordy w\u00A0panelu od razu. Kolejka pokazuje, kto nie trenował. Możesz napisać pierwszy.",
  },
] as const;

export function faqPlainText(value: string): string {
  return value.replace(/\u00A0/g, " ");
}
