"use client";

import Link from "next/link";
import { Suspense } from "react";
import { clerkEnabled } from "@/lib/api";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { SignUpForm } from "@/components/auth/SignUpForm";

function SignUpBody() {
  if (!clerkEnabled) {
    return (
      <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
        Otwórz{" "}
        <Link href="/" className="font-medium text-foreground underline">
          Panel
        </Link>{" "}
        — lokalnie działa od razu.
      </p>
    );
  }

  return <SignUpForm />;
}

export default function SignUpPage() {
  return (
    <AuthScreen
      title={clerkEnabled ? "Załóż konto" : "Rejestracja wyłączona"}
      subtitle={
        clerkEnabled
          ? "Bez karty. Dodaj klienta, ułóż plan, wyślij link."
          : "W trybie lokalnym bez kluczy Clerk konto nie jest wymagane."
      }
      switchLabel="Masz już konto?"
      switchHref="/sign-in"
      switchCta="Zaloguj się"
    >
      <Suspense
        fallback={
          <div className="h-40 skeleton-pulse rounded-[var(--r-card)] bg-surface" />
        }
      >
        <SignUpBody />
      </Suspense>
    </AuthScreen>
  );
}
