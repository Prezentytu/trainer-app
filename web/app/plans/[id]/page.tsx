"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, Plan } from "@/lib/api";
import PlanBuilder from "@/components/PlanBuilder";
import { Badge, Button, Card, ErrorBanner, formatRest, PageHeader } from "@/components/ui";

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
        {plan.assignedCount > 0 && <Badge tone="green">{plan.assignedCount} aktywne przypisania</Badge>}
      </div>

      <div className="grid gap-3">
        {plan.items.map((item, idx) => (
          <Card key={item.id} className="flex items-start gap-4">
            <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-400/15 text-sm font-bold text-yellow-300">
              {idx + 1}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{item.exerciseName}</span>
                <Badge tone={item.exerciseType === "time" ? "yellow" : "neutral"}>
                  {item.exerciseType === "time" ? "czas" : "powtórzenia"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-zinc-400">
                {item.sets} serie × {item.reps}
                {item.exerciseType === "time" && item.repDurationSeconds ? ` × ${item.repDurationSeconds}s` : " powt."}
                {item.loadKg ? ` · ${item.loadKg} kg` : ""}
                {" · przerwa między seriami "}{formatRest(item.restBetweenSetsSeconds)}
                {" · po ćwiczeniu "}{formatRest(item.restAfterExerciseSeconds)}
              </p>
              {item.notes && <p className="mt-1 text-xs text-zinc-500">Notatka: {item.notes}</p>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
