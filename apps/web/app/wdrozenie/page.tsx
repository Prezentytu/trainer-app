import { Suspense } from "react";
import { MarketingShell } from "@/components/landing/MarketingShell";
import { WdrozenieForm } from "./WdrozenieForm";

export default function WdrozeniePage() {
  return (
    <MarketingShell action="konto">
      <main className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 sm:py-24">
        <p className="t-label m-0 tracking-[0.16em]">14 dni do pełnego wglądu</p>
        <h1 className="mt-6 max-w-[16ch] text-[clamp(2.25rem,5vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
          W 30 minut przenosisz plan do linku bez konta.
        </h1>
        <p className="mt-6 max-w-[46ch] text-[17px] leading-[1.6] text-muted">
          Jeden plan, trzech klientów i linki wysłane na rozmowie. Jeśli w 14 dni
          żaden podopieczny nie dokończy treningu — zostajesz na 0 zł. Warunek: wysłałeś
          link do co najmniej trzech osób na rozmowie.
        </p>
        <ul className="mt-10 max-w-[46ch] space-y-3 text-[15px] leading-relaxed text-foreground-secondary">
          <li>Przeniesienie planu z Excela na rozmowie.</li>
          <li>Trzy gotowe wiadomości, gdy klient nie trenował.</li>
          <li>Szablony serii i eksport danych (JSON i CSV).</li>
        </ul>
        <Suspense fallback={<p className="mt-12 text-sm text-muted">Wczytuję formularz…</p>}>
          <WdrozenieForm />
        </Suspense>
      </main>
    </MarketingShell>
  );
}
