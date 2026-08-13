"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { api, PlanSummary } from "@/lib/api";
import { daysAgo, formatDayShort, relativeDayLabel } from "@/lib/dates";
import { refreshNavCounts } from "@/lib/navCounts";
import { polishDayCount, polishExerciseCount, polishResultCount, polishWeekCount } from "@/lib/plural";
import {
  Avatar,
  Button,
  Dialog,
  EmptyState,
  ErrorBanner,
  IconButton,
  PageHeader,
  SearchInput,
  Tabs,
  useUndoToast,
} from "@/components/ui";
import { PlanListSkeleton } from "@/components/skeletons";

type AssignmentSummary = { planId: number; clientName: string };
type KindFilter = "all" | "library" | "clients";

/** Wspólna siatka nagłówka i wierszy — stałe tracki, żeby komórki zawsze się pokrywały. */
const PLAN_ROW_PAD = "px-4 py-3";
/** Plan | Struktura | Klienci | Dodano | Akcje — akcje zawsze ta sama szerokość (2 ikony). */
const PLAN_GRID =
  "lg:grid lg:grid-cols-[minmax(0,1fr)_11rem_9rem_5.5rem_5.5rem] lg:items-center lg:gap-x-4";

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<PlanSummary | null>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const { showUndoToast, toastNode } = useUndoToast();

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

  const libraryCount = useMemo(() => plans.filter((p) => p.isTemplate).length, [plans]);
  const clientCount = useMemo(() => plans.filter((p) => !p.isTemplate).length, [plans]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return plans.filter((p) => {
      if (kind === "library" && !p.isTemplate) return false;
      if (kind === "clients" && p.isTemplate) return false;
      if (!q) return true;
      const name = p.name.toLowerCase();
      const desc = (p.description ?? "").toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [plans, kind, query]);

  const filtersActive = kind !== "all" || query.trim().length > 0;

  const handleDuplicate = async (plan: PlanSummary, asClientPlan: boolean) => {
    try {
      const created = await api.plans.duplicate(plan.id, {
        name: asClientPlan ? `${plan.name} — plan klienta` : null,
        isTemplate: asClientPlan ? false : null,
      });
      void refreshNavCounts();
      router.push(`/plans/${created.id}`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (plan: PlanSummary) => {
    const snapshot = plans;
    setDeleteTarget(null);
    setPlans((prev) => prev.filter((p) => p.id !== plan.id));
    try {
      await api.plans.remove(plan.id);
      void refreshNavCounts();
      showUndoToast("Usunięto plan");
    } catch (err) {
      setPlans(snapshot);
      setError((err as Error).message);
    }
  };

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
              <Button>Utwórz plan</Button>
            </Link>
          </div>
        }
      />
      <ErrorBanner message={error} />

      {toastNode}
      {loading ? <PlanListSkeleton /> : null}

      {!loading ? (
        <>
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <SearchInput
                  value={query}
                  onChange={setQuery}
                  placeholder="Szukaj po nazwie lub opisie…"
                  aria-label="Szukaj planu"
                />
              </div>
              <div className="sm:shrink-0">
                <Tabs
                  items={[
                    { value: "all", label: "Wszystkie", count: plans.length },
                    { value: "library", label: "Biblioteka", count: libraryCount },
                    { value: "clients", label: "Klienci", count: clientCount },
                  ]}
                  value={kind}
                  onChange={(v) => setKind(v as KindFilter)}
                />
              </div>
            </div>
            {filtersActive ? (
              <p className="text-sm text-muted">
                {polishResultCount(filtered.length)}
                {query.trim() ? ` dla „${query.trim()}”` : ""}
              </p>
            ) : null}
          </div>

          {plans.length === 0 ? (
            <EmptyState
              title="Zacznij od pierwszego planu"
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Link href="/plans/new">
                    <Button size="sm">Utwórz plan</Button>
                  </Link>
                  <Link href="/plans/import">
                    <Button size="sm" variant="secondary">
                      Importuj
                    </Button>
                  </Link>
                </div>
              }
            >
              Plan, który skopiujesz dla dowolnego klienta — albo zaimportuj gotowy.
            </EmptyState>
          ) : filtered.length === 0 ? (
            <PlansEmptyState
              kind={kind}
              query={query}
              onClearQuery={() => setQuery("")}
            />
          ) : (
            <div className="overflow-hidden rounded-[var(--r-card)] border border-border bg-surface">
              <div
                className={`${PLAN_ROW_PAD} ${PLAN_GRID} hidden border-b border-border bg-surface-raised t-label`}
                aria-hidden
              >
                <span>Plan</span>
                <span>Struktura</span>
                <span>Klienci</span>
                <span>Dodano</span>
                <span className="sr-only">Akcje</span>
              </div>
              <ul className="divide-y divide-border">
                {filtered.map((p) => (
                  <PlanRow
                    key={p.id}
                    plan={p}
                    clientNames={clientNamesByPlan.get(p.id) ?? []}
                    onDuplicate={() => void handleDuplicate(p, false)}
                    onCreateClientPlan={
                      p.isTemplate ? () => void handleDuplicate(p, true) : undefined
                    }
                    onDelete={() => setDeleteTarget(p)}
                  />
                ))}
              </ul>
            </div>
          )}
        </>
      ) : null}

      <Dialog
        open={!!deleteTarget}
        title={deleteTarget ? `Usunąć „${deleteTarget.name}”?` : "Usunąć plan?"}
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

function PlansEmptyState({
  kind,
  query,
  onClearQuery,
}: {
  kind: KindFilter;
  query: string;
  onClearQuery: () => void;
}) {
  const q = query.trim();
  if (q) {
    return (
      <EmptyState
        title={`Nic nie pasuje do „${q}”`}
        action={
          <Button variant="ghost" size="sm" onClick={onClearQuery}>
            Wyczyść szukanie
          </Button>
        }
      >
        Spróbuj innej nazwy albo wyczyść filtr — albo utwórz nowy plan.
      </EmptyState>
    );
  }
  if (kind === "library") {
    return (
      <EmptyState
        title="Biblioteka jest pusta"
        action={
          <Link href="/plans/new">
            <Button size="sm">Utwórz plan</Button>
          </Link>
        }
      >
        Plan, który skopiujesz dla dowolnego klienta.
      </EmptyState>
    );
  }
  if (kind === "clients") {
    return (
      <EmptyState title="Żaden plan nie jest jeszcze przypisany" action={null}>
        Skopiuj plan z biblioteki przyciskiem „Utwórz plan klienta” — pojawi się tutaj.
      </EmptyState>
    );
  }
  return null;
}

function PlanRow({
  plan,
  clientNames,
  onDuplicate,
  onCreateClientPlan,
  onDelete,
}: {
  plan: PlanSummary;
  clientNames: string[];
  onDuplicate: () => void;
  onCreateClientPlan?: () => void;
  onDelete: () => void;
}) {
  const visibleClients = clientNames.slice(0, 3);
  const extraClients = clientNames.length - visibleClients.length;
  const structure = [
    polishWeekCount(plan.weeksCount),
    polishDayCount(plan.daysCount),
    polishExerciseCount(plan.exerciseCount),
  ].join(" · ");
  const addedLabel = planAddedLabel(plan.createdAt);

  return (
    <li
      className={`group relative grid grid-cols-1 gap-2 transition-colors hover:bg-surface-raised/60 ${PLAN_ROW_PAD} ${PLAN_GRID}`}
    >
      {/* Plan */}
      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-field)] bg-surface-active text-fg-muted"
        >
          {plan.isTemplate ? (
            <Icon name="stack" size={16} decorative />
          ) : (
            <Icon name="user" size={16} decorative />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <Link
            href={`/plans/${plan.id}`}
            className="t-heading break-words text-[15px] after:absolute after:inset-0 after:z-0"
          >
            {plan.name}
          </Link>
          {plan.description?.trim() ? (
            <p className="mt-0.5 line-clamp-1 break-words text-[13px] text-fg-muted">
              {plan.description}
            </p>
          ) : null}
          {onCreateClientPlan ? (
            <button
              type="button"
              onClick={onCreateClientPlan}
              className="relative z-10 mt-1 text-[13px] font-medium text-fg-muted underline underline-offset-2 hover:text-foreground"
            >
              Utwórz plan klienta
            </button>
          ) : null}
          {/* Mobile meta — jedna linia pod nazwą */}
          <p className="mt-1 text-[13px] text-fg-faint lg:hidden">
            {structure}
            <span className="mx-1.5">·</span>
            {clientNames.length > 0
              ? `${visibleClients.join(", ")}${extraClients > 0 ? ` +${extraClients}` : ""}`
              : "Nieprzypisany"}
            <span className="mx-1.5">·</span>
            {addedLabel}
          </p>
        </div>
      </div>

      {/* Struktura */}
      <div className="hidden min-w-0 font-mono text-[12px] leading-snug tabular-nums text-fg-muted lg:block">
        {structure}
      </div>

      {/* Klienci */}
      <div className="hidden min-w-0 lg:block">
        {clientNames.length > 0 ? (
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex shrink-0 -space-x-1.5">
              {visibleClients.map((name) => (
                <span
                  key={name}
                  className="rounded-full ring-2 ring-surface transition-[box-shadow] duration-[var(--dur-fast)] group-hover:ring-surface-raised"
                >
                  <Avatar name={name} size="sm" />
                </span>
              ))}
            </div>
            <span className="min-w-0 break-words text-[12px] text-fg-muted">
              {visibleClients.join(", ")}
              {extraClients > 0 ? ` +${extraClients}` : ""}
            </span>
          </div>
        ) : (
          <span className="text-[12px] text-fg-ghost">—</span>
        )}
      </div>

      {/* Dodano */}
      <div className="hidden font-mono text-[12px] tabular-nums text-fg-faint lg:block">
        {addedLabel}
      </div>

      {/* Akcje — stała szerokość, zawsze te same 2 ikony */}
      <div className="relative z-10 flex w-full shrink-0 items-center justify-end gap-0.5 opacity-100 transition-opacity duration-[var(--dur-fast)] lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
        <IconButton title={`Duplikuj „${plan.name}”`} size="sm" onClick={onDuplicate}>
          <Icon name="copy" size={16} decorative />
        </IconButton>
        <IconButton title={`Usuń „${plan.name}”`} size="sm" variant="danger" onClick={onDelete}>
          <Icon name="delete" size={16} decorative />
        </IconButton>
      </div>
    </li>
  );
}

function planAddedLabel(createdAt?: string): string {
  if (!createdAt) return "—";
  const iso = createdAt.slice(0, 10);
  if (daysAgo(iso) > 30) return formatDayShort(iso);
  return relativeDayLabel(iso);
}
