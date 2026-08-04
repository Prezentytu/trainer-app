import { LandingReveal } from "./LandingReveal";

const COLUMNS = [
  {
    label: "Co już działa",
    body: "Plany, biblioteka ćwiczeń, portal klienta z linkiem, logowanie serii, przerwy, rekordy i podstawowe statystyki.",
  },
  {
    label: "Dla kogo",
    body: "Trenerzy personalni, którzy układają plany siłowe i chcą widzieć, czy klient je naprawdę robi — bez Excela i bez aplikacji do instalacji.",
  },
  {
    label: "Czego jeszcze nie ma",
    body: "Płatności, aplikacji natywnej i pełnej automatyki periodyzacji. Budujemy to razem z wczesnymi użytkownikami.",
  },
];

export function EarlyAccess() {
  return (
    <LandingReveal
      as="section"
      id="wczesny-dostep"
      className="scroll-mt-20 border-y border-border bg-surface-raised/40 px-5 py-28 sm:px-6 sm:py-36"
    >
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-xs uppercase tracking-caps text-muted">Wczesny dostęp</p>
        <blockquote className="mt-6 max-w-4xl display-editorial text-[clamp(1.75rem,4vw,3.25rem)] text-foreground text-pretty">
          Budujemy narzędzie, którego sami chcielibyśmy używać na{" "}
          <span className="accent-serif">sali</span> — bez arkuszy, bez fejkowych obietnic.
        </blockquote>

        <div className="mt-16 grid gap-10 border-t border-border pt-12 md:grid-cols-3 md:gap-8">
          {COLUMNS.map((col) => (
            <div key={col.label}>
              <h3 className="font-mono text-xs uppercase tracking-caps text-muted">{col.label}</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-foreground-secondary">{col.body}</p>
            </div>
          ))}
        </div>
      </div>
    </LandingReveal>
  );
}
