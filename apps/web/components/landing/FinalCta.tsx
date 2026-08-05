import Link from "next/link";
import { Button } from "@/components/ui";
import { LandingReveal } from "./LandingReveal";

export function FinalCta() {
  return (
    <LandingReveal
      as="section"
      id="cennik"
      className="scroll-mt-20 border-t border-border px-5 py-32 sm:px-6 sm:py-44"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 text-center sm:gap-12">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-muted">
            04 — Cena
          </p>
          <p className="mt-6 display-landing-xl text-[clamp(5rem,15vw,9rem)] tabular-nums leading-none text-foreground">
            0
            <span className="ml-2 text-[0.28em] text-muted sm:ml-3">zł</span>
          </p>
          <p className="mx-auto mt-8 max-w-[34ch] text-[15px] leading-relaxed text-muted text-pretty">
            Wczesny dostęp bez karty. Potem 149 zł miesięcznie. Klient nie płaci nic.
          </p>
        </div>
        <Link href="/sign-up">
          <Button size="lg" className="landing-cta-pill">
            Załóż darmowe konto
          </Button>
        </Link>
      </div>
    </LandingReveal>
  );
}
