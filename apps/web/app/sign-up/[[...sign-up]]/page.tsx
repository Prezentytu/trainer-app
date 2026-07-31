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
          <Link href="/" className="font-medium text-accent hover:underline">
            Panel
          </Link>{" "}
          — lokalnie działa od razu.
        </p>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Utwórz konto trenera"
      subtitle="Bez karty. Dodaj klienta, ułóż plan, wyślij link."
      footerHint={
        <p className="rounded-[10px] border border-accent-border bg-accent-dim px-3 py-2 text-xs text-accent-strong">
          We wczesnym dostępie — za darmo. Twoje dane zawsze możesz wyeksportować.
        </p>
      }
      switchLabel="Masz już konto?"
      switchHref="/sign-in"
      switchCta="Zaloguj się"
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
