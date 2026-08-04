import Link from "next/link";
import { Button } from "@/components/ui";
import { LandingReveal } from "./LandingReveal";

export function Pricing() {
  return (
    <LandingReveal as="section" id="cennik" className="scroll-mt-20 px-5 py-28 sm:px-6 sm:py-36">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
          <div className="lg:col-span-7">
            <p className="font-mono text-xs uppercase tracking-caps text-muted">Cennik</p>
            <h2 className="mt-4 display-editorial text-[clamp(2.25rem,5vw,4rem)] text-foreground text-pretty">
              Za darmo we{" "}
              <span className="accent-serif">wczesnym</span> dostępie
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted">
              Później 149 zł miesięcznie. Wszystko w cenie — plany, portal klienta, statystyki,
              eksport danych.
            </p>
          </div>
          <div className="lg:col-span-5 lg:text-right">
            <p className="display-editorial text-[clamp(4rem,10vw,7rem)] tabular-nums text-foreground">
              0{" "}
              <span className="text-[0.35em] text-muted">zł</span>
            </p>
            <div className="mt-8 lg:flex lg:justify-end">
              <Link href="/sign-up">
                <Button size="lg">Zacznij za darmo</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </LandingReveal>
  );
}
