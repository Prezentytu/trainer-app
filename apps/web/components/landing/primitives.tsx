import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";

/** Pas ma górę i dół — CTA nie siada na szwie kolorów. */
export const SECTION_SPACE = "py-[clamp(4.5rem,calc(2.5rem+6vw),10rem)]";

/** Stos wewnątrz sekcji — oddech między H2, artefaktem i CTA. */
export const SECTION_STACK = "flex flex-col gap-10 md:gap-12 xl:gap-16";

/** Nav, hero treść, sekcje, stopka — jedna miara. `landing-measure` = container-type. */
export const LANDING_MEASURE = "landing-measure mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-10";

const SECTION_BOX = `${LANDING_MEASURE} scroll-mt-24`;

export const SECTION_SHELL = `${SECTION_BOX} ${SECTION_SPACE}`;

/** Strony marketingowe poza `/` — ta sama miara i rytm. */
export const PAGE_SHELL = `${LANDING_MEASURE} ${SECTION_SPACE}`;

/** Lead bez górnego odstępu — gdy stoi w siatce pod H2. */
export const SECTION_COPY =
  "max-w-[44ch] text-[19px] font-normal leading-[1.6] text-muted text-pretty";

/** H2 → lead w jednej kolumnie. */
export const SECTION_LEAD = `mt-8 ${SECTION_COPY}`;

/** Nav i etykiety sekcji — Instrument Sans caps, nie Geist Mono. */
export const LANDING_CAPS =
  "font-sans text-[12px] font-medium uppercase tracking-[0.16em]";

/** Hero: copy | jedna scena produktu. Od lg scena wypełnia prawą stronę kadru. */
export const LANDING_HERO_GRID =
  "grid min-w-0 flex-1 items-center gap-14 py-16 sm:py-20 lg:grid-cols-[minmax(17rem,0.56fr)_minmax(0,1.44fr)] lg:gap-12 lg:py-6 xl:gap-16 xl:py-8";

/** H1 hero — główna dominanta copy, czytelna obok dużego ekranu produktu. */
export const LANDING_H1 =
  "m-0 font-semibold leading-[1.08] tracking-[-0.025em] text-[clamp(2.25rem,4.8cqi,3rem)] text-foreground";

/** Hak pod H1 — cena i czas, wyraźny stopień w dół. */
export const LANDING_H1_SUB =
  "m-0 max-w-[22ch] font-medium leading-[1.25] tracking-[-0.015em] text-[clamp(1.25rem,2vw,1.5rem)] text-muted";

/**
 * H2 sekcji ≈ 40 px na desktopie.
 * 20 ch — dwie zrównoważone linie, bez sieroty.
 */
export const SECTION_H2 =
  "m-0 max-w-[20ch] overflow-visible text-[clamp(1.875rem,2.6vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-balance";

/** H2 na `/` — skala mocka (~46 px / 700). Inne strony marketingowe zostają na SECTION_H2. */
export const LANDING_SECTION_H2 =
  "m-0 max-w-[30ch] overflow-visible text-[clamp(1.875rem,3.2vw,2.875rem)] font-bold leading-[1.04] tracking-[-0.03em] text-balance";

export function SectionIndex({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-baseline gap-3 lg:block">
      <p className="t-num m-0 text-[2rem] leading-[0.9] text-[var(--line)] lg:text-[clamp(3.5rem,8vw,5.5rem)]">
        {n}
      </p>
      <p className={`m-0 break-words ${LANDING_CAPS} text-foreground lg:mt-3`}>{label}</p>
    </div>
  );
}

/** Szyna 200 px + ghost-numer mono. Ten sam próg co 01 (`lg:`). */
export function SectionHead({
  n,
  label,
  children,
}: {
  n: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12">
      <div>
        <SectionIndex n={n} label={label} />
      </div>
      <div className="mt-4 lg:mt-0">{children}</div>
    </div>
  );
}

/** H2 + lead w siatce jak w mocku. */
export function SectionIntro({
  title,
  lead,
  className = "",
}: {
  title: ReactNode;
  lead: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`grid items-end gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,44ch)] lg:gap-10 ${className}`.trim()}
    >
      <h2 className={LANDING_SECTION_H2}>{title}</h2>
      <p className="m-0 text-[19px] font-normal leading-[1.6] text-muted text-pretty">
        {lead}
      </p>
    </div>
  );
}

export function LandingCta({
  size = "lg",
  children,
  href,
  variant = "primary",
  className = "",
  full,
}: {
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  full?: boolean;
}) {
  if (variant === "ghost") {
    return (
      <Link
        href={href}
        className={`landing-cta-ghost ${className}`.trim()}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link href={href} className={full ? "block" : undefined}>
      <Button size={size} variant={variant} full={full} className={className}>
        {children}
      </Button>
    </Link>
  );
}

export const LANDING_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
