"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { foldDiacritics } from "@/lib/exerciseSearch";

export type PickerItem = {
  value: string;
  label: string;
  /** Prawa kolumna wiersza — liczba, data, jednostka. */
  meta?: string;
};

/**
 * Picker z wyszukiwaniem — zamiennik natywnego `<select>` dla list encji.
 * Po otwarciu można wpisać frazę zamiast scrollować. Klawiatura: ↑ ↓ Enter Esc.
 */
export function SearchPicker({
  items,
  value,
  onChange,
  ariaLabel,
  placeholder = "Wybierz…",
  searchPlaceholder = "Szukaj…",
  emptyHint = "Brak wyników.",
  size = "md",
}: {
  items: PickerItem[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyHint?: string;
  /** `sm` — wysokość pola (panel trenera), `md` — cel dotykowy 44px (portal). */
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  const selected = items.find((i) => i.value === value) ?? null;

  const filtered = useMemo(() => {
    const folded = foldDiacritics(query.trim());
    if (!folded) return items;
    const tokens = folded.split(/\s+/).filter(Boolean);
    return items.filter((i) => {
      const hay = foldDiacritics(`${i.label} ${i.meta ?? ""}`);
      return tokens.every((t) => hay.includes(t));
    });
  }, [items, query]);

  const active = filtered[activeIdx] ?? null;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    // Capture — Escape zamyka picker, zanim dosięgnie nadrzędnego Dialogu.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
      setQuery("");
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector(`[data-idx="${activeIdx}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, activeIdx]);

  const pick = (item: PickerItem) => {
    onChange(item.value);
    setOpen(false);
    setQuery("");
    triggerRef.current?.focus();
  };

  const heightClass =
    size === "sm" ? "h-[var(--h-field)]" : "min-h-[var(--tap-min)] py-2";

  return (
    <div ref={rootRef} className="relative">
      {open ? (
        <input
          autoFocus
          role="combobox"
          aria-expanded
          aria-controls={listboxId}
          aria-label={ariaLabel}
          aria-autocomplete="list"
          aria-activedescendant={active ? `${listboxId}-opt-${active.value}` : undefined}
          value={query}
          placeholder={selected?.label ?? searchPlaceholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIdx(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIdx((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIdx((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (active) pick(active);
            } else if (e.key === "Tab") {
              setOpen(false);
              setQuery("");
            }
          }}
          className={`w-full rounded-[var(--r-field)] border border-foreground bg-field px-2.5 text-base font-medium text-foreground shadow-[var(--focus-ring)] outline-none placeholder:font-normal placeholder:text-fg-ghost sm:text-sm ${heightClass}`}
        />
      ) : (
        <button
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-expanded={false}
          aria-controls={listboxId}
          aria-label={ariaLabel}
          onClick={() => {
            const idx = items.findIndex((i) => i.value === value);
            setActiveIdx(idx < 0 ? 0 : idx);
            setOpen(true);
          }}
          className={`flex w-full items-center gap-2 rounded-[var(--r-field)] border border-border-strong bg-field px-2.5 text-left transition-[border-color,box-shadow] duration-[var(--dur-fast)] hover:border-fg-ghost focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] ${heightClass}`}
        >
          <span
            className={`min-w-0 flex-1 break-words text-[15px] font-medium ${
              selected ? "text-foreground" : "text-fg-ghost"
            }`}
          >
            {selected?.label ?? placeholder}
          </span>
          {selected?.meta ? (
            <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
              {selected.meta}
            </span>
          ) : null}
          <Icon name="caret-down" size={16} className="shrink-0 text-muted" decorative />
        </button>
      )}

      {open ? (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto overscroll-contain rounded-[var(--r-card)] border border-border-strong bg-surface-raised py-1"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-muted">{emptyHint}</li>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = item.value === value;
              const isActive = idx === activeIdx;
              return (
                <li key={item.value} role="presentation" data-idx={idx}>
                  <button
                    type="button"
                    id={`${listboxId}-opt-${item.value}`}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={-1}
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => pick(item)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={`flex min-h-[var(--tap-min)] w-full items-center gap-2 px-3 py-2 text-left ${
                      isActive ? "bg-surface-hover" : ""
                    }`}
                  >
                    <span
                      className={`min-w-0 flex-1 break-words text-[15px] ${
                        isSelected ? "font-semibold text-foreground" : "text-foreground-secondary"
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.meta ? (
                      <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                        {item.meta}
                      </span>
                    ) : null}
                    {isSelected ? (
                      <Icon name="check" size={14} className="shrink-0 text-foreground" decorative />
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
