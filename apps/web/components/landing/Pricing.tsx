import { LandingReveal } from "./LandingReveal";

export function Pricing() {
  return (
    <LandingReveal as="section" className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-xl">
        <div className="rounded-xl border border-border-strong bg-surface p-6 text-center shadow-raised sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-caps text-muted">Wczesny dostęp</p>
          <p className="mt-3 font-mono text-4xl font-semibold tabular-nums text-foreground">
            149 zł <span className="text-lg font-normal text-muted">/ mies.</span>
          </p>
          <p className="mt-4 text-sm text-foreground-secondary">
            Wszystko w cenie — bez dopłat za AI, raporty i portal klienta.
          </p>
          <p className="mt-3 text-[13px] text-muted">
            U konkurencji nutrition i branding to osobne add-ony.
          </p>
          <a
            href="#cta"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
          >
            Umów rozmowę
          </a>
        </div>
      </div>
    </LandingReveal>
  );
}
