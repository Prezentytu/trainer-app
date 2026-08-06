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
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-2.5 px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
      {stickyCta ? (
        <div className="pointer-events-auto w-full max-w-lg">
          <Button full size="lg" disabled={stickyCta.disabled} onClick={stickyCta.onClick}>
            {stickyCta.label}
          </Button>
        </div>
      ) : null}
      <nav
        aria-label="Nawigacja portalu"
        className="pointer-events-auto inline-flex gap-0.5 rounded-[var(--r-pill)] border border-border-strong bg-surface p-1"
      >
        {TABS.map((tab) => {
          const active = tab.match(pathname, token);
          return (
            <Link
              key={tab.id}
              href={tab.href(token)}
              aria-current={active ? "page" : undefined}
              aria-label={tab.label}
              className={`flex min-h-[42px] min-w-[62px] flex-col items-center justify-center gap-0.5 rounded-[var(--r-pill)] px-2 transition-colors duration-[var(--dur-fast)] ${FOCUS} ${
                active
                  ? "bg-invert-bg text-invert-fg"
                  : "text-fg-faint hover:bg-surface-raised hover:text-foreground"
              }`}
            >
              <Icon name={tab.icon} size={20} decorative />
              <span className="text-[10px] font-semibold leading-none tracking-wide">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
