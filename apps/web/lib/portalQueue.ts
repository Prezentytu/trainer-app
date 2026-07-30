/** Kolejka zapisów offline dla PWA klienta (localStorage). */

export type QueuedPortalWrite = {
  id: string;
  token: string;
  sessionId: number;
  body: unknown;
  complete?: boolean;
  createdAt: string;
};

const KEY = "wa-portal-queue";

export function readPortalQueue(): QueuedPortalWrite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedPortalWrite[];
  } catch {
    return [];
  }
}

/** Dedupe po sessionId — ostatni stan wygrywa. */
export function enqueuePortalWrite(item: Omit<QueuedPortalWrite, "id" | "createdAt">) {
  const queue = readPortalQueue().filter(
    (q) => !(q.token === item.token && q.sessionId === item.sessionId),
  );
  queue.push({
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem(KEY, JSON.stringify(queue));
}

export function clearPortalQueueItem(id: string) {
  const next = readPortalQueue().filter((q) => q.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
}
