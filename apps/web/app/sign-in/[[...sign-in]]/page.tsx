"use client";

import { SignIn } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/api";

export default function SignInPage() {
  if (!clerkEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="max-w-md text-center text-sm text-muted">
          Clerk nie jest skonfigurowany (brak{" "}
          <code className="font-mono text-foreground-secondary">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code>
          ). Lokalnie panel działa bez logowania.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </div>
  );
}
