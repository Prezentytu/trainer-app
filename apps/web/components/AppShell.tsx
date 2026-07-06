"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";

const NAV = [
  { href: "/", label: "Panel" },
  { href: "/clients", label: "Klienci" },
  { href: "/exercises", label: "Ćwiczenia" },
  { href: "/plans", label: "Plany" },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 px-2">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent font-black text-accent-foreground">
        T
      </span>
      <span className="text-lg font-bold tracking-tight">
        Trainer<span className="text-accent">Portal</span>
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className="rounded-lg px-3 py-2 text-sm font-medium text-foreground-secondary hover:bg-surface-hover hover:text-accent transition-colors"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

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
          <span className="text-lg">☰</span>
        </button>
      </header>

      <aside className="hidden w-56 shrink-0 flex-col gap-6 border-r border-border bg-surface/60 p-4 md:sticky md:top-0 md:flex md:h-screen md:overflow-y-auto">
        <Logo />
        <NavLinks />
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
                ✕
              </button>
            </div>
            <NavLinks onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <main className="w-full flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
