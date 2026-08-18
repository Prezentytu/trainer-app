import { LiveSession, NeedsReview } from "@/lib/api";
import { polishSetCount } from "@/lib/plural";

export function liveSetsLabel(live: LiveSession): string {
  return `${live.doneSets}/${live.totalSets} serii`;
}

export function needsReviewLabel(review: NeedsReview): string {
  const n = review.belowTargetCount;
  if (n >= 1) return `▼ ${polishSetCount(n)} poniżej celu`;
  return "▼ Serie poniżej celu";
}

export function presenceHref(
  clientId: number,
  liveSession?: LiveSession | null,
  needsReview?: NeedsReview | null,
): string | null {
  if (liveSession) return `/clients/${clientId}/sessions/${liveSession.sessionId}`;
  if (needsReview) return `/clients/${clientId}/sessions/${needsReview.sessionId}`;
  return null;
}

export function ClientPresenceLabel({
  liveSession,
  needsReview,
  idle,
}: {
  liveSession?: LiveSession | null;
  needsReview?: NeedsReview | null;
  idle: string;
}) {
  if (liveSession) {
    return <span className="text-sm text-gain">▲ Trenuje teraz · {liveSetsLabel(liveSession)}</span>;
  }
  if (needsReview) {
    return <span className="text-sm text-loss">{needsReviewLabel(needsReview)}</span>;
  }
  return <span className="text-sm">{idle}</span>;
}
