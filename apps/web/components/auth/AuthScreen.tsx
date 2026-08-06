"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Wordmark } from "@/components/Wordmark";

type AuthScreenProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  switchLabel: string;
  switchHref: string;
  switchCta: string;
  /** Wymaga zaznaczenia zgody przed interakcją z formularzem (rejestracja). */
  requireConsent?: boolean;
};

export function AuthScreen({
  title,
  subtitle,
  children,
  switchLabel,
  switchHref,
  switchCta,
  requireConsent = false,
}: AuthScreenProps) {
  const [consent, setConsent] = useState(false);
  const blocked = requireConsent && !consent;

  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-[44%] flex-col justify-between overflow-hidden border-r border-border p-10 lg:flex xl:w-[48%] xl:p-14">
        <div className="relative">
          <Wordmark />
        </div>

        <div className="relative max-w-md space-y-5">
          <h1 className="display-landing-xl text-3xl text-foreground xl:text-4xl text-pretty">
            Wysyłasz link. Widzisz każdy trening.
          </h1>
          <p className="text-[15px] leading-relaxed text-muted">
            Klient odhacza serie w telefonie. Bez aplikacji, bez konta.
          </p>
        </div>

        <p className="relative text-sm text-muted-faint">RepMaxer · wczesny dostęp</p>
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center bg-background/40 px-4 py-12 sm:px-8">
        <div className="mb-10 w-full max-w-sm lg:hidden">
          <Wordmark />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8 space-y-2">
            <h2 className="display-soft text-2xl text-foreground">{title}</h2>
            <p className="text-[15px] text-muted">{subtitle}</p>
          </div>

          {requireConsent ? (
            <label className="mb-4 flex cursor-pointer items-start gap-3 text-sm leading-snug text-muted">
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0 rounded border-border-strong accent-foreground"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                Potwierdzam, że jako trener odpowiadam za dane podopiecznych (w tym o
                zdrowiu) i akceptuję{" "}
                <Link href="/regulamin" className="text-foreground underline">
                  regulamin
                </Link>{" "}
                oraz{" "}
                <Link href="/prywatnosc" className="text-foreground underline">
                  politykę prywatności
                </Link>
                .
              </span>
            </label>
          ) : null}

          <div
            className={`flex justify-center [&_.cl-rootBox]:w-full [&_.cl-cardBox]:w-full [&_.cl-card]:w-full ${
              blocked ? "pointer-events-none opacity-40" : ""
            }`}
            aria-disabled={blocked || undefined}
          >
            {children}
          </div>

          {blocked ? (
            <p className="mt-3 text-center text-xs text-muted">
              Zaznacz zgodę powyżej, żeby założyć konto.
            </p>
          ) : null}

          <p className="mt-8 text-center text-sm text-muted">
            {switchLabel}{" "}
            <Link href={switchHref} className="font-medium text-foreground underline">
              {switchCta}
            </Link>
          </p>

          <p className="mt-4 text-center text-sm text-muted-faint">
            <Link href="/prywatnosc" className="hover:text-muted">
              Polityka prywatności
            </Link>
            {" · "}
            <Link href="/regulamin" className="hover:text-muted">
              Regulamin
            </Link>
            {" · "}
            <Link href="/" className="hover:text-muted">
              Strona główna
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
