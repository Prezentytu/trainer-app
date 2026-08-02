"use client";

import { ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="break-words font-display text-xl font-bold sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-[70ch] break-words text-sm leading-[var(--leading-body)] text-muted-strong">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Placeholder ładowania — kształt 1:1 z docelowym layoutem. Pokazuj po ≥200ms (useDelayedFlag). */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`skeleton-pulse rounded-md bg-surface-active ${className}`}
    />
  );
}

export function Card({
  children,
  className = "",
  eyebrow,
  title,
  meta,
  interactive,
  selected,
  onClick,
}: {
  children?: ReactNode;
  className?: string;
  eyebrow?: string;
  title?: string;
  meta?: string;
  interactive?: boolean;
  selected?: boolean;
  onClick?: () => void;
}) {
  const classNames = [
    "rounded-xl border bg-surface p-4 text-left shadow-card transition-[background-color,border-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)]",
    selected ? "border-accent" : "border-border",
    interactive || onClick
      ? "hover:bg-surface-hover focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] active:scale-[0.99]"
      : "",
    className,
  ].join(" ");
  const header =
    eyebrow || title || meta ? (
      <div className="mb-3 min-w-0">
        {eyebrow ? (
          <div className="mb-1 text-xs font-semibold uppercase tracking-caps text-muted">{eyebrow}</div>
        ) : null}
        {title ? <div className="break-words font-display text-lg font-semibold text-foreground">{title}</div> : null}
        {meta ? <div className="mt-0.5 break-words text-sm leading-[var(--leading-label)] text-muted">{meta}</div> : null}
      </div>
    ) : null;

  if (interactive || onClick) {
    return (
      <button type="button" onClick={onClick} className={classNames}>
        {header}
        {children}
      </button>
    );
  }
  return (
    <div className={classNames}>
      {header}
      {children}
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled,
  loading,
  title,
  full,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  /** Spinner wewnątrz przycisku — rozmiar stabilny, treść w aria-busy. */
  loading?: boolean;
  title?: string;
  full?: boolean;
  className?: string;
}) {
  const styles: Record<ButtonVariant, string> = {
    primary: "bg-accent text-accent-foreground hover:bg-accent-strong font-semibold",
    secondary: "border border-border-strong bg-surface text-foreground-secondary hover:bg-surface-hover",
    ghost: "bg-transparent text-foreground-secondary hover:bg-surface-hover",
    danger: "bg-danger-bg text-danger hover:bg-danger-border",
  };
  const sizes: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-5 text-sm",
  };
  const busy = !!loading;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      title={title}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-md transition-[background-color,transform,color] duration-[var(--dur-fast)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        styles[variant],
        sizes[size],
        full ? "w-full" : "",
        className,
      ].join(" ")}
    >
      {busy ? (
        <span
          aria-hidden
          className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : null}
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  title,
  children,
}: {
  label: string;
  /** Tekst pomocniczy widoczny obok etykiety (np. przelicznik „≈ RIR 8”). */
  hint?: string;
  /** Tooltip (natywny title) z dłuższym wyjaśnieniem pola. */
  title?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm" title={title}>
      <span className="flex flex-wrap items-baseline gap-1.5 text-xs font-semibold uppercase tracking-caps text-muted-strong">
        {label}
        {hint ? <span className="text-xs font-normal normal-case tracking-normal text-muted">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "h-10 w-full rounded-md border border-border-strong bg-surface-sunken px-3 text-base text-foreground outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)] placeholder:text-muted-faint focus:border-accent-strong focus:shadow-[var(--glow-accent)] sm:text-sm";

/** Input liczbowy — mono + tabular, bez „drgania” layoutu przy zmianie cyfr. 16px na mobile (iOS nie zoomuje). */
export const inputNumericClass =
  "h-10 w-full rounded-[10px] border border-border-strong bg-surface-raised px-3 font-mono text-base tabular-nums text-foreground outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)] placeholder:text-muted-faint focus:border-accent-strong focus:shadow-[var(--glow-accent)] sm:text-sm";

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mb-4 rounded-md border border-danger-border bg-danger-bg/60 px-4 py-2 text-sm leading-[var(--leading-body)] text-danger"
    >
      {message}
    </div>
  );
}

