import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { clerkEnabled } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { TrainerDashboard } from "@/components/TrainerDashboard";
import { LandingPage } from "@/components/landing/LandingPage";

// Landing vs Panel zależy od sesji Clerka — nie wolno zamrozić jednej wersji w buildzie.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "RepMaxer — wszyscy podopieczni w jednym raporcie",
  description:
    "Wysyłasz arkusz albo zrzuty z WhatsAppa. Wraca gotowa lista i trzy wiadomości do wysłania. Za 0 zł, w 24 godziny.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "RepMaxer — wszyscy podopieczni w jednym raporcie",
    description:
      "Wysyłasz arkusz albo zrzuty. Wraca lista i trzy wiadomości. Za 0 zł, w 24 godziny.",
  },
  twitter: {
    card: "summary_large_image",
    title: "RepMaxer — wszyscy podopieczni w jednym raporcie",
    description:
      "Wysyłasz arkusz albo zrzuty. Wraca lista i trzy wiadomości. Za 0 zł, w 24 godziny.",
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
