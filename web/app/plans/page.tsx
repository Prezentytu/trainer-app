"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, Plan } from "@/lib/api";
import { Badge, Button, Card, EmptyState, ErrorBanner, PageHeader } from "@/components/ui";

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.plans
      .list()
      .then(setPlans)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  const handleDuplicate = async (plan: Plan, asClientPlan: boolean) => {
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

  const handleDelete = async (plan: Plan) => {
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
        subtitle="Szablony wielokrotnego użytku i plany gotowe do przypisania"
        action={
          <Link href="/plans/new">
            <Button>+ Nowy plan</Button>
          </Link>
        }
      />
      <ErrorBanner message={error} />

      <Section title="Szablony">
        {templates.length === 0 ? (
          <EmptyState>Brak szablonów. Tworząc plan, wybierz rodzaj „Szablon”.</EmptyState>
        ) : (
          templates.map((p) => (
            <PlanRow key={p.id} plan={p}>
              <Button variant="ghost" onClick={() => handleDuplicate(p, true)}>Użyj → plan klienta</Button>
              <Button variant="ghost" onClick={() => handleDuplicate(p, false)}>Duplikuj</Button>
              <Button variant="danger" onClick={() => handleDelete(p)}>Usuń</Button>
            </PlanRow>
          ))
        )}
      </Section>

      <Section title="Plany klientów">
        {clientPlans.length === 0 ? (
          <EmptyState>Brak planów klientów — stwórz nowy albo użyj szablonu.</EmptyState>
        ) : (
          clientPlans.map((p) => (
            <PlanRow key={p.id} plan={p}>
              <Button variant="ghost" onClick={() => handleDuplicate(p, false)}>Duplikuj</Button>
              <Button variant="danger" onClick={() => handleDelete(p)}>Usuń</Button>
            </PlanRow>
          ))
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 font-semibold">{title}</h2>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function PlanRow({ plan, children }: { plan: Plan; children: React.ReactNode }) {
  return (
    <Card className="flex items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <Link href={`/plans/${plan.id}`} className="font-semibold hover:text-yellow-400">
            {plan.name}
          </Link>
          {plan.assignedCount > 0 && <Badge tone="green">{plan.assignedCount} aktywne przypisania</Badge>}
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">
          {plan.items.length} ćwiczeń
          {plan.description ? ` · ${plan.description}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </Card>
  );
}
