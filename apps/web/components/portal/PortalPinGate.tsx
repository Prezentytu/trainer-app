"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { ApiError, api, portalPinStorageKey } from "@/lib/api";
import { Button, Field, inputClass } from "@/components/ui";

export function PortalPinGate({ token, children }: { token: string; children: ReactNode }) {
  const [needed, setNeeded] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.portal
      .pinStatus(token)
      .then((s) => {
        if (cancelled) return;
        const stored = sessionStorage.getItem(portalPinStorageKey(token));
        setNeeded(s.pinRequired && !stored);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setUnlocking(true);
    setError(null);
    try {
      await api.portal.unlock(token, pin.trim());
      sessionStorage.setItem(portalPinStorageKey(token), pin.trim());
      setNeeded(false);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.code === "pin_required" ? "Niepoprawny PIN. Spróbuj jeszcze raz." : apiErr.message);
    } finally {
      setUnlocking(false);
    }
  };

  if (needed === null && !error) {
    return <p className="px-5 py-16 text-sm text-muted">Otwieram portal…</p>;
  }

  if (needed) {
    return (
      <form onSubmit={(e) => void submit(e)} className="mx-auto max-w-sm space-y-4 px-5 py-16">
        <h1 className="t-title m-0">Podaj PIN</h1>
        <p className="text-sm text-foreground-secondary">
          Trener ustawił 4 cyfry do tego linku. Nie wysyłaj go dalej.
        </p>
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        <Field label="PIN">
          <input
            className={inputClass}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          />
        </Field>
        <Button type="submit" disabled={pin.length !== 4 || unlocking}>
          {unlocking ? "Sprawdzam…" : "Otwórz portal"}
        </Button>
      </form>
    );
  }

  return <>{children}</>;
}
