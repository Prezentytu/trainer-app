"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, EXERCISE_TYPE_LABELS, Plan, PlanDay, PlanItem } from "@/lib/api";
import { buildGroupLabels } from "@/lib/supersets";
import PlanBuilder from "@/components/plan-builder/PlanBuilder";
import { Badge, Button, Card, ErrorBanner, formatRest, PageHeader } from "@/components/ui";

function repsText(item: PlanItem): string {
  if (item.exerciseType === "time") {
    const base = item.repDurationSeconds ? `${item.repDurationSeconds}s` : "";
    const max = item.repDurationSecondsMax ? `–${item.repDurationSecondsMax}s` : "";
    return `${item.sets} × ${base}${max}`.trim();
  }
  if (item.exerciseType === "distance") {
    return `${item.sets} × ${item.distanceMeters ?? "?"} m`;
  }
  const reps = item.repsMax ? `${item.reps}–${item.repsMax}` : `${item.reps}`;
  return `${item.sets} × ${reps}`;
}

function PrescribedSets({ item }: { item: PlanItem }) {
  if (item.prescribedSets.length === 0) return null;
  return (
    <div className="mt-2 overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full min-w-[480px] text-left text-xs">
        <thead className="bg-zinc-900 text-[11px] uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-3 py-1.5">#</th>
            <th className="px-3 py-1.5">Rola</th>
            <th className="px-3 py-1.5">Powt./czas</th>
            <th className="px-3 py-1.5">Obciążenie</th>
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
                ? `${s.computedLoadKg} kg${s.loadPercent != null ? ` (${s.loadPercent}%)` : ""}`
                : s.loadPercent != null
                  ? `${s.loadPercent}%${s.percentOf === "1rm" ? " 1RM" : s.percentOf === "top" ? " od topu" : ""}`
                  : "—";
            return (
              <tr key={s.id} className="border-t border-zinc-800">
                <td className="px-3 py-1.5 text-zinc-500">{s.order}</td>
                <td className="px-3 py-1.5">{s.role ?? "—"}</td>
                <td className="px-3 py-1.5">{reps}</td>
                <td className="px-3 py-1.5 text-yellow-300">{load}</td>
                <td className="px-3 py-1.5 text-zinc-400">{s.note ?? ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DayView({ day }: { day: PlanDay }) {
  const labels = buildGroupLabels(day.items.map((i) => i.supersetGroup));
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="break-words font-semibold">{day.label}</span>
        {day.notes && <span className="break-words text-xs text-zinc-500">— {day.notes}</span>}
      </div>
      <div className="grid gap-2">
        {day.items.map((item, idx) => (
          <div
            key={item.id}
            className={`rounded-lg border bg-zinc-900/60 p-3 ${
              item.supersetGroup != null ? "border-yellow-400/40 border-l-[3px]" : "border-zinc-800"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-400/15 text-xs font-bold text-yellow-300">
                {idx + 1}
              </span>
              <span className="min-w-0 break-words font-medium">{item.exerciseName}</span>
              {labels[idx] && <Badge tone="yellow">{labels[idx]}</Badge>}
              <span className="shrink-0 text-xs text-zinc-500">{EXERCISE_TYPE_LABELS[item.exerciseType]}</span>
            </div>
            <p className="mt-1 text-sm text-zinc-400">
              {repsText(item)}
              {item.loadKg ? ` · ${item.loadKg} kg` : ""}
              {item.tempo ? ` · tempo ${item.tempo}` : ""}
              {item.targetRpe ? ` · RPE ${item.targetRpe}` : ""}
              {` · przerwa ${formatRest(item.restBetweenSetsSeconds)}`}
              {item.setScheme ? ` · ${item.setScheme}` : ""}
            </p>
            {item.notes && <p className="mt-1 text-xs text-zinc-500">Notatka: {item.notes}</p>}
            <PrescribedSets item={item} />
          </div>
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

  useEffect(() => {
    api.plans
      .get(planId)
      .then(setPlan)
      .catch((e: Error) => setError(e.message));
  }, [planId, editing]);

  if (!plan) {
    return (
      <div>
        <ErrorBanner message={error} />
        <p className="text-zinc-500">Ładowanie…</p>
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

      <div className="grid gap-6">
        {weeks.map((week) => (
          <Card key={week}>
            <h2 className="mb-3 font-semibold text-yellow-400">Tydzień {week}</h2>
            <div className="grid gap-3">
              {plan.days
                .filter((d) => d.weekNumber === week)
                .sort((a, b) => a.order - b.order)
                .map((day) => (
                  <DayView key={day.id} day={day} />
                ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
