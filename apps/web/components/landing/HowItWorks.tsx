import { LandingReveal } from "./LandingReveal";
import {
  SECTION_SHELL,
  SECTION_STACK,
  SectionHead,
  SectionIntro,
} from "./primitives";

const STEPS = [
  {
    n: "01",
    title: "Wysyłasz to, co masz dziś",
    body: "Arkusz, PDF albo zrzuty z WhatsAppa.",
  },
  {
    n: "02",
    title: "Podopieczny otwiera link pod Twoim imieniem",
    body: "Nic nie instaluje i nie zakłada konta.",
  },
  {
    n: "03",
    title: "Ty widzisz tydzień w jednym raporcie",
    body: "Kto stanął, komu spadły ciężary, kto nie odezwał się od dwóch tygodni.",
  },
] as const;

/** 02 — trzy kroki łączące role. Bez panelu i bez telefonu. */
export function HowItWorks() {
  return (
    <LandingReveal as="section" id="produkt" className={SECTION_SHELL}>
      <div className="landing-stagger">
        <SectionHead n="02" label="Produkt">
          <div className={SECTION_STACK}>
            <SectionIntro
              title="Podopieczny odhacza serie. Ty nic nie przepisujesz."
              lead="Otwiera link pod Twoim imieniem. Bez konta, bez instalowania."
            />

            <ol className="m-0 list-none p-0">
              {STEPS.map((step) => (
                <li
                  key={step.n}
                  className="grid grid-cols-[36px_minmax(0,1fr)] items-baseline gap-5 border-b border-border py-6 last:border-b-0"
                >
                  <span className="t-num text-[13px] tabular-nums text-muted">{step.n}</span>
                  <span className="min-w-0">
                    <span className="block break-words text-[18px] font-medium leading-snug text-foreground">
                      {step.title}
                    </span>
                    <span className="mt-2 block text-[16px] leading-[1.6] text-muted">
                      {step.body}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </SectionHead>
      </div>
    </LandingReveal>
  );
}
