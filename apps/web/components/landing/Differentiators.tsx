import { Keyboard, Link2, Radar } from "lucide-react";
import { LandingReveal } from "./LandingReveal";

export function Differentiators() {
  return (
    <LandingReveal
      as="section"
      className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24"
    >
      <div id="korzysci" className="mx-auto max-w-6xl scroll-mt-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs font-medium tracking-[0.12em] text-muted uppercase">
            02 / Korzyści
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Mniej arkuszy. Więcej coachingu.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 md:grid-rows-2">
          {/* Duża karta — portal klienta */}
          <article className="flex flex-col justify-between rounded-xl border border-border bg-surface p-6 shadow-card md:row-span-2 md:p-8">
            <div>
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-[10px] bg-accent-dim text-accent-strong">
                <Link2 className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                Klient klika link i trenuje
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-foreground-secondary sm:text-base">
                Bez konta i bez sklepu z aplikacjami. Otwiera link na telefonie i loguje serie.
              </p>
            </div>

            <div className="mt-8 overflow-hidden rounded-xl border border-border bg-surface-sunken p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted">Link do treningu</span>
                <span className="rounded-full bg-accent-dim px-2 py-0.5 text-[10px] font-semibold text-accent-strong">
                  gotowy
                </span>
              </div>
              <p className="mt-2 truncate font-mono text-xs text-foreground-secondary">
                app.wa.pl/p/anna-push-3
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between rounded-[10px] border border-border bg-surface px-3 py-2 text-xs">
                  <span className="text-foreground">Wyciskanie</span>
                  <span className="font-mono tabular-nums text-muted">4×8</span>
                </div>
                <div className="flex items-center justify-between rounded-[10px] border border-border bg-surface px-3 py-2 text-xs">
                  <span className="text-foreground">Wiosłowanie</span>
                  <span className="font-mono tabular-nums text-muted">3×10</span>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-xl border border-border bg-surface p-6 shadow-card">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent-dim text-accent-strong">
              <Keyboard className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground">Plan w kilka minut</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
              Układaj treningi jak w notatniku. Serie, przerwy i ciężary w jednym miejscu.
            </p>
          </article>

          <article className="rounded-xl border border-border bg-surface p-6 shadow-card">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent-dim text-accent-strong">
              <Radar className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground">Widzisz, kto trenuje</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
              Panel pokazuje wykonanie i ciszę. Interweniujesz, zanim klient zniknie.
            </p>
          </article>
        </div>
      </div>
    </LandingReveal>
  );
}
