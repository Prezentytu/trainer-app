"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "trainer-app:composer-help:v1";

function loadHelpOpen(): boolean {
  if (typeof window === "undefined") return true;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "closed") return false;
  if (stored === "open") return true;
  return true; // pierwsze wejście — panel otwarty
}

export function markComposerHelpSeen() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, "closed");
}

export function ComposerHelp({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, open ? "open" : "closed");
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        title="Ściągałka klawiszy i formatów"
        aria-expanded={open}
        aria-label="Pokaż ściągawkę"
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          open
            ? "border-accent-border bg-accent-dim text-accent-strong"
            : "border-border text-muted hover:border-border-strong hover:text-foreground-secondary"
        }`}
      >
        ?
      </button>
      {open && (
        <div className="absolute bottom-full right-0 z-40 mb-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-border-strong bg-surface p-4 shadow-raised">
          <p className="font-display text-sm font-semibold text-foreground">Ściągałka</p>
          <div className="mt-3 space-y-3 text-xs leading-relaxed text-muted">
            <section>
              <p className="mb-1 font-semibold uppercase tracking-[0.08em] text-muted-faint">Klawisze</p>
              <ul className="space-y-0.5 text-foreground-secondary">
                <li>
                  <span className="font-semibold text-foreground">↵</span> dodaj
                </li>
                <li>
                  <span className="font-semibold text-foreground">⇧↵</span> superseria z ostatnim
                </li>
                <li>
                  <span className="font-semibold text-foreground">↑↓</span> wybór z listy
                </li>
                <li>
                  <span className="font-semibold text-foreground">⇥</span> szczegóły nowego ćwiczenia
                </li>
                <li>
                  <span className="font-semibold text-foreground">esc</span> wyczyść ·{" "}
                  <span className="font-semibold text-foreground">?</span> ta ściągawka
                </li>
              </ul>
            </section>
            <section>
              <p className="mb-1 font-semibold uppercase tracking-[0.08em] text-muted-faint">Format wpisu</p>
              <ul className="space-y-0.5 font-mono tabular-nums text-foreground-secondary">
                <li>przysiad 3x8</li>
                <li>przysiad 3x8-10 3110 rir2</li>
                <li>deska 3x30s · 3x1:30 · 3x2min</li>
                <li>farmer walk 3x15m</li>
                <li>1b nazwa · 0 nazwa (rozgrzewka)</li>
              </ul>
            </section>
            <section>
              <p className="mb-1 font-semibold uppercase tracking-[0.08em] text-muted-faint">Słownik</p>
              <p>
                <span className="font-mono text-muted">Tempo 3110</span> = 3s w dół · 1s pauza na dole · 1s w
                górę · 0s na górze · <span className="font-mono text-muted">X</span> = dynamicznie.{" "}
                <span className="text-muted-strong">RIR</span> = powtórzenia w zapasie.{" "}
                <span className="text-muted-strong">Rampa</span> = kolejne serie rosnącym ciężarem do
                docelowego xRM. Numer <span className="font-mono text-muted">0</span> = część rozgrzewkowa.
              </p>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

export function useComposerHelpOpen() {
  const [open, setOpen] = useState(loadHelpOpen);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next ? "open" : "closed");
    }
  };

  return { open, onOpenChange };
}
