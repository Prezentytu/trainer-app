"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, EXERCISE_TYPE_LABELS, Plan, PlanDay, PlanItem, rirFromRpe } from "@/lib/api";
import { buildGroupLabels } from "@/lib/supersets";
import PlanBuilder from "@/components/plan-builder/PlanBuilder";
import { Badge, Button, Card, ErrorBanner, formatRest, PageHeader, Pill } from "@/components/ui";

function repsText(item: PlanItem): string {
  if (item.exerciseType === "time") {
    const base = item.repDurationSeconds ? `${item.repDurationSeconds}s` : "";
    const max = item.repDurationSecondsMax ? `–${item.repDurationSecondsMax}s` : "";
    return `${base}${max}`.trim() || "—";
  }
  if (item.exerciseType === "distance") {
    return `${item.distanceMeters ?? "?"} m`;
  }
  return item.repsMax ? `${item.reps}–${item.repsMax}` : `${item.reps}`;
}

function intensityText(item: PlanItem): string | null {
  if (item.targetRir != null) return `RIR ${item.targetRir}`;
  if (item.targetRpe != null) return `RPE ${item.targetRpe} (≈ RIR ${rirFromRpe(item.targetRpe)})`;
  return null;
}

function PrescribedSets({ item }: { item: PlanItem }) {
  if (item.prescribedSets.length === 0) return null;
  return (
    <div className="mt-2 overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[480px] text-left text-xs">
        <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
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
            return (
              <tr key={s.id} className="border-t border-border">
                <td className="px-3 py-1.5 text-muted">{s.order}</td>
                <td className="px-3 py-1.5 text-muted-strong">{s.role ?? "—"}</td>
                <td className="px-3 py-1.5 text-sm font-semibold">{reps}</td>
                <td className="px-3 py-1.5 text-sm font-semibold text-accent">
                  {load}
                  {s.computedLoadKg != null && s.loadPercent != null && (
                    <span className="ml-1 text-xs font-normal text-muted">({s.loadPercent}%)</span>
                  )}
                </td>
                <td className="px-3 py-1.5 text-muted-strong">{s.targetRir ?? "—"}</td>
                <td className="px-3 py-1.5 text-muted-strong">{s.note ?? ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ItemView({ item, label }: { item: PlanItem; label: string | null }) {
  return (
    <div
      className={`rounded-lg border bg-surface/60 p-3 ${
        item.supersetGroup != null ? "border-accent/40 border-l-[3px]" : "border-border"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 break-words font-medium">{item.exerciseName}</span>
        {label && <Badge tone="yellow">{label}</Badge>}
        <span className="shrink-0 text-xs text-muted">{EXERCISE_TYPE_LABELS[item.exerciseType]}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-sm font-semibold text-foreground">
          {item.sets} <span className="text-muted">×</span> {repsText(item)}
        </span>
        {item.loadKg != null && (
          <span className="text-sm font-semibold text-accent">{item.loadKg} kg</span>
        )}
        {intensityText(item) && <span className="text-sm font-semibold text-foreground">{intensityText(item)}</span>}
      </div>

      <p className="mt-1 text-xs text-muted">
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
  return (
    <div className="rounded-lg border border-border bg-surface-sunken/60 p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="break-words font-semibold">{day.label}</span>
        {day.notes && <span className="break-words text-xs text-muted">— {day.notes}</span>}
      </div>
      <div className="grid gap-2">
        {day.items.map((item, idx) => (
          <ItemView key={item.id} item={item} label={labels[idx]} />
        ))}
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
        <p className="text-muted">Ładowanie…</p>
      </div>
    );
  }

  if (editing) {
    return (
      <div>
        <PageHeader
          title={`Edycja: ${plan.name}`}
          action={<Button variant="ghost" onClick={() => setEditing(false)}>Anuluj edycję</Button>}
        />
        <PlanBuilder plan={plan} />
      </div>
    );
  }

  const weeks = [...new Set(plan.days.map((d) => d.weekNumber))].sort((a, b) => a - b);
  const currentWeek = activeWeek ?? weeks[0] ?? 1;
  const currentIndex = Math.max(weeks.indexOf(currentWeek), 0);
  const progressPercent = weeks.length > 1 ? Math.round((currentIndex / (weeks.length - 1)) * 100) : 100;

  return (
    <div>
      <PageHeader
        title={plan.name}
        subtitle={plan.description ?? undefined}
        action={<Button onClick={() => setEditing(true)}>Edytuj plan</Button>}
      />
      <ErrorBanner message={error} />

      <div className="mb-4 flex items-center gap-2">
        <Badge tone={plan.isTemplate ? "yellow" : "neutral"}>
          {plan.isTemplate ? "szablon" : "plan klienta"}
        </Badge>
        <Badge tone="neutral">
          {plan.weeksCount} tyg. · {plan.daysCount} dni · {plan.exerciseCount} ćwiczeń
        </Badge>
        {plan.assignedCount > 0 && <Badge tone="green">{plan.assignedCount} aktywne przypisania</Badge>}
      </div>

      {weeks.length > 1 && (
        <Card className="mb-4">
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span>
              Tydzień {currentIndex + 1} z {weeks.length}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface-hover">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {weeks.map((week, idx) => (
              <Pill key={week} active={week === currentWeek} onClick={() => setActiveWeek(week)}>
                {idx < currentIndex ? "✓ " : ""}Tydzień {week}
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
