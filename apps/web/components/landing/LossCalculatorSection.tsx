import { LandingReveal } from "./LandingReveal";
import { IleTraciszCalculator } from "./IleTraciszCalculator";

export function LossCalculatorSection() {
  return (
    <LandingReveal
      as="section"
      id="ile-tracisz"
      className="mx-auto max-w-[1200px] scroll-mt-24 px-5 pt-[clamp(8rem,18vw,12rem)] sm:px-8"
    >
      <div className="landing-stagger grid grid-cols-1 items-start gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <h2 className="m-0 max-w-[16ch] text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1.08] tracking-[-0.028em] text-balance">
            Ile tracisz, gdy klient odchodzi.
          </h2>
          <p className="mt-6 max-w-[42ch] text-[17px] font-normal leading-[1.6] text-muted text-pretty">
            Osiem sesji w miesiącu. Twoja stawka. Ile osób skończyło współpracę
            w tym roku. Wynik to sesje, które nie weszły na konto.
          </p>
        </div>
        <IleTraciszCalculator className="" />
      </div>
    </LandingReveal>
  );
}
