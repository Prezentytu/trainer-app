"use client";

import { useEffect, useRef, useState } from "react";
import { IconButton } from "@/components/ui";

export function DuplicateDayButton({
  weeks,
  currentWeek,
  onDuplicate,
  title = "Duplikuj dzień",
}: {
  weeks: number[];
  currentWeek: number;
  onDuplicate: (targetWeek?: number) => void;
  title?: string;
}) {
  const others = weeks.filter((w) => w !== currentWeek);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (others.length === 0) {
    return (
      <IconButton title={title} size="sm" onClick={() => onDuplicate()}>
        ⎘
      </IconButton>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <IconButton
        title={title}
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        ⎘
      </IconButton>
      {open ? (
        <div className="absolute right-0 z-30 mt-1 min-w-44 rounded-[10px] border border-border-strong bg-surface py-1">
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-hover"
            onClick={() => {
              onDuplicate();
              setOpen(false);
            }}
          >
            W tym tygodniu
          </button>
          {others.map((w) => (
            <button
              key={w}
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-hover"
              onClick={() => {
                onDuplicate(w);
                setOpen(false);
              }}
            >
              Do tygodnia {w}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}