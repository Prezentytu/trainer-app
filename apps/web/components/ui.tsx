"use client";

import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import {
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { SESSION_EXPIRED_MESSAGE, clerkEnabled } from "@/lib/api";
import { Icon } from "@/components/Icon";

const subscribeNoop = () => () => {};
const snapshotClient = () => true;
const snapshotServer = () => false;

const FOCUS = "focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]";
const PRESS = "active:[transform:var(--press)]";

/** true dopiero po hydracji — getServerSnapshot=false (SSR i pierwszy pass klienta = to samo). */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribeNoop, snapshotClient, snapshotServer);
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div
      className={`mb-8 flex flex-col gap-3 sm:flex-row sm:justify-between ${
        subtitle ? "sm:items-start" : "sm:items-center"
      }`}
    >
      <div className="min-w-0">
        <h1 className="t-title break-words">{title}</h1>
        {subtitle ? <p className="t-small mt-1 max-w-[70ch] break-words">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Kompaktowy pasek chrome (tożsamość + akcje) — bez PageHeader na ekranach boardu. */
export function Toolbar({
  left,
  right,
  className = "",
}: {
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-11 shrink-0 items-center justify-between gap-3 border-b border-border py-2 ${className}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">{left}</div>
      {right ? <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">{right}</div> : null}
    </div>
  );
}

export function OverflowMenu({
  children,
  label = "Więcej",
  align = "right",
  onOpenChange,
}: {
  children: ReactNode | ((api: { close: () => void }) => ReactNode);
  label?: string;
  align?: "left" | "right";
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const setMenuOpen = useCallback(
    (next: boolean) => {
      setOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );
  const close = useCallback(() => setMenuOpen(false), [setMenuOpen]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <div className="relative" ref={ref}>
      <IconButton title={label} onClick={() => setMenuOpen(!open)} active={open}>
        <span className="font-mono text-base leading-none tracking-widest" aria-hidden>
          ···
        </span>
      </IconButton>
      {open ? (
        <div
          role="menu"
          className={`absolute top-full z-40 mt-1.5 min-w-[15rem] max-w-[min(20rem,calc(100vw-2rem))] rounded-[var(--r-card)] border border-border-strong bg-surface p-1 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {typeof children === "function" ? children({ close }) : children}
        </div>
      ) : null}
    </div>
  );
}

export function OverflowMenuItem({
  children,
  onClick,
  href,
  danger,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  const className = `flex w-full items-center rounded-[var(--r-field)] px-3 py-2 text-left text-sm transition-colors ${FOCUS} ${
    danger
      ? "text-danger hover:bg-danger-bg"
      : "text-foreground-secondary hover:bg-surface-raised hover:text-foreground"
  } ${disabled ? "pointer-events-none opacity-45" : ""}`;

  if (href) {
    return (
      <a role="menuitem" href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  );
}

/** Placeholder ładowania — kształt 1:1 z docelowym layoutem. Opóźnienie widoczności: klasa `skeleton-defer` na rootcie skeletonu. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`skeleton-pulse rounded-md bg-surface-active ${className}`}
    />
  );
}

type CardIconTone = "neutral" | "pr" | "danger";

const CARD_ICON_TONE: Record<CardIconTone, string> = {
  neutral: "bg-surface-active text-muted-strong",
  pr: "border border-pr-border bg-pr-dim text-pr",
  danger: "bg-danger-bg text-danger",
};

export function Card({
  children,
  className = "",
  eyebrow,
  eyebrowMark,
  title,
  meta,
  icon,
  iconTone = "neutral",
  headerAction,
  interactive,
  selected,
  pending,
  flat,
  onClick,
}: {
  children?: ReactNode;
  className?: string;
  eyebrow?: string;
  /** Prefiks „///” przed eyebrow (Acid micro-label). */
  eyebrowMark?: boolean;
  title?: string;
  meta?: string;
  /** Kafelek ikony po lewej nagłówka. */
  icon?: ReactNode;
  iconTone?: CardIconTone;
  /** Akcja / meta po prawej stronie nagłówka. */
  headerAction?: ReactNode;
  interactive?: boolean;
  selected?: boolean;
  /** Dashed border — stan pending / next. */
  pending?: boolean;
  /** Bez fill — mocniejsza krawędź. */
  flat?: boolean;
  onClick?: () => void;
}) {
  const classNames = [
    "rounded-[var(--r-card)] border p-3.5 text-left transition-[background-color,border-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] sm:p-4",
    flat ? "border-border-strong bg-transparent" : "border-border bg-surface",
    selected
      ? "border-foreground bg-surface-raised"
      : pending
        ? "border-dashed border-border-strong"
        : "",
    interactive || onClick
      ? `hover:bg-surface-raised hover:border-border-strong ${FOCUS} ${PRESS}`
      : "",
    className,
  ].join(" ");
  const hasHeader = Boolean(eyebrow || title || meta || icon || headerAction);
  const header = hasHeader ? (
    <div className="mb-3 flex items-start gap-3">
      {icon ? (
        <span
          aria-hidden
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${CARD_ICON_TONE[iconTone]}`}
        >
          {icon}
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <div className="eyebrow mb-1">{eyebrowMark ? `/// ${eyebrow}` : eyebrow}</div>
        ) : null}
        {title ? <div className="t-heading break-words">{title}</div> : null}
        {meta ? <div className="t-small mt-0.5 break-words text-fg-faint">{meta}</div> : null}
      </div>
      {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
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
  /** @deprecated Glow retired — kept for API compat, no visual effect. */
  glow: _glow,
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
  /** @deprecated Hierarchy rule: no CTA blooms. Ignored. */
  glow?: boolean;
  className?: string;
}) {
  void _glow;
  const styles: Record<ButtonVariant, string> = {
    primary: "bg-invert-bg text-invert-fg hover:bg-fg-muted",
    secondary: "border border-border-strong bg-surface text-foreground hover:bg-surface-raised hover:border-fg-ghost",
    ghost: "bg-transparent text-foreground underline decoration-transparent underline-offset-[3px] hover:decoration-foreground",
    danger: "bg-danger text-invert-fg hover:bg-loss",
  };
  const sizes: Record<ButtonSize, string> = {
    sm: "h-[var(--h-control-sm)] px-3 text-[13px]",
    md: "h-[var(--h-control)] px-4 text-sm font-semibold",
    lg: "h-[46px] px-[22px] text-[15px] font-semibold",
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
        // loading: pełna nieprzezroczystość — spinner komunikuje stan; opacity tylko przy zwykłym disabled
        "inline-flex items-center justify-center gap-2 rounded-[var(--r-pill)] transition-[background-color,transform,color,border-color] duration-[var(--dur-fast)] ease-[var(--ease-out)] disabled:pointer-events-none",
        busy ? "" : "disabled:opacity-45",
        FOCUS,
        PRESS,
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
      <span className="t-label flex flex-wrap items-baseline gap-1.5">
        {label}
        {hint ? <span className="text-xs font-normal normal-case tracking-normal text-muted">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

/** 16px na mobile (iOS nie auto-zoomuje); sm:text-sm na większych ekranach. */
export const inputClass =
  "h-[var(--h-field)] w-full rounded-[var(--r-field)] border border-border-strong bg-field px-2.5 text-base font-medium text-foreground outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)] placeholder:font-normal placeholder:text-fg-ghost focus:border-foreground focus:shadow-[var(--focus-ring)] sm:text-sm";

/** Szukajka z lupą i czyszczeniem — wspólna dla list (Klienci, Plany, Ćwiczenia). */
export function SearchInput({
  value,
  onChange,
  placeholder,
  "aria-label": ariaLabel,
  inputRef,
  shortcutHint,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label": string;
  inputRef?: RefObject<HTMLInputElement | null>;
  shortcutHint?: string;
}) {
  return (
    <div className="relative min-w-0 w-full">
      <Icon
        name="search"
        size={16}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-faint"
        decorative
      />
      <input
        ref={inputRef}
        type="search"
        className={`${inputClass} pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
      />
      {value ? (
        <button
          type="button"
          aria-label="Wyczyść wyszukiwanie"
          className={`absolute top-1/2 right-2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-surface-hover hover:text-foreground ${FOCUS}`}
          onClick={() => onChange("")}
        >
          <Icon name="close" size={16} decorative />
        </button>
      ) : shortcutHint ? (
        <kbd
          className="pointer-events-none absolute top-1/2 right-2.5 hidden h-6 min-w-6 -translate-y-1/2 items-center justify-center rounded-[var(--r-field)] border border-border px-1.5 font-mono text-xs text-fg-ghost md:inline-flex"
          aria-hidden
        >
          {shortcutHint}
        </kbd>
      ) : null}
    </div>
  );
}

/** Input liczbowy — mono + tabular, bez „drgania” layoutu przy zmianie cyfr. 16px na mobile (iOS nie zoomuje). */
export const inputNumericClass =
  "h-[var(--h-field)] w-full rounded-[var(--r-field)] border border-border-strong bg-field px-2.5 text-center font-mono text-base font-bold tabular-nums text-foreground outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)] placeholder:font-normal placeholder:text-fg-ghost focus:border-foreground focus:shadow-[var(--focus-ring)] sm:text-sm";

/** Textarea — bez sztywnego h-field (inputClass zmiażdżyłby treść do jednej linii). */
export const textareaClass =
  "min-h-20 w-full rounded-[var(--r-field)] border border-border-strong bg-field px-2.5 py-2 text-base font-medium text-foreground outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)] placeholder:font-normal placeholder:text-fg-ghost focus:border-foreground focus:shadow-[var(--focus-ring)] sm:text-sm";

function ClerkSignInAgainButton() {
  const { signOut } = useClerk();
  return (
    <Button size="sm" variant="secondary" onClick={() => void signOut({ redirectUrl: "/sign-in" })}>
      Zaloguj się ponownie
    </Button>
  );
}

function SignInAgainAction() {
  if (clerkEnabled) return <ClerkSignInAgainButton />;
  return (
    <Link href="/sign-in">
      <Button size="sm" variant="secondary">
        Zaloguj się ponownie
      </Button>
    </Link>
  );
}

export function ErrorBanner({
  message,
  action,
}: {
  message: string | null;
  action?: ReactNode;
}) {
  if (!message) return null;
  const resolvedAction =
    action ?? (message === SESSION_EXPIRED_MESSAGE ? <SignInAgainAction /> : null);
  return (
    <div
      role="alert"
      className="mb-4 flex flex-col gap-3 rounded-[var(--r-field)] border border-danger-border bg-danger-bg px-4 py-2 text-sm leading-[var(--leading-body)] text-danger sm:flex-row sm:items-center sm:justify-between"
    >
      <span className="min-w-0">{message}</span>
      {resolvedAction ? <div className="shrink-0">{resolvedAction}</div> : null}
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
  /** CTA wymagane — jawne `null` tylko dla stanów informacyjnych bez akcji. */
  action: ReactNode | null;
}) {
  return (
    <div className="rounded-[var(--r-card)] border border-border px-6 py-10 text-center">
      {title ? <div className="t-heading">{title}</div> : null}
      <div className={`t-small mx-auto max-w-[40ch] ${title ? "mt-2" : ""}`}>
        {children}
      </div>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export type BadgeTone =
  | "neutral"
  | "yellow"
  | "green"
  | "red"
  | "pr"
  | "accent"
  | "positive"
  | "danger"
  | "gain"
  | "loss";

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: BadgeTone }) {
  const styles: Record<BadgeTone, string> = {
    neutral: "bg-surface-raised text-fg-faint",
    yellow: "bg-surface-raised text-foreground",
    accent: "bg-invert-bg text-invert-fg",
    green: "bg-gain-quiet text-gain",
    positive: "bg-gain-quiet text-gain",
    gain: "bg-gain-quiet text-gain",
    red: "bg-danger-bg text-danger",
    danger: "bg-danger-bg text-danger",
    loss: "bg-loss-quiet text-loss",
    pr: "bg-pr-dim text-pr",
  };
  return (
    <span
      className={`inline-flex h-5 items-center gap-1 rounded-[var(--r-pill)] px-1.5 font-mono text-xs font-semibold tabular-nums ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

const MARKER_GLYPH: Record<"pr" | "gain" | "loss" | "flat", string> = {
  pr: "★",
  gain: "▲",
  loss: "▼",
  flat: "–",
};

function signGlyph(text: ReactNode): string | null {
  const s = String(text ?? "").trim();
  if (s.startsWith("+")) return "▲";
  if (s.startsWith("-") || s.startsWith("−")) return "▼";
  return null;
}

/** Data marker — PR / gain / loss z glifem (nie tylko kolorem). */
export function Marker({
  tone = "flat",
  children,
  glyph = true,
}: {
  tone?: "pr" | "gain" | "loss" | "flat";
  children: ReactNode;
  glyph?: boolean;
}) {
  const mark = signGlyph(children) || MARKER_GLYPH[tone];
  const styles = {
    pr: "bg-pr-dim text-pr",
    gain: "bg-gain-quiet text-gain",
    loss: "bg-loss-quiet text-loss",
    flat: "bg-surface-raised text-fg-faint",
  }[tone];
  return (
    <span
      className={`inline-flex h-5 items-center gap-1 rounded-[var(--r-pill)] px-1.5 font-mono text-xs font-semibold tabular-nums ${styles}`}
    >
      {glyph && mark ? (
        <span className="text-xs leading-none" aria-hidden>
          {mark}
        </span>
      ) : null}
      {children}
    </span>
  );
}

/** Hairline list row — title, mono sub, optional right. */
export function ListRow({
  title,
  sub,
  right,
  leading,
  onClick,
  className = "",
}: {
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  leading?: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={[
        "flex w-full min-h-[var(--tap-min)] items-center gap-3 border-b border-border px-2 py-2.5 text-left last:border-b-0",
        onClick
          ? `cursor-pointer rounded-[var(--r-field)] hover:bg-surface ${FOCUS}`
          : "cursor-default",
        className,
      ].join(" ")}
    >
      {leading ? <span className="inline-flex shrink-0">{leading}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-foreground">{title}</span>
        {sub ? <span className="mt-0.5 block font-mono text-xs text-fg-faint">{sub}</span> : null}
      </span>
      {right ? <span className="shrink-0">{right}</span> : null}
    </Tag>
  );
}

export function Pill({
  children,
  active,
  onClick,
  /** Cichy stan aktywny — w mono = invert jak active. */
  quiet,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  quiet?: boolean;
}) {
  void quiet;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active ?? false}
      className={`inline-flex h-[var(--h-pill)] shrink-0 items-center rounded-[var(--r-pill)] border px-2.5 font-mono text-xs font-medium uppercase tracking-[var(--track-label)] transition-[background-color,transform,color,border-color] duration-[var(--dur-fast)] ${FOCUS} ${PRESS} ${
        active
          ? "border-invert-bg bg-invert-bg text-invert-fg"
          : "border-border-strong bg-surface text-fg-faint hover:border-fg-ghost hover:bg-surface-raised hover:text-foreground"
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
      ? "bg-surface-raised text-foreground"
      : "bg-transparent text-fg-muted hover:bg-surface-raised hover:text-foreground",
    outline: "border border-border-strong bg-surface text-fg-muted hover:bg-surface-raised",
    danger: "bg-transparent text-fg-muted hover:bg-danger-bg hover:text-danger",
  }[variant];
  const dims = {
    xs: "h-[var(--h-control-sm)] w-[var(--h-control-sm)] text-xs",
    sm: "h-[var(--h-control)] w-[var(--h-control)] text-sm",
    md: "h-[var(--h-control)] w-[var(--h-control)] text-sm",
    lg: "h-[46px] w-[46px] text-base",
  }[size];
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={`inline-flex ${dims} shrink-0 items-center justify-center rounded-[var(--r-pill)] transition-[background-color,transform,color] duration-[var(--dur-fast)] ease-[var(--ease-out)] disabled:opacity-45 ${FOCUS} ${PRESS} ${styles}`}
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
      className={`inline-flex ${dims} shrink-0 items-center justify-center rounded-full bg-surface-raised font-semibold text-fg-muted`}
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
  const deltaTone =
    delta?.trim().startsWith("+") ? "text-gain" : delta?.trim().startsWith("-") || delta?.trim().startsWith("−") ? "text-loss" : "text-fg-faint";
  const glyph = signGlyph(delta);
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex min-h-[25px] items-baseline gap-1">
        <span
          className={`t-num ${valueClassName ?? "text-foreground"} ${
            size === "lg" ? "text-[34px] leading-none" : "text-[25px] leading-none"
          }`}
        >
          {value}
        </span>
        {unit ? <span className="font-mono text-xs font-medium text-fg-faint">{unit}</span> : null}
      </div>
      <div className="t-label">{label}</div>
      {showDelta ? (
        <div className={`mt-0.5 flex min-h-[1rem] items-center gap-1 font-mono text-xs font-medium tabular-nums ${deltaTone}`}>
          {delta && glyph ? (
            <span className="text-xs leading-none" aria-hidden>
              {glyph}
            </span>
          ) : null}
          {delta ?? "\u00a0"}
        </div>
      ) : null}
    </div>
  );
}

export function Tag({
  children,
  onRemove,
  invert = false,
}: {
  children: ReactNode;
  onRemove?: () => void;
  /** Invert fill — ta sama wysokość co zwykły Tag (chip 28px). */
  invert?: boolean;
}) {
  return (
    <span
      className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs ${
        invert
          ? "border-invert-bg bg-invert-bg text-invert-fg"
          : "border-border-strong bg-surface text-fg-muted"
      }`}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Usuń"
          className={`-my-1.5 -mr-2 inline-flex h-10 w-10 items-center justify-center text-fg-ghost hover:text-foreground ${FOCUS}`}
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
    <div
      className="-mx-1 overflow-x-auto overscroll-x-contain border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
    >
      <div className="flex min-w-max gap-1 px-1">
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
              className={`-mb-px inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors duration-[var(--dur-fast)] ${FOCUS} ${
                active
                  ? "border-foreground text-foreground"
                  : "border-transparent text-fg-faint hover:text-fg-muted"
              }`}
            >
              {tabLabel(item)}
              {count != null ? (
                <span className="font-mono text-xs tabular-nums text-fg-ghost">{count}</span>
              ) : null}
            </button>
          );
        })}
      </div>
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
      className={`inline-flex gap-0.5 rounded-[var(--r-field)] border border-border-strong bg-surface p-0.5 ${
        full ? "h-full min-h-[34px] w-full" : ""
      }`}
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
            className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 font-mono text-[12px] font-medium uppercase tracking-[var(--track-label)] transition-colors duration-[var(--dur-fast)] sm:px-3 ${FOCUS} ${
              full ? "h-full min-w-0 flex-1" : "h-[30px]"
            } ${
              active
                ? "bg-invert-bg font-bold text-invert-fg"
                : "text-fg-faint hover:bg-surface-raised hover:text-foreground"
            }`}
          >
            <span className="whitespace-nowrap">{tabLabel(item)}</span>
            {tabCount(item) != null ? (
              <span className="shrink-0 font-mono text-[12px] tabular-nums opacity-70">
                {tabCount(item)}
              </span>
            ) : null}
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
      className={`${
        label ? "flex w-full min-h-11 min-w-0" : "inline-flex"
      } cursor-pointer items-center gap-3 ${disabled ? "opacity-45" : ""}`}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={!!checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative h-6 w-10 shrink-0 rounded-[var(--r-pill)] border transition-colors duration-[var(--dur-fast)] ${FOCUS} ${
          checked
            ? "border-invert-bg bg-invert-bg hover:bg-fg-muted"
            : "border-border-strong bg-surface-raised hover:border-fg-ghost hover:bg-surface-active"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] ${
            checked ? "translate-x-4 bg-invert-fg" : "translate-x-0 bg-fg-muted"
          }`}
        >
          {checked ? (
            <span
              aria-hidden
              className="mb-px block h-[6px] w-[8px] -rotate-45 border-b-2 border-l-2 border-invert-bg"
            />
          ) : null}
        </span>
      </button>
      {label ? <span className="t-body min-w-0 flex-1 break-words text-[15px]">{label}</span> : null}
    </label>
  );
}

/**
 * Opóźniony unmount pod exit transition (--dur-med).
 * Mount przy otwarciu — adjust podczas renderu (bez setState w body effect).
 * Entered po rAF; unmount po timeout / reduced-motion w callbacku.
 */
export function usePresence(open = false) {
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setMounted(true);
      setEntered(false);
    } else {
      setEntered(false);
    }
  }

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
      return () => cancelAnimationFrame(id);
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const id = requestAnimationFrame(() => setMounted(false));
      return () => cancelAnimationFrame(id);
    }
    const t = window.setTimeout(() => setMounted(false), 220);
    return () => window.clearTimeout(t);
  }, [open]);

  return { mounted, entered };
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useFocusTrap(
  active: boolean,
  panelRef: RefObject<HTMLElement | null>,
  onEscape?: () => void,
) {
  useEffect(() => {
    if (!active) return;
    const panel = panelRef.current;
    const focusables = () =>
      panel ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const first = focusables()[0];
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onEscape?.();
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
  }, [active, panelRef, onEscape]);
}

const OVERLAY_SCRIM =
  "absolute inset-0 bg-[var(--scrim)] transition-opacity duration-[var(--dur-med)] motion-reduce:duration-[var(--dur-fast)]";
const OVERLAY_EASE = (entered: boolean) =>
  entered ? "ease-[var(--ease-out)]" : "ease-[var(--ease-in)]";

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
  /** `null` ukrywa stopkę z Anuluj/Potwierdź (np. podgląd wideo z własnymi akcjami). */
  footer,
  /** Nadpisanie klas panelu (domyślnie max-w-sm). */
  className = "max-w-sm",
  /** Blokuje przycisk potwierdzenia + pokazuje spinner (Anuluj zostaje aktywny). */
  busy,
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
  footer?: ReactNode | null;
  className?: string;
  busy?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const { mounted, entered } = usePresence(!!open);
  useFocusTrap(!!open && mounted, panelRef, onCancel);

  if (!mounted) return null;
  const showDefaultFooter = footer === undefined;
  const ease = OVERLAY_EASE(entered);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Scrim bez onClick — dialog zamyka tylko Anuluj / Escape / potwierdzenie. */}
      <div
        className={`${OVERLAY_SCRIM} ${ease} ${entered ? "opacity-100" : "opacity-0"}`}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal
        aria-labelledby={titleId}
        className={`relative w-full rounded-[var(--r-sheet)] border border-border-strong bg-surface p-[18px] transition-[opacity,transform] duration-[var(--dur-med)] motion-reduce:duration-[var(--dur-fast)] motion-reduce:transform-none ${ease} ${
          entered
            ? "opacity-100 motion-safe:translate-y-0 motion-safe:scale-100"
            : "opacity-0 motion-safe:translate-y-1 motion-safe:scale-[0.98]"
        } ${className}`}
      >
        <h2 id={titleId} className="t-heading">
          {title}
        </h2>
        {description ? <p className="t-small mt-2 max-w-[70ch]">{description}</p> : null}
        {children ? <div className="mt-4">{children}</div> : null}
        {showDefaultFooter ? (
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button
              variant={danger ? "danger" : "primary"}
              onClick={onConfirm}
              loading={busy}
              disabled={busy}
            >
              {confirmLabel}
            </Button>
          </div>
        ) : footer ? (
          <div className="mt-5">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

/** Bottom sheet (default) lub wyśrodkowany panel. */
export function Sheet({
  open,
  onClose,
  title,
  center,
  children,
  footer,
}: {
  open?: boolean;
  onClose?: () => void;
  title?: string;
  center?: boolean;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const { mounted, entered } = usePresence(!!open);
  useFocusTrap(!!open && mounted, panelRef, onClose);

  if (!mounted) return null;
  const ease = OVERLAY_EASE(entered);
  const panelMotion = center
    ? entered
      ? "opacity-100 motion-safe:translate-y-0 motion-safe:scale-100"
      : "opacity-0 motion-safe:translate-y-1 motion-safe:scale-[0.98]"
    : entered
      ? "opacity-100 motion-safe:translate-y-0"
      : "opacity-0 motion-safe:translate-y-3";

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center ${
        center ? "items-center p-4" : "items-end"
      }`}
    >
      <button
        type="button"
        aria-label="Zamknij"
        className={`${OVERLAY_SCRIM} ${ease} ${entered ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal
        aria-labelledby={title ? titleId : undefined}
        className={`relative w-full border border-border-strong bg-surface p-[18px] transition-[opacity,transform] duration-[var(--dur-med)] motion-reduce:duration-[var(--dur-fast)] motion-reduce:transform-none ${ease} ${panelMotion} ${
          center
            ? "max-w-sm rounded-[var(--r-sheet)]"
            : "max-w-[430px] rounded-t-[var(--r-sheet)] border-b-0"
        }`}
      >
        {title ? (
          <h2 id={titleId} className="t-heading mb-3">
            {title}
          </h2>
        ) : null}
        {children}
        {footer ? <div className="mt-5 flex gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}

export function ProgressRing({
  value = 0,
  size = 64,
  stroke = 5,
  color = "currentColor",
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
    <div
      className="relative inline-flex items-center justify-center text-foreground"
      style={{ width: size, height: size }}
    >
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
          {label ? <span className="t-num text-sm">{label}</span> : null}
          {sub ? <span className="t-label">{sub}</span> : null}
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
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-50 flex items-center gap-3 rounded-[var(--r-field)] border border-border-strong bg-surface px-4 py-3 text-sm sm:bottom-4"
    >
      <span className="text-fg-muted">{toast.message}</span>
      {toast.onUndo && (
        <button
          type="button"
          onClick={() => {
            toast.onUndo?.();
            dismiss();
          }}
          className={`font-medium text-foreground underline underline-offset-[3px] decoration-fg-ghost hover:decoration-foreground ${FOCUS}`}
        >
          Cofnij
        </button>
      )}
    </div>
  ) : null;

  return { showUndoToast, dismissToast: dismiss, toastNode };
}

export function formatRest(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const min = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${min} min` : `${min} min ${rest} s`;
}
