import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/Wordmark";

const PROOFS = [
  {
    title: "Kreator keyboard-first",
    body: "Programuj serie w tempie myślenia — bez klikania w każdą komórkę.",
  },
  {
    title: "Portal klienta bez konta",
    body: "Jeden link — podopieczny loguje treningi, Ty widzisz wykonanie.",
  },
  {
    title: "Eksport jednym klikiem",
    body: "Twoje dane są Twoje. JSON z klientami, planami i sesjami.",
  },
];

type AuthScreenProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerHint?: ReactNode;
  switchLabel: string;
  switchHref: string;
  switchCta: string;
};

export function AuthScreen({
  title,
  subtitle,
  children,
  footerHint,
  switchLabel,
  switchHref,
  switchCta,
}: AuthScreenProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="relative hidden w-[44%] flex-col justify-between overflow-hidden border-r border-border bg-surface-sunken p-10 lg:flex xl:w-[48%]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,var(--accent-dim)_0%,transparent_55%)]"
        />
        <div className="relative">
          <Wordmark />
        </div>

        <div className="relative space-y-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.08em] text-accent uppercase">
              Studio trenera
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground xl:text-4xl">
              Programuj treningi, nie arkusze.
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-foreground-secondary">
              Workout Alchemist łączy kreator planów, logger sesji i portal klienta w jednym ciemnym
              studio — bez fragmentacji na WhatsApp + Excel.
            </p>
          </div>

          <ul className="space-y-4">
            {PROOFS.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                />
                <div>
                  <div className="text-sm font-medium text-foreground">{item.title}</div>
                  <p className="mt-0.5 text-sm text-muted">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="inline-flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-card">
            <span className="rounded-full bg-pr-dim px-2.5 py-0.5 font-mono text-xs font-semibold tabular-nums text-pr">
              PR
            </span>
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground">Przysiad · +5 kg e1RM</div>
              <div className="font-mono text-xs tabular-nums text-muted">vs 4 tyg. temu</div>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-muted-faint">Workout Alchemist · wczesny dostęp</p>
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="mb-8 w-full max-w-md lg:hidden">
          <Wordmark />
        </div>

        <div className="w-full max-w-md">
          <div className="mb-6 space-y-2">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">{title}</h2>
            <p className="text-sm text-muted-strong">{subtitle}</p>
            {footerHint}
          </div>

          <div className="flex justify-center [&_.cl-rootBox]:w-full [&_.cl-cardBox]:w-full [&_.cl-card]:w-full">
            {children}
          </div>

          <p className="mt-6 text-center text-sm text-muted">
            {switchLabel}{" "}
            <Link href={switchHref} className="font-medium text-accent hover:text-accent-strong">
              {switchCta}
            </Link>
          </p>

          <p className="mt-3 text-center">
            <Link href="/" className="text-xs text-muted-faint hover:text-muted-strong">
              ← Strona główna
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
