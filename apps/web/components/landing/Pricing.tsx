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
            149 zł <span className="text-lg font-normal text-muted">/ mies.</span>
          </p>
          <p className="mt-4 text-sm text-muted">
            Wszystko w cenie — bez dopłat za AI, raporty i portal klienta.
          </p>
          <p className="mt-2 text-[13px] text-muted-faint">
            U konkurencji nutrition i branding to osobne add-ony.
          </p>
          <div className="mt-7">
            <Link href="#cta">
              <Button>Umów rozmowę</Button>
            </Link>
          </div>
        </div>
      </div>
    </LandingReveal>
  );
}
