import type { SessionDetail } from "@/lib/api";

/** Lokalna kopia draftu sesji — przetrwa minimalizację / kill karty. */

export type SessionDraftScope = string; // portal token albo "trainer"

type StoredDraft = {
  sessionId: number;
  savedAt: string;
  draft: SessionDetail;
};

function key(scope: SessionDraftScope, sessionId: number): string {
  return `wa-session-draft:${scope}:${sessionId}`;
}

export function saveLocalDraft(
  scope: SessionDraftScope,
  sessionId: number,
  draft: SessionDetail,
): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredDraft = {
      sessionId,
      savedAt: new Date().toISOString(),
      draft,
    };
    localStorage.setItem(key(scope, sessionId), JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function readLocalDraft(
  scope: SessionDraftScope,
  sessionId: number,
): SessionDetail | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key(scope, sessionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft;
    if (parsed.sessionId !== sessionId || !parsed.draft) return null;
    return parsed.draft;
  } catch {
    return null;
  }
}

export function clearLocalDraft(scope: SessionDraftScope, sessionId: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key(scope, sessionId));
  } catch {
    /* ignore */
  }
}
