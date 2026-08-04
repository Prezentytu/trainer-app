"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, Plan, PlanDay, PlanItem, rirFromRpe } from "@/lib/api";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { formatMeasureCore, MEASURE_LABELS } from "@/lib/measure";
import { buildGroupLabels } from "@/lib/supersets";
import PlanBuilder from "@/components/plan-builder/PlanBuilder";
import { PlanDetailSkeleton } from "@/components/skeletons";
import { Badge, Button, Card, Dialog, ErrorBanner, formatRest, PageHeader, Pill } from "@/components/ui";

function repsText(item: PlanItem): string {
  return formatMeasureCore(item, undefined);
}

function intensityText(item: PlanItem): string | null {
  if (item.targetRir != null) return `RIR ${item.targetRir}`;
  if (item.targetRpe != null) return `RPE ${item.targetRpe} (≈ RIR ${rirFromRpe(item.targetRpe)})`;
  return null;
}

function prescribedSetMeta(s: PlanItem["prescribedSets"][number]) {
  const reps =
    s.durationSeconds != null
      ? `${s.durationSeconds}s`
      : s.repsMax
        ? `${s.reps}–${s.repsMax}`
        : s.reps != null
          ? `${s.reps}`
          : "—";
  const load =
    s.computedLoadKg != null
      ? `${s.computedLoadKg} kg`
      : s.loadPercent != null
        ? `${s.loadPercent}%${s.percentOf === "1rm" ? " 1RM" : s.percentOf === "top" ? " od topu" : ""}`
        : "—";
  return { reps, load };
}

