"use client";

import { useSignUp } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, ErrorBanner, Field, inputClass } from "@/components/ui";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { PasswordField } from "@/components/auth/PasswordField";
import { CodeInput } from "@/components/auth/CodeInput";
import {
  authErrorMessage,
  fieldErrorMessage,
  isIdentifierExists,
} from "@/components/auth/authErrors";
import { finalizeAndRedirect } from "@/components/auth/finalizeSession";

export function SignUpForm() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const busy = fetchStatus === "fetching";
  const exists = isIdentifierExists(errors);
  const verifying =
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0;

  const banner = useMemo(() => {
    if (localError) return localError;
    if (exists) return null;
    return authErrorMessage(errors);
  }, [localError, errors, exists]);

  const emailFieldError =
    emailTouched && !email.trim()
      ? "Podaj adres e-mail."
      : fieldErrorMessage(errors.fields.emailAddress);

  const passwordFieldError =
    passwordTouched && password.length > 0 && password.length < 8
      ? "Hasło musi mieć co najmniej 8 znaków."
      : fieldErrorMessage(errors.fields.password);

  async function onGoogle() {
    setLocalError(null);
    if (!consent) {
      setLocalError("Zaznacz zgodę na regulamin, żeby kontynuować.");
      return;
    }
    const { error } = await signUp.sso({
      strategy: "oauth_google",
      redirectUrl: "/",
      redirectCallbackUrl: "/sso-callback",
      legalAccepted: true,
    });
    if (error) {
      setLocalError(error.longMessage ?? error.message);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    setEmailTouched(true);
    setPasswordTouched(true);

    if (!email.trim()) return;
    if (password.length < 8) {
      setLocalError("Hasło musi mieć co najmniej 8 znaków.");
      return;
    }
    if (!consent) {
      setLocalError("Zaznacz zgodę na regulamin, żeby założyć konto.");
      return;
    }

    const { error } = await signUp.password({
      emailAddress: email.trim(),
      password,
      legalAccepted: true,
    });
    if (error) {
      setLocalError(error.longMessage ?? error.message);
      return;
    }

    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (sendError) {
      setLocalError(sendError.longMessage ?? sendError.message);
    }
  }

  async function verifyCode(value: string) {
    setLocalError(null);
    const { error } = await signUp.verifications.verifyEmailCode({
      code: value,
    });
    if (error) {
      setLocalError(error.longMessage ?? error.message);
      return;
    }

    if (signUp.status === "complete") {
      const { error: finError } = await finalizeAndRedirect(
        (p) => signUp.finalize(p),
        router,
      );
      if (finError) {
        const err = finError as { longMessage?: string; message?: string };
        setLocalError(err.longMessage ?? err.message ?? "Nie udało się zalogować.");
      }
    } else {
      setLocalError("Weryfikacja nie została dokończona. Spróbuj ponownie.");
    }
  }

  if (verifying) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.length === 6) void verifyCode(code);
        }}
        className="space-y-4"
      >
        <ErrorBanner message={banner} />
        <p className="text-sm text-muted">
          Wpisz kod, który wysłaliśmy na{" "}
          <span className="text-foreground">{signUp.emailAddress ?? email}</span>.
        </p>
        <Field label="Kod z e-maila">
          <CodeInput
            value={code}
            onChange={setCode}
            onComplete={(v) => void verifyCode(v)}
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
          Potwierdź e-mail
        </Button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void signUp.verifications.sendEmailCode()}
          className="w-full text-center text-sm text-muted underline decoration-transparent underline-offset-[3px] hover:text-foreground hover:decoration-foreground disabled:opacity-45"
        >
          Wyślij kod ponownie
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <GoogleButton
        onClick={() => void onGoogle()}
        loading={busy}
        disabled={!consent}
      />

      <div className="flex items-center gap-3 text-xs text-muted-faint">
        <div className="h-px flex-1 bg-border" />
        <span>lub</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <ErrorBanner message={banner} />

        {exists ? (
          <div
            role="alert"
            className="rounded-[var(--r-field)] border border-border bg-surface px-4 py-3 text-sm text-muted"
          >
            Konto z tym adresem już istnieje.{" "}
            <Link
              href={`/sign-in?email=${encodeURIComponent(email.trim())}`}
              className="font-medium text-foreground underline"
            >
              Zaloguj się
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
            aria-invalid={emailFieldError && !exists ? true : undefined}
          />
          {emailFieldError && !exists ? (
            <p role="alert" className="mt-1 text-xs text-danger">
              {emailFieldError}
            </p>
          ) : null}
        </Field>

        <PasswordField
          label="Hasło"
          value={password}
          onChange={setPassword}
          onBlur={() => setPasswordTouched(true)}
          autoComplete="new-password"
          placeholder="Utwórz hasło"
          error={passwordFieldError}
          disabled={busy}
        />

        <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-muted">
          <input
            type="checkbox"
            className="mt-1 size-4 shrink-0 rounded border-border-strong accent-foreground"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            Potwierdzam, że jako trener odpowiadam za dane podopiecznych (w tym o
            zdrowiu) i akceptuję{" "}
            <Link href="/regulamin" className="text-foreground underline">
              regulamin
            </Link>{" "}
            oraz{" "}
            <Link href="/prywatnosc" className="text-foreground underline">
              politykę prywatności
            </Link>
            .
          </span>
        </label>
        {fieldErrorMessage(errors.fields.legalAccepted) ? (
          <p role="alert" className="text-xs text-danger">
            {fieldErrorMessage(errors.fields.legalAccepted)}
          </p>
        ) : null}

        <Button type="submit" full size="lg" loading={busy} disabled={!consent}>
          Załóż konto
          <span aria-hidden className="text-base leading-none">
            →
          </span>
        </Button>
      </form>

      {/* Wymagane przez bot protection Clerka przy custom sign-up */}
      <div id="clerk-captcha" />
    </div>
  );
}
