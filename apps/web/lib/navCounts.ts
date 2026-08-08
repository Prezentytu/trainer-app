/** Cache liczników nawigacji + nazwy trenera — sessionStorage + subskrypcja same-tab. */

import { api, type NavCounts } from "@/lib/api";

const STORAGE_KEY = "rm-nav-shell";
const CHANGE_EVENT = "rm-nav-shell";

export type NavShellState = {
  clients: number | null;
  plans: number | null;
  trainerName: string;
};

const DEFAULT: NavShellState = {
  clients: null,
  plans: null,
  trainerName: "Trener",
};

let memory: NavShellState = DEFAULT;
let inflight: Promise<void> | null = null;

function readStorage(): NavShellState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return memory;
    const parsed = JSON.parse(raw) as Partial<NavShellState>;
    return {
      clients: typeof parsed.clients === "number" ? parsed.clients : null,
      plans: typeof parsed.plans === "number" ? parsed.plans : null,
      trainerName:
        typeof parsed.trainerName === "string" && parsed.trainerName.trim()
          ? parsed.trainerName
          : "Trener",
    };
  } catch {
    return memory;
  }
}

function write(next: NavShellState): void {
  memory = next;
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function getNavShell(): NavShellState {
  if (typeof window === "undefined") return DEFAULT;
  // Synchronizuj memory z storage przy pierwszym odczycie po reloadzie.
  memory = readStorage();
  return memory;
}

export function subscribeNavShell(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** Odświeża liczniki i nazwę trenera z API (deduplikacja równoległych wywołań). */
export function refreshNavCounts(): Promise<void> {
  if (inflight) return inflight;
  inflight = Promise.all([api.counts(), api.me()])
    .then(([counts, me]: [NavCounts, { name: string }]) => {
      const name = me.name?.trim();
      write({
        clients: counts.clients,
        plans: counts.plans,
        trainerName: name || getNavShell().trainerName,
      });
    })
    .catch(() => {
      /* cicho — stare cache zostaje */
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}
