"use client";

import { ReactNode, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/api";
import { getNavShell, refreshNavCounts, subscribeNavShell } from "@/lib/navCounts";
import { Avatar, useIsClient, usePresence } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
import { Wordmark } from "@/components/Wordmark";

const NAV_SHELL_SSR = { clients: null, plans: null, trainerName: "Trener" } as const;

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Panel", icon: "home" },
  { href: "/clients", label: "Klienci", icon: "clients" },
  { href: "/plans", label: "Plany", icon: "plans" },
  { href: "/exercises", label: "Ćwiczenia", icon: "dumbbell" },
  { href: "/settings", label: "Ustawienia", icon: "settings" },
];

const FOCUS = "focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]";
const PRESS = "active:[transform:var(--press)]";

function SideNavLinks({
  onNavigate,
  compact,
}: {
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Główna nawigacja">
      {NAV.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={compact ? item.label : undefined}
            aria-current={active ? "page" : undefined}
            aria-label={compact ? item.label : undefined}
            className={`flex min-h-[44px] items-center rounded-[var(--r-pill)] text-[15px] font-medium transition-[background-color,color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] ${FOCUS} ${PRESS} ${
              active
                ? "bg-invert-bg text-invert-fg"
                : "text-fg-faint hover:bg-surface-raised hover:text-foreground"
            } ${compact ? "justify-center px-0" : "gap-3 px-3"}`}
          >
            <Icon name={item.icon} size={20} decorative />
            {!compact ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
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
          className={`flex w-full min-h-11 items-center gap-3 px-3 py-2.5 text-left text-[15px] text-fg-muted transition-[background-color,color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-surface-raised hover:text-foreground ${FOCUS} ${PRESS}`}
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
          className={`flex w-full min-h-11 items-center gap-3 px-3 py-2.5 text-left text-[15px] text-fg-muted transition-[background-color,color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-surface-raised hover:text-foreground ${FOCUS} ${PRESS}`}
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
              className={`flex min-h-[44px] min-w-[48px] items-center justify-center rounded-[var(--r-pill)] px-2 transition-[background-color,color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] ${FOCUS} ${PRESS} ${
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
  const { mounted: drawerMounted, entered: drawerEntered } = usePresence(drawerOpen);
  const [railExpanded, setRailExpanded] = useState(false);
  const shell = useSyncExternalStore(subscribeNavShell, getNavShell, () => NAV_SHELL_SSR);
  const trainerName = shell.trainerName;
  const pathname = usePathname();
  // Board/kreator: viewport lock + wąski rail. /plans/import to długi formularz — normalny scroll strony.
  const isPlanEditor =
    /^\/plans\/.+/.test(pathname ?? "") && !(pathname ?? "").startsWith("/plans/import");
  const showRail = isPlanEditor && !railExpanded;

  useEffect(() => {
    void refreshNavCounts();
  }, [pathname]);

  const drawerEase = drawerEntered ? "ease-[var(--ease-out)]" : "ease-[var(--ease-in)]";

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background px-4 py-3 md:hidden">
        <Wordmark />
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Otwórz menu"
          className={`inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[var(--r-pill)] text-fg-muted transition-[background-color,color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-surface-raised hover:text-foreground ${FOCUS} ${PRESS}`}
        >
          <Icon name="menu" size={20} decorative />
        </button>
      </header>

      {/* Desktop left sidebar */}
      <aside
        onMouseEnter={() => showRail && setRailExpanded(true)}
        onMouseLeave={() => isPlanEditor && setRailExpanded(false)}
        className={`hidden shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-[var(--dur-fast)] md:sticky md:top-0 md:flex md:h-screen ${
          showRail
            ? "md:w-14 md:items-stretch md:overflow-hidden md:px-1.5 md:py-3"
            : "md:w-56 md:overflow-y-auto md:p-3"
        }`}
      >
        <div className={`mb-6 ${showRail ? "flex justify-center" : "px-3 pt-1"}`}>
          <Wordmark compact={showRail} />
        </div>
        <SideNavLinks compact={showRail} />
        <TrainerFooter compact={showRail} name={trainerName} />
      </aside>

      {/* Mobile drawer */}
      {drawerMounted ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Zamknij menu"
            onClick={() => setDrawerOpen(false)}
            className={`absolute inset-0 bg-[var(--scrim)] transition-opacity duration-[var(--dur-med)] motion-reduce:duration-[var(--dur-fast)] ${drawerEase} ${
              drawerEntered ? "opacity-100" : "opacity-0"
            }`}
          />
          <aside
            className={`relative flex h-full w-64 max-w-[80vw] flex-col gap-6 border-r border-border bg-surface p-3 transition-[transform,opacity] duration-[var(--dur-med)] motion-reduce:duration-[var(--dur-fast)] motion-reduce:transform-none ${drawerEase} ${
              drawerEntered
                ? "opacity-100 motion-safe:translate-x-0"
                : "opacity-0 motion-safe:-translate-x-3"
            }`}
          >
            <div className="flex items-center justify-between px-1">
              <Wordmark />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Zamknij menu"
                className={`inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[var(--r-pill)] text-fg-muted transition-[background-color,color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-surface-raised ${FOCUS} ${PRESS}`}
              >
                <Icon name="close" size={20} decorative />
              </button>
            </div>
            <SideNavLinks onNavigate={() => setDrawerOpen(false)} />
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
