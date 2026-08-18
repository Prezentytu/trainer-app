"use client";

import Link from "next/link";
import { PlanItem } from "@/lib/api";
import { Badge, formatRest } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { SidePanel } from "@/components/SidePanel";
import { ExerciseName } from "@/components/ExerciseName";
import { sanitizeSetScheme } from "@/lib/schemeSummary";
import { MEASURE_LABELS } from "@/lib/measure";
import { intensityText, prescribedSetLine, schemeLine } from "./summary";

export function PlanItemPanel({
  item,
  open,
  panelId,
  onClose,
}: {
  item: PlanItem | null;
  open: boolean;
  panelId: string;
  onClose: () => void;
}) {
  if (!open || !item) return null;

  const intensity = intensityText(item);

  return (
    <SidePanel
      open={open}
      panelId={panelId}
      title={<ExerciseName name={item.exerciseName} />}
      subtitle={schemeLine(item)}
      onClose={onClose}
    >
      <div className="flex flex-wrap gap-1.5">
        <Badge tone="neutral">{MEASURE_LABELS[item.measureType]}</Badge>
        {item.isWarmup ? <Badge tone="neutral">rozgrzewka</Badge> : null}
        {sanitizeSetScheme(item.setScheme) ? (
          <Badge tone="neutral">{sanitizeSetScheme(item.setScheme)}</Badge>
        ) : null}
      </div>

      <dl className="mt-4 grid gap-2 text-sm">
        {item.tempo ? (
          <div className="flex justify-between gap-3 border-b border-border py-2">
            <dt className="text-muted">Tempo</dt>
            <dd className="font-mono tabular-nums text-foreground">{item.tempo}</dd>
          </div>
        ) : null}
        {item.restBetweenSetsSeconds > 0 ? (
          <div className="flex justify-between gap-3 border-b border-border py-2">
            <dt className="text-muted">Przerwa</dt>
            <dd className="font-mono tabular-nums text-foreground">
              {formatRest(item.restBetweenSetsSeconds)}
            </dd>
          </div>
        ) : null}
        {intensity ? (
          <div className="flex justify-between gap-3 border-b border-border py-2">
            <dt className="text-muted">Intensywność</dt>
            <dd className="font-mono tabular-nums text-foreground">{intensity}</dd>
          </div>
        ) : null}
        {item.loadPercent != null && item.computedLoadKg == null && item.loadKg == null ? (
          <div className="flex justify-between gap-3 border-b border-border py-2">
            <dt className="text-muted">% obciążenia</dt>
            <dd className="font-mono tabular-nums text-foreground">{item.loadPercent}%</dd>
          </div>
        ) : null}
      </dl>

      {item.prescribedSets.length > 0 ? (
        <section className="mt-5">
          <h3 className="t-label text-muted">Serie</h3>
          <ul className="mt-2 divide-y divide-border border-y border-border">
            {item.prescribedSets.map((s) => {
              const { primary, note } = prescribedSetLine(s);
              return (
                <li key={s.id} className="py-2.5">
                  <p className="font-mono text-[13px] font-medium tabular-nums text-foreground">
                    {primary}
                  </p>
                  {note ? <p className="mt-0.5 text-[13px] text-muted-strong">{note}</p> : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {item.notes ? (
        <section className="mt-5">
          <h3 className="t-label text-muted">Notatka</h3>
          <p className="mt-2 break-words text-sm text-foreground-secondary">{item.notes}</p>
        </section>
      ) : null}

      <div className="mt-6">
        <Link
          href={`/exercises/${item.exerciseId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-foreground-secondary"
        >
          Otwórz ćwiczenie
          <Icon name="caret-right" size={14} decorative />
        </Link>
      </div>
    </SidePanel>
  );
}
