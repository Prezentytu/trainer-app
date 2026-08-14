import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  robots: { index: true, follow: true },
  alternates: { canonical: "/prywatnosc" },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-4">
          <Wordmark />
          <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
            Dokument prawny
          </p>
          <h1 className="t-title">Polityka prywatności</h1>
          <p className="t-small">
            Szkic dla pierwszych trenerów. Wypełnij przed szerszą premierą —
            nie stanowi finalnej porady prawnej.
          </p>
        </header>

        <article className="space-y-6 text-[15px] leading-relaxed text-foreground-secondary">
          <section className="space-y-2">
            <h2 className="t-heading text-foreground">1. Administrator</h2>
            <p>
              [DO UZUPEŁNIENIA: imię i nazwisko / firma, adres, e-mail kontaktowy]. W
              relacji trener ↔ podopieczny trener jest administratorem danych swojego
              klienta; RepMaxer działa jako podmiot przetwarzający w zakresie
              udostępnionej infrastruktury.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="t-heading text-foreground">2. Jakie dane przetwarzamy</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Konto trenera (e-mail, identyfikator Clerk).</li>
              <li>Dane klientów: imię/nazwa, e-mail, notatki, plany, sesje treningowe.</li>
              <li>
                Dane o zdrowiu i stylu życia: pomiary (waga, obwody), wywiad startowy,
                check-iny (samopoczucie, sen, energia).
              </li>
              <li>Dane techniczne: logi, tokeny dostępu do portalu, subskrypcje push.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="t-heading text-foreground">3. Cele i podstawa</h2>
            <p>
              [DO UZUPEŁNIENIA: podstawy prawne — umowa / prawnie uzasadniony interes /
              zgoda przy danych o zdrowiu]. Cel: świadczenie usługi planowania i
              logowania treningów oraz komunikacji trener ↔ klient.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="t-heading text-foreground">4. Podmioty przetwarzające</h2>
            <p>
              Hosting i narzędzia: [DO UZUPEŁNIENIA — m.in. Vercel, Azure, Neon, Clerk,
              Resend]. Umowy powierzenia / DPA należy zawrzeć przed komercyjnym launch.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="t-heading text-foreground">5. Prawa osób</h2>
            <p>
              Trener może pobrać kopię danych (Ustawienia → eksport) oraz usunąć konto i
              dane klientów. Podopieczny uzyskuje dostęp przez link portalu; w sprawie
              usunięcia lub eksportu kontaktuje się z trenerem albo z administratorem
              RepMaxer: [DO UZUPEŁNIENIA: e-mail].
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="t-heading text-foreground">6. Okres przechowywania</h2>
            <p>
              [DO UZUPEŁNIENIA: okres retencji po usunięciu konta / kopie zapasowe].
            </p>
          </section>
        </article>

        <p className="text-sm text-muted">
          <Link href="/" className="text-foreground underline-offset-4 hover:underline">
            ← Strona główna
          </Link>
          {" · "}
          <Link
            href="/regulamin"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Regulamin
          </Link>
        </p>
      </div>
    </div>
  );
}
