"use client";

import { ReactNode, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  ChevronUp,
  ClipboardList,
  Dumbbell,
  Home,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { api, clerkEnabled } from "@/lib/api";
import { Avatar, useIsClient } from "@/components/ui";
import { Wordmark } from "@/components/Wordmark";

const NAV = [
  { href: "/", label: "Panel", icon: Home, countKey: null },
  { href: "/clients", label: "Klienci", icon: Users, countKey: "clients" as const },
  { href: "/exercises", label: "Ćwiczenia", icon: Dumbbell, countKey: null },
  { href: "/plans", label: "Plany", icon: ClipboardList, countKey: "plans" as const },
  { href: "/settings", label: "Ustawienia", icon: Settings, countKey: null },
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
    <nav className={`flex flex-col gap-1 ${compact ? "w-full" : ""}`}>
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
            aria-current={active ? "page" : undefined}
            className={`relative flex w-full items-center rounded-[10px] py-2.5 text-sm font-medium transition-colors duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] ${
              active
                ? "bg-accent-dim text-foreground"
                : "text-muted hover:bg-surface-hover hover:text-foreground"
            } ${compact ? "justify-center px-0" : "gap-3 px-3"}`}
          >
            {active ? (
              <span
                aria-hidden
                className={`absolute top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent ${
                  compact ? "left-1" : "left-0"
                }`}
              />
            ) : null}
            <Icon aria-hidden className="h-5 w-5 shrink-0" strokeWidth={1.75} />
            {!compact && (
              <>
                <span className="min-w-0 flex-1 truncate font-mono text-xs font-medium uppercase tracking-caps">
                  {item.label}
                </span>
                {count != null ? (
                  <span className="shrink-0 rounded-full bg-surface-active px-2 py-0.5 font-mono text-xs font-semibold tabular-nums text-foreground-secondary">
                    {count}
                  </span>
                ) : null}
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function AccountMenu({
  open,
  onClose,
  onSignOut,
  onOpenProfile,
  anchorId,
}: {
  open: boolean;
  onClose: () => void;
  onSignOut?: () => void;
  onOpenProfile?: () => void;
  anchorId: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      const anchor = document.getElementById(anchorId);
      if (anchor?.contains(target)) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, onClose, anchorId]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute bottom-full left-0 z-50 mb-2 w-full min-w-[12rem] overflow-hidden rounded-[10px] border border-border bg-surface shadow-modal"
    >
      {onOpenProfile ? (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onOpenProfile();
            onClose();
          }}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:bg-surface-hover"
        >
          <Settings aria-hidden className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Konto
        </button>
      ) : null}
      {onSignOut ? (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onSignOut();
            onClose();
          }}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:bg-surface-hover"
        >
          <LogOut aria-hidden className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Wyloguj się
        </button>
      ) : null}
    </div>
  );
}

function AccountTile({
  compact,
  name,
  interactive,
  onActivate,
  menuOpen,
  onMenuClose,
  onSignOut,
  onOpenProfile,
}: {
  compact?: boolean;
  name: string;
  interactive: boolean;
  onActivate?: () => void;
  menuOpen: boolean;
  onMenuClose: () => void;
  onSignOut?: () => void;
  onOpenProfile?: () => void;
}) {
  const triggerId = useId();

  if (compact) {
    return (
      <div className="relative mt-auto w-full border-t border-border pt-3">
        <button
          id={triggerId}
          type="button"
          disabled={!interactive}
          onClick={onActivate}
          aria-haspopup={interactive ? "menu" : undefined}
          aria-expanded={interactive ? menuOpen : undefined}
          aria-label={interactive ? `Konto: ${name}` : name}
          className="mx-auto flex h-10 w-10 items-center justify-center rounded-[10px] transition-colors duration-[var(--dur-fast)] hover:bg-surface-hover focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] disabled:pointer-events-none"
        >
          <Avatar name={name} size="sm" />
        </button>
        {interactive ? (
          <AccountMenu
            open={menuOpen}
            onClose={onMenuClose}
            onSignOut={onSignOut}
            onOpenProfile={onOpenProfile}
            anchorId={triggerId}
          />
        ) : null}
      </div>
    );
  }

  const body = (
    <>
      <Avatar name={name} size="md" />
      <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground">{name}</span>
      {interactive ? (
        <ChevronUp
          aria-hidden
          className={`h-4 w-4 shrink-0 text-muted transition-transform duration-[var(--dur-fast)] ${
            menuOpen ? "" : "rotate-180"
          }`}
          strokeWidth={1.75}
        />
      ) : null}
    </>
  );

  return (
    <div className="relative mt-auto w-full border-t border-border pt-3">
      {interactive ? (
        <button
          id={triggerId}
          type="button"
          onClick={onActivate}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex w-full min-w-0 items-center gap-3 rounded-[10px] px-3 py-2.5 transition-colors duration-[var(--dur-fast)] hover:bg-surface-hover focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
        >
          {body}
        </button>
      ) : (
        <div className="flex w-full min-w-0 items-center gap-3 rounded-[10px] px-3 py-2.5">{body}</div>
      )}
      {interactive ? (
        <AccountMenu
          open={menuOpen}
          onClose={onMenuClose}
          onSignOut={onSignOut}
          onOpenProfile={onOpenProfile}
          anchorId={triggerId}
        />
      ) : null}
    </div>
  );
}

