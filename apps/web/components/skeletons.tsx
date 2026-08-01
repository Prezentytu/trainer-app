"use client";

import { Skeleton } from "@/components/ui";

export function DashboardSkeleton() {
  return (
    <div aria-busy aria-label="Wczytuję panel">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function ClientListSkeleton() {
  return (
    <div aria-busy aria-label="Wczytuję klientów" className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3 max-w-[12rem]" />
            <Skeleton className="h-3 w-1/2 max-w-[8rem]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ClientDetailSkeleton() {
  return (
    <div aria-busy aria-label="Wczytuję profil klienta">
      <div className="mb-8 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="mb-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>
      <Skeleton className="mb-4 h-10 w-full max-w-md rounded-md" />
      <Skeleton className="h-56 w-full rounded-xl" />
    </div>
  );
}

export function PlanListSkeleton() {
  return (
    <div aria-busy aria-label="Wczytuję plany" className="space-y-8">
      <div>
        <Skeleton className="mb-3 h-5 w-24" />
        <div className="grid gap-3 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
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
