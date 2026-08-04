const ITEMS = [
  "Plany",
  "Serie",
  "Powtórzenia",
  "RPE",
  "Przerwy",
  "Rekordy",
  "Postęp",
  "Objętość",
  "1RM",
];

export function Marquee() {
  const sequence = [...ITEMS, ...ITEMS];

  return (
    <div
      className="landing-marquee border-y border-border py-5 overflow-hidden"
      aria-hidden
    >
      <div className="landing-marquee-track font-mono text-xs uppercase tracking-caps text-muted">
        {sequence.map((item, i) => (
          <span key={`${item}-${i}`} className="inline-flex items-center gap-10">
            <span>{item}</span>
            <span className="text-muted-faint">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
