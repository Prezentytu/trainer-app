"use client";

import { Skeleton } from "@/components/ui";

export function DashboardSkeleton() {
  return (
    <div aria-busy aria-label="Wczytuję panel">
      <div className="mb-8 flex items-center justify-between gap-3">
        <Skeleton className="h-7 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>
      </div>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="mb-6 h-64 w-full rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function ClientListSkeleton() {
  return (
    <div aria-busy aria-label="Wczytuję klientów" className="grid gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
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
    <div aria-busy aria-label="Wczytuję profil klienta">
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

export function PlanListSkeleton() {
  return (
    <div aria-busy aria-label="Wczytuję plany" className="space-y-10">
      {["Szablony", "Plany klientów"].map((section) => (
        <div key={section}>
          <div className="mb-1 flex items-center gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-5 rounded-full" />
            <span aria-hidden className="h-px flex-1 bg-border" />
          </div>
          <Skeleton className="mb-4 h-4 w-72 max-w-full" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="min-h-[2.625rem] space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <Skeleton className="h-[3.625rem] w-full rounded-md" />
                <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                  <Skeleton className="h-6 w-28" />
                  <Skeleton className="h-8 w-32 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ExerciseListSkeleton() {
  return (
    <div aria-busy aria-label="Wczytuję ćwiczenia" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-surface p-4">
          <Skeleton className="mb-3 aspect-video w-full rounded-md" />
          <Skeleton className="mb-2 h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function PortalHomeSkeleton() {
  return (
    <div aria-busy aria-label="Wczytuję trening" className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-48" />
      </div>
      <Skeleton className="h-10 w-full rounded-md" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-md" />
    </div>
  );
}

export function SessionLoggerSkeleton() {
  return (
    <div aria-busy aria-label="Wczytuję sesję" className="space-y-4 pb-24">
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
    <div aria-busy aria-label="Wczytuję plan" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
      <Skeleton className="h-10 w-full max-w-md rounded-md" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Uniwersalny skeleton podstron portalu (progres, historia, pomiary, profil). */
export function PortalPageSkeleton({ label = "Wczytuję…" }: { label?: string }) {
  return (
    <div aria-busy aria-label={label} className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-40" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
