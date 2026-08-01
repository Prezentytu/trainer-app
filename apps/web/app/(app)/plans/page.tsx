"use client";

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, PlanSummary } from "@/lib/api";
import { Badge, Button, Card, EmptyState, ErrorBanner, PageHeader } from "@/components/ui";
import { PlanListSkeleton } from "@/components/skeletons";

type AssignmentSummary = { planId: number; clientName: string };

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    Promise.all([api.plans.list(), api.assignments.list()])
      .then(([p, a]) => {
        setPlans(p);
        setAssignments(a.filter((x) => x.status === "active"));
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const clientNamesByPlan = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const a of assignments) {
      const list = map.get(a.planId) ?? [];
      list.push(a.clientName);
      map.set(a.planId, list);
    }
    return map;
  }, [assignments]);

  const handleDuplicate = async (plan: PlanSummary, asClientPlan: boolean) => {
    try {
      const created = await api.plans.duplicate(plan.id, {
        name: asClientPlan ? `${plan.name} — plan klienta` : null,
        isTemplate: asClientPlan ? false : null,
      });
      router.push(`/plans/${created.id}`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (plan: PlanSummary) => {
    if (!confirm(`Usunąć plan „${plan.name}” wraz z przypisaniami?`)) return;
    try {
      await api.plans.remove(plan.id);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const templates = plans.filter((p) => p.isTemplate);
  const clientPlans = plans.filter((p) => !p.isTemplate);

  return (
    <div>
      <PageHeader
        title="Plany treningowe"
        subtitle="Formuły wielokrotnego użytku i plany gotowe do przypisania"
        action={
          <Link href="/plans/new">
            <Button>+ Nowy plan</Button>
          </Link>
        }
      />
      <ErrorBanner message={error} />

      {loading ? <PlanListSkeleton /> : null}

      <Section title="Formuły" count={templates.length}>
        {!loading && templates.length === 0 ? (
          <EmptyState
            title="Brak formuł"
            action={
              <Link href="/plans/new">
                <Button size="sm">Utwórz formułę</Button>
              </Link>
            }
          >
            Formuła to szablon wielokrotnego użytku — sklonujesz ją na plan klienta.
          </EmptyState>
        ) : loading ? null : (
          templates.map((p) => (
            <PlanRow key={p.id} plan={p} clientNames={clientNamesByPlan.get(p.id) ?? []} kind="formula">
              <Button variant="ghost" onClick={() => handleDuplicate(p, true)}>
                Utwórz plan klienta
              </Button>
              <Button variant="ghost" onClick={() => handleDuplicate(p, false)}>
                Duplikuj
              </Button>
              <Button variant="danger" onClick={() => handleDelete(p)}>
                Usuń
              </Button>
            </PlanRow>
          ))
        )}
      </Section>

      <Section title="Plany klientów" count={clientPlans.length}>
        {!loading && clientPlans.length === 0 ? (
          <EmptyState
            title="Brak planów klientów"
            action={
              <Link href="/plans/new">
                <Button size="sm">Utwórz plan klienta</Button>
              </Link>
            }
          >
            Stwórz nowy plan albo użyj formuły → „Utwórz plan klienta”.
          </EmptyState>
        ) : loading ? null : (
          clientPlans.map((p) => (
            <PlanRow key={p.id} plan={p} clientNames={clientNamesByPlan.get(p.id) ?? []} kind="client">
              <Button variant="ghost" onClick={() => handleDuplicate(p, false)}>
                Duplikuj
              </Button>
              <Button variant="danger" onClick={() => handleDelete(p)}>
                Usuń
              </Button>
            </PlanRow>
          ))
        )}
      </Section>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
        {title}{" "}
        <span className="font-mono text-sm font-normal tabular-nums text-muted">· {count}</span>
      </h2>
      <div className="grid gap-3 xl:grid-cols-2">{children}</div>
    </div>
  );
}

function PlanRow({
  plan,
  clientNames,
  kind,
  children,
}: {
  plan: PlanSummary;
  clientNames: string[];
  kind: "formula" | "client";
  children: ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/plans/${plan.id}`} className="break-words font-semibold hover:text-accent">
            {plan.name}
          </Link>
          <Badge tone={kind === "formula" ? "accent" : "neutral"}>{kind === "formula" ? "Formula" : "Plan"}</Badge>
          {clientNames.length > 0 && (
            <Badge tone="positive">
              aktywny u: {clientNames.slice(0, 2).join(", ")}
              {clientNames.length > 2 ? ` +${clientNames.length - 2}` : ""}
            </Badge>
          )}
        </div>
        <p className="mt-0.5 break-words font-mono text-xs tabular-nums text-muted">
          {plan.weeksCount} tyg. · {plan.daysCount} dni · {plan.exerciseCount} ćwiczeń
          {plan.description ? ` · ${plan.description}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
    </Card>
  );
}
