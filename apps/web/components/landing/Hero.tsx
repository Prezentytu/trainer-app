import Link from "next/link";
import { Button } from "@/components/ui";

const METRICS = [
  { value: "1 link", label: "Klient zaczyna" },
  { value: "0", label: "Aplikacji do instalacji" },
  { value: "Live", label: "Widok każdej serii" },
  { value: "0 zł", label: "Wczesny dostęp" },
];

export function Hero() {
  return (
    <section id="produkt" className="relative overflow-hidden scroll-mt-20 px-5 pt-28 pb-0 sm:px-6 sm:pt-36">
      <div className="relative z-[1] mx-auto max-w-6xl">
        <p className="landing-reveal eyebrow">{"/// Dla trenerów personalnych"}</p>
        <h1 className="landing-reveal landing-reveal-delay-1 mt-6 display-caps text-[clamp(3.25rem,8vw,6.75rem)] text-foreground">
          <span className="block">
            Układasz plan
            <span className="text-accent-text">.</span>
          </span>
          <span className="block">
            <span
              className="text-transparent"
              style={{ WebkitTextStroke: "2px var(--accent-text)" }}
            >
              Widzisz
            </span>{" "}
            każdą serię
            <span className="text-accent-text">.</span>
          </span>
        </h1>

        <div className="landing-reveal landing-reveal-delay-2 mt-9 flex flex-col items-stretch justify-between gap-8 sm:flex-row sm:items-end">
          <p className="max-w-md text-[17px] leading-relaxed text-muted text-pretty">
            Klient dostaje link — bez aplikacji i bez konta. Zapisuje wyniki w trakcie treningu, a Ty
            widzisz jego postępy na żywo.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/sign-up">
              <Button size="lg" glow>
                Zacznij za darmo
              </Button>
            </Link>
            <a href="#jak-to-dziala">
              <Button variant="secondary" size="lg">
                Jak to działa
              </Button>
            </a>
          </div>
        </div>

        <div className="landing-reveal landing-reveal-delay-3 mt-14 flex flex-wrap gap-8 border-t border-dashed border-border-strong pt-6 pb-16 sm:gap-12 sm:pb-20">
          {METRICS.map((m) => (
            <div key={m.label}>
              <div className="font-mono text-2xl font-semibold tabular-nums text-foreground">{m.value}</div>
              <div className="mt-1 font-mono text-[11px] uppercase tracking-caps text-muted">
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
