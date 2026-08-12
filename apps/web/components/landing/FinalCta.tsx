import { LandingReveal } from "./LandingReveal";
import { LandingCta } from "./primitives";

export function FinalCta() {
  return (
    <LandingReveal
      as="section"
      className="mx-auto max-w-[1200px] px-5 pb-[clamp(6rem,12vw,10rem)] pt-[clamp(8rem,16vw,10rem)] sm:px-8"
    >
      {/* Domknięcie klamry z hero — ten sam wyśrodkowany blok z tekstem do lewej. */}
      <div className="w-full sm:mx-auto sm:w-fit">
        {/* Dłuższy nagłówek niż hero — zawija się, żeby nie wyjść poza kontener. */}
        <h2
          className="landing-stagger m-0 max-w-[18ch] text-[clamp(2.75rem,7.4vw,6rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-balance"
          style={{ ["--i" as string]: 0 }}
        >
          Zacznij z pierwszym klientem.
        </h2>
        <div
          className="landing-stagger mt-10 flex flex-wrap items-center gap-x-6 gap-y-3"
          style={{ ["--i" as string]: 1 }}
        >
          <LandingCta />
          <span className="t-label tracking-[0.16em] text-muted">0 zł · bez karty</span>
        </div>
      </div>
    </LandingReveal>
  );
}
