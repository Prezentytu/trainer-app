const ITEMS = [
  "Plan",
  "Seria",
  "Progres",
  "PR",
  "Link",
  "Offline",
  "Klient",
  "Trening",
] as const;

function MarqueeHalf({ suffix }: { suffix: string }) {
  return (
    <>
      {ITEMS.map((item) => (
        <span key={`${suffix}-${item}`} className="landing-marquee-item">
          {item}
          <span aria-hidden className="mx-3 opacity-40">
            ·
          </span>
        </span>
      ))}
    </>
  );
}

export function Marquee() {
  return (
    <div className="landing-marquee" aria-hidden>
      <div className="landing-marquee-track">
        <MarqueeHalf suffix="a" />
        <MarqueeHalf suffix="b" />
      </div>
    </div>
  );
}
