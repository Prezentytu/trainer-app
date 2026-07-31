"use client";

import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ClerkProvider, RedirectToSignIn, useAuth } from "@clerk/nextjs";
import { plPL } from "@clerk/localizations";
import { clerkEnabled, setAuthTokenGetter } from "@/lib/api";
import { clerkAppearance } from "@/lib/clerkAppearance";

function AuthTokenBridge({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);
  return <>{children}</>;
}

function Guard({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const { isLoaded, isSignedIn } = useAuth();
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up");

  if (isPublic) return <>{children}</>;
  if (!isLoaded) {
    return <p className="p-8 text-center text-sm text-muted">Ładowanie…</p>;
  }
  if (!isSignedIn) return <RedirectToSignIn signInFallbackRedirectUrl="/" />;

  return <>{children}</>;
}

/** Opakowuje panel trenera w Clerk gdy skonfigurowany; portal i lokal bez kluczy — bez auth. */
export function ClerkAppProvider({ children }: { children: ReactNode }) {
  if (!clerkEnabled) return <>{children}</>;

  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      afterSignOutUrl="/sign-in"
      localization={plPL}
      appearance={clerkAppearance}
    >
      <AuthTokenBridge>
        <Guard>{children}</Guard>
      </AuthTokenBridge>
    </ClerkProvider>
  );
}
