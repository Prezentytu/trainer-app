import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { clerkEnabled } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { TrainerDashboard } from "@/components/TrainerDashboard";
import { LandingPage } from "@/components/landing/LandingPage";

// Landing vs Panel zależy od sesji Clerka — nie wolno zamrozić jednej wersji w buildzie.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "RepMaxer — wysyłasz link",
  description:
    "Klient otwiera link w przeglądarce — bez konta i bez aplikacji. Po treningu masz serie i rekordy. Piszesz pierwszy, zanim odejdzie.",
  openGraph: {
    title: "RepMaxer — wysyłasz link",
    description:
      "Widzisz trening. Klient otwiera link w przeglądarce — bez konta.",
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
