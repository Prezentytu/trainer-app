import { ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="break-words text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-1 break-words text-sm text-muted-strong">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-surface/60 p-5 ${className}`}>
      {children}
    </div>
  );
}

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
}) {
  const styles = {
    primary: "bg-accent text-accent-foreground hover:bg-accent-strong font-semibold",
    ghost: "bg-surface-hover text-foreground-secondary hover:bg-surface-active",
    danger: "bg-danger-bg text-danger hover:bg-danger-border",
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50 ${styles}`}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted-strong">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "rounded-lg border border-border-strong bg-surface-hover px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-lg border border-danger-border bg-danger-bg/60 px-4 py-2 text-sm text-danger">
      {message}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted">
      {children}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "yellow" | "green" | "red" }) {
  const styles = {
    neutral: "bg-surface-hover text-foreground-secondary",
    yellow: "bg-accent/15 text-accent-strong",
    green: "bg-success-bg/15 text-success",
    red: "bg-danger/15 text-danger",
  }[tone];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}>{children}</span>;
}

export function Pill({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-accent text-accent-foreground" : "bg-surface-hover text-foreground-secondary hover:bg-surface-active"
      }`}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  onClick,
  title,
  variant = "ghost",
  size = "sm",
}: {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  variant?: "ghost" | "danger";
  size?: "sm" | "xs";
}) {
  const styles = {
    ghost: "bg-surface-hover text-foreground-secondary hover:bg-surface-active hover:text-accent-strong",
    danger: "bg-surface-hover text-muted-strong hover:bg-danger-bg hover:text-danger",
  }[variant];
  const dims = size === "xs" ? "h-8 w-8 text-xs sm:h-6 sm:w-6" : "h-10 w-10 text-sm sm:h-8 sm:w-8";
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`inline-flex ${dims} shrink-0 items-center justify-center rounded-lg transition-colors ${styles}`}
    >
      {children}
    </button>
  );
}

export function formatRest(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${min}min` : `${min}min ${rest}s`;
}
