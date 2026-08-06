"use client";

import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/api";
import { AuthScreen } from "@/components/auth/AuthScreen";

export default function SignUpPage() {
  if (!clerkEnabled) {
    return (
      <AuthScreen
        title="Rejestracja wyłączona"
        subtitle="W trybie lokalnym bez kluczy Clerk konto nie jest wymagane."
        switchLabel="Masz już konto?"
        switchHref="/sign-in"
        switchCta="Zaloguj się"
      >
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
          Otwórz{" "}
          <Link href="/" className="font-medium text-accent-text hover:underline">
            Panel
          </Link>{" "}
          — lokalnie działa od razu.
        </p>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Załóż konto"
      subtitle="Bez karty. Dodaj klienta, ułóż plan, wyślij link."
      switchLabel="Masz już konto?"
      switchHref="/sign-in"
      switchCta="Zaloguj się"
      requireConsent
    >
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/"
        forceRedirectUrl="/"
      />
    </AuthScreen>
  );
}
