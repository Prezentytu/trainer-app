"use client";

import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ErrorBanner, Field, inputClass } from "@/components/ui";
import { CodeInput } from "@/components/auth/CodeInput";
import { PasswordField } from "@/components/auth/PasswordField";
import {
  authErrorMessage,
  fieldErrorMessage,
} from "@/components/auth/authErrors";
import { finalizeAndRedirect } from "@/components/auth/finalizeSession";

type ResetPasswordFormProps = {
  initialEmail?: string;
  onCancel: () => void;
};

type Step = "email" | "code" | "password";

export function ResetPasswordForm({
  initialEmail = "",
  onCancel,
}: ResetPasswordFormProps) {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [localError, setLocalError] = useState<string | null>(null);

  const busy = fetchStatus === "fetching";
  const banner =
    localError ??
    authErrorMessage(errors) ??
    null;

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (!email.trim()) {
      setLocalError("Podaj adres e-mail.");
      return;
    }

    const { error: createError } = await signIn.create({
      identifier: email.trim(),
    });
    if (createError) {
      setLocalError(createError.longMessage ?? createError.message);
      return;
    }

    const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
    if (sendError) {
      setLocalError(sendError.longMessage ?? sendError.message);
      return;
    }
    setStep("code");
  }

  async function verifyCode(value: string) {
    setLocalError(null);
    const { error } = await signIn.resetPasswordEmailCode.verifyCode({
      code: value,
    });
    if (error) {
      setLocalError(error.longMessage ?? error.message);
      return;
    }
    setStep("password");
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (password.length < 8) {
      setLocalError("Hasło musi mieć co najmniej 8 znaków.");
      return;
    }

    const { error } = await signIn.resetPasswordEmailCode.submitPassword({
      password,
      signOutOfOtherSessions: true,
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
    } else {
      setLocalError("Reset nie został dokończony. Spróbuj ponownie.");
    }
  }

  if (step === "email") {
    return (
      <form onSubmit={sendCode} className="space-y-4">
        <ErrorBanner message={banner} />
        <p className="text-sm text-muted">
          Wyślemy kod na e-mail, a potem ustawisz nowe hasło.
        </p>
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
            className={inputClass}
            aria-invalid={errors.fields.identifier ? true : undefined}
          />
          {fieldErrorMessage(errors.fields.identifier) ? (
            <p role="alert" className="mt-1 text-xs text-danger">
              {fieldErrorMessage(errors.fields.identifier)}
            </p>
          ) : null}
        </Field>
        <Button type="submit" full size="lg" loading={busy}>
          Wyślij kod
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full text-center text-sm text-muted underline decoration-transparent underline-offset-[3px] hover:text-foreground hover:decoration-foreground"
        >
          Wróć do logowania
        </button>
      </form>
    );
  }

  if (step === "code") {
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
          Kod wysłaliśmy na <span className="text-foreground">{email}</span>.
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
          Potwierdź kod
        </Button>
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setCode("");
          }}
          className="w-full text-center text-sm text-muted underline decoration-transparent underline-offset-[3px] hover:text-foreground hover:decoration-foreground"
        >
          Zmień e-mail
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={submitPassword} className="space-y-4">
      <ErrorBanner message={banner} />
      <p className="text-sm text-muted">Ustaw nowe hasło do konta.</p>
      <PasswordField
        label="Nowe hasło"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        placeholder="Utwórz hasło"
        error={fieldErrorMessage(errors.fields.password)}
        disabled={busy}
      />
      <Button type="submit" full size="lg" loading={busy}>
        Zapisz hasło i zaloguj
      </Button>
    </form>
  );
}
