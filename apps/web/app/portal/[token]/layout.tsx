"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { PortalBottomNav } from "@/components/portal/PortalBottomNav";
import { PortalChromeProvider } from "@/components/portal/PortalChrome";

export default function PortalTokenLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ token: string }>();
  const token = params.token;

  return (
    <PortalChromeProvider>
      {children}
      <PortalBottomNav token={token} />
    </PortalChromeProvider>
  );
}