export function EmptyState({
  children,
  title,
  action,
}: {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
      {title ? (
        <div className="font-display text-base font-semibold text-foreground">{title}</div>
      ) : null}
      <div className={`mx-auto max-w-[40ch] text-sm leading-[var(--leading-body)] text-muted ${title ? "mt-2" : ""}`}>
        {children}
      </div>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export type BadgeTone = "neutral" | "yellow" | "green" | "red" | "pr" | "accent" | "positive" | "danger";

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: BadgeTone }) {
  const styles: Record<BadgeTone, string> = {
    neutral: "bg-surface-active text-foreground-secondary",
    yellow: "bg-accent-dim text-accent-strong",
    accent: "bg-accent-dim text-accent-strong",
    green: "bg-positive-dim text-positive",
    positive: "bg-positive-dim text-positive",
    red: "bg-danger-bg text-danger",
    danger: "bg-danger-bg text-danger",
    pr: "bg-pr-dim text-pr",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[tone]}`}>
      {children}
    </span>
  );
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
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] ${
        active
          ? "bg-accent text-accent-foreground"
          : "bg-surface-hover text-foreground-secondary hover:bg-surface-active"
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
  active,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  variant?: "ghost" | "danger" | "outline";
  size?: "sm" | "xs" | "md" | "lg";
  active?: boolean;
  disabled?: boolean;
}) {
  const styles = {
    ghost: active
      ? "bg-accent-dim text-accent"
      : "bg-transparent text-foreground-secondary hover:bg-surface-hover hover:text-accent-strong",
    outline: "border border-border-strong bg-surface text-foreground-secondary hover:bg-surface-hover",
    danger: "bg-surface-hover text-muted-strong hover:bg-danger-bg hover:text-danger",
  }[variant];
  const dims = {
    xs: "h-8 w-8 text-xs sm:h-6 sm:w-6",
    sm: "h-10 w-10 text-sm sm:h-8 sm:w-8",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  }[size];
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={`inline-flex ${dims} shrink-0 items-center justify-center rounded-md transition-[background-color,transform,color] duration-[var(--dur-fast)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] active:scale-[0.98] disabled:opacity-50 ${styles}`}
    >
      {children}
    </button>
  );
}

/** Awatar z inicjałami (recognition over recall) — używany wszędzie, gdzie listujemy klientów. */
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?";
  const dims = { sm: "h-6 w-6 text-xs", md: "h-8 w-8 text-xs", lg: "h-10 w-10 text-sm" }[size];
  return (
    <span
      className={`inline-flex ${dims} shrink-0 items-center justify-center rounded-full bg-surface-hover font-semibold text-foreground-secondary`}
    >
      {initials}
    </span>
  );
}

export function StatBlock({
  label,
  value,
  unit,
  delta,
  size = "md",
  valueClassName,
  reserveDelta = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  size?: "md" | "lg";
  /** Nadpisanie koloru wartości (np. text-pr dla rekordów). */
  valueClassName?: string;
  /** Zawsze rezerwuj wiersz delty — wyrównanie wysokości kafelków w gridzie. */
  reserveDelta?: boolean;
}) {
  const showDelta = Boolean(delta) || reserveDelta;
  return (
    <div className="min-w-0">
      <div className="text-xs font-semibold uppercase tracking-caps text-muted">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span
          className={`font-mono font-semibold tabular-nums ${valueClassName ?? "text-foreground"} ${
            size === "lg" ? "text-4xl" : "text-2xl"
          }`}
        >
          {value}
        </span>
        {unit ? <span className="font-mono text-sm text-muted">{unit}</span> : null}
      </div>
      {showDelta ? (
        <div
          className={`mt-1 min-h-[1rem] font-mono text-xs ${
            delta?.trim().startsWith("+") ? "text-positive" : "text-muted"
          }`}
        >
          {delta ?? "\u00a0"}
        </div>
      ) : null}
    </div>
  );
}

export function Tag({ children, onRemove }: { children: ReactNode; onRemove?: () => void }) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border-strong bg-surface-sunken px-2.5 text-xs text-foreground-secondary">
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Usuń"
          className="text-muted-faint hover:text-foreground-secondary"
        >
          ×
        </button>
      ) : null}
    </span>
  );
}

export type TabItem = string | { value: string; label: string; count?: number };

function tabValue(item: TabItem): string {
  return typeof item === "string" ? item : item.value;
}
function tabLabel(item: TabItem): string {
  return typeof item === "string" ? item : item.label;
}
function tabCount(item: TabItem): number | undefined {
  return typeof item === "string" ? undefined : item.count;
}

export function Tabs({
  items,
  value,
  onChange,
}: {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-border" role="tablist">
      {items.map((item) => {
        const v = tabValue(item);
        const active = v === value;
        const count = tabCount(item);
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v)}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] ${
              active
                ? "border-accent text-accent"
                : "border-transparent text-muted-strong hover:text-foreground-secondary"
            }`}
          >
            {tabLabel(item)}
            {count != null ? <span className="font-mono text-xs tabular-nums text-muted">{count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function SegmentedControl({
  items,
  value,
  onChange,
  full,
}: {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  full?: boolean;
}) {
  return (
    <div
      className={`inline-flex rounded-md border border-border bg-surface-sunken p-0.5 ${full ? "w-full" : ""}`}
      role="group"
    >
      {items.map((item) => {
        const v = tabValue(item);
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] ${
              full ? "flex-1" : ""
            } ${
              active
                ? "bg-surface-active text-foreground shadow-[var(--shadow-segment-active)]"
                : "text-muted-strong hover:text-foreground-secondary"
            }`}
          >
            {tabLabel(item)}
          </button>
        );
      })}
    </div>
  );
}

export function Switch({
  label,
  checked,
  onChange,
  disabled,
}: {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={`inline-flex cursor-pointer items-center gap-3 ${disabled ? "opacity-50" : ""}`}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={!!checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] ${
          checked ? "bg-accent" : "bg-surface-active"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] ${
            checked ? "translate-x-4 bg-accent-foreground" : "translate-x-0 bg-foreground-secondary"
          }`}
        />
      </button>
      {label ? <span className="text-sm text-foreground-secondary">{label}</span> : null}
    </label>
  );
}

export function Dialog({
  open,
  title,
  description,
  confirmLabel = "Potwierdź",
  cancelLabel = "Anuluj",
  danger,
  onConfirm,
  onCancel,
  children,
}: {
  open?: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  children?: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const focusables = () =>
      panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
          )
        : [];

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const first = focusables()[0];
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel?.();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const nodes = focusables();
      if (nodes.length === 0) return;
      const firstNode = nodes[0];
      const lastNode = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === firstNode) {
        e.preventDefault();
        lastNode.focus();
      } else if (!e.shiftKey && document.activeElement === lastNode) {
        e.preventDefault();
        firstNode.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Zamknij"
        className="absolute inset-0 bg-[var(--overlay-scrim)]"
        onClick={onCancel}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal
        aria-labelledby="dialog-title"
        className="relative w-full max-w-lg rounded-xl border border-border bg-surface-sunken p-6 shadow-modal"
      >
        <h2 id="dialog-title" className="font-display text-xl font-bold text-foreground">
          {title}
        </h2>
        {description ? <p className="mt-2 max-w-[70ch] text-sm leading-[var(--leading-body)] text-muted-strong">{description}</p> : null}
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProgressRing({
  value = 0,
  size = 64,
  stroke = 5,
  color = "var(--accent)",
  label,
  sub,
}: {
  value?: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
  sub?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));
  const offset = c * (1 - clamped);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-active)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      {(label || sub) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {label ? <span className="font-mono text-sm font-semibold tabular-nums text-foreground">{label}</span> : null}
          {sub ? <span className="text-xs font-semibold uppercase tracking-caps text-muted">{sub}</span> : null}
        </div>
      )}
    </div>
  );
}

/**
 * Wzorzec „akcja + Cofnij + auto-dismiss" dla destrukcyjnych akcji (loss aversion). Wykonaj akcję
 * natychmiast, potem wywołaj `showUndoToast(komunikat, cofnijAkcję)` — toast sam się chowa po 5s.
 */
export function useUndoToast() {
  const [toast, setToast] = useState<{ message: string; onUndo?: () => void } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast(null);
  }, []);

  const showUndoToast = useCallback((message: string, onUndo?: () => void) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast({ message, onUndo });
    timeoutRef.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const toastNode = toast ? (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-md border border-border-strong bg-surface px-4 py-3 text-sm shadow-raised"
    >
      <span className="text-foreground-secondary">{toast.message}</span>
      {toast.onUndo && (
        <button
          type="button"
          onClick={() => {
            toast.onUndo?.();
            dismiss();
          }}
          className="font-semibold text-accent hover:text-accent-strong focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
        >
          Cofnij
        </button>
      )}
    </div>
  ) : null;

  return { showUndoToast, dismissToast: dismiss, toastNode };
}

export function formatRest(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${min}min` : `${min}min ${rest}s`;
}
