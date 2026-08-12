"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ClientNoteGroup, ClientNoteItem } from "@/lib/api";
import { formatDayShort, relativeDayLabel } from "@/lib/dates";
import { Badge, Card, EmptyState } from "@/components/ui";
import { formatKg } from "@/lib/plates";

function setContext(item: ClientNoteItem): string {
  const parts: string[] = [`Seria ${item.setNumber}`];
  if (item.weightKg != null && item.reps != null) {
    parts.push(`${formatKg(item.weightKg)} kg × ${item.reps}`);
  } else if (item.weightKg != null) {
    parts.push(`${formatKg(item.weightKg)} kg`);
  } else if (item.reps != null) {
    parts.push(`${item.reps} powt.`);
  }
  if (item.rpe != null) parts.push(`RPE ${item.rpe}`);
  return parts.join(" · ");
}

function groupNotesByExercise(items: ClientNoteItem[]) {
  const order: number[] = [];
  const map = new Map<number, { name: string; items: ClientNoteItem[] }>();
  for (const item of items) {
    let bucket = map.get(item.exerciseId);
    if (!bucket) {
      bucket = { name: item.exerciseName, items: [] };
      map.set(item.exerciseId, bucket);
      order.push(item.exerciseId);
    }
    bucket.items.push(item);
  }
  return order.map((id) => ({ exerciseId: id, ...map.get(id)! }));
}

export function ClientNotesTab({
  clientId,
  groups,
}: {
  clientId: number;
  groups: ClientNoteGroup[];
}) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">Notatki klienta</h2>
        <p className="text-xs text-fg-ghost">Z serii, ćwiczeń i wiadomości po treningu</p>
      </div>

      {groups.length === 0 ? (
        <EmptyState title="Klient nie zostawił jeszcze notatek" action={null}>
          Notatki pojawią się tutaj, gdy klient doda je przy serii, przy ćwiczeniu albo jako wiadomość po
          zakończeniu treningu w portalu.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-4">
          {groups.map((group) => {
            const byExercise = groupNotesByExercise(group.items);
            const title =
              group.dayLabel || group.planName || `Trening ${formatDayShort(group.performedOn)}`;
            return (
              <li key={group.sessionId}>
                <Card>
                  <Link
                    href={`/clients/${clientId}/sessions/${group.sessionId}`}
                    className="mb-3 flex flex-wrap items-baseline justify-between gap-2 rounded-[8px] outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground/40"
                  >
                    <div>
                      <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
                      <p className="mt-0.5 font-mono text-xs tabular-nums text-fg-ghost">
                        {formatDayShort(group.performedOn)} · {relativeDayLabel(group.performedOn)}
                        {group.planName && group.dayLabel ? ` · ${group.planName}` : ""}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-muted">
                      Zobacz sesję
                      <Icon name="caret-right" size={12} decorative />
                    </span>
                  </Link>

                  {group.sessionNote ? (
                    <div className="mb-3 rounded-[10px] border border-border bg-surface-raised/60 px-3 py-2.5">
                      <div className="mb-1 flex items-center gap-1.5">
                        <Badge tone="neutral">
                          <Icon name="chat" size={11} decorative />
                          Po treningu
                        </Badge>
                      </div>
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground-secondary">
                        {group.sessionNote}
                      </p>
                    </div>
                  ) : null}

                  {byExercise.length > 0 ? (
                    <ul className="flex flex-col gap-3">
                      {byExercise.map((ex) => (
                        <li key={ex.exerciseId} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                          <p className="mb-2 text-sm font-medium text-foreground">{ex.name}</p>
                          <ul className="flex flex-col gap-2">
                            {ex.items.map((item, idx) => (
                              <li key={`${item.exerciseId}-${item.setNumber ?? "ex"}-${idx}`}>
                                {item.setNumber != null ? (
                                  <p className="mb-0.5 font-mono text-xs tabular-nums text-fg-ghost">
                                    {setContext(item)}
                                  </p>
                                ) : (
                                  <p className="mb-0.5 font-mono text-xs uppercase tracking-caps text-fg-ghost">
                                    Ćwiczenie
                                  </p>
                                )}
                                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground-secondary">
                                  {item.note}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function countClientNotes(groups: ClientNoteGroup[]): number {
  return groups.reduce(
    (sum, g) => sum + g.items.length + (g.sessionNote ? 1 : 0),
    0,
  );
}
