"use client";

import { useSignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, ErrorBanner, Field, inputClass } from "@/components/ui";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { PasswordField } from "@/components/auth/PasswordField";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import {
  authErrorMessage,
  fieldErrorMessage,
  isIdentifierNotFound,
} from "@/components/auth/authErrors";
import { finalizeAndRedirect } from "@/components/auth/finalizeSession";
import { CodeInput } from "@/components/auth/CodeInput";

export function SignInForm() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "reset">("signin");
  const [trustStep, setTrustStep] = useState(false);
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);

  const busy = fetchStatus === "fetching";
  const notFound = isIdentifierNotFound(errors);
  const banner = useMemo(() => {
    if (localError) return localError;
    if (notFound) return null; // pokazujemy inline z linkiem
    return authErrorMessage(errors);
  }, [localError, errors, notFound]);

  const emailFieldError =
    emailTouched && !email.trim()
      ? "Podaj adres e-mail."
      : fieldErrorMessage(errors.fields.identifier);

  async function onGoogle() {
    setLocalError(null);
    const { error } = await signIn.sso({
      strategy: "oauth_google",
      redirectUrl: "/",
      redirectCallbackUrl: "/sso-callback",
    });
    if (error) {
      setLocalError(error.longMessage ?? error.message);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    setEmailTouched(true);
    if (!email.trim()) return;
    if (!password) {
      setLocalError("Podaj hasło.");
      return;
    }

    const { error } = await signIn.password({
      emailAddress: email.trim(),
      password,
    });
    if (error) {
      setLocalError(error.longMessage ?? error.message);
      return;
    }

    if (signIn.status === "complete") {
      const { error: finError } = await finalizeAndRedirect(
        (p) => signIn.finalize(p),
        router,
      );
      if (finError) {
        const err = finError as { longMessage?: string; message?: string };
        setLocalError(err.longMessage ?? err.message ?? "Nie udało się zalogować.");
      }
      return;
    }

    if (signIn.status === "needs_client_trust") {
      const emailFactor = signIn.supportedSecondFactors?.find(
        (f) => f.strategy === "email_code",
      );
      if (emailFactor) {
        await signIn.mfa.sendEmailCode();
        setTrustStep(true);
        return;
      }
    }

    if (signIn.status === "needs_second_factor") {
      setLocalError(
        "To konto wymaga dodatkowego potwierdzenia. Użyj logowania przez Google albo skontaktuj się z nami.",
      );
      return;
    }

    setLocalError("Logowanie nie zostało dokończone. Spróbuj ponownie.");
  }

  async function verifyTrust(value: string) {
    setLocalError(null);
    const { error } = await signIn.mfa.verifyEmailCode({ code: value });
    if (error) {
      setLocalError(error.longMessage ?? error.message);
      return;
    }
    if (signIn.status === "complete") {
      const { error: finError } = await finalizeAndRedirect(
        (p) => signIn.finalize(p),
        router,
      );
      if (finError) {
        const err = finError as { longMessage?: string; message?: string };
        setLocalError(err.longMessage ?? err.message ?? "Nie udało się zalogować.");
      }
    }
  }

  if (mode === "reset") {
    return (
      <ResetPasswordForm
        initialEmail={email}
        onCancel={() => setMode("signin")}
      />
    );
  }

  if (trustStep) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.length === 6) void verifyTrust(code);
        }}
        className="space-y-4"
      >
        <ErrorBanner message={banner} />
        <p className="text-sm text-muted">
          Potwierdź logowanie kodem wysłanym na e-mail.
        </p>
        <Field label="Kod z e-maila">
          <CodeInput
            value={code}
            onChange={setCode}
            onComplete={(v) => void verifyTrust(v)}
            disabled={busy}
            error={fieldErrorMessage(errors.fields.code)}
            autoFocus
          />
        </Field>
        <Button
          type="submit"
          full
          size="lg"
          loading={busy}
          disabled={code.length !== 6}
        >
          Potwierdź
        </Button>
        <button
          type="button"
          onClick={() => {
            void signIn.reset();
            setTrustStep(false);
            setCode("");
          }}
          className="w-full text-center text-sm text-muted underline decoration-transparent underline-offset-[3px] hover:text-foreground hover:decoration-foreground"
        >
          Zacznij od nowa
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <GoogleButton onClick={() => void onGoogle()} loading={busy} />

      <div className="flex items-center gap-3 text-xs text-muted-faint">
        <div className="h-px flex-1 bg-border" />
        <span>lub</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <ErrorBanner message={banner} />

        {notFound ? (
          <div
            role="alert"
            className="rounded-[var(--r-field)] border border-border bg-surface px-4 py-3 text-sm text-muted"
          >
            Nie znaleziono konta z tym adresem.{" "}
            <Link
              href={`/sign-up?email=${encodeURIComponent(email.trim())}`}
              className="font-medium text-foreground underline"
            >
              Załóż konto
            </Link>
          </div>
        ) : null}

        <Field label="Adres e-mail">
          <input
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            placeholder="Wprowadź adres e-mail"
            value={email}
            disabled={busy}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            className={inputClass}
            aria-invalid={emailFieldError ? true : undefined}
          />
          {emailFieldError && !notFound ? (
            <p role="alert" className="mt-1 text-xs text-danger">
              {emailFieldError}
            </p>
          ) : null}
        </Field>

        <PasswordField
          label="Hasło"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          error={fieldErrorMessage(errors.fields.password)}
          disabled={busy}
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setMode("reset")}
            className="text-sm text-muted underline decoration-transparent underline-offset-[3px] hover:text-foreground hover:decoration-foreground"
          >
            Nie pamiętam hasła
          </button>
        </div>

        <Button type="submit" full size="lg" loading={busy}>
          Zaloguj się
          <span aria-hidden className="text-base leading-none">
            →
          </span>
        </Button>
      </form>
    </div>
  );
}
