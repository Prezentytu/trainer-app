import Link from "next/link";
import { Button } from "@/components/ui";
import { LandingReveal } from "./LandingReveal";

export function Pricing() {
  return (
    <LandingReveal as="section" id="cennik" className="scroll-mt-20 px-5 py-28 sm:px-6 sm:py-36">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-sm text-muted">Cennik</p>
        <h2 className="mt-4 display-soft text-[clamp(1.875rem,3.4vw,2.75rem)] text-foreground">
          Za darmo we wczesnym dostępie
        </h2>
        <p className="mt-8 font-mono text-5xl font-semibold tabular-nums text-foreground">0 zł</p>
        <p className="mt-6 text-[15px] leading-relaxed text-muted text-pretty">
          Później 149 zł miesięcznie. Wszystko w cenie — plany, portal klienta, statystyki, eksport
          danych.
        </p>
        <div className="mt-10">
          <Link href="/sign-up">
            <Button size="lg">Zacznij za darmo</Button>
          </Link>
        </div>
      </div>
    </LandingReveal>
  );
}
