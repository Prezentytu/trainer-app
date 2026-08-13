/** Cache liczników nawigacji + nazwy trenera — sessionStorage + subskrypcja same-tab. */

import { api, type NavCounts } from "@/lib/api";

const STORAGE_KEY = "rm-nav-shell";
const CHANGE_EVENT = "rm-nav-shell";

export type NavShellState = {
  clients: number | null;
  plans: number | null;
  trainerName: string;
  inboxUnread: number | null;
};

const DEFAULT: NavShellState = {
  clients: null,
  plans: null,
  trainerName: "Trener",
  inboxUnread: null,
};

let memory: NavShellState = DEFAULT;
let inflight: Promise<void> | null = null;

function isSame(a: NavShellState, b: NavShellState): boolean {
  return (
    a.clients === b.clients &&
    a.plans === b.plans &&
    a.trainerName === b.trainerName &&
    a.inboxUnread === b.inboxUnread
  );
}

function readStorage(): NavShellState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return memory;
    const parsed = JSON.parse(raw) as Partial<NavShellState>;
    const next: NavShellState = {
      clients: typeof parsed.clients === "number" ? parsed.clients : null,
      plans: typeof parsed.plans === "number" ? parsed.plans : null,
      trainerName:
        typeof parsed.trainerName === "string" && parsed.trainerName.trim()
          ? parsed.trainerName
          : "Trener",
      inboxUnread: typeof parsed.inboxUnread === "number" ? parsed.inboxUnread : null,
    };
    // useSyncExternalStore porównuje referencje — bez tego każdy odczyt to nowy obiekt i pętla renderów.
    return isSame(memory, next) ? memory : next;
  } catch {
    return memory;
  }
}

function write(next: NavShellState): void {
  if (isSame(memory, next)) return;
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
        inboxUnread: typeof counts.inboxUnread === "number" ? counts.inboxUnread : 0,
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
