"use client";

import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/Wordmark";
import { ErrorBanner } from "@/components/ui";
import { finalizeAndRedirect } from "@/components/auth/finalizeSession";
import { clerkEnabled } from "@/lib/api";

function SsoShell({
  error,
  children,
}: {
  error?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-8">
        <Wordmark />
      </div>
      <div className="w-full max-w-sm space-y-4 text-center">
        {children}
        <ErrorBanner message={error ?? null} />
        {error ? (
          <Link
            href="/sign-in"
            className="inline-block text-sm font-medium text-foreground underline"
          >
            Wróć do logowania
          </Link>
        ) : null}
        <div id="clerk-captcha" />
      </div>
    </div>
  );
}

/**
 * Callback OAuth (Future API) — finalizuje sign-in / sign-up po powrocie z Google.
 * Wzorzec: https://clerk.com/docs/guides/development/custom-flows/authentication/oauth-connections
 */
function SsoCallbackInner() {
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const router = useRouter();
  const hasRun = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      if (!clerk.loaded || hasRun.current) return;
      hasRun.current = true;

      try {
        if (signIn.status === "complete") {
          await finalizeAndRedirect((p) => signIn.finalize(p), router);
          return;
        }

        if (signUp.isTransferable) {
          await signIn.create({ transfer: true });
          // TS nie wie, że create() mutuje status — jak w docs Clerka.
          const afterTransfer = signIn.status as typeof signIn.status | "complete";
          if (afterTransfer === "complete") {
            await finalizeAndRedirect((p) => signIn.finalize(p), router);
            return;
          }
          router.replace("/sign-in");
          return;
        }

        if (
          signIn.status === "needs_first_factor" &&
          !signIn.supportedFirstFactors?.every((f) => f.strategy === "enterprise_sso")
        ) {
          router.replace("/sign-in");
          return;
        }

        if (signIn.isTransferable) {
          await signUp.create({ transfer: true });
          if (signUp.status === "complete") {
            await finalizeAndRedirect((p) => signUp.finalize(p), router);
            return;
          }
          router.replace("/sign-up");
          return;
        }

        if (signUp.status === "complete") {
          await finalizeAndRedirect((p) => signUp.finalize(p), router);
          return;
        }

        if (
          signIn.status === "needs_second_factor" ||
          signIn.status === "needs_new_password"
        ) {
          router.replace("/sign-in");
          return;
        }

        const sessionId =
          signIn.existingSession?.sessionId || signUp.existingSession?.sessionId;
        if (sessionId) {
          await clerk.setActive({
            session: sessionId,
            navigate: async ({ session, decorateUrl }) => {
              if (session?.currentTask) return;
              const url = decorateUrl("/");
              if (url.startsWith("http")) {
                window.location.href = url;
              } else {
                router.push(url);
              }
            },
          });
          return;
        }

        router.replace("/sign-in");
      } catch (e) {
        const err = e as { longMessage?: string; message?: string };
        setError(err.longMessage ?? err.message ?? "Logowanie Google nie powiodło się.");
      }
    })();
  }, [clerk, signIn, signUp, router]);

  return (
    <SsoShell error={error}>
      <p className="display-soft text-xl text-foreground">Łączę z Google…</p>
      <p className="text-sm text-muted">Chwilę — kończymy logowanie.</p>
    </SsoShell>
  );
}

export default function SsoCallbackPage() {
  if (!clerkEnabled) {
    return (
      <SsoShell>
        <p className="display-soft text-xl text-foreground">Logowanie wyłączone</p>
        <p className="text-sm text-muted">
          Lokalnie panel działa bez Clerka.{" "}
          <Link href="/" className="font-medium text-foreground underline">
            Otwórz panel
          </Link>
          .
        </p>
      </SsoShell>
    );
  }

  return <SsoCallbackInner />;
}
