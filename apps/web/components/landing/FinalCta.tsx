import { LandingReveal } from "./LandingReveal";
import { LandingCta } from "./primitives";

export function FinalCta() {
  return (
    <LandingReveal
      as="section"
      className="mx-auto max-w-[1200px] px-5 pb-[clamp(6rem,12vw,10rem)] pt-[clamp(8rem,18vw,12rem)] sm:px-8"
    >
      <div className="landing-stagger w-full sm:mx-auto sm:w-fit">
        <h2 className="m-0 max-w-[18ch] text-[clamp(2.75rem,7.4vw,6rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-balance">
          Zacznij z pierwszym klientem.
        </h2>
        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
          <LandingCta href="/wdrozenie">Umów 30 minut wdrożenia</LandingCta>
          <span className="t-label tracking-[0.16em] text-muted">10 miejsc · 0 zł / 90 dni</span>
        </div>
      </div>
    </LandingReveal>
  );
}
