import Link from "next/link";
import { Button } from "@/components/ui";
import { LandingReveal } from "./LandingReveal";

export function CtaBand() {
  return (
    <LandingReveal as="section" id="cta" className="relative overflow-hidden px-5 py-28 sm:px-6 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,var(--accent-dim)_0%,transparent_60%)]"
      />
      <div className="relative mx-auto max-w-2xl text-center">
        <h2 className="display-soft text-[clamp(1.875rem,3.4vw,2.75rem)] text-foreground text-pretty">
          Pierwszy plan ułożysz w kilka minut.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[15px] text-muted">
          Wczesny dostęp za darmo, bez karty.
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
