import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export const metadata: Metadata = {
  title: "Regulamin",
  robots: { index: true, follow: true },
  alternates: { canonical: "/regulamin" },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-4">
          <Wordmark />
          <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
            Dokument prawny
          </p>
          <h1 className="t-title">Regulamin</h1>
          <p className="t-small">
            Szkic na start, dla pierwszych trenerów. Wypełnij przed szerszą premierą —
            nie stanowi finalnej porady prawnej.
          </p>
        </header>

        <article className="space-y-6 text-[15px] leading-relaxed text-foreground-secondary">
          <section className="space-y-2">
            <h2 className="t-heading text-foreground">1. Usługa</h2>
            <p>
              RepMaxer to narzędzie dla trenerów personalnych: plany treningowe, portal
              klienta bez konta (link) oraz podgląd postępów. Na start: 90 dni za 0 zł
              po rozmowie wdrożeniowej, do 15 osób. Albo 390 zł raz za rok przy 15 osobach
              (dwa miesiące w cenie);
              po roku 39 zł za 15 — ta kwota nie rośnie. Cennik korzystania: 0 zł / do 5
              podopiecznych, 39 zł / 15, 99 zł / 30. Podopieczny nie płaci.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="t-heading text-foreground">2. Konto trenera</h2>
            <p>
              Rejestracja wymaga prawdziwego adresu e-mail. Trener odpowiada za treść
              planów, komunikację z podopiecznymi oraz podstawę prawną przetwarzania ich
              danych (w tym danych o zdrowiu).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="t-heading text-foreground">3. Portal klienta</h2>
            <p>
              Dostęp odbywa się przez indywidualny link. Trener może go rotować. Klient
              nie zakłada konta w RepMaxer. Link nie powinien być publikowany publicznie.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="t-heading text-foreground">4. Odpowiedzialność</h2>
            <p>
              [DO UZUPEŁNIENIA: ograniczenie odpowiedzialności, brak porady medycznej —
              treningi na odpowiedzialność trenera i klienta].
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="t-heading text-foreground">5. Rozwiązanie umowy</h2>
            <p>
              Trener może w każdej chwili usunąć konto w Ustawieniach (kaskada danych
              klientów). [DO UZUPEŁNIENIA: procedura reklamacji / kontakt].
            </p>
          </section>
        </article>

        <p className="text-sm text-muted">
          <Link href="/" className="text-foreground underline-offset-4 hover:underline">
            ← Strona główna
          </Link>
          {" · "}
          <Link
            href="/prywatnosc"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Polityka prywatności
          </Link>
        </p>
      </div>
    </div>
  );
}
