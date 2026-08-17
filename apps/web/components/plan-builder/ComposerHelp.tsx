"use client";

import { Dialog } from "@/components/ui";

export const COMPOSER_PLACEHOLDER = "np. „przysiad 3x8”";

const STORAGE_KEY = "trainer-app:composer-help:v1";

export function markComposerHelpSeen() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, "closed");
}

export function ComposerHelpDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      title="Składnia wpisywania"
      onCancel={onClose}
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--r-field)] px-3 py-2 text-sm text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
          >
            Zamknij
          </button>
        </div>
      }
      className="max-w-md"
    >
      <div className="space-y-3 text-xs leading-relaxed text-muted">
        <section>
          <p className="mb-1 font-semibold uppercase tracking-[0.08em] text-muted-faint">Klawisze</p>
          <ul className="space-y-0.5 text-foreground-secondary">
            <li>
              <span className="font-semibold text-foreground">/</span> fokus pola wpisywania
            </li>
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
            <li>przysiad 5x52.5, 5x67.5, 5x77.5</li>
            <li>wyciskanie 8-10x60 · 5x85%</li>
            <li>przysiad 3x8-10 60kg 3110 rir2</li>
            <li>przysiad rampa 4 + bo 80% 47.5kg</li>
            <li>military rampa 2 + bo 80/60%</li>
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
            <span className="text-muted-strong">Rampa</span> = serie do docelowego xRM;{" "}
            <span className="font-mono text-muted">+ bo 80%</span> /{" "}
            <span className="font-mono text-muted">bo 80/60%</span> = backoff % topu (kolejne serie).{" "}
            <span className="font-mono text-muted">8x30kg, 8x35kg</span> = serie z różnym ciężarem
            (powtórzenia × kg). <span className="font-mono text-muted">60kg</span> /{" "}
            <span className="font-mono text-muted">75%</span> = ciężar. Numer{" "}
            <span className="font-mono text-muted">0</span> = część rozgrzewkowa.
          </p>
        </section>
      </div>
    </Dialog>
  );
}
