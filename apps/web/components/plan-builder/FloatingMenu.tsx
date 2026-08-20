"use client";

import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Placement = { top: number; left: number; openUp: boolean };

const MARGIN = 8;
const ESTIMATED_HEIGHT = 200;

/**
 * Menu w portalu do `body`. Rodzic z `overflow-x-auto` ani krawędź panelu nie mogą go uciąć,
 * więc menu roli ostatniej serii zawsze zostaje w widoku — samo wybiera dół albo górę.
 */
export function FloatingMenu({
  trigger,
  children,
  align = "left",
  minWidth = "8.5rem",
  label,
}: {
  trigger: (api: { open: boolean; toggle: () => void; ref: React.Ref<HTMLButtonElement> }) => ReactNode;
  children: ReactNode | ((api: { close: () => void }) => ReactNode);
  align?: "left" | "right";
  minWidth?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Po zamknięciu fokus wraca na przycisk, który menu otworzył (klawiatura nie gubi miejsca).
  useEffect(() => {
    if (!open) return;
    const anchor = triggerRef.current;
    return () => {
      anchor?.focus();
    };
  }, [open]);

  const measure = useCallback(() => {
    const anchor = triggerRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const height = menuRef.current?.offsetHeight ?? ESTIMATED_HEIGHT;
    const width = menuRef.current?.offsetWidth ?? rect.width;
    const spaceBelow = window.innerHeight - rect.bottom - MARGIN;
    const openUp = spaceBelow < height && rect.top - MARGIN > spaceBelow;
    const rawLeft = align === "right" ? rect.right - width : rect.left;
    const left = Math.min(Math.max(MARGIN, rawLeft), Math.max(MARGIN, window.innerWidth - width - MARGIN));
    const top = openUp
      ? Math.max(MARGIN, rect.top - height - 4)
      : Math.min(rect.bottom + 4, Math.max(MARGIN, window.innerHeight - height - MARGIN));
    setPlacement({ top, left, openUp });
  }, [align]);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
  }, [open, measure]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      close();
    };
    const onReflow = () => measure();
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [open, close, measure]);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  return (
    <>
      {trigger({ open, toggle, ref: triggerRef })}
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              aria-label={label}
              style={{
                position: "fixed",
                top: placement?.top ?? -9999,
                left: placement?.left ?? -9999,
                minWidth,
                visibility: placement ? "visible" : "hidden",
              }}
              className="z-[100] max-h-[min(60vh,20rem)] overflow-y-auto overscroll-contain rounded-[10px] border border-border-strong bg-surface p-1 shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
            >
              {typeof children === "function" ? children({ close }) : children}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function FloatingMenuItem({
  children,
  onClick,
  active,
  danger,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full whitespace-nowrap rounded-[8px] px-2.5 py-1.5 text-left text-sm transition-colors ${
        danger
          ? "text-danger hover:bg-danger-bg"
          : active
            ? "bg-surface-active text-foreground"
            : "text-foreground-secondary hover:bg-surface-hover"
      }`}
    >
      {children}
    </button>
  );
}

export function FloatingMenuLabel({ children }: { children: ReactNode }) {
  return <p className="t-label px-2.5 pb-1 pt-1.5 text-muted-faint">{children}</p>;
}

export function FloatingMenuSeparator() {
  return <div className="my-1 h-px bg-border" aria-hidden />;
}
