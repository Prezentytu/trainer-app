import Link from "next/link";
import { Button } from "@/components/ui";
import { LandingReveal } from "./LandingReveal";

export function FinalCta() {
  return (
    <LandingReveal
      as="section"
      id="cennik"
      className="scroll-mt-20 border-t border-border px-5 py-24 sm:px-6 sm:py-32"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-caps text-muted">Cennik</p>
          <p className="mt-4 display-editorial text-[clamp(4rem,12vw,7.5rem)] tabular-nums leading-none text-foreground">
            0{" "}
            <span className="text-[0.35em] text-muted">zł</span>
          </p>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted text-pretty">
            Wczesny dostęp za darmo. Później 149 zł miesięcznie — wszystko w cenie.
          </p>
        </div>
        <div className="shrink-0">
          <Link href="/sign-up">
            <Button size="lg">Zacznij za darmo</Button>
          </Link>
        </div>
      </div>
    </LandingReveal>
  );
}
