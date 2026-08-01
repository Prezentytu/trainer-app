"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, ClientIntake, ClientIntakeInput } from "@/lib/api";
import { ClientIntakeForm } from "@/components/ClientIntakeForm";
import { Button, ErrorBanner } from "@/components/ui";

export default function PortalIntakePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const [intake, setIntake] = useState<ClientIntake | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => {
    api.portal
      .getIntake(token)
      .then(setIntake)
      .catch((e: Error) => setError(e.message));
  }, [token]);

  useEffect(load, [load]);

  const handleSave = async (input: ClientIntakeInput) => {
    setError(null);
    try {
      const next = await api.portal.saveIntake(token, input);
      setIntake(next);
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (!intake) {
    return (
      <div className="space-y-4">
        <ErrorBanner message={error} />
        {!error ? <p className="text-sm text-muted">Ładowanie ankiety…</p> : null}
      </div>
    );
  }

  if (saved) {
    return (
      <div className="space-y-5">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Ankieta startowa</p>
          <h1 className="font-display text-2xl font-bold">Dzięki!</h1>
          <p className="mt-2 text-sm text-muted-strong">
            Odpowiedzi zapisane. Trener widzi je w Twoim profilu i ułoży plan na ich podstawie.
          </p>
        </header>
        <Button onClick={() => router.push(`/portal/${token}`)}>Wróć do treningów</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <Link href={`/portal/${token}`} className="text-sm text-accent hover:text-accent-strong">
          ← Wróć
        </Link>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted">Ankieta startowa</p>
        <h1 className="font-display text-2xl font-bold">Poznajmy się</h1>
        <p className="mt-2 max-w-[40ch] text-sm leading-[var(--leading-body)] text-muted-strong">
          Kilka pytań o cele, zdrowie i styl życia. Wszystko opcjonalne — uzupełnij to, co znasz.
        </p>
      </header>
      <ErrorBanner message={error} />
      <ClientIntakeForm
        key={intake.updatedAt ?? "blank"}
        initial={intake}
        submitLabel="Zapisz ankietę"
        onSubmit={handleSave}
      />
    </div>
  );
}
