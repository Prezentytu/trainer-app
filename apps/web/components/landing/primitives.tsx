import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";

/** Pas ma górę i dół — CTA nie siada na szwie kolorów. */
export const SECTION_SPACE = "py-[clamp(4.5rem,calc(2.5rem+6vw),10rem)]";

/** Nav, hero treść, sekcje, stopka — jedna miara. `landing-measure` = container-type. */
export const LANDING_MEASURE = "landing-measure mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14";

const SECTION_BOX = `${LANDING_MEASURE} scroll-mt-24`;

export const SECTION_SHELL = `${SECTION_BOX} ${SECTION_SPACE}`;

/** Strony marketingowe poza `/` — ta sama miara i rytm. */
export const PAGE_SHELL = `${LANDING_MEASURE} ${SECTION_SPACE}`;

/** Lead bez górnego odstępu — gdy stoi w siatce pod H2. */
export const SECTION_COPY =
  "max-w-[44ch] text-[19px] font-normal leading-[1.6] text-muted text-pretty";

/** H2 → lead w jednej kolumnie. */
export const SECTION_LEAD = `mt-8 ${SECTION_COPY}`;

/** Caps sekcji, navu i etykiet mocków — Geist Mono, tabular po liczbach. */
export const LANDING_CAPS =
  "font-mono text-[12px] font-medium uppercase tracking-[0.1em]";

/** H1 hero — jeden wyśrodkowany blok, dwa takty na desktopie. */
export const LANDING_H1 =
  "m-0 max-w-[19ch] text-balance font-semibold leading-[0.94] tracking-[-0.04em] text-[clamp(2.25rem,7.6vw,4.5rem)] text-foreground";

/**
 * H2 sekcji ≈ 40 px na desktopie.
 * 20 ch — dwie zrównoważone linie, bez sieroty.
 */
export const SECTION_H2 =
  "m-0 max-w-[20ch] overflow-visible text-[clamp(1.875rem,2.6vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-balance";

/** H2 na `/` — skala mocka (40 px / 600 / −0.03em). */
export const LANDING_SECTION_H2 =
  "m-0 max-w-[20ch] overflow-visible text-[clamp(1.75rem,3.4vw,2.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-balance";

/**
 * Sekcja na `/`: kreska u góry, po lewej etykieta (+ H2 i lead),
 * po prawej treść. Siatka `1fr / 1.4fr` jak w mocku.
 */
export function SectionSplit({
  index,
  label,
  title,
  lead,
  children,
}: {
  index: string;
  label: string;
  title?: ReactNode;
  lead?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-10 border-t border-border pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16 xl:gap-20">
      <div className="min-w-0">
        <p className={`${LANDING_CAPS} m-0 text-fg-ghost`}>
          <span className="tabular-nums">{index}</span> · {label}
        </p>
        {title ? <h2 className={`mt-6 ${LANDING_SECTION_H2}`}>{title}</h2> : null}
        {lead ? (
          <p className="m-0 mt-5 max-w-[36ch] text-[17px] leading-[1.6] text-muted text-pretty">
            {lead}
          </p>
        ) : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Pole marketingowe — kreska u dołu, bez ramki. Panel trenera zostaje na `inputClass`. */
export const landingInputClass =
  "h-11 w-full rounded-none border-0 border-b border-border bg-transparent px-0 text-[17px] font-medium text-foreground outline-none transition-colors duration-[var(--dur-fast)] placeholder:font-normal placeholder:text-fg-ghost focus:border-foreground focus-visible:border-foreground";

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
