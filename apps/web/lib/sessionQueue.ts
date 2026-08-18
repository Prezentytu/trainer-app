/** Kolejka zapisów offline (portal + panel trenera). */

export type QueuedSessionWrite = {
  id: string;
  /** Token portalu albo "trainer". */
  scope: string;
  sessionId: number;
  body: unknown;
  complete?: boolean;
  createdAt: string;
};

const KEY = "wa-session-queue";
const LEGACY_PORTAL_KEY = "wa-portal-queue";
const listeners = new Set<() => void>();

function emitQueue() {
  for (const fn of listeners) fn();
}

export function subscribeSessionQueue(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function sessionQueueCount(scope?: string): number {
  const all = readSessionQueue();
  if (!scope) return all.length;
  return all.filter((q) => q.scope === scope).length;
}

function migrateLegacyPortalQueue(): void {
  try {
    const legacy = localStorage.getItem(LEGACY_PORTAL_KEY);
    if (!legacy) return;
    const items = JSON.parse(legacy) as {
      id: string;
      token: string;
      sessionId: number;
      body: unknown;
      complete?: boolean;
      createdAt: string;
    }[];
    const existing = (() => {
      try {
        const raw = localStorage.getItem(KEY);
        return raw ? (JSON.parse(raw) as QueuedSessionWrite[]) : [];
      } catch {
        return [];
      }
    })();
    const mapped: QueuedSessionWrite[] = items.map((q) => ({
      id: q.id,
      scope: q.token,
      sessionId: q.sessionId,
      body: q.body,
      complete: q.complete,
      createdAt: q.createdAt,
    }));
    localStorage.setItem(KEY, JSON.stringify([...existing, ...mapped]));
    localStorage.removeItem(LEGACY_PORTAL_KEY);
  } catch {
    /* ignore */
  }
}

export function readSessionQueue(): QueuedSessionWrite[] {
  if (typeof window === "undefined") return [];
  try {
    migrateLegacyPortalQueue();
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedSessionWrite[];
  } catch {
    return [];
  }
}

/** Dedupe po scope+sessionId — ostatni stan wygrywa. */
export function enqueueSessionWrite(item: Omit<QueuedSessionWrite, "id" | "createdAt">) {
  const queue = readSessionQueue().filter(
    (q) => !(q.scope === item.scope && q.sessionId === item.sessionId),
  );
  queue.push({
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem(KEY, JSON.stringify(queue));
  emitQueue();
}

export function clearSessionQueueItem(id: string) {
  const next = readSessionQueue().filter((q) => q.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
  emitQueue();
}

/** Kompatybilność wsteczna z portalQueue. */
export type QueuedPortalWrite = {
  id: string;
  token: string;
  sessionId: number;
  body: unknown;
  complete?: boolean;
  createdAt: string;
};

export function readPortalQueue(): QueuedPortalWrite[] {
  return readSessionQueue()
    .filter((q) => q.scope !== "trainer")
    .map((q) => ({
      id: q.id,
      token: q.scope,
      sessionId: q.sessionId,
      body: q.body,
      complete: q.complete,
      createdAt: q.createdAt,
    }));
}

export function enqueuePortalWrite(item: Omit<QueuedPortalWrite, "id" | "createdAt">) {
  enqueueSessionWrite({
    scope: item.token,
    sessionId: item.sessionId,
    body: item.body,
    complete: item.complete,
  });
}

export function clearPortalQueueItem(id: string) {
  clearSessionQueueItem(id);
}
