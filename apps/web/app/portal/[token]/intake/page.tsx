"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, ClientIntake, ClientIntakeInput } from "@/lib/api";
import { ClientIntakeForm } from "@/components/ClientIntakeForm";
import { Button, ErrorBanner } from "@/components/ui";
import { PortalBackLink } from "@/components/portal/PortalBackLink";
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
      <div className="mx-auto max-w-lg space-y-4">
        <PortalBackLink href={`/portal/${token}`}>Treningi</PortalBackLink>
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
        <PortalBackLink href={`/portal/${token}`}>Treningi</PortalBackLink>
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
        <p className="t-small mt-3 max-w-[48ch]">
          Trenowałeś już w innej apce?{" "}
          <Link
            href={`/portal/${token}/import`}
            className="text-foreground underline-offset-2 hover:underline"
          >
            Wrzuć zdjęcia z poprzedniej apki
          </Link>
          — trener zobaczy je u siebie.
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
