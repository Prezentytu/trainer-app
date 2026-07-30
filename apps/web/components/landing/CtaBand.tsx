import Link from "next/link";
import { Button } from "@/components/ui";

export function CtaBand() {
  return (
    <section className="px-4 pb-16 sm:px-6 sm:pb-20">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-xl border border-accent-border bg-accent-dim px-6 py-10 text-center sm:px-10 sm:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,var(--accent)_0%,transparent_55%)] opacity-20"
        />
        <div className="relative">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Gotowy na pierwsze 15 minut?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-foreground-secondary sm:text-base">
            Załóż konto, dodaj klienta, wyślij link. Bez karty, bez zobowiązań we wczesnym dostępie.
          </p>
          <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link href="/sign-up" className="sm:min-w-[220px]">
              <Button size="lg" full>
                Utwórz konto trenera
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
    </section>
  );
}
