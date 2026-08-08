"use client";

import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ClerkProvider, RedirectToSignIn, useAuth } from "@clerk/nextjs";
import { clerkEnabled, markAuthReady, setAuthTokenGetter } from "@/lib/api";

function AuthTokenBridge({ children }: { children: ReactNode }) {
  const { isLoaded, getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter((opts) => getToken(opts));
    if (isLoaded) markAuthReady();
    return () => setAuthTokenGetter(null);
  }, [getToken, isLoaded]);
  return <>{children}</>;
}

function Guard({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const { isLoaded, isSignedIn } = useAuth();
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/sso-callback");

  if (isPublic) return <>{children}</>;
  // Nie podmieniaj drzewa przed isLoaded — SSR już przeszedł auth.protect();
  // „Ładowanie…” vs treść strony = hydration mismatch.
  if (!isLoaded) return <>{children}</>;
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
    >
      <AuthTokenBridge>
        <Guard>{children}</Guard>
      </AuthTokenBridge>
    </ClerkProvider>
  );
}
