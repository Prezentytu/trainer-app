import type { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { AppShell } from "@/components/AppShell";
import { clerkEnabled } from "@/lib/api";

export default async function AppLayout({ children }: { children: ReactNode }) {
  if (clerkEnabled) {
    await auth.protect();
  }

  return <AppShell>{children}</AppShell>;
}
