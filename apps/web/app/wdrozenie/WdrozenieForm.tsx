"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button, ErrorBanner, Field, inputClass } from "@/components/ui";
import { WDROZENIE_PREMIUM_ZL, WDROZENIE_SPOTS } from "@/lib/wdrozenieOffer";

const CONTACT = "kontakt@repmaxer.pl";

type Track = "whiteglove" | "personal";

export function WdrozenieForm() {
  const params = useSearchParams();
  const status = params.get("status");
  const successRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [howYouWork, setHowYouWork] = useState("");
  const [busy, setBusy] = useState<Track | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    message: string;
    emailSent: boolean;
    paid: boolean;
  } | null>(
    status === "ok"
      ? {
          message: "Zgłoszenie zapisane. Odpisz na maila i dołącz arkusz albo zrzuty.",
          emailSent: true,
          paid: false,
        }
      : null,
  );

  useEffect(() => {
    if (done) successRef.current?.scrollIntoView({ block: "start" });
  }, [done]);

  const apply = async (track: Track) => {
    setBusy(track);
    setError(null);
    try {
      const res = await api.founding.apply({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        howYouWork: howYouWork.trim() || undefined,
        track,
      });
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
        return;
      }
      setDone({
        message: res.message,
        emailSent: !!res.emailSent,
        paid: track === "personal",
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void apply("whiteglove");
  };

  const onPersonal = () => {
    if (name.trim().length < 2 || !email.includes("@")) {
      setError("Najpierw podaj imię i e-mail.");
      return;
    }
    void apply("personal");
  };

  if (done) {
    return (
      <div ref={successRef} className="mt-12 max-w-[46ch] space-y-8">
        <p className="m-0 text-[17px] leading-relaxed text-foreground">{done.message}</p>
        {!done.emailSent ? (
          <p className="m-0 text-[15px] leading-[1.6] text-muted">
            Napisz na{" "}
            <a className="text-foreground underline-offset-4 hover:underline" href={`mailto:${CONTACT}`}>
              {CONTACT}
            </a>{" "}
            i dołącz arkusz, PDF albo zrzuty.
          </p>
        ) : null}
        <ol className="m-0 grid list-none gap-4 p-0 text-[15px] leading-[1.6] text-foreground-secondary">
          <li>1. Odpisz na maila — dołącz to, czym dziś prowadzisz.</li>
          <li>2. W 24 godziny wraca raport i trzy wiadomości.</li>
          <li>3. Jeśli nic nie powie — jedno zdanie i kończymy.</li>
        </ol>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-14 space-y-8">
      <ErrorBanner message={error} />
      {status === "cancel" ? (
        <p className="text-sm text-muted">Płatność przerwana. Możesz spróbować ponownie.</p>
      ) : null}

      <div className="max-w-md space-y-4">
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
        <Field label="Telefon" hint="opcjonalnie">
          <input
            className={inputClass}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            inputMode="tel"
          />
        </Field>
        <Field label="Czym dziś prowadzisz" hint="arkusz, PDF, WhatsApp — opcjonalnie">
          <textarea
            className="min-h-[5.5rem] w-full resize-y rounded-[var(--r-field)] border border-border-strong bg-field px-2.5 py-3 text-base font-medium text-foreground outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)] placeholder:font-normal placeholder:text-fg-ghost focus:border-foreground focus:shadow-[var(--focus-ring)] sm:text-sm"
            value={howYouWork}
            onChange={(e) => setHowYouWork(e.target.value)}
            maxLength={400}
          />
        </Field>
      </div>

      <div>
        <Button type="submit" loading={busy === "whiteglove"} disabled={busy != null}>
          Zamów darmowy raport
        </Button>
        <p className="t-label mt-3 tracking-[0.16em] text-muted">
          {WDROZENIE_SPOTS} miejsc · 24 godziny · 0 zł
        </p>
        <p className="mt-3 max-w-[42ch] text-[13px] leading-[1.55] text-muted">
          Raport wraca w 24 godziny. Jeśli nic Ci nie powie — jedno zdanie i
          kończymy.
        </p>
        <p className="mt-3 max-w-[42ch] text-[13px] leading-[1.55] text-muted">
          Arkusz widzi jedna osoba. Po raporcie dane kasuję na Twoją prośbę — nic
          nie trafia do bazy, dopóki nie zdecydujesz.
        </p>
        <p className="mt-3 max-w-[42ch] text-[13px] leading-[1.55] text-muted">
          Po zgłoszeniu dostaniesz maila — odpowiadasz załącznikiem. Nikt nie
          dzwoni.
        </p>
      </div>

      <div>
        <Button
          type="button"
          variant="secondary"
          loading={busy === "personal"}
          disabled={busy != null}
          onClick={onPersonal}
        >
          Przeniesienie całej bazy · {WDROZENIE_PREMIUM_ZL.toLocaleString("pl-PL")} zł
        </Button>
      </div>
    </form>
  );
}
