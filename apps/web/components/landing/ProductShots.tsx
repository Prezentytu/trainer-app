import Image from "next/image";
import { LandingReveal } from "./LandingReveal";

const PORTAL_SHOTS = [
  {
    src: "/landing/portal-home.png",
    alt: "Portal klienta — dzisiejszy trening",
    caption: "Dziś — plan i start treningu",
  },
  {
    src: "/landing/portal-session.png",
    alt: "Portal klienta — logowanie serii",
    caption: "Logowanie serii w telefonie",
  },
  {
    src: "/landing/portal-progress.png",
    alt: "Portal klienta — progres",
    caption: "Progres i objętość",
  },
] as const;

export function ProductShots() {
  return (
    <LandingReveal
      as="section"
      id="produkt"
      className="scroll-mt-20 border-t border-border px-5 py-24 sm:px-6 sm:py-32"
    >
      <div className="mx-auto max-w-6xl space-y-20 sm:space-y-28">
        <div>
          <p className="font-mono text-xs uppercase tracking-caps text-muted">Panel trenera</p>
          <h2 className="mt-4 max-w-2xl display-editorial text-[clamp(1.75rem,4vw,3rem)] text-foreground text-pretty">
            Widzisz, czy klient{" "}
            <span className="accent-serif">naprawdę</span> trenuje
          </h2>
          <figure className="mt-10">
            <div className="overflow-hidden rounded-xl border border-border-strong bg-surface">
              <Image
                src="/landing/panel-client.png"
                alt="Panel trenera — profil klienta z historią i wynikami"
                width={2880}
                height={1800}
                className="h-auto w-full"
                sizes="(max-width: 1152px) 100vw, 1152px"
                priority
              />
            </div>
            <figcaption className="mt-4 text-sm text-muted">
              Profil klienta — plan, historia, rekordy
            </figcaption>
          </figure>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-caps text-muted">Portal klienta</p>
          <h2 className="mt-4 max-w-2xl display-editorial text-[clamp(1.75rem,4vw,3rem)] text-foreground text-pretty">
            Jeden link. Bez aplikacji.{" "}
            <span className="accent-serif">Bez</span> konta.
          </h2>
          <ul className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
            {PORTAL_SHOTS.map((shot) => (
              <li
                key={shot.src}
                className="w-[min(72vw,280px)] shrink-0 snap-center md:w-auto"
              >
                <figure>
                  <div className="overflow-hidden rounded-[1.25rem] border border-border-strong bg-surface">
                    <Image
                      src={shot.src}
                      alt={shot.alt}
                      width={1170}
                      height={2532}
                      className="h-auto w-full"
                      sizes="(max-width: 768px) 72vw, 360px"
                    />
                  </div>
                  <figcaption className="mt-3 text-sm text-muted">{shot.caption}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </LandingReveal>
  );
}
