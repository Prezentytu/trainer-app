"use client";

import { SignUp } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/api";

export default function SignUpPage() {
  if (!clerkEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-sm text-muted">Rejestracja wyłączona w trybie lokalnym.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </div>
  );
}
