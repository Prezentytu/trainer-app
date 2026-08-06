import Image from "next/image";
import { LandingReveal } from "./LandingReveal";

const PHONE_SHOTS = [
  {
    src: "/landing/portal-home.png",
    alt: "Portal klienta — dzisiejszy trening",
    caption: "Dziś",
    cascade: "left" as const,
  },
  {
    src: "/landing/portal-session.png",
    alt: "Portal klienta — odhaczanie serii",
    caption: "Serie",
    cascade: "center" as const,
  },
  {
    src: "/landing/portal-progress.png",
    alt: "Portal klienta — progres",
    caption: "Progres",
    cascade: "right" as const,
  },
] as const;

function cascadeClass(cascade: "left" | "center" | "right") {
  if (cascade === "center") {
    return "md:w-[260px] md:z-10 md:opacity-100";
  }
  if (cascade === "left") {
    return "md:w-[236px] md:translate-y-12 md:opacity-80";
  }
  return "md:w-[236px] md:translate-y-24 md:opacity-80";
}

export function ProductShots() {
  return (
    <LandingReveal
      as="section"
      id="produkt"
      className="scroll-mt-24 border-t border-border px-5 py-32 sm:px-6 sm:py-44"
    >
      <div className="mx-auto max-w-6xl space-y-20 sm:space-y-28">
        <div>
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-muted">
              02 — Telefon klienta
            </p>
            <h2 className="mt-4 display-landing text-[clamp(1.5rem,3.4vw,2.75rem)] text-foreground text-pretty">
              Klient otwiera link i trenuje.
            </h2>
            <p className="mx-auto mt-6 max-w-[34ch] text-[16px] leading-relaxed text-muted text-pretty sm:text-[17px]">
              Ciężary z ostatniego treningu są już wpisane. Działa bez zasięgu.
            </p>
          </div>

          <ul className="landing-edge-mask mt-16 flex snap-x snap-mandatory justify-start gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden md:mt-20 md:items-start md:justify-center md:overflow-visible md:pb-8 md:[mask-image:none] md:[-webkit-mask-image:none]">
            {PHONE_SHOTS.map((shot, i) => (
              <li
                key={shot.src}
                className={`landing-stagger w-[min(68vw,260px)] shrink-0 snap-center ${cascadeClass(shot.cascade)}`}
                style={{ ["--i" as string]: i }}
              >
                <figure className="landing-phone">
                  <div className="landing-phone-frame overflow-hidden border border-border-strong shadow-card">
                    <Image
                      src={shot.src}
                      alt={shot.alt}
                      width={1170}
                      height={2532}
                      className="h-auto w-full"
                      sizes="(max-width: 768px) 68vw, 260px"
                      priority={shot.src === "/landing/portal-home.png"}
                    />
                  </div>
                  <figcaption className="landing-phone-caption mt-4 text-center font-mono text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-muted">
                    {shot.caption}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-muted">
              03 — Twój panel
            </p>
            <h2 className="mt-4 display-landing text-[clamp(1.5rem,3.4vw,2.75rem)] text-foreground text-pretty">
              Wszystko widzisz od razu.
            </h2>
            <p className="mx-auto mt-6 max-w-[34ch] text-[16px] leading-relaxed text-muted text-pretty sm:text-[17px]">
              Serie, ciężary, rekordy. I gdzie nic nie rośnie.
            </p>
          </div>
          <figure
            className="landing-phone landing-stagger mx-auto mt-12 max-w-5xl"
            style={{ ["--i" as string]: 0 }}
          >
            <div className="overflow-hidden rounded-xl border border-border-strong bg-surface shadow-card">
              <Image
                src="/landing/panel-client.png"
                alt="Panel trenera — profil klienta z historią i wynikami"
                width={2880}
                height={1800}
                className="h-auto w-full"
                sizes="(max-width: 1152px) 100vw, 1152px"
              />
            </div>
            <figcaption className="landing-phone-caption mt-4 text-center font-mono text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-muted">
              Panel trenera
            </figcaption>
          </figure>
        </div>
      </div>
    </LandingReveal>
  );
}
