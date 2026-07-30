"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Dumbbell, Home, Menu, Users, X } from "lucide-react";
import { api } from "@/lib/api";
import { Avatar } from "@/components/ui";
import { Wordmark } from "@/components/Wordmark";

const NAV = [
  { href: "/", label: "Panel", icon: Home, countKey: null },
  { href: "/clients", label: "Klienci", icon: Users, countKey: "clients" as const },
  { href: "/exercises", label: "Ćwiczenia", icon: Dumbbell, countKey: null },
  { href: "/plans", label: "Plany", icon: ClipboardList, countKey: "plans" as const },
];

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
    <nav className="flex flex-col gap-1">
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
            className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors duration-[var(--dur-fast)] ${
              active
                ? "bg-accent-dim text-accent-strong"
                : "text-foreground-secondary hover:bg-surface-hover hover:text-accent-strong"
            } ${compact ? "justify-center" : "justify-between"}`}
          >
            <span className={`flex items-center gap-3 ${compact ? "justify-center" : "min-w-0"}`}>
              <Icon aria-hidden className="h-5 w-5 shrink-0" strokeWidth={1.75} />
              {!compact && <span className="truncate">{item.label}</span>}
            </span>
            {!compact && count != null && (
              <span className="shrink-0 rounded-full bg-surface-active px-2 py-0.5 font-mono text-xs font-semibold tabular-nums text-foreground-secondary">
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function TrainerFooter({ compact, clientCount }: { compact?: boolean; clientCount: number | null }) {
  if (compact) {
    return (
      <div className="mt-auto flex justify-center px-1 pt-4">
        <Avatar name="Trener" size="sm" />
      </div>
    );
  }
  return (
    <div className="mt-auto flex items-center gap-3 border-t border-border px-2 pt-4">
      <Avatar name="Trener" size="md" />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-foreground">Trener</div>
        <div className="truncate font-mono text-xs tabular-nums text-muted">
          {clientCount != null ? `${clientCount} klientów` : "—"}
        </div>
      </div>
    </div>
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
            <span
              className={`flex h-7 w-10 items-center justify-center rounded-lg ${
                active ? "bg-accent-dim" : ""
              }`}
            >
              <Icon aria-hidden className="h-5 w-5" strokeWidth={1.75} />
            </span>
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
    api
      .counts()
      .then((c) => setCounts({ clients: c.clients, plans: c.plans }))
      .catch(() => {
        // Liczniki nawigacji to tylko usprawnienie orientacji — brak backendu nie może wywrócić layoutu.
      });
  }, []);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surface/80 p-4 backdrop-blur md:hidden">
        <Wordmark />
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Otwórz menu"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-surface-hover text-foreground-secondary hover:bg-surface-active"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </header>

      <aside
        onMouseEnter={() => showRail && setRailExpanded(true)}
        onMouseLeave={() => isPlanEditor && setRailExpanded(false)}
        className={`hidden shrink-0 flex-col gap-6 border-r border-border bg-surface p-4 transition-[width] duration-150 md:sticky md:top-0 md:flex md:h-screen md:overflow-y-auto ${
          showRail ? "md:w-16" : "md:w-56"
        }`}
      >
        <Wordmark compact={showRail} className="px-2" />
        <NavLinks counts={counts} compact={showRail} />
        <TrainerFooter compact={showRail} clientCount={counts.clients} />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Zamknij menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-[var(--overlay-scrim)]"
          />
          <aside className="relative flex h-full w-64 max-w-[80vw] flex-col gap-6 border-r border-border bg-surface p-4 shadow-modal">
            <div className="flex items-center justify-between">
              <Wordmark />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Zamknij menu"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-surface-hover text-foreground-secondary hover:bg-surface-active"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            <NavLinks counts={counts} onNavigate={() => setDrawerOpen(false)} />
            <TrainerFooter clientCount={counts.clients} />
          </aside>
        </div>
      )}

      <main className="w-full flex-1 bg-background p-4 pb-20 md:p-8 md:pb-8">
        <div className={`mx-auto ${isPlanEditor ? "max-w-[120rem]" : "max-w-7xl 2xl:max-w-[100rem]"}`}>{children}</div>
      </main>

      <BottomNav />
    </div>
  );
}
