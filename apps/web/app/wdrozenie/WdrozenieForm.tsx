"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button, ErrorBanner, Field } from "@/components/ui";
import { landingInputClass } from "@/components/landing/primitives";
import { WDROZENIE_PREMIUM_ZL } from "@/lib/wdrozenieOffer";

const CONTACT = "kontakt@repmaxer.pl";

/** pl-PL nie grupuje czterocyfrowych liczb, a na stronie sprzedażowej chcemy „2 900". */
function zl(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
}

const NEXT_STEPS = [
  { n: "01", body: "Odpisz na maila — dołącz to, czym dziś prowadzisz." },
  { n: "02", body: "W 24 godziny wraca raport i trzy wiadomości." },
  { n: "03", body: "Jeśli nic nie powie — jedno zdanie i kończymy." },
] as const;

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
          message: "Odpisz na maila i dołącz arkusz albo zrzuty.",
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
      <div ref={successRef} className="mt-12">
        <h2 className="m-0 text-[clamp(1.75rem,4vw,2.25rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground text-balance">
          Zgłoszenie zapisane.
        </h2>
        <p className="mt-5 m-0 max-w-[46ch] text-[17px] leading-[1.6] text-muted">
          {done.message}
        </p>
        {!done.emailSent ? (
          <p className="mt-4 m-0 max-w-[46ch] text-[15px] leading-[1.6] text-muted">
            Napisz na{" "}
            <a
              className="text-foreground underline-offset-4 hover:underline"
              href={`mailto:${CONTACT}`}
            >
              {CONTACT}
            </a>{" "}
            i dołącz arkusz, PDF albo zrzuty.
          </p>
        ) : null}
        <ol className="mt-10 m-0 list-none p-0">
          {NEXT_STEPS.map((step) => (
            <li
              key={step.n}
              className="grid grid-cols-[36px_minmax(0,1fr)] items-baseline gap-5 border-t border-border py-5 last:border-b last:border-border"
            >
              <span className="t-num text-[13px] tabular-nums text-fg-ghost">{step.n}</span>
              <span className="text-[16px] leading-[1.6] text-foreground">{step.body}</span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-12">
      <ErrorBanner message={error} />
      {status === "cancel" ? (
        <p className="m-0 mb-6 text-[15px] text-muted">
          Płatność przerwana. Możesz spróbować ponownie.
        </p>
      ) : null}

      <div className="grid gap-6">
        <Field label="Imię">
          <input
            className={landingInputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </Field>
        <Field label="E-mail">
          <input
            className={landingInputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </Field>
        <Field label="Telefon" hint="opcjonalnie">
          <input
            className={landingInputClass}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            inputMode="tel"
          />
        </Field>
        <Field label="Czym dziś prowadzisz" hint="arkusz, PDF, WhatsApp — opcjonalnie">
          <textarea
            className={`${landingInputClass} min-h-[4.5rem] resize-y py-2 leading-[1.5]`}
            value={howYouWork}
            onChange={(e) => setHowYouWork(e.target.value)}
            maxLength={400}
          />
        </Field>
      </div>

      <div className="mt-10">
        <Button type="submit" size="lg" loading={busy === "whiteglove"} disabled={busy != null}>
          Zamów darmowy raport
        </Button>
        <p className="mt-5 max-w-[44ch] text-[14px] leading-[1.55] text-muted">
          Po zgłoszeniu dostaniesz maila — odpowiadasz załącznikiem. Nikt nie dzwoni.
        </p>
      </div>

      <div className="mt-10 border-t border-border pt-8">
        <p className="t-label m-0 tracking-[0.1em]">Wolisz oddać całą bazę</p>
        <p className="mt-3 max-w-[42ch] text-[15px] leading-[1.6] text-muted">
          Przenoszę wszystkie plany i podopiecznych, z 90 dniami opieki co tydzień.
        </p>
        <div className="mt-5">
          <Button
            type="button"
            variant="secondary"
            loading={busy === "personal"}
            disabled={busy != null}
            onClick={onPersonal}
          >
            Przeniesienie całej bazy · {zl(WDROZENIE_PREMIUM_ZL)} zł
          </Button>
        </div>
      </div>
    </form>
  );
}
