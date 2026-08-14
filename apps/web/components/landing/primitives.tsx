import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";

/** 120 px indeks + 32 px gap — wyrównanie leadu/CTA pod H2, gdy stoją poza SectionHead. */
export const SECTION_GUTTER = "md:ml-[152px]";

/** Nowy rozdział — 4rem+8vw rośnie od telefonu, cap 12 rem. */
export const SECTION_SPACE = "pt-[clamp(5rem,calc(4rem+8vw),12rem)]";

/** Para w rozdziale (01→02, 03→04) — ciaśniej niż chapter. */
export const SECTION_SPACE_TIGHT = "pt-[clamp(3rem,calc(2rem+5vw),6rem)]";

/** Domknięcie strony: chapter + zapas. */
export const SECTION_CLOSE = "pb-[clamp(10rem,calc(10vw+4rem),14rem)]";

/** Nav, hero treść, sekcje, stopka — jedna miara. */
export const LANDING_MEASURE = "mx-auto max-w-[1360px] px-5 sm:px-8";

const SECTION_BOX = `${LANDING_MEASURE} scroll-mt-24`;

export const SECTION_SHELL = `${SECTION_BOX} ${SECTION_SPACE}`;

export const SECTION_SHELL_TIGHT = `${SECTION_BOX} ${SECTION_SPACE_TIGHT}`;

/** Lead bez górnego odstępu — gdy stoi w siatce pod H2. */
export const SECTION_COPY =
  "max-w-[42ch] text-[17px] font-normal leading-[1.6] text-muted text-pretty";

/** H2 → lead w jednej kolumnie. */
export const SECTION_LEAD = `mt-8 ${SECTION_COPY}`;

/** Lead → CTA. */
export const SECTION_CTA = "mt-12";

/**
 * H1 hero i H2 finału — bookend.
 * Min 2.75 rem: obie linie H1 pojedyncze na 360 px. Max 8.5 rem / body 17 px ≈ 8:1.
 */
export const LANDING_DISPLAY =
  "text-[clamp(2.75rem,9.2vw,8.5rem)] font-semibold leading-[0.94] tracking-[-0.045em]";

/**
 * H2 sekcji ≈ 0.47× H1 (4 rem / 8.5 rem).
 * 18 ch — dwie zrównoważone linie, bez sieroty.
 */
export const SECTION_H2 =
  "m-0 max-w-[18ch] overflow-visible text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1.12] tracking-[-0.028em] text-balance";

/** Numer w marginesie + treść (H2) — bez stempla hairline; kreska = dane albo chrome. */
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
    <div className="md:grid md:grid-cols-[120px_minmax(0,1fr)] md:gap-8">
      <p className="t-label m-0 tracking-[0.16em] text-fg-ghost">
        {n} / {label}
      </p>
      <div className="mt-3 md:mt-0">{children}</div>
    </div>
  );
}

export function LandingCta({
  size = "lg",
  children = "Załóż darmowe konto",
  href = "/sign-up",
  variant = "primary",
  className = "",
  full,
}: {
  size?: "sm" | "md" | "lg";
  children?: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  full?: boolean;
}) {
  return (
    <Link href={href} className={full ? `block ${className}` : className}>
      <Button size={size} variant={variant} full={full}>
        {children}
      </Button>
    </Link>
  );
}

export const LANDING_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
