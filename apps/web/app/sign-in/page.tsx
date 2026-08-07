"use client";

import Link from "next/link";
import { Suspense } from "react";
import { clerkEnabled } from "@/lib/api";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { SignInForm } from "@/components/auth/SignInForm";

function SignInBody() {
  if (!clerkEnabled) {
    return (
      <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
        Brak{" "}
        <code className="font-mono text-foreground-secondary">
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
        </code>
        . Otwórz{" "}
        <Link href="/" className="font-medium text-foreground underline">
          Panel
        </Link>{" "}
        bezpośrednio.
      </p>
    );
  }

  return <SignInForm />;
}

export default function SignInPage() {
  return (
    <AuthScreen
      title={clerkEnabled ? "Zaloguj się" : "Logowanie wyłączone"}
      subtitle={
        clerkEnabled
          ? "Wróć do swoich klientów i planów."
          : "Lokalnie panel działa bez konta Clerk."
      }
      switchLabel={clerkEnabled ? "Nie masz konta?" : "Chcesz założyć konto?"}
      switchHref="/sign-up"
      switchCta={clerkEnabled ? "Załóż konto" : "Rejestracja"}
    >
      <Suspense
        fallback={
          <div className="h-40 animate-pulse rounded-[var(--r-card)] bg-surface" />
        }
      >
        <SignInBody />
      </Suspense>
    </AuthScreen>
  );
}
