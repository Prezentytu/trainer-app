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
          <p className="font-mono text-xs uppercase tracking-caps text-muted">Cennik</p>
          <p className="mt-6 display-serif text-[clamp(4.5rem,14vw,8rem)] tabular-nums leading-none text-foreground">
            0{" "}
            <span className="text-[0.35em] text-muted">zł</span>
          </p>
          <p className="mx-auto mt-8 max-w-sm text-[15px] leading-relaxed text-muted text-pretty">
            Wczesny dostęp za darmo. Później 149 zł / miesiąc.
          </p>
        </div>
        <Link href="/sign-up">
          <Button size="lg">Zacznij za darmo</Button>
        </Link>
      </div>
    </LandingReveal>
  );
}
