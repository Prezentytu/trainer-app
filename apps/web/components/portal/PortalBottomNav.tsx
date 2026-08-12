"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
import { usePortalStickyCta } from "@/components/portal/PortalChrome";

const TABS: {
  id: string;
  label: string;
  href: (token: string) => string;
  match: (path: string, token: string) => boolean;
  icon: IconName;
}[] = [
  {
    id: "today",
    label: "Dziś",
    href: (token) => `/portal/${token}`,
    match: (path, token) => path === `/portal/${token}` || path === `/portal/${token}/`,
    icon: "house",
  },
  {
    id: "history",
    label: "Historia",
    href: (token) => `/portal/${token}/history`,
    match: (path, token) => path.startsWith(`/portal/${token}/history`),
    icon: "history",
  },
  {
    id: "progress",
    label: "Progres",
    href: (token) => `/portal/${token}/progress`,
    match: (path, token) => path.startsWith(`/portal/${token}/progress`),
    icon: "progress",
  },
  {
    id: "profile",
    label: "Profil",
    href: (token) => `/portal/${token}/profile`,
    match: (path, token) => path.startsWith(`/portal/${token}/profile`),
    icon: "user",
  },
];

const FOCUS = "focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]";

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
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background">
      {stickyCta ? (
        <div className="mx-auto max-w-lg px-4 pt-3">
          <Button
            full
            size="lg"
            disabled={stickyCta.disabled}
            loading={stickyCta.loading}
            onClick={stickyCta.onClick}
          >
            {stickyCta.label}
          </Button>
        </div>
      ) : null}
      <nav aria-label="Nawigacja portalu" className="mx-auto flex max-w-lg">
        {TABS.map((tab) => {
          const active = tab.match(pathname, token);
          return (
            <Link
              key={tab.id}
              href={tab.href(token)}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-[color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] active:[transform:var(--press)] ${FOCUS} ${
                active ? "text-foreground" : "text-muted hover:text-foreground-secondary"
              }`}
            >
              <span
                className={`h-0.5 w-4 rounded-full ${active ? "bg-invert-bg" : "bg-transparent"}`}
                aria-hidden
              />
              <Icon name={tab.icon} size={20} decorative />
              <span
                className={`text-xs leading-none tracking-wide ${
                  active ? "font-semibold" : "font-medium"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
