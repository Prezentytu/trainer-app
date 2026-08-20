/**
 * Miejsce na opinie. Pusta tablica = widać osobę, która składa raport.
 * Włączamy ścianę dopiero przy trzech prawdziwych cytatach — bez karuzeli.
 */

export type TrainerQuote = {
  name: string;
  city: string;
  quote: string;
};

export const TRAINER_QUOTES: TrainerQuote[] = [];

const FOUNDER = {
  initials: "AJ",
  name: "Adam",
  line: "Raport składam ja, nie automat. Pierwszej piątce — bo nie mam jeszcze opinii od trenerów.",
} as const;

export function ReviewProof() {
  if (TRAINER_QUOTES.length >= 3) {
    return (
      <div aria-label="Co mówią trenerzy">
        <ul className="m-0 list-none border-t border-border p-0">
          {TRAINER_QUOTES.map((row) => (
            <li key={row.name} className="border-b border-border py-6 last:border-b-0">
              <p className="m-0 max-w-[46ch] text-[17px] leading-[1.6] text-foreground">
                {row.quote}
              </p>
              <p className="mt-3 text-[14px] text-muted">
                {row.name}
                {row.city ? ` · ${row.city}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4 border-t border-border pt-8">
      <span
        aria-hidden
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-strong font-mono text-[13px] font-medium text-foreground"
      >
        {FOUNDER.initials}
      </span>
      <div className="min-w-0">
        <p className="m-0 text-[15px] font-medium text-foreground">{FOUNDER.name}</p>
        <p className="mt-1 max-w-[46ch] text-[15px] leading-[1.6] text-muted">{FOUNDER.line}</p>
      </div>
    </div>
  );
}
