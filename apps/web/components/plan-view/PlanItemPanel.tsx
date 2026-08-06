"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { PlanItem } from "@/lib/api";
import { Badge, formatRest } from "@/components/ui";
import { Icon } from "@/components/Icon";
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
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = () =>
      panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
            ),
          )
        : [];

    const first = focusables()[0];
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const nodes = focusables();
      if (nodes.length === 0) return;
      const firstNode = nodes[0];
      const lastNode = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === firstNode) {
        e.preventDefault();
        lastNode.focus();
      } else if (!e.shiftKey && document.activeElement === lastNode) {
        e.preventDefault();
        firstNode.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose, item?.id]);

  if (!open || !item) return null;

  const intensity = intensityText(item);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none md:items-stretch md:justify-end"
      role="presentation"
    >
      {/* Mobile scrim — desktop: panel równoległy (board zostaje klikalny). */}
      <button
        type="button"
        aria-label="Zamknij"
        className="absolute inset-0 bg-[var(--scrim)] pointer-events-auto md:hidden"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={[
          "relative flex w-full max-h-[85vh] flex-col border border-border-strong bg-surface pointer-events-auto",
          "rounded-t-[var(--r-sheet)] border-b-0 md:h-full md:max-h-none md:w-[380px] md:rounded-none md:border-y-0 md:border-r-0 md:border-l",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3.5">
          <div className="min-w-0">
            <h2 id={titleId} className="t-heading break-words text-[18px]">
              {item.exerciseName}
            </h2>
            <p className="mt-1 font-mono text-[12px] tabular-nums text-muted">{schemeLine(item)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij szczegóły"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-field)] text-muted transition-colors duration-[var(--dur-fast)] hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)] active:scale-[0.98]"
          >
            <Icon name="close" size={18} decorative />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="neutral">{MEASURE_LABELS[item.measureType]}</Badge>
            {item.isWarmup ? <Badge tone="neutral">rozgrzewka</Badge> : null}
            {item.setScheme ? <Badge tone="neutral">{item.setScheme}</Badge> : null}
          </div>

          <dl className="mt-4 grid gap-2 text-sm">
            {item.tempo ? (
              <div className="flex justify-between gap-3 border-b border-border py-2">
                <dt className="text-muted">Tempo</dt>
                <dd className="font-mono tabular-nums text-foreground">{item.tempo}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-3 border-b border-border py-2">
              <dt className="text-muted">Przerwa</dt>
              <dd className="font-mono tabular-nums text-foreground">
                {formatRest(item.restBetweenSetsSeconds)}
              </dd>
            </div>
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
              className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline underline-offset-2 hover:text-foreground-secondary"
            >
              Otwórz ćwiczenie
              <Icon name="caret-right" size={14} decorative />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
