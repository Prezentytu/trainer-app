import Link from "next/link";
import { Button } from "@/components/ui";
import { LandingReveal } from "./LandingReveal";

export function CtaBand() {
  return (
    <LandingReveal as="section" id="cta" className="relative overflow-hidden px-5 py-28 sm:px-6 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,var(--accent-dim)_0%,transparent_55%)]"
      />
      <div className="relative mx-auto max-w-6xl">
        <h2 className="max-w-4xl display-editorial text-[clamp(2.5rem,6vw,5rem)] text-foreground text-pretty">
          Pierwszy plan ułożysz w{" "}
          <span className="accent-serif">kilka</span> minut.
        </h2>
        <p className="mt-6 max-w-md text-[15px] text-muted">
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
