import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

/** Podgląd landingu (gdy lokalnie Clerk wyłączony i `/` pokazuje panel). */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function LandingPreviewPage() {
  return <LandingPage />;
}
