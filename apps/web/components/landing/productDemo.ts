"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

export const DEMO_SETS = [
  { n: "1", weight: "100,0", reps: "5", kg: 100, repsN: 5 },
  { n: "2", weight: "102,5", reps: "5", kg: 102.5, repsN: 5 },
  { n: "3", weight: "102,5", reps: "5", kg: 102.5, repsN: 5 },
  { n: "4", weight: "105,0", reps: "3", kg: 105, repsN: 3 },
] as const;

export const DEMO_REST_TOTAL = 90;
export const DEMO_STEP_MS = 1400;
export const DEMO_HOLD_MS = 2600;
export const DEMO_TICK_MS = 100;
export const DEMO_CYCLE = DEMO_SETS.length * DEMO_STEP_MS + DEMO_HOLD_MS;

export type HeroRow = {
  name: string;
  sub: string;
  value: string | null;
  tone: "pr" | "gain" | "loss" | "flat";
  mark: string | null;
  live?: boolean;
};

/** Lista Klientów w panelu hero — dane przykładowe, osiem wierszy jak w mocku. */
export const HERO_ROWS: HeroRow[] = [
  {
    name: "Michał Dąbrowski",
    sub: "Wyciskanie · seria w toku",
    value: null,
    tone: "flat",
    mark: null,
    live: true,
  },
  {
    name: "Marta Lewicka",
    sub: "Przysiad · ciężar w dół",
    value: "80,0 kg × 5",
    tone: "loss",
    mark: "−5 kg",
  },
  {
    name: "Ola Wiśniewska",
    sub: "Brak treningu od 14 dni",
    value: null,
    tone: "loss",
    mark: "14 dni",
  },
  {
    name: "Tomasz Zieliński",
    sub: "Przysiad · ciężar w górę",
    value: "102,5 kg × 5",
    tone: "gain",
    mark: "+2,5 kg",
  },
  {
    name: "Kasia Nowak",
    sub: "2 z 3 treningów",
    value: "62,5 kg × 8",
    tone: "gain",
    mark: "+2,5 kg",
  },
  {
    name: "Piotr Kaczmarek",
    sub: "Martwy ciąg · tydzień 4 planu",
    value: "140,0 kg × 5",
    tone: "gain",
    mark: "+5 kg",
  },
  {
    name: "Anna Zając",
    sub: "3 z 3 treningów · wiosłowanie",
    value: "55,0 kg × 10",
    tone: "pr",
    mark: "PR",
  },
  {
    name: "Jakub Szymański",
    sub: "1 z 3 treningów",
    value: "70,0 kg × 6",
    tone: "loss",
    mark: "−2,5 kg",
  },
];

function subscribeReducedMotion(onChange: () => void) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/** Zegar pary hero. Start dopiero gdy `active`. Reduced-motion = finisz. */
export function useProductDemo(active: boolean) {
  const reduceMotion = usePrefersReducedMotion();
  const [t, setT] = useState(0);

  useEffect(() => {
    if (reduceMotion || !active) return;
    const id = window.setInterval(() => {
      setT((prev) => (prev + DEMO_TICK_MS) % DEMO_CYCLE);
    }, DEMO_TICK_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, active]);

  const clock = reduceMotion
    ? DEMO_SETS.length * DEMO_STEP_MS
    : active
      ? t
      : 0;
  const completed = Math.min(DEMO_SETS.length, Math.floor(clock / DEMO_STEP_MS));

  return { clock, completed, reduceMotion };
}

export function heroLiveRow(completed: number): HeroRow {
  if (completed <= 0) {
    return {
      name: "Michał Dąbrowski",
      sub: "Wyciskanie · seria w toku",
      value: null,
      tone: "flat",
      mark: null,
      live: true,
    };
  }
  if (completed >= DEMO_SETS.length) {
    return {
      name: "Michał Dąbrowski",
      sub: "3 z 3 treningów · wyciskanie",
      value: "105,0 kg × 3",
      tone: "pr",
      mark: "PR",
      live: true,
    };
  }
  const set = DEMO_SETS[completed - 1];
  return {
    name: "Michał Dąbrowski",
    sub: `${completed} z 4 serii · wyciskanie`,
    value: `${set.weight} kg × ${set.reps}`,
    tone: "flat",
    mark: null,
    live: true,
  };
}

export function heroRowsFor(completed: number): HeroRow[] {
  return HERO_ROWS.map((row) => (row.live ? heroLiveRow(completed) : row));
}
