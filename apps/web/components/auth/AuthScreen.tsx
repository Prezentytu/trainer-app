import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/Wordmark";

type AuthScreenProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  switchLabel: string;
  switchHref: string;
  switchCta: string;
};

export function AuthScreen({
  title,
  subtitle,
  children,
  switchLabel,
  switchHref,
  switchCta,
}: AuthScreenProps) {
  return (
    <div className="landing-atmosphere flex min-h-screen">
      <aside className="relative hidden w-[44%] flex-col justify-between overflow-hidden border-r border-border p-10 lg:flex xl:w-[48%] xl:p-14">
        <div className="relative">
          <Wordmark />
        </div>

        <div className="relative max-w-md space-y-5">
          <h1 className="display-editorial text-3xl text-foreground xl:text-4xl text-pretty">
            Układasz plan. Widzisz{" "}
            <span className="accent-serif">każdą</span> serię.
          </h1>
          <p className="text-[15px] leading-relaxed text-muted">
            Wysyłasz klientowi jeden link. On trenuje w telefonie, Ty widzisz każdy trening.
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

          <div className="flex justify-center [&_.cl-rootBox]:w-full [&_.cl-cardBox]:w-full [&_.cl-card]:w-full">
            {children}
          </div>

          <p className="mt-8 text-center text-sm text-muted">
            {switchLabel}{" "}
            <Link href={switchHref} className="font-medium text-accent-text hover:text-accent-strong">
              {switchCta}
            </Link>
          </p>

          <p className="mt-4 text-center">
            <Link href="/" className="text-sm text-muted-faint hover:text-muted">
              ← Strona główna
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
