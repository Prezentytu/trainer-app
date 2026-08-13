import { LandingReveal } from "./LandingReveal";
import { LandingCta } from "./primitives";

export function PricingSection() {
  return (
    <LandingReveal
      as="section"
      id="cennik"
      className="mx-auto max-w-[1200px] scroll-mt-24 px-5 pt-[clamp(8rem,18vw,12rem)] sm:px-8"
    >
      <div className="landing-stagger grid grid-cols-1 items-end gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <p className="t-label m-0 tracking-[0.16em]">Cennik</p>
          <p className="m-0 mt-10 flex flex-wrap items-baseline gap-x-2 gap-y-0">
            <span className="t-num text-[clamp(4rem,11vw,8.75rem)] leading-none tracking-[-0.03em] text-foreground">
              0
            </span>
            <span className="t-num text-[clamp(1.5rem,3.2vw,2.5rem)] leading-none text-fg-faint">
              zł
            </span>
          </p>
          <p className="t-label mt-6 tracking-[0.16em]">Do 5 osób · na zawsze</p>
        </div>

        <div className="max-w-[46ch]">
          <p className="m-0 text-[17px] font-normal leading-[1.6] text-muted text-pretty">
            <span className="t-num text-[17px] text-foreground">39 zł</span>
            {" / 15 osób. "}
            <span className="t-num text-[17px] text-foreground">99 zł</span>
            {" / 30 osób. Podopieczny zawsze 0 zł, bez konta. Dane zawsze do eksportu."}
          </p>
          <p className="mt-4 text-[15px] font-normal leading-[1.6] text-muted text-pretty">
            Na start możesz umówić rozmowę: 90 dni za 0 zł, do 15 osób. 10 miejsc
            w miesiącu.
          </p>
          <div className="mt-8">
            <LandingCta href="/wdrozenie">Umów 30 minut wdrożenia</LandingCta>
          </div>
        </div>
      </div>
    </LandingReveal>
  );
}
