"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, ClientIntake, ClientIntakeInput } from "@/lib/api";
import { ClientIntakeForm } from "@/components/ClientIntakeForm";
import { Icon } from "@/components/Icon";
import { Button, ErrorBanner } from "@/components/ui";
import { PortalPageSkeleton } from "@/components/skeletons";

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
        {!error ? <PortalPageSkeleton label="Wczytuję ankietę…" /> : null}
      </div>
    );
  }

  if (saved) {
    return (
      <div className="mx-auto max-w-lg space-y-8 pb-24">
        <header>
          <p className="t-label text-muted">Ankieta startowa</p>
          <h1 className="t-title mt-2">Dzięki!</h1>
          <p className="t-small mt-2">
            Odpowiedzi zapisane. Trener widzi je w Twoim profilu i ułoży plan na ich podstawie.
          </p>
        </header>
        <Button onClick={() => router.push(`/portal/${token}`)}>Wróć do treningów</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-24">
      <header>
        <Link
          href={`/portal/${token}`}
          className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted transition-[color,transform] duration-[var(--dur-fast)] hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] active:scale-[0.97]"
        >
          <Icon name="caret-left" size={16} decorative />
          Treningi
        </Link>
        <p className="t-label mt-2 text-muted">Ankieta startowa</p>
        <h1 className="t-title mt-2">Poznajmy się</h1>
        <p className="t-small mt-2 max-w-[40ch]">
          Kilka pytań o cele, zdrowie i styl życia. Wszystko opcjonalne — uzupełnij to, co znasz.
        </p>
        <p className="t-small mt-3 max-w-[48ch]">
          Odpowiedzi widzi Twój trener — pomagają ułożyć bezpieczny plan. Możesz pominąć
          pytania o zdrowie. Szczegóły:{" "}
          <Link href="/prywatnosc" className="text-foreground underline-offset-2 hover:underline">
            polityka prywatności
          </Link>
          .
        </p>
      </header>
      <ErrorBanner message={error} />
      <ClientIntakeForm
        key={intake.updatedAt ?? "blank"}
        initial={intake}
        submitLabel="Wyślij do trenera"
        onSubmit={handleSave}
      />
    </div>
  );
}
