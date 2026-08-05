import Image from "next/image";
import { LandingReveal } from "./LandingReveal";

const PHONE_SHOTS = [
  {
    src: "/landing/portal-home.png",
    alt: "Portal klienta — dzisiejszy trening",
    caption: "Dziś",
  },
  {
    src: "/landing/portal-session.png",
    alt: "Portal klienta — logowanie serii",
    caption: "Logowanie serii",
  },
  {
    src: "/landing/portal-progress.png",
    alt: "Portal klienta — progres",
    caption: "Progres",
  },
] as const;

export function ProductShots() {
  return (
    <LandingReveal
      as="section"
      id="produkt"
      className="scroll-mt-20 border-t border-border px-5 py-32 sm:px-6 sm:py-44"
    >
      <div className="mx-auto max-w-6xl space-y-20 sm:space-y-28">
        <div>
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-xs uppercase tracking-caps text-muted">
              01 — Produkt
            </p>
            <h2 className="mt-4 display-serif text-[clamp(2rem,4.5vw,3.5rem)] text-foreground text-pretty">
              Jeden link. Bez aplikacji.
            </h2>
          </div>

          <ul className="mt-16 flex snap-x snap-mandatory justify-start gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden md:mt-20 md:justify-center md:overflow-visible md:pb-0">
            {PHONE_SHOTS.map((shot, i) => (
              <li
                key={shot.src}
                className="landing-stagger w-[min(68vw,260px)] shrink-0 snap-center md:w-[240px]"
                style={{ ["--i" as string]: i }}
              >
                <figure className="landing-phone">
                  <div className="landing-phone-frame overflow-hidden rounded-[1.75rem] border border-border-strong bg-surface shadow-card">
                    <Image
                      src={shot.src}
                      alt={shot.alt}
                      width={1170}
                      height={2532}
                      className="h-auto w-full"
                      sizes="(max-width: 768px) 68vw, 240px"
                      priority={shot.src === "/landing/portal-home.png"}
                    />
                  </div>
                  <figcaption className="landing-phone-caption mt-4 text-center font-mono text-xs uppercase tracking-caps text-muted">
                    {shot.caption}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-xs uppercase tracking-caps text-muted">
              Panel trenera
            </p>
            <h2 className="mt-4 display-serif text-[clamp(2rem,4.5vw,3.5rem)] text-foreground text-pretty">
              Widzisz, czy klient naprawdę trenuje.
            </h2>
          </div>
          <figure className="landing-phone landing-stagger mx-auto mt-12 max-w-5xl" style={{ ["--i" as string]: 0 }}>
            <div className="landing-phone-frame overflow-hidden rounded-xl border border-border-strong bg-surface shadow-card">
              <Image
                src="/landing/panel-client.png"
                alt="Panel trenera — profil klienta z historią i wynikami"
                width={2880}
                height={1800}
                className="h-auto w-full"
                sizes="(max-width: 1152px) 100vw, 1152px"
              />
            </div>
            <figcaption className="landing-phone-caption mt-4 text-center font-mono text-xs uppercase tracking-caps text-muted">
              Panel trenera
            </figcaption>
          </figure>
        </div>
      </div>
    </LandingReveal>
  );
}
