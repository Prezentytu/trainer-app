"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { api, PlanSummary } from "@/lib/api";
import { daysAgo, formatDayShort, relativeDayLabel } from "@/lib/dates";
import { polishDayCount, polishExerciseCount, polishWeekCount } from "@/lib/plural";
import {
  Avatar,
  Button,
  Dialog,
  EmptyState,
  ErrorBanner,
  IconButton,
  PageHeader,
  SegmentedControl,
  inputClass,
  useUndoToast,
} from "@/components/ui";
import { PlanListSkeleton } from "@/components/skeletons";

type AssignmentSummary = { planId: number; clientName: string };
type KindFilter = "all" | "library" | "clients";

/** Wspólna siatka nagłówka i wierszy — 1fr bierze luz, akcje max-content przy lewej krawędzi kolumny. */
const PLAN_ROW_PAD = "px-4 py-3.5";
const PLAN_ROW_COLS =
  "gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(11rem,13rem)_minmax(8rem,10rem)_auto] sm:items-center sm:gap-x-5 lg:grid-cols-[minmax(0,1fr)_minmax(11rem,13rem)_minmax(8rem,10rem)_4.5rem_auto] lg:gap-x-5";

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
              <Button>+ Nowy plan</Button>
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
              <div className="relative min-w-0 flex-1">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-faint"
                  strokeWidth={1.75}
                />
                <input
                  type="search"
                  className={`${inputClass} pl-9 pr-9`}
                  placeholder="Szukaj po nazwie lub opisie…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Szukaj planu"
                />
                {query ? (
                  <button
                    type="button"
                    aria-label="Wyczyść wyszukiwanie"
                    className="absolute top-1/2 right-2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-surface-hover hover:text-foreground"
                    onClick={() => setQuery("")}
                  >
                    <X className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                ) : null}
              </div>
              <div className="flex h-10 w-full sm:w-auto sm:shrink-0">
                <SegmentedControl
                  full
                  value={kind}
                  onChange={(v) => setKind(v as KindFilter)}
                  items={[
                    { value: "all", label: "Wszystkie", count: plans.length },
                    { value: "library", label: "Biblioteka", count: libraryCount },
                    { value: "clients", label: "Plany klientów", count: clientCount },
                  ]}
                />
              </div>
            </div>
            {filtersActive ? (
              <p className="text-sm text-muted">
                {filtered.length === 1 ? "1 wynik" : `${filtered.length} wyników`}
                {query.trim() ? ` dla „${query.trim()}"` : ""}
              </p>
            ) : null}
          </div>

          {plans.length === 0 ? (
            <EmptyState
              title="Zacznij od pierwszego planu"
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Link href="/plans/new">
                    <Button size="sm">+ Nowy plan</Button>
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
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
              <li
                className={`${PLAN_ROW_PAD} ${PLAN_ROW_COLS} hidden bg-surface-raised font-mono text-xs uppercase tracking-caps text-muted lg:grid`}
                aria-hidden
              >
                <span>Plan</span>
                <span>Struktura</span>
                <span>Klienci</span>
                <span>Dodano</span>
                <span>Akcje</span>
              </li>
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
          )}
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
        title={`Brak planów dla „${q}"`}
        action={
          <Button variant="ghost" size="sm" onClick={onClearQuery}>
            Wyczyść szukanie
          </Button>
        }
      >
        Spróbuj innej nazwy albo wyczyść filtr.
      </EmptyState>
    );
  }
  if (kind === "library") {
    return (
      <EmptyState
        title="Biblioteka jest pusta"
        action={
          <Link href="/plans/new">
            <Button size="sm">+ Nowy plan</Button>
          </Link>
        }
      >
        Plan, który skopiujesz dla dowolnego klienta.
      </EmptyState>
    );
  }
  if (kind === "clients") {
    return (
      <EmptyState title="Żaden plan nie jest jeszcze przypisany">
        Skopiuj plan z biblioteki → „Utwórz plan klienta”, albo utwórz nowy bez oznaczenia wielokrotnego użytku.
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
      className={`group relative grid grid-cols-1 transition-colors hover:bg-surface-hover sm:grid ${PLAN_ROW_PAD} ${PLAN_ROW_COLS}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-surface-active text-muted-strong"
        >
          {plan.isTemplate ? <TemplateIcon /> : <ClientPlanIcon />}
        </span>
        <div className="min-w-0 flex-1">
          <Link
            href={`/plans/${plan.id}`}
            className="break-words font-display text-base font-semibold text-foreground after:absolute after:inset-0"
          >
            {plan.name}
          </Link>
          {plan.description?.trim() ? (
            <p className="mt-0.5 line-clamp-1 break-words text-xs text-muted">{plan.description}</p>
          ) : null}
        </div>
      </div>

      <div className="font-mono text-xs leading-snug tabular-nums text-muted-strong sm:min-w-0">
        {structure}
      </div>

      <div className="min-w-0">
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
          <span className="text-xs text-muted-faint">Nieprzypisany</span>
        )}
      </div>

      <div className="hidden font-mono text-xs tabular-nums text-muted lg:block">{addedLabel}</div>

      <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-1">
        {onCreateClientPlan ? (
          <Button variant="secondary" size="sm" onClick={onCreateClientPlan}>
            Utwórz plan klienta
          </Button>
        ) : null}
        <div className="flex items-center gap-0.5 transition-opacity duration-[var(--dur-fast)] sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <IconButton title={`Duplikuj „${plan.name}"`} size="sm" onClick={onDuplicate}>
            <DuplicateIcon />
          </IconButton>
          <IconButton title={`Usuń „${plan.name}"`} size="sm" variant="danger" onClick={onDelete}>
            <TrashIcon />
          </IconButton>
        </div>
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
