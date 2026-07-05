import { ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-zinc-400">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 ${className}`}>
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
    primary: "bg-yellow-400 text-zinc-950 hover:bg-yellow-300 font-semibold",
    ghost: "bg-zinc-800 text-zinc-200 hover:bg-zinc-700",
    danger: "bg-red-950 text-red-300 hover:bg-red-900",
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
      <span className="text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-yellow-400";

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-lg border border-red-900 bg-red-950/60 px-4 py-2 text-sm text-red-300">
      {message}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-500">
      {children}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "yellow" | "green" | "red" }) {
  const styles = {
    neutral: "bg-zinc-800 text-zinc-300",
    yellow: "bg-yellow-400/15 text-yellow-300",
    green: "bg-emerald-400/15 text-emerald-300",
    red: "bg-red-400/15 text-red-300",
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
        active ? "bg-yellow-400 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
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
    ghost: "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-yellow-300",
    danger: "bg-zinc-800 text-zinc-400 hover:bg-red-950 hover:text-red-300",
  }[variant];
  const dims = size === "xs" ? "h-6 w-6 text-xs" : "h-8 w-8 text-sm";
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
