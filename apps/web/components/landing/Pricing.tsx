import Link from "next/link";
import { Button } from "@/components/ui";
import { LandingReveal } from "./LandingReveal";

export function Pricing() {
  return (
    <LandingReveal as="section" id="cennik" className="scroll-mt-20 px-5 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-xl">
        <p className="eyebrow text-center">{"/// Cennik"}</p>
        <div className="mt-6 rounded-xl border border-border-strong bg-surface p-7 text-center shadow-raised sm:p-9">
          <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
            Wczesny dostęp
          </p>
          <p className="mt-4 font-mono text-4xl font-semibold tabular-nums text-foreground">
            0 zł <span className="text-lg font-normal text-muted">/ wczesny dostęp</span>
          </p>
          <p className="mt-2 font-mono text-sm tabular-nums text-muted">
            <span className="line-through">149 zł / mies.</span>
            <span className="ml-2 text-muted-faint">po premierze</span>
          </p>
          <p className="mt-4 text-sm text-muted">
            Wszystko w cenie — analityka, portal klienta, eksport danych.
          </p>
          <div className="mt-7">
            <Link href="/sign-up">
              <Button>Zacznij za darmo</Button>
            </Link>
          </div>
        </div>
      </div>
    </LandingReveal>
  );
}
