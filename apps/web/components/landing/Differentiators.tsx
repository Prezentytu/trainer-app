import { LandingReveal } from "./LandingReveal";

const POINTS = [
  {
    title: (
      <>
        Jeden plan,{" "}
        <span className="accent-serif">wielu</span> klientów
      </>
    ),
    body: "Zapisujesz plan do biblioteki i przypisujesz kolejnym podopiecznym. Ciężary i progresję ustawiasz osobno dla każdego.",
  },
  {
    title: (
      <>
        Klient wie,{" "}
        <span className="accent-serif">co ma robić</span>
      </>
    ),
    body: "Dokładne ciężary, powtórzenia i przerwy — timer odlicza sam. Każdy zapisany wynik widzisz od razu.",
  },
  {
    title: (
      <>
        Widzisz postęp i{" "}
        <span className="accent-serif">rekordy</span>
      </>
    ),
    body: "Objętość, regularność i rekordy życiowe — dla każdego klienta. Zastój zauważysz, zanim klient go poczuje.",
  },
];

export function Differentiators() {
  return (
    <LandingReveal as="section" id="korzysci" className="scroll-mt-20 px-5 py-28 sm:px-6 sm:py-36">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <p className="font-mono text-xs uppercase tracking-caps text-muted">Co dostajesz</p>
            <h2 className="mt-4 display-editorial text-[clamp(2.25rem,5vw,4rem)] text-foreground text-pretty">
              Wszystko między planem a rekordem
            </h2>
          </div>
          <ul className="divide-y divide-border border-y border-border lg:col-span-8">
            {POINTS.map((point, i) => (
              <li
                key={i}
                className="grid gap-3 py-10 sm:grid-cols-[minmax(0,16rem)_1fr] sm:gap-12 sm:py-12"
              >
                <h3 className="display-editorial text-xl text-foreground sm:text-2xl text-pretty">
                  {point.title}
                </h3>
                <p className="max-w-xl text-[15px] leading-relaxed text-muted">{point.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </LandingReveal>
  );
}
