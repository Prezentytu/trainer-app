"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api, Plan, PlanItem } from "@/lib/api";
import PlanBuilder from "@/components/plan-builder/PlanBuilder";
import { PlanBoard } from "@/components/plan-view/PlanBoard";
import { PlanItemPanel } from "@/components/plan-view/PlanItemPanel";
import { PlanDetailSkeleton } from "@/components/skeletons";
import {
  Avatar,
  Badge,
  Button,
  Dialog,
  EmptyState,
  ErrorBanner,
  OverflowMenu,
  Toolbar,
} from "@/components/ui";
import { polishDayCount, polishExerciseCount } from "@/lib/plural";

export default function PlanDetailsPage() {
  const params = useParams<{ id: string }>();
  const planId = Number(params.id);
  const panelId = useId();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [clientNames, setClientNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [activeWeek, setActiveWeek] = useState<number | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.plans.get(planId), api.assignments.list()])
      .then(([p, assignments]) => {
        if (cancelled) return;
        setPlan(p);
        setActiveWeek(
          (prev) =>
            prev ??
            [...new Set(p.days.map((d) => d.weekNumber))].sort((a, b) => a - b)[0] ??
            1,
        );
        setClientNames(
          assignments
            .filter((a) => a.planId === planId && a.status === "active")
            .map((a) => a.clientName),
        );
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [planId, editing]);

  const weeks = useMemo(
    () => (plan ? [...new Set(plan.days.map((d) => d.weekNumber))].sort((a, b) => a - b) : []),
    [plan],
  );
  const currentWeek = activeWeek ?? weeks[0] ?? 1;

  const weekDays = useMemo(() => {
    if (!plan) return [];
    return plan.days
      .filter((d) => d.weekNumber === currentWeek)
      .sort((a, b) => a.order - b.order);
  }, [plan, currentWeek]);

  const selectedItem: PlanItem | null = useMemo(() => {
    if (selectedItemId == null || !plan) return null;
    for (const day of plan.days) {
      const found = day.items.find((i) => i.id === selectedItemId);
      if (found) return found;
    }
    return null;
  }, [plan, selectedItemId]);

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
      <div className="flex min-h-0 flex-1 flex-col">
        <PlanBuilder plan={plan} onExit={() => setCancelOpen(true)} />
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

  const weekMeta = `${polishDayCount(plan.daysCount)} · ${polishExerciseCount(plan.exerciseCount)}`;
  const visibleClients = clientNames.slice(0, 4);
  const extraClients = clientNames.length - visibleClients.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0">
        <Toolbar
          left={
            <>
              <h1
                title={plan.name}
                className="min-w-0 truncate text-base font-semibold tracking-tight text-foreground"
              >
                {plan.name}
              </h1>
              {plan.isTemplate ? <Badge tone="accent">Wielokrotnego użytku</Badge> : null}
              {clientNames.length > 0 ? (
                <div className="flex shrink-0 -space-x-1.5" title={clientNames.join(", ")}>
                  {visibleClients.map((name) => (
                    <span key={name} className="rounded-full ring-2 ring-background">
                      <Avatar name={name} size="sm" />
                    </span>
                  ))}
                  {extraClients > 0 ? (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface-raised font-mono text-[10px] font-semibold text-muted ring-2 ring-background">
                      +{extraClients}
                    </span>
                  ) : null}
                </div>
              ) : plan.assignedCount > 0 ? (
                <Badge tone="positive">{plan.assignedCount}</Badge>
              ) : null}
            </>
          }
          right={
            <>
              <OverflowMenu label="Szczegóły planu" align="right">
                <div className="max-w-xs space-y-1 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-faint">
                    Zasady / opis
                  </p>
                  <p className="text-sm leading-snug text-foreground-secondary">
                    {plan.description?.trim() || "Brak opisu planu."}
                  </p>
                </div>
              </OverflowMenu>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedItemId(null);
                  setEditing(true);
                }}
              >
                Edytuj plan
              </Button>
            </>
          }
        />
        <ErrorBanner message={error} />

        <div className="flex min-h-9 items-center gap-2 border-b border-border py-1.5">
          {weeks.length > 1 ? (
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto overscroll-x-contain">
              {weeks.map((week) => (
                <button
                  key={week}
                  type="button"
                  onClick={() => {
                    setSelectedItemId(null);
                    setActiveWeek(week);
                  }}
                  aria-label={`Tydzień ${week}`}
                  aria-current={week === currentWeek ? "true" : undefined}
                  className={`min-w-8 shrink-0 rounded-full px-2.5 py-1.5 font-mono text-sm tabular-nums transition-colors ${
                    week === currentWeek
                      ? "border border-border-strong bg-surface-active font-semibold text-foreground"
                      : "border border-border bg-surface text-foreground-secondary hover:border-border-strong"
                  }`}
                >
                  {week}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1" />
          )}
          <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-faint">{weekMeta}</span>
        </div>
      </div>

      {weekDays.length === 0 ? (
        <EmptyState
          title="Brak dni w tym tygodniu"
          action={
            <Button
              size="sm"
              onClick={() => {
                setSelectedItemId(null);
                setEditing(true);
              }}
            >
              Edytuj plan
            </Button>
          }
        >
          Dodaj dzień w edycji planu — pojawi się tu jako kolumna boardu.
        </EmptyState>
      ) : (
        <div className="flex min-h-0 flex-1">
          <div className="min-h-0 min-w-0 flex-1">
            <PlanBoard
              days={weekDays}
              selectedItemId={selectedItemId}
              panelId={panelId}
              onSelectItem={(id) => setSelectedItemId((prev) => (prev === id ? null : id))}
            />
          </div>
          <PlanItemPanel
            item={selectedItem}
            open={selectedItemId != null && selectedItem != null}
            panelId={panelId}
            onClose={() => setSelectedItemId(null)}
          />
        </div>
      )}
    </div>
  );
}
