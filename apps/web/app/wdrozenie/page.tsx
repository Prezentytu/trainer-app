"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button, ErrorBanner, Field, inputClass } from "@/components/ui";
import { Wordmark } from "@/components/Wordmark";
import { LandingThemeLock } from "@/components/landing/LandingThemeLock";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function WdrozeniePage() {
  return (
    <div data-theme="light" className="min-h-screen bg-background text-foreground">
      <LandingThemeLock />
      <header className="border-b border-border">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Wordmark href="/" />
          <Link
            href="/sign-up"
            className="t-label tracking-[0.16em] text-foreground hover:text-muted"
          >
            Konto
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 sm:py-24">
        <p className="t-label m-0 tracking-[0.16em]">14 dni do pełnego wglądu</p>
        <h1 className="mt-6 max-w-[16ch] text-[clamp(2.25rem,5vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
          W 30 min wpinamy plan w link bez konta.
        </h1>
        <p className="mt-6 max-w-[46ch] text-[17px] leading-[1.6] text-muted">
          Import jednego planu, trzech klientów i linki wysłane na callu. Jeśli w 14 dni
          żaden podopieczny nie dokończy treningu — zostajesz na 0 zł. Warunek: wysłałeś
          link do co najmniej trzech osób na callu. 10 miejsc w miesiącu.
        </p>
        <ul className="mt-10 max-w-[46ch] space-y-3 text-[15px] leading-relaxed text-foreground-secondary">
          <li>Przeprowadzka z Excela na callu.</li>
          <li>Protokół ciszy: trzy gotowce wiadomości (dzień 7 / 14 / pierwszy trening).</li>
          <li>Szablony metod i eksport JSON/CSV.</li>
          <li>Founding 490 zł: trzy miesiące Solo i cena zamknięta, gdy skończą się miejsca white-glove.</li>
        </ul>
        <Suspense fallback={<p className="mt-12 text-sm text-muted">Wczytuję formularz…</p>}>
          <WdrozenieForm />
        </Suspense>
      </main>
      <LandingFooter />
    </div>
  );
}

function WdrozenieForm() {
  const params = useSearchParams();
  const status = params.get("status");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [track, setTrack] = useState<"whiteglove" | "founding">("whiteglove");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(
    status === "ok" ? "Płatność przyjęta. Oddzwonimy w sprawie calla." : null,
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.founding.apply({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        track,
      });
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
        return;
      }
      setDone(res.message);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <p className="mt-12 max-w-[46ch] text-[17px] leading-relaxed text-foreground">{done}</p>
    );
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mt-12 max-w-md space-y-4">
      <ErrorBanner message={error} />
      {status === "cancel" ? (
        <p className="text-sm text-muted">Płatność przerwana. Możesz wysłać zgłoszenie bez karty.</p>
      ) : null}
      <Field label="Imię">
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />
      </Field>
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
      <Field label="Telefon (opcjonalnie)">
        <input
          className={inputClass}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
        />
      </Field>
      <fieldset className="space-y-2">
        <legend className="t-label">Ścieżka</legend>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="radio"
            name="track"
            checked={track === "whiteglove"}
            onChange={() => setTrack("whiteglove")}
          />
          Wdrożenie 0 zł / 90 dni (10 miejsc)
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="radio"
            name="track"
            checked={track === "founding"}
            onChange={() => setTrack("founding")}
          />
          Founding 490 zł — Solo locked
        </label>
      </fieldset>
      <Button type="submit" loading={busy} disabled={busy}>
        {track === "founding" ? "Zgłoś founding" : "Umów wdrożenie"}
      </Button>
    </form>
  );
}
