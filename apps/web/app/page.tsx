import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { clerkEnabled } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { TrainerDashboard } from "@/components/TrainerDashboard";
import { LandingPage } from "@/components/landing/LandingPage";

// Landing vs Panel zależy od sesji Clerka — nie wolno zamrozić jednej wersji w buildzie.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "RepMaxer — wiesz, kto nie trenował",
  description:
    "Klient otwiera link w przeglądarce — bez konta. Po treningu widzisz serie i rekordy. Od razu wiesz, kto nie trenował.",
  openGraph: {
    title: "RepMaxer — wiesz, kto nie trenował",
    description:
      "Klient otwiera link w przeglądarce — bez konta. Po treningu widzisz serie i rekordy.",
  },
};

export default async function HomePage() {
  if (!clerkEnabled) {
    return (
      <AppShell>
        <TrainerDashboard />
      </AppShell>
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return <LandingPage />;
  }

  await auth.protect();

  return (
    <AppShell>
      <TrainerDashboard />
    </AppShell>
  );
}
