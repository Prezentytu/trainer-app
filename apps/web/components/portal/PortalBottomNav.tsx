"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui";
import { usePortalStickyCta } from "@/components/portal/PortalChrome";

const TABS = [
  {
    id: "today",
    label: "Dziś",
    href: (token: string) => `/portal/${token}`,
    match: (path: string, token: string) => path === `/portal/${token}` || path === `/portal/${token}/`,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M14.4 14.4 9.6 9.6" />
        <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z" />
        <path d="m21.5 21.5-1.4-1.4" />
        <path d="M3.9 3.9 2.5 2.5" />
        <path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z" />
      </svg>
    ),
  },
  {
    id: "history",
    label: "Historia",
    href: (token: string) => `/portal/${token}/history`,
    match: (path: string, token: string) => path.startsWith(`/portal/${token}/history`),
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l4 2" />
      </svg>
    ),
  },
  {
    id: "progress",
    label: "Progres",
    href: (token: string) => `/portal/${token}/progress`,
    match: (path: string, token: string) => path.startsWith(`/portal/${token}/progress`),
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 3v16a2 2 0 0 0 2 2h16" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Profil",
    href: (token: string) => `/portal/${token}/profile`,
    match: (path: string, token: string) => path.startsWith(`/portal/${token}/profile`),
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="8" r="5" />
        <path d="M20 21a8 8 0 0 0-16 0" />
      </svg>
    ),
  },
] as const;

export function PortalBottomNav({ token }: { token: string }) {
  const pathname = usePathname() ?? "";
  const { stickyCta } = usePortalStickyCta();

  if (
    pathname.includes(`/portal/${token}/session`) ||
    pathname.includes(`/portal/${token}/intake`) ||
    pathname.includes(`/portal/${token}/measurements`)
  ) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/80 px-5 pt-3 backdrop-blur-md"
      style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto w-full max-w-lg">
        {stickyCta ? (
          <div className="mb-2.5">
            <Button
              full
              size="lg"
              disabled={stickyCta.disabled}
              onClick={stickyCta.onClick}
            >
              {stickyCta.label}
            </Button>
          </div>
        ) : null}
        <nav aria-label="Nawigacja portalu" className="flex">
          {TABS.map((tab) => {
            const active = tab.match(pathname, token);
            return (
              <Link
                key={tab.id}
                href={tab.href(token)}
                className="flex min-h-11 flex-1 flex-col items-center gap-0.5 rounded-[10px] px-1 py-1.5 transition-colors active:bg-surface-hover"
              >
                <span className={active ? "text-accent" : "text-muted"}>{tab.icon}</span>
                <span
                  className={`text-[11px] ${
                    active ? "font-semibold text-accent" : "font-normal text-muted"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