function LocalTrainerFooter({ compact, name }: { compact?: boolean; name: string }) {
  return (
    <AccountTile
      compact={compact}
      name={name}
      interactive={false}
      menuOpen={false}
      onMenuClose={() => {}}
    />
  );
}

/** Stopka z sesją Clerk — pełnoszerokościowy kafelek z imieniem i nazwiskiem + menu wylogowania. */
function ClerkTrainerFooter({ compact, fallbackName }: { compact?: boolean; fallbackName: string }) {
  const isClient = useIsClient();
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const [menuOpen, setMenuOpen] = useState(false);
  // SSR + hydracja: ten sam fallbackName; imię z Clerka dopiero po mount (bez mismatch).
  const fromClerk = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  const displayName = !isClient
    ? fallbackName
    : fromClerk ||
      user?.fullName?.trim() ||
      fallbackName ||
      user?.primaryEmailAddress?.emailAddress ||
      "Trener";

  return (
    <AccountTile
      compact={compact}
      name={displayName}
      interactive
      menuOpen={menuOpen}
      onActivate={() => setMenuOpen((v) => !v)}
      onMenuClose={() => setMenuOpen(false)}
      onSignOut={() => void signOut({ redirectUrl: "/sign-in" })}
      onOpenProfile={() => openUserProfile()}
    />
  );
}

function TrainerFooter({ compact, name }: { compact?: boolean; name: string }) {
  if (!clerkEnabled) {
    return <LocalTrainerFooter compact={compact} name={name} />;
  }
  return <ClerkTrainerFooter compact={compact} fallbackName={name} />;
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
            aria-current={active ? "page" : undefined}
            className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 font-mono text-[10px] uppercase tracking-caps transition-colors focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] ${
              active ? "font-semibold text-foreground" : "text-muted"
            }`}
          >
            <span
              className={`flex h-7 w-10 items-center justify-center rounded-lg ${
                active ? "bg-accent-dim" : ""
              }`}
            >
              <Icon
                aria-hidden
                className={`h-5 w-5 ${active ? "text-foreground" : "text-muted"}`}
                strokeWidth={1.75}
              />
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
  const [trainerName, setTrainerName] = useState("Trener");
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
    api
      .me()
      .then((me) => {
        const n = me.name?.trim();
        if (n) setTrainerName(n);
      })
      .catch(() => {
        // Imię z /api/me jest opcjonalne — zostaje fallback „Trener”.
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
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-surface-hover text-foreground-secondary hover:bg-surface-active focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </header>

      <aside
        onMouseEnter={() => showRail && setRailExpanded(true)}
        onMouseLeave={() => isPlanEditor && setRailExpanded(false)}
        className={`hidden shrink-0 flex-col gap-6 border-r border-border bg-surface transition-[width] duration-150 md:sticky md:top-0 md:flex md:h-screen md:overflow-hidden ${
          showRail ? "md:w-14 md:items-stretch md:px-1.5 md:py-3" : "md:w-56 md:overflow-y-auto md:p-3"
        }`}
      >
        <Wordmark compact={showRail} className={showRail ? "justify-center" : "px-3"} />
        <NavLinks counts={counts} compact={showRail} />
        <TrainerFooter compact={showRail} name={trainerName} />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Zamknij menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-[var(--overlay-scrim)]"
          />
          <aside className="relative flex h-full w-64 max-w-[80vw] flex-col gap-6 border-r border-border bg-surface p-3 shadow-modal">
            <div className="flex items-center justify-between px-1">
              <Wordmark />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Zamknij menu"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-surface-hover text-foreground-secondary hover:bg-surface-active focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            <NavLinks counts={counts} onNavigate={() => setDrawerOpen(false)} />
            <TrainerFooter name={trainerName} />
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
