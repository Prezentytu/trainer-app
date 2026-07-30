"use client";

import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/api";
import { AuthScreen } from "@/components/auth/AuthScreen";

export default function SignInPage() {
  if (!clerkEnabled) {
    return (
      <AuthScreen
        title="Logowanie wyłączone"
        subtitle="Lokalnie panel działa bez konta Clerk."
        switchLabel="Chcesz założyć konto?"
        switchHref="/sign-up"
        switchCta="Rejestracja"
      >
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
          Brak{" "}
          <code className="font-mono text-foreground-secondary">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code>.
          Otwórz{" "}
          <Link href="/" className="font-medium text-accent hover:underline">
            Panel
          </Link>{" "}
          bezpośrednio.
        </p>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Zaloguj się do studia"
      subtitle="Witaj z powrotem. Kontynuuj pracę z klientami i planami."
      switchLabel="Nie masz konta?"
      switchHref="/sign-up"
      switchCta="Utwórz konto"
    >
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
        forceRedirectUrl="/"
      />
    </AuthScreen>
  );
}
