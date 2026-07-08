"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Dumbbell, Home, Menu, Users, X } from "lucide-react";
import { api } from "@/lib/api";

const NAV = [
  { href: "/", label: "Panel", icon: Home, countKey: null },
  { href: "/clients", label: "Klienci", icon: Users, countKey: "clients" as const },
  { href: "/exercises", label: "Ćwiczenia", icon: Dumbbell, countKey: null },
  { href: "/plans", label: "Plany", icon: ClipboardList, countKey: "plans" as const },
];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 px-2">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent font-black text-accent-foreground">
        T
      </span>
      {!compact && (
        <span className="text-lg font-bold tracking-tight">
          Trainer<span className="text-accent">Portal</span>
        </span>
      )}
    </Link>
  );
}

function NavLinks({
  onNavigate,
  counts,
  compact,
}: {
  onNavigate?: () => void;
  counts: { clients: number | null; plans: number | null };
  compact?: boolean;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1.5">
      {NAV.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
        const count = item.countKey ? counts[item.countKey] : null;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={compact ? item.label : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "bg-surface-hover text-accent" : "text-foreground-secondary hover:bg-surface-hover hover:text-accent"
            } ${compact ? "justify-center" : "justify-between"}`}
          >
            <span className={`flex items-center gap-3 ${compact ? "justify-center" : "min-w-0"}`}>
              <Icon aria-hidden className="h-5 w-5 shrink-0" strokeWidth={2} />
              {!compact && <span className="truncate">{item.label}</span>}
            </span>
            {!compact && count != null && (
              <span className="shrink-0 rounded-full bg-surface-active px-2 py-0.5 text-xs font-semibold text-foreground-secondary">
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      {NAV.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-xs transition-colors ${
              active ? "font-semibold text-accent" : "text-muted-strong"
            }`}
          >
            <Icon aria-hidden className="h-6 w-6" strokeWidth={2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [railExpanded, setRailExpanded] = useState(false);
  const [counts, setCounts] = useState<{ clients: number | null; plans: number | null }>({
    clients: null,
    plans: null,
  });
  const pathname = usePathname();
  // Kreator/podgląd planu (/plans/new, /plans/[id]) potrzebuje szerokiej siatki na dni tygodnia —
  // lista planów (/plans) zostaje przy wąskim, czytelnym kontenerze jak reszta stron. Te same
  // trasy dostają "tryb skupienia": sidebar zwija się do wąskiego railu z ikonami.
  const isPlanEditor = /^\/plans\/.+/.test(pathname ?? "");
  const showRail = isPlanEditor && !railExpanded;

  useEffect(() => {
    Promise.all([api.clients.list(), api.plans.list()])
      .then(([clients, plans]) => setCounts({ clients: clients.length, plans: plans.length }))
      .catch(() => {
        // Liczniki nawigacji to tylko usprawnienie orientacji — brak backendu nie może wywrócić layoutu.
      });
  }, []);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surface/60 p-4 md:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Otwórz menu"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-foreground-secondary hover:bg-surface-active"
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
        </button>
      </header>

      <aside
        onMouseEnter={() => showRail && setRailExpanded(true)}
        onMouseLeave={() => isPlanEditor && setRailExpanded(false)}
        className={`hidden shrink-0 flex-col gap-6 border-r border-border bg-surface/60 p-4 transition-[width] duration-150 md:sticky md:top-0 md:flex md:h-screen md:overflow-y-auto ${
          showRail ? "md:w-16" : "md:w-56"
        }`}
      >
        <Logo compact={showRail} />
        <NavLinks counts={counts} compact={showRail} />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Zamknij menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <aside className="relative flex h-full w-64 max-w-[80vw] flex-col gap-6 border-r border-border bg-surface p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <Logo />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Zamknij menu"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-foreground-secondary hover:bg-surface-active"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            <NavLinks counts={counts} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <main className="w-full flex-1 p-4 pb-20 md:p-8 md:pb-8">
        <div className={`mx-auto ${isPlanEditor ? "max-w-[120rem]" : "max-w-7xl 2xl:max-w-[100rem]"}`}>{children}</div>
      </main>

      <BottomNav />
    </div>
  );
}
