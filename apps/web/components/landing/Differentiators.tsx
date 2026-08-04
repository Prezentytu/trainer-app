import { LandingReveal } from "./LandingReveal";

const POINTS = [
  {
    title: "Jeden plan, wielu klientów",
    body: "Zapisujesz plan do biblioteki i przypisujesz kolejnym podopiecznym. Ciężary i progresję ustawiasz osobno dla każdego.",
  },
  {
    title: "Klient wie, co ma robić",
    body: "Dokładne ciężary, powtórzenia i przerwy — timer odlicza sam. Każdy zapisany wynik widzisz od razu.",
  },
  {
    title: "Widzisz postęp i rekordy",
    body: "Objętość, regularność i rekordy życiowe — dla każdego klienta. Zastój zauważysz, zanim klient go poczuje.",
  },
];

export function Differentiators() {
  return (
    <LandingReveal as="section" id="korzysci" className="scroll-mt-20 px-5 py-28 sm:px-6 sm:py-36">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm text-muted">Co dostajesz</p>
          <h2 className="mt-4 display-soft text-[clamp(1.875rem,3.4vw,2.75rem)] text-foreground text-pretty">
            Wszystko między planem a rekordem
          </h2>
        </div>

        <ul className="mt-16 divide-y divide-border border-y border-border">
          {POINTS.map((point) => (
            <li
              key={point.title}
              className="grid gap-3 py-10 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-12 sm:py-12"
            >
              <h3 className="display-soft text-lg text-foreground sm:text-xl">{point.title}</h3>
              <p className="max-w-xl text-[15px] leading-relaxed text-muted">{point.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </LandingReveal>
  );
}
