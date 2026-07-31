import Link from "next/link";
import { Button } from "@/components/ui";
import { LandingReveal } from "./LandingReveal";

export function CtaBand() {
  return (
    <LandingReveal as="section" className="px-4 pb-20 sm:px-6 sm:pb-28">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-xl border border-border bg-surface px-6 py-16 text-center sm:px-12 sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,var(--accent-dim)_0%,transparent_55%)]"
        />
        <div className="relative">
          <h2 className="font-display text-4xl font-bold tracking-[-0.03em] text-balance text-foreground sm:text-5xl md:text-6xl">
            Przestań wysyłać PDF-y.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base text-foreground-secondary sm:text-lg">
            Załóż konto, dodaj klienta, wyślij link. Za darmo we wczesnym dostępie.
          </p>
          <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link href="/sign-up" className="sm:min-w-[220px]">
              <Button size="lg" full>
                Zacznij za darmo
              </Button>
            </Link>
            <Link href="/sign-in" className="sm:min-w-[160px]">
              <Button variant="ghost" size="lg" full>
                Mam już konto
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </LandingReveal>
  );
}
