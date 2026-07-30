import { Card } from "@/components/ui";
import { Keyboard, Link2, Radar } from "lucide-react";

const ITEMS = [
  {
    icon: Keyboard,
    eyebrow: "Programowanie",
    title: "Kreator w tempie myślenia",
    body: "Composer serii, inline ćwiczenia, RIR — mniej klików niż w typowym softcie PT. Plany budujesz jak w notatniku, nie w arkuszu.",
  },
  {
    icon: Link2,
    eyebrow: "Portal klienta",
    title: "Link zamiast konta",
    body: "Podopieczny otwiera magic-link i loguje treningi. Zero onboardingowego tarcia — bez hasła, bez App Store przed pierwszym treningiem.",
  },
  {
    icon: Radar,
    eyebrow: "Retencja",
    title: "Wiesz, kto wymaga uwagi",
    body: "Panel pokazuje klientów bez planu i sygnały ciszy. Interweniujesz zanim usłyszysz „kończę współpracę”.",
  },
];

export function Differentiators() {
  return (
    <section id="roznice" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.08em] text-accent uppercase">Dlaczego WA</p>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Mniej tarcia. Więcej coachingu.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground-secondary sm:text-base">
            Soft PT często boli ceną, lock-inem i klikaniem. My zaczynamy od pętli: program → log →
            progres → retencja.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="h-full">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent-dim text-accent-strong">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </div>
                <div className="mb-1 text-xs font-semibold tracking-[0.08em] text-muted uppercase">
                  {item.eyebrow}
                </div>
                <h3 className="break-words font-display text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">{item.body}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
