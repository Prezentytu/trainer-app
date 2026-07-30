import Link from "next/link";
import { Button } from "@/components/ui";

export function DataOwnership() {
  return (
    <section id="dane" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <p className="text-xs font-semibold tracking-[0.08em] text-accent uppercase">Anti lock-in</p>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Twoje dane są Twoje
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-foreground-secondary sm:text-base">
            Eksport JSON z klientami, planami, sesjami i maxami — jednym kliknięciem z Panelu. Bez
            migracyjnej migracji 8 godzin i bez „CSV kontaktów bez historii”.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-foreground-secondary">
            <li className="flex gap-2">
              <span aria-hidden className="text-accent">
                ✓
              </span>
              Pełna historia treningów, nie tylko lista imion
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-accent">
                ✓
              </span>
              Format otwarty — możesz wrócić do Excela, jeśli kiedyś zechcesz
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-accent">
                ✓
              </span>
              We wczesnym dostępie bez ukrytych opłat za coaching loop
            </li>
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6 shadow-raised">
          <div className="rounded-[10px] border border-border bg-surface-sunken p-4 font-mono text-xs leading-relaxed text-muted-strong">
            <div className="text-muted">{"{"}</div>
            <div className="pl-3">
              <span className="text-accent">&quot;exportedAt&quot;</span>:{" "}
              <span className="text-foreground">&quot;2026-07-30&quot;</span>,
            </div>
            <div className="pl-3">
              <span className="text-accent">&quot;clients&quot;</span>:{" "}
              <span className="text-foreground">[…]</span>,
            </div>
            <div className="pl-3">
              <span className="text-accent">&quot;plans&quot;</span>:{" "}
              <span className="text-foreground">[…]</span>,
            </div>
            <div className="pl-3">
              <span className="text-accent">&quot;sessions&quot;</span>:{" "}
              <span className="text-foreground">[…]</span>
            </div>
            <div className="text-muted">{"}"}</div>
          </div>
          <p className="mt-4 text-sm text-muted">
            Przycisk „Eksportuj dane” jest w Panelu od pierwszego dnia.
          </p>
          <div className="mt-5">
            <Link href="/sign-up">
              <Button variant="secondary">Załóż konto i sprawdź</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
