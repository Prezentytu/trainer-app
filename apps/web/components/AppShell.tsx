"use client";

import { ReactNode, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { api, clerkEnabled } from "@/lib/api";
import { Avatar, useIsClient } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
import { Wordmark } from "@/components/Wordmark";

const NAV: { href: string; label: string; icon: IconName; countKey: "clients" | "plans" | null }[] = [
  { href: "/", label: "Panel", icon: "home", countKey: null },
  { href: "/clients", label: "Klienci", icon: "clients", countKey: "clients" },
  { href: "/exercises", label: "Ćwiczenia", icon: "dumbbell", countKey: null },
  { href: "/plans", label: "Plany", icon: "plans", countKey: "plans" },
  { href: "/settings", label: "Ustawienia", icon: "settings", countKey: null },
];

const FOCUS = "focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]";

function SideNavLinks({
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
    <nav className="flex flex-col gap-0.5" aria-label="Główna nawigacja">
      {NAV.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
        const count = item.countKey ? counts[item.countKey] : null;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={compact ? item.label : undefined}
            aria-current={active ? "page" : undefined}
            aria-label={compact ? item.label : undefined}
            className={`flex min-h-[44px] items-center rounded-[var(--r-pill)] text-[15px] font-medium transition-colors duration-[var(--dur-fast)] ${FOCUS} ${
              active
                ? "bg-invert-bg text-invert-fg"
                : "text-fg-faint hover:bg-surface-raised hover:text-foreground"
            } ${compact ? "justify-center px-0" : "gap-3 px-3"}`}
          >
            <Icon name={item.icon} size={20} decorative />
            {!compact ? (
              <>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {count != null ? (
                  <span
                    className={`shrink-0 font-mono text-[12px] tabular-nums ${
                      active ? "opacity-70" : "text-fg-ghost"
                    }`}
                  >
                    {count}
                  </span>
                ) : null}
              </>
            ) : null}
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
  align = "up",
}: {
  open: boolean;
  onClose: () => void;
  onSignOut?: () => void;
  onOpenProfile?: () => void;
  anchorId: string;
  align?: "up" | "down";
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
      className={`absolute left-0 z-50 w-full min-w-[12rem] overflow-hidden rounded-[var(--r-card)] border border-border-strong bg-surface ${
        align === "up" ? "bottom-full mb-2" : "top-full mt-2"
      }`}
    >
      {onOpenProfile ? (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onOpenProfile();
            onClose();
          }}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[15px] text-fg-muted transition-colors hover:bg-surface-raised hover:text-foreground"
        >
          <Icon name="settings" size={16} decorative />
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
          className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[15px] text-fg-muted transition-colors hover:bg-surface-raised hover:text-foreground"
        >
          <Icon name="sign-out" size={16} decorative />
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
          className={`mx-auto flex h-10 w-10 items-center justify-center rounded-[var(--r-pill)] transition-colors duration-[var(--dur-fast)] hover:bg-surface-raised ${FOCUS} disabled:pointer-events-none`}
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
      <span className="min-w-0 flex-1 truncate text-left text-[15px] font-medium text-foreground">
        {name}
      </span>
      {interactive ? (
        <Icon
          name="caret-left"
          size={14}
          className={`shrink-0 text-muted transition-transform duration-[var(--dur-fast)] ${
            menuOpen ? "rotate-90" : "-rotate-90"
          }`}
          decorative
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
          className={`flex w-full min-w-0 items-center gap-3 rounded-[var(--r-pill)] px-3 py-2.5 transition-colors duration-[var(--dur-fast)] hover:bg-surface-raised ${FOCUS}`}
        >
          {body}
        </button>
      ) : (
        <div className="flex w-full min-w-0 items-center gap-3 rounded-[var(--r-pill)] px-3 py-2.5">
          {body}
        </div>
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

function ClerkTrainerFooter({ compact, fallbackName }: { compact?: boolean; fallbackName: string }) {
  const isClient = useIsClient();
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const [menuOpen, setMenuOpen] = useState(false);
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
  if (!clerkEnabled) return <LocalTrainerFooter compact={compact} name={name} />;
  return <ClerkTrainerFooter compact={compact} fallbackName={name} />;
}

function FloatingBottomNav() {
  const pathname = usePathname();
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4 md:hidden"
      style={{ bottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
    >
      <nav
        aria-label="Główna nawigacja"
        className="pointer-events-auto inline-flex gap-0.5 rounded-[var(--r-pill)] border border-border-strong bg-surface-raised p-1"
      >
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
              className={`flex min-h-[44px] min-w-[48px] items-center justify-center rounded-[var(--r-pill)] px-2 transition-colors duration-[var(--dur-fast)] ${FOCUS} ${
                active
                  ? "bg-invert-bg text-invert-fg"
                  : "text-fg-faint hover:bg-surface hover:text-foreground"
              }`}
            >
              <Icon name={item.icon} size={20} decorative />
            </Link>
          );
        })}
      </nav>
    </div>
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
  // Board/kreator: viewport lock + wąski rail. /plans/import to długi formularz — normalny scroll strony.
  const isPlanEditor =
    /^\/plans\/.+/.test(pathname ?? "") && !(pathname ?? "").startsWith("/plans/import");
  const showRail = isPlanEditor && !railExpanded;

  useEffect(() => {
    api
      .counts()
      .then((c) => setCounts({ clients: c.clients, plans: c.plans }))
      .catch(() => {});
    api
      .me()
      .then((me) => {
        const n = me.name?.trim();
        if (n) setTrainerName(n);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background px-4 py-3 md:hidden">
        <Wordmark />
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Otwórz menu"
          className={`inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[var(--r-pill)] text-fg-muted hover:bg-surface-raised hover:text-foreground ${FOCUS}`}
        >
          <Icon name="menu" size={20} decorative />
        </button>
      </header>

      {/* Desktop left sidebar */}
      <aside
        onMouseEnter={() => showRail && setRailExpanded(true)}
        onMouseLeave={() => isPlanEditor && setRailExpanded(false)}
        className={`hidden shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-150 md:sticky md:top-0 md:flex md:h-screen ${
          showRail
            ? "md:w-14 md:items-stretch md:overflow-hidden md:px-1.5 md:py-3"
            : "md:w-56 md:overflow-y-auto md:p-3"
        }`}
      >
        <div className={`mb-6 ${showRail ? "flex justify-center" : "px-3 pt-1"}`}>
          <Wordmark compact={showRail} />
        </div>
        <SideNavLinks counts={counts} compact={showRail} />
        <TrainerFooter compact={showRail} name={trainerName} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Zamknij menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-[var(--scrim)]"
          />
          <aside className="relative flex h-full w-64 max-w-[80vw] flex-col gap-6 border-r border-border bg-surface p-3">
            <div className="flex items-center justify-between px-1">
              <Wordmark />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Zamknij menu"
                className={`inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[var(--r-pill)] text-fg-muted hover:bg-surface-raised ${FOCUS}`}
              >
                <Icon name="close" size={20} decorative />
              </button>
            </div>
            <SideNavLinks counts={counts} onNavigate={() => setDrawerOpen(false)} />
            <TrainerFooter name={trainerName} />
          </aside>
        </div>
      ) : null}

      <main
        className={`w-full min-w-0 flex-1 bg-background p-4 pb-28 md:p-6 ${
          isPlanEditor
            ? "md:flex md:h-dvh md:flex-col md:overflow-hidden md:pb-4"
            : "md:p-8 md:pb-8"
        }`}
      >
        <div
          className={`mx-auto w-full min-w-0 ${
            isPlanEditor
              ? "flex min-h-0 flex-1 flex-col max-w-[120rem]"
              : "max-w-[1080px] 2xl:max-w-[100rem]"
          }`}
        >
          {children}
        </div>
      </main>

      <FloatingBottomNav />
    </div>
  );
}
