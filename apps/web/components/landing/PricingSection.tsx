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
          {/* Kwota i waluta osobno — spacja w foncie mono robiłaby dziurę na pół ekranu. */}
          <p
            className="landing-stagger m-0 flex items-baseline gap-2"
            style={{ ["--i" as string]: 1 }}
          >
            <span className="t-num text-[clamp(4rem,11vw,8.75rem)] leading-none tracking-[-0.03em] text-foreground">
              0
            </span>
            <span className="t-num text-[clamp(1.5rem,3.2vw,2.5rem)] leading-none text-fg-faint">
              zł
            </span>
          </p>
          <p
            className="landing-stagger t-label mt-6 tracking-[0.16em]"
            style={{ ["--i" as string]: 2 }}
          >
            Do 5 osób · na zawsze
          </p>
        </div>
        <div className="landing-stagger max-w-[46ch]" style={{ ["--i" as string]: 3 }}>
          <p className="m-0 text-[17px] font-normal leading-[1.6] text-muted text-pretty">
            Płacisz od{" "}
            <span className="t-num text-[17px] text-foreground">39 zł</span>
            {" / 15 osób — nie za klienta. Podopieczny zawsze 0 zł, bez konta. Dane zawsze do eksportu."}
          </p>
          <div className="mt-8">
            <LandingCta />
          </div>
        </div>
      </div>
    </LandingReveal>
  );
}
