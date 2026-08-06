import { LandingReveal } from "./LandingReveal";
import { LandingCta } from "./primitives";

export function PricingSection() {
  return (
    <LandingReveal
      as="section"
      id="cennik"
      className="mx-auto max-w-[1200px] scroll-mt-24 px-5 pt-[clamp(6rem,12vw,10rem)] sm:px-8"
    >
      <p
        className="landing-stagger t-label m-0 tracking-[0.16em]"
        style={{ ["--i" as string]: 0 }}
      >
        04 — Cennik
      </p>

      <div className="mt-12 grid grid-cols-1 items-end gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <p
            className="landing-stagger t-num m-0 text-[clamp(4rem,11vw,8.75rem)] leading-none tracking-[-0.03em] text-foreground"
            style={{ ["--i" as string]: 1 }}
          >
            0 zł
          </p>
          <p
            className="landing-stagger t-label mt-6 tracking-[0.16em]"
            style={{ ["--i" as string]: 2 }}
          >
            Na start · bez karty
          </p>
        </div>
        <div className="landing-stagger max-w-[46ch]" style={{ ["--i" as string]: 3 }}>
          <p className="m-0 text-[17px] font-normal leading-[1.6] text-muted text-pretty">
            Wczesny dostęp bez limitu klientów. Potem{" "}
            <span className="t-num text-[17px] text-foreground">149 zł</span> miesięcznie — cena za
            cały panel, nie za klienta. Klient nie płaci nic.
          </p>
          <div className="mt-8">
            <LandingCta />
          </div>
        </div>
      </div>
    </LandingReveal>
  );
}
