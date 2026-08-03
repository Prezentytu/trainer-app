"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button, Card, ErrorBanner, Field, inputClass } from "@/components/ui";

export default function RecoverPortalPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.portal.recover(email);
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-8">
      <Card className="w-full" title="Odzyskaj link dostępu">
        <p className="mb-5 text-sm text-muted">
          Podaj adres e-mail użyty przez trenera. Jeśli jest w systemie, wyślemy link do portalu.
        </p>
        <ErrorBanner message={error} />
        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-positive">Jeśli ten adres jest w systemie, wysłaliśmy link dostępu.</p>
            <Link href="/" className="text-sm font-medium text-accent hover:text-accent-strong">
              Wróć do strony głównej
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={submit}>
            <Field label="E-mail">
              <input
                className={inputClass}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </Field>
            <Button type="submit" loading={saving} full>
              Wyślij link dostępu
            </Button>
          </form>
        )}
      </Card>
    </main>
  );
}
