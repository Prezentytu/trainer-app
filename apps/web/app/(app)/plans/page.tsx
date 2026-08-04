"use client";

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, PlanSummary } from "@/lib/api";
import { Avatar, Button, Card, Dialog, EmptyState, ErrorBanner, IconButton, PageHeader } from "@/components/ui";
import { PlanListSkeleton } from "@/components/skeletons";

type AssignmentSummary = { planId: number; clientName: string };

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<PlanSummary | null>(null);

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
    try {
      await api.plans.remove(plan.id);
      setDeleteTarget(null);
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
        subtitle="Twoja biblioteka planów i plany przypisane klientom"
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/plans/import">
              <Button variant="secondary">Importuj</Button>
            </Link>
            <Link href="/plans/new">
              <Button>+ Nowy plan</Button>
            </Link>
          </div>
        }
      />
      <ErrorBanner message={error} />

      {loading ? <PlanListSkeleton /> : null}

      {!loading ? (
        <>
          <Section
            title="Biblioteka planów"
            count={templates.length}
            hint="Plany wielokrotnego użytku — skopiuj na plan konkretnego klienta."
          >
            {templates.length === 0 ? (
              <div className="sm:col-span-2 xl:col-span-3">
                <EmptyState
                  title="Zacznij od pierwszego planu"
                  action={
                    <Link href="/plans/new">
                      <Button size="sm">Utwórz plan</Button>
                    </Link>
                  }
                >
                  Plan, który skopiujesz dla dowolnego klienta.
                </EmptyState>
              </div>
            ) : (
              templates.map((p) => (
                <PlanCard
                  key={p.id}
                  plan={p}
                  clientNames={clientNamesByPlan.get(p.id) ?? []}
                  kind="formula"
                  onDuplicate={() => void handleDuplicate(p, false)}
                  onCreateClientPlan={() => void handleDuplicate(p, true)}
                  onDelete={() => setDeleteTarget(p)}
                />
              ))
            )}
          </Section>

          <Section
            title="Plany klientów"
            count={clientPlans.length}
            hint="Spersonalizowane kopie — to je widzi klient w swoim portalu."
          >
            {clientPlans.length === 0 ? (
              <div className="sm:col-span-2 xl:col-span-3">
                <EmptyState
                  title="Zacznij od planu klienta"
                  action={
                    <Link href="/plans/new">
                      <Button size="sm">Utwórz plan klienta</Button>
                    </Link>
                  }
                >
                  Stwórz nowy plan albo skopiuj z biblioteki → „Utwórz plan klienta”.
                </EmptyState>
              </div>
            ) : (
              clientPlans.map((p) => (
                <PlanCard
                  key={p.id}
                  plan={p}
                  clientNames={clientNamesByPlan.get(p.id) ?? []}
                  kind="client"
                  onDuplicate={() => void handleDuplicate(p, false)}
                  onDelete={() => setDeleteTarget(p)}
                />
              ))
            )}
          </Section>
        </>
      ) : null}

      <Dialog
        open={!!deleteTarget}
        title={deleteTarget ? `Usunąć „${deleteTarget.name}"?` : "Usunąć plan?"}
        description="Plan i powiązane przypisania zostaną usunięte na stałe. Tej operacji nie można cofnąć."
        confirmLabel="Usuń plan"
        danger
        onConfirm={() => {
          if (deleteTarget) void handleDelete(deleteTarget);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function Section({
  title,
  count,
  hint,
  children,
}: {
  title: string;
  count: number;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-caps text-muted-strong">{title}</h2>
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-surface-active px-1.5 font-mono text-xs tabular-nums text-foreground-secondary">
            {count}
          </span>
          <span aria-hidden className="h-px flex-1 bg-border" />
        </div>
        {hint ? <p className="mt-1.5 max-w-[62ch] text-sm text-muted">{hint}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

function PlanCard({
  plan,
  clientNames,
  kind,
  onDuplicate,
  onCreateClientPlan,
  onDelete,
}: {
  plan: PlanSummary;
  clientNames: string[];
  kind: "formula" | "client";
  onDuplicate: () => void;
  onCreateClientPlan?: () => void;
  onDelete: () => void;
}) {
  const isTemplate = kind === "formula";
  const visibleClients = clientNames.slice(0, 3);
  const extraClients = clientNames.length - visibleClients.length;

  return (
    <Card className="group relative flex h-full flex-col gap-4 hover:border-border-strong hover:bg-surface-hover">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
            isTemplate ? "bg-accent-dim text-accent" : "bg-surface-active text-muted-strong"
          }`}
        >
          {isTemplate ? <TemplateIcon /> : <ClientPlanIcon />}
        </span>

        <div className="min-w-0 flex-1">
          <Link
            href={`/plans/${plan.id}`}
            className="break-words font-display text-base font-semibold text-foreground transition-colors duration-[var(--dur-fast)] after:absolute after:inset-0 after:rounded-xl group-hover:text-accent"
          >
            {plan.name}
          </Link>
          <div className="mt-1 text-xs font-semibold uppercase tracking-caps text-muted">
            {isTemplate ? "Wielokrotnego użytku" : "Plan klienta"}
          </div>
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-0.5 transition-opacity duration-[var(--dur-fast)] sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <IconButton title={`Duplikuj „${plan.name}"`} size="sm" onClick={onDuplicate}>
            <DuplicateIcon />
          </IconButton>
          <IconButton title={`Usuń „${plan.name}"`} size="sm" variant="danger" onClick={onDelete}>
            <TrashIcon />
          </IconButton>
        </div>
      </div>

      <p className="line-clamp-2 min-h-[2.625rem] break-words text-sm leading-[var(--leading-body)] text-muted">
        {plan.description?.trim() ? plan.description : <span className="text-muted-faint">Bez opisu</span>}
      </p>

      <div className="grid grid-cols-3 divide-x divide-border overflow-hidden rounded-md border border-border bg-surface-sunken">
        <StatCell value={plan.weeksCount} label="tyg." />
        <StatCell value={plan.daysCount} label="dni" />
        <StatCell value={plan.exerciseCount} label="ćwiczeń" />
      </div>

      <div className="relative z-10 mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        {clientNames.length > 0 ? (
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex shrink-0 -space-x-1.5">
              {visibleClients.map((name) => (
                <span
                  key={name}
                  className="rounded-full ring-2 ring-surface transition-[box-shadow] duration-[var(--dur-fast)] group-hover:ring-surface-hover"
                >
                  <Avatar name={name} size="sm" />
                </span>
              ))}
            </div>
            <span className="min-w-0 break-words text-xs text-muted">
              {visibleClients.join(", ")}
              {extraClients > 0 ? ` +${extraClients}` : ""}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-faint">Brak aktywnych przypisań</span>
        )}

        {onCreateClientPlan ? (
          <Button variant="secondary" size="sm" onClick={onCreateClientPlan}>
            Utwórz plan klienta
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

function StatCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-0 px-2 py-2.5 text-center">
      <div className="font-mono text-base font-semibold tabular-nums text-foreground">{value}</div>
      <div className="mt-0.5 truncate text-xs uppercase tracking-caps text-muted">{label}</div>
    </div>
  );
}

const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function TemplateIcon() {
  return (
    <svg {...iconProps}>
      <path d="M8 1.8 1.8 5 8 8.2 14.2 5 8 1.8Z" />
      <path d="m1.8 8 6.2 3.2L14.2 8" />
      <path d="m1.8 11 6.2 3.2 6.2-3.2" />
    </svg>
  );
}

function ClientPlanIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="8" cy="5.2" r="2.6" />
      <path d="M2.8 14c0-2.6 2.33-4.7 5.2-4.7s5.2 2.1 5.2 4.7" />
    </svg>
  );
}

function DuplicateIcon() {
  return (
    <svg {...iconProps}>
      <rect x="5.4" y="5.4" width="8.4" height="8.4" rx="1.6" />
      <path d="M10.6 5.4V3.8a1.6 1.6 0 0 0-1.6-1.6H3.8a1.6 1.6 0 0 0-1.6 1.6v5.2a1.6 1.6 0 0 0 1.6 1.6h1.6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg {...iconProps}>
      <path d="M2.6 4.4h10.8" />
      <path d="M6.4 4.4V3.2a1 1 0 0 1 1-1h1.2a1 1 0 0 1 1 1v1.2" />
      <path d="m4 4.4.62 8.5a1.2 1.2 0 0 0 1.2 1.1h4.36a1.2 1.2 0 0 0 1.2-1.1L12 4.4" />
      <path d="M6.7 7v4M9.3 7v4" />
    </svg>
  );
}
