import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";

/** Etykieta sekcji mocka — tytuł + opcjonalna akcja po prawej. */
export function SectionLabel({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="t-label tracking-[0.16em] text-muted">{children}</span>
      {action ? <span className="shrink-0">{action}</span> : null}
    </div>
  );
}

/** Mały kafelek KPI w mockach landingu — delta inline w linii wartości (stały pion etykiet). */
export function StatTile({
  value,
  label,
  unit,
  delta,
  tone,
  size = "md",
}: {
  value: string;
  label: string;
  unit?: string;
  delta?: string;
  tone?: "pr";
  size?: "md" | "lg";
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex items-baseline gap-1">
        <span
          className={`t-num leading-none ${tone === "pr" ? "text-pr" : "text-foreground"} ${
            size === "lg" ? "text-[34px]" : "text-[25px]"
          }`}
        >
          {value}
        </span>
        {unit ? <span className="font-mono text-xs font-medium text-fg-faint">{unit}</span> : null}
        {delta ? (
          <span className="ml-1.5 inline-flex items-baseline gap-1 font-mono text-[11px] font-medium tabular-nums text-gain">
            <span className="text-[9px] leading-none" aria-hidden>
              ▲
            </span>
            {delta}
          </span>
        ) : null}
      </div>
      <div className="t-label tracking-[0.16em]">{label}</div>
    </div>
  );
}

/** Nagłówek kolumn tabeli serii w mocku telefonu. */
export function SetRowHeader() {
  return (
    <div className="grid grid-cols-[28px_1fr_1fr_40px] gap-2 border-b border-border pb-2">
      <span className="t-label tracking-[0.16em] text-fg-ghost">#</span>
      <span className="t-label tracking-[0.16em] text-fg-ghost">kg</span>
      <span className="t-label tracking-[0.16em] text-fg-ghost">powt.</span>
      <span className="t-label tracking-[0.16em] text-right text-fg-ghost"> </span>
    </div>
  );
}

export function LandingCta({
  size = "lg",
  children = "Załóż darmowe konto",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Link href="/sign-up" className={className}>
      <Button size={size}>{children}</Button>
    </Link>
  );
}

export const LANDING_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
