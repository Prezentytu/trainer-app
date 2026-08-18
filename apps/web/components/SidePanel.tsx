"use client";

import { ReactNode, useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/Icon";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useIsMobileMd(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return isMobile;
}

/**
 * Panel boczny (side peek): desktop = split w flow (380px, bez scrimu),
 * mobile = bottom sheet ze scrimem i focus trapem. Esc zamyka.
 */
export function SidePanel({
  open,
  panelId,
  title,
  subtitle,
  headerRight,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  panelId: string;
  title: ReactNode;
  subtitle?: ReactNode;
  headerRight?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const isMobile = useIsMobileMd();

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    const focusables = () =>
      panel ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];

    if (isMobile) {
      focusables()[0]?.focus();
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (!isMobile || e.key !== "Tab" || !panel) return;
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
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose, isMobile, title]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none md:static md:z-auto md:pointer-events-auto md:contents"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Zamknij"
        className="absolute inset-0 bg-[var(--scrim)] pointer-events-auto md:hidden"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-modal={isMobile ? true : undefined}
        aria-labelledby={titleId}
        className={[
          "relative flex w-full max-h-[85dvh] flex-col border border-border-strong bg-surface pointer-events-auto",
          "rounded-t-[var(--r-sheet)] border-b-0",
          "motion-safe:transition-[transform,opacity] motion-safe:duration-[var(--dur-med)] motion-safe:ease-[var(--ease-out)]",
          "md:h-full md:max-h-none md:w-[clamp(380px,30vw,480px)] md:shrink-0 md:rounded-none md:border-y-0 md:border-r-0 md:border-l",
          "md:static md:pointer-events-auto",
        ].join(" ")}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="t-heading break-words text-[18px]">
              {title}
            </h2>
            {subtitle ? (
              <div className="mt-1 min-w-0 font-mono text-[12px] tabular-nums text-muted">
                {subtitle}
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {headerRight}
            <button
              type="button"
              onClick={onClose}
              aria-label="Zamknij szczegóły"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-field)] text-muted transition-colors duration-[var(--dur-fast)] hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)] active:scale-[0.98]"
            >
              <Icon name="close" size={18} decorative />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 border-t border-border px-4 py-3">{footer}</div>
        ) : null}
      </aside>
    </div>
  );
}