function PrescribedSets({ item }: { item: PlanItem }) {
  if (item.prescribedSets.length === 0) return null;
  return (
    <>
      {/* Mobile: karty zamiast szerokiej tabeli */}
      <ul className="mt-2 space-y-2 sm:hidden">
        {item.prescribedSets.map((s) => {
          const { reps, load } = prescribedSetMeta(s);
          return (
            <li key={s.id} className="rounded-md border border-border bg-surface-sunken p-3 text-xs">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono tabular-nums text-muted">Seria {s.order}</span>
                {s.role ? <span className="text-muted-strong">{s.role}</span> : null}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                <span>
                  <span className="text-muted">Powt. </span>
                  <span className="font-mono font-semibold tabular-nums text-foreground">{reps}</span>
                </span>
                <span>
                  <span className="text-muted">Obc. </span>
                  <span className="font-mono font-semibold tabular-nums text-accent">{load}</span>
                </span>
                {s.targetRir != null ? (
                  <span>
                    <span className="text-muted">RIR </span>
                    <span className="font-mono tabular-nums text-foreground">{s.targetRir}</span>
                  </span>
                ) : null}
              </div>
              {s.note ? <p className="mt-1 text-muted-strong">{s.note}</p> : null}
            </li>
          );
        })}
      </ul>
      <div className="mt-2 hidden overflow-x-auto rounded-lg border border-border sm:block">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface text-xs uppercase tracking-caps text-muted">
            <tr>
              <th className="px-3 py-1.5">#</th>
              <th className="px-3 py-1.5">Rola</th>
              <th className="px-3 py-1.5">Powt./czas</th>
              <th className="px-3 py-1.5">Obciążenie</th>
              <th className="px-3 py-1.5">RIR</th>
              <th className="px-3 py-1.5">Notatka</th>
            </tr>
          </thead>
          <tbody>
            {item.prescribedSets.map((s) => {
              const { reps, load } = prescribedSetMeta(s);
              return (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-3 py-1.5 font-mono tabular-nums text-muted">{s.order}</td>
                  <td className="px-3 py-1.5 text-muted-strong">{s.role ?? "—"}</td>
                  <td className="px-3 py-1.5 font-mono text-sm font-semibold tabular-nums">{reps}</td>
                  <td className="px-3 py-1.5 font-mono text-sm font-semibold tabular-nums text-accent">
                    {load}
                    {s.computedLoadKg != null && s.loadPercent != null && (
                      <span className="ml-1 text-xs font-normal text-muted">({s.loadPercent}%)</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 font-mono tabular-nums text-muted-strong">{s.targetRir ?? "—"}</td>
                  <td className="px-3 py-1.5 text-muted-strong">{s.note ?? ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ItemView({
  item,
  label,
}: {
  item: PlanItem;
  label: string | null;
}) {
  return (
    <div
      className={`rounded-[10px] border bg-surface p-3 ${
        item.supersetGroup != null ? "border-accent/50 border-l-[3px] bg-accent-dim/40" : "border-border"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="h-10 w-10 shrink-0">
          <ExerciseThumb
            variant="square"
            youtubeId={item.demoYoutubeId}
            category={item.category}
            alt={item.exerciseName}
          />
        </div>
        <span className="min-w-0 break-words font-medium">{item.exerciseName}</span>
        {item.isWarmup && <Badge tone="neutral">rozgrzewka</Badge>}
        {label && <Badge tone="accent">{label}</Badge>}
        <span className="shrink-0 text-xs text-muted">{MEASURE_LABELS[item.measureType]}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono tabular-nums">
        <span className="text-sm font-semibold text-foreground">
          {item.sets} <span className="text-muted">×</span> {repsText(item)}
        </span>
        {item.loadKg != null && (
          <span className="text-sm font-semibold text-accent">{item.loadKg} kg</span>
        )}
        {intensityText(item) && <span className="text-sm font-semibold text-foreground">{intensityText(item)}</span>}
      </div>

      <p className="mt-1 font-mono text-xs tabular-nums text-muted">
        {item.tempo ? `tempo ${item.tempo} · ` : ""}
        {`przerwa ${formatRest(item.restBetweenSetsSeconds)}`}
        {item.setScheme ? ` · ${item.setScheme}` : ""}
      </p>
      {item.notes && <p className="mt-1 text-xs text-muted">Notatka: {item.notes}</p>}
      <PrescribedSets item={item} />
    </div>
  );
}

function DayView({ day }: { day: PlanDay }) {
  const labels = buildGroupLabels(day.items.map((i) => i.supersetGroup));
  const hasWarmup = day.items.some((i) => i.isWarmup);
  const firstMainIdx = day.items.findIndex((i) => !i.isWarmup);
  return (
    <div className="rounded-lg border border-border bg-surface-sunken/60 p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="break-words font-semibold">{day.label}</span>
        {day.notes && <span className="break-words text-xs text-muted">— {day.notes}</span>}
      </div>
      <div className="grid gap-2">
        {day.items.map((item, idx) => {
          const showWarmupCaption = hasWarmup && item.isWarmup && (idx === 0 || !day.items[idx - 1]?.isWarmup);
          const showMainCaption = hasWarmup && idx === firstMainIdx;
          return (
            <div key={item.id} className="grid gap-2">
              {showWarmupCaption ? (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-faint">
                    Rozgrzewka
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>
              ) : null}
              {showMainCaption ? (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-faint">
                    Część główna
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>
              ) : null}
              <ItemView item={item} label={labels[idx]} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PlanDetailsPage() {
  const params = useParams<{ id: string }>();
  const planId = Number(params.id);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [activeWeek, setActiveWeek] = useState<number | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    api.plans
      .get(planId)
      .then((p) => {
        setPlan(p);
        setActiveWeek((prev) => prev ?? [...new Set(p.days.map((d) => d.weekNumber))].sort((a, b) => a - b)[0] ?? 1);
      })
      .catch((e: Error) => setError(e.message));
  }, [planId, editing]);

  if (!plan) {
    return (
      <div>
        <ErrorBanner message={error} />
        {error ? null : <PlanDetailSkeleton />}
      </div>
    );
  }

  if (editing) {
    return (
      <div>
        <PageHeader
          title={`Edycja: ${plan.name}`}
          action={
            <Button variant="ghost" onClick={() => setCancelOpen(true)}>
              Anuluj edycję
            </Button>
          }
        />
        <PlanBuilder plan={plan} />
        <Dialog
          open={cancelOpen}
          title="Opuścić edycję?"
          description="Niezapisane zmiany w tym widoku mogą zostać utracone. Autosave zapisuje istniejący plan w tle — upewnij się, że widzisz status „Zapisano”, albo wyjdź świadomie."
          confirmLabel="Opuść edycję"
          cancelLabel="Zostań"
          danger
          onConfirm={() => {
            setCancelOpen(false);
            setEditing(false);
          }}
          onCancel={() => setCancelOpen(false)}
        />
      </div>
    );
  }

  const weeks = [...new Set(plan.days.map((d) => d.weekNumber))].sort((a, b) => a - b);
  const currentWeek = activeWeek ?? weeks[0] ?? 1;
  const currentIndex = Math.max(weeks.indexOf(currentWeek), 0);

  return (
    <div>
      <PageHeader
        title={plan.name}
        subtitle={plan.description ?? undefined}
        action={<Button onClick={() => setEditing(true)}>Edytuj plan</Button>}
      />
      <ErrorBanner message={error} />

      <div className="mb-4 flex items-center gap-2">
        <Badge tone={plan.isTemplate ? "accent" : "neutral"}>
          {plan.isTemplate ? "Wielokrotnego użytku" : "plan klienta"}
        </Badge>
        <Badge tone="neutral">
          <span className="font-mono tabular-nums">
            {plan.weeksCount} tyg. · {plan.daysCount} dni · {plan.exerciseCount} ćwiczeń
          </span>
        </Badge>
        {plan.assignedCount > 0 && (
          <Badge tone="positive">{plan.assignedCount} aktywne przypisania</Badge>
        )}
      </div>

      {weeks.length > 1 && (
        <Card className="mb-4">
          <div className="mb-3 text-xs text-muted">
            Tydzień {currentIndex + 1} z {weeks.length}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {weeks.map((week) => (
              <Pill key={week} active={week === currentWeek} onClick={() => setActiveWeek(week)}>
                Tydzień {week}
              </Pill>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(18rem,1fr))]">
        {plan.days
          .filter((d) => d.weekNumber === currentWeek)
          .sort((a, b) => a.order - b.order)
          .map((day) => (
            <DayView key={day.id} day={day} />
          ))}
      </div>
    </div>
  );
}
