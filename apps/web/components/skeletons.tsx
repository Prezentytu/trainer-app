"use client";

import { Skeleton } from "@/components/ui";

export function DashboardSkeleton() {
  // Bez 3 KPI — przy onboardingu znikają (unikamy CLS). Wspólna rama: header + lista + 2 karty.
  return (
    <div aria-busy aria-label="Wczytuję panel" className="skeleton-defer">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>
      <Skeleton className="mb-6 h-48 w-full rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function ExerciseDetailSkeleton() {
  return (
    <div aria-busy aria-label="Wczytuję ćwiczenie" className="skeleton-defer space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="aspect-video w-full max-w-xl rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function PlanWizardSkeleton() {
  return (
    <div aria-busy aria-label="Wczytuję kreator" className="skeleton-defer mx-auto w-full max-w-2xl space-y-4 lg:max-w-5xl">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-1.5 w-full rounded-full" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <Skeleton className="hidden h-full min-h-72 w-full rounded-xl lg:block" />
      </div>
    </div>
  );
}

export function PlanBuilderLibrarySkeleton() {
  return (
    <div aria-busy aria-label="Wczytuję bibliotekę ćwiczeń" className="skeleton-defer space-y-2 p-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-md" />
      ))}
    </div>
  );
}

export function ClientListSkeleton() {
  return (
    <div aria-busy aria-label="Wczytuję klientów" className="skeleton-defer">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 border-b border-border px-1 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-start gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-2/3 max-w-[14rem]" />
              <Skeleton className="h-4 w-1/2 max-w-[12rem]" />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ClientDetailSkeleton() {
  return (
    <div aria-busy aria-label="Wczytuję profil klienta" className="skeleton-defer">
      <div className="mb-8 flex items-start gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-44 w-full rounded-xl" />
      </div>
      <Skeleton className="mb-6 h-10 w-full max-w-sm rounded-md" />
      <div className="grid gap-2">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </div>
  );
}

const PLAN_SKELETON_PAD = "px-4 py-3";
const PLAN_SKELETON_COLS =
  "lg:grid lg:grid-cols-[minmax(0,1fr)_11rem_9rem_5.5rem_5.5rem] lg:items-center lg:gap-x-4";

export function PlanListSkeleton() {
  return (
    <div aria-busy aria-label="Wczytuję plany" className="skeleton-defer space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Skeleton className="h-10 min-w-0 flex-1 rounded-[var(--r-field)]" />
        <Skeleton className="h-10 w-full rounded-[var(--r-pill)] sm:w-80" />
      </div>
      <div className="overflow-hidden rounded-[var(--r-card)] border border-border bg-surface">
        <div
          className={`${PLAN_SKELETON_PAD} ${PLAN_SKELETON_COLS} hidden border-b border-border bg-surface-raised lg:grid`}
        >
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="ml-auto h-3 w-10" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`grid grid-cols-1 gap-2 ${PLAN_SKELETON_PAD} ${PLAN_SKELETON_COLS}`}>
              <div className="flex min-w-0 items-center gap-3">
                <Skeleton className="h-8 w-8 shrink-0 rounded-[var(--r-field)]" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="hidden h-3 w-28 lg:block" />
              <Skeleton className="hidden h-6 w-24 lg:block" />
              <Skeleton className="hidden h-3 w-14 lg:block" />
              <div className="flex items-center justify-end gap-0.5">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ExerciseListSkeleton() {
  return (
    <div
      aria-busy
      aria-label="Wczytuję ćwiczenia"
      className="skeleton-defer divide-y divide-border border-y border-border"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex min-h-[var(--tap-min)] items-center gap-3 px-2 py-2.5">
          <Skeleton className="h-12 w-12 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          <Skeleton className="h-8 w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function PortalHomeSkeleton() {
  return (
    <div aria-busy aria-label="Wczytuję trening" className="skeleton-defer mx-auto max-w-lg space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-9 w-44" />
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="mx-auto h-8 w-8 rounded-full" />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}

export function SessionLoggerSkeleton() {
  return (
    <div aria-busy aria-label="Wczytuję sesję" className="skeleton-defer space-y-4 pb-24">
      <div className="flex items-center justify-between gap-3 border-b border-border py-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-36" />
        </div>
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-3 border-b border-border px-3 py-3">
            <Skeleton className="h-12 w-12 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3 max-w-[14rem]" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="flex items-center gap-2 border-b border-border px-3 py-3 last:border-b-0">
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-11 flex-1 rounded-md" />
              <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function PlanDetailSkeleton() {
  return (
    <div aria-busy aria-label="Wczytuję plan" className="skeleton-defer flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-11 shrink-0 items-center justify-between gap-3 border-b border-border py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Skeleton className="h-5 w-48 max-w-[50%]" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>
      <div className="flex min-h-9 shrink-0 items-center justify-between gap-2 border-b border-border py-1.5">
        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8 shrink-0 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-3 w-28" />
      </div>
      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3 md:flex-row md:overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="w-full shrink-0 space-y-2 rounded-[var(--r-card)] border border-border bg-surface p-3 md:w-[300px]"
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
            <div className="space-y-2 pt-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-14 w-full rounded-[10px]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Uniwersalny skeleton podstron portalu (progres, historia, pomiary, profil). */
export function PortalPageSkeleton({ label = "Wczytuję…" }: { label?: string }) {
  return (
    <div aria-busy aria-label={label} className="skeleton-defer space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-9 w-48" />
      </div>
      <div className="grid grid-cols-3 gap-3 border-y border-border py-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
      <Skeleton className="h-32 w-full" />
      <div className="space-y-0 divide-y divide-border border-y border-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="py-4">
            <Skeleton className="h-4 w-2/3 max-w-[14rem]" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
