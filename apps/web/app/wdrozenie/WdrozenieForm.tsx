"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button, ErrorBanner, Field, inputClass } from "@/components/ui";

const CONTACT = "kontakt@repmaxer.pl";

const SLOT_PRESETS = ["Wtorek 18:00", "Środa 18:00", "Czwartek 10:00"] as const;
const SLOT_OTHER = "inna";

type Track = "whiteglove" | "founding";

function YearCard({
  onPay,
  busy,
}: {
  onPay: () => void;
  busy: boolean;
}) {
  return (
    <div className="rounded-[var(--r-card)] border border-border-strong p-5">
      <p className="t-label m-0 tracking-[0.16em]">Rok z góry</p>
      <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="t-num text-[15px] text-muted line-through">468 zł</span>
        <span className="t-num text-[clamp(1.75rem,4vw,2.5rem)] leading-none tracking-[-0.03em]">
          390 zł
        </span>
      </p>
      <p className="mt-4 max-w-[42ch] text-[15px] leading-[1.6] text-muted">
        Dwa miesiące w cenie. 12 miesięcy, do 15 osób. Po roku: 39 zł za 15 — ta kwota
        nie rośnie. Ta sama rozmowa 30 minut. Ta sama gwarancja — zwrot 390 zł.
      </p>
      <div className="mt-6">
        <Button type="button" variant="secondary" loading={busy} disabled={busy} onClick={onPay}>
          Zapłać 390 zł
        </Button>
      </div>
      <p className="t-label mt-3 tracking-[0.16em] text-muted">Godzinę ustalisz w mailu</p>
    </div>
  );
}

export function WdrozenieForm() {
  const params = useSearchParams();
  const status = params.get("status");
  const successRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [slotId, setSlotId] = useState<string>("");
  const [slotOther, setSlotOther] = useState("");
  const [busy, setBusy] = useState<Track | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    message: string;
    emailSent: boolean;
    paid: boolean;
  } | null>(
    status === "ok"
      ? {
          message: "Płatność 390 zł przyjęta. Godzinę ustalamy w mailu.",
          emailSent: true,
          paid: true,
        }
      : null,
  );

  useEffect(() => {
    if (done) successRef.current?.scrollIntoView({ block: "start" });
  }, [done]);

  const preferredSlot = (): string | undefined => {
    if (slotId === SLOT_OTHER) {
      const custom = slotOther.trim();
      return custom || "Inna godzina";
    }
    return slotId || undefined;
  };

  const apply = async (track: Track) => {
    setBusy(track);
    setError(null);
    try {
      const res = await api.founding.apply({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        preferredSlot: preferredSlot(),
        track,
      });
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
        return;
      }
      setDone({
        message: res.message,
        emailSent: !!res.emailSent,
        paid: track === "founding",
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

  const onPay = () => {
    if (name.trim().length < 2 || !email.includes("@")) {
      setError("Najpierw podaj imię i e-mail — potem 390 zł.");
      return;
    }
    void apply("founding");
  };

  if (done) {
    return (
      <div ref={successRef} className="mt-12 max-w-[46ch] space-y-8">
        <p className="m-0 text-[17px] leading-relaxed text-foreground">{done.message}</p>
        {!done.emailSent && !done.paid ? (
          <p className="m-0 text-[15px] leading-[1.6] text-muted">
            Napisz na{" "}
            <a className="text-foreground underline-offset-4 hover:underline" href={`mailto:${CONTACT}`}>
              {CONTACT}
            </a>{" "}
            i podaj dwie godziny, które Ci pasują.
          </p>
        ) : null}
        <ol className="m-0 grid list-none gap-4 p-0 text-[15px] leading-[1.6] text-foreground-secondary">
          <li>1. Odpisz na maila — która godzina.</li>
          <li>2. Potwierdzimy slot w jeden dzień roboczy.</li>
          <li>3. 30 minut: plan w linku, trzy osoby.</li>
        </ol>
        <div>
          <p className="t-label m-0 tracking-[0.16em]">Przygotuj</p>
          <ul className="mt-3 m-0 grid list-none gap-2 p-0 text-[15px] leading-[1.6] text-muted">
            <li>Arkusz albo PDF jednego planu.</li>
            <li>Imiona trzech klientów.</li>
          </ul>
        </div>
        {done.paid ? null : <YearCard onPay={onPay} busy={busy === "founding"} />}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-14 space-y-8">
      <ErrorBanner message={error} />
      {status === "cancel" ? (
        <p className="text-sm text-muted">Płatność przerwana. Możesz umówić rozmowę bez karty.</p>
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
      </div>

      <fieldset>
        <legend className="t-label mb-4 tracking-[0.16em]">Kiedy Ci pasuje</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SLOT_PRESETS.map((label) => {
            const selected = slotId === label;
            return (
              <label
                key={label}
                className={`flex min-h-11 cursor-pointer items-center rounded-[var(--r-card)] border px-4 text-[15px] transition-[background-color,border-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] has-[:focus-visible]:shadow-[var(--focus-ring)] active:[transform:var(--press)] ${
                  selected
                    ? "border-foreground bg-invert-bg text-invert-fg"
                    : "border-border-strong bg-transparent text-foreground"
                }`}
              >
                <input
                  type="radio"
                  name="slot"
                  className="sr-only"
                  checked={selected}
                  onChange={() => setSlotId(label)}
                />
                {label}
              </label>
            );
          })}
          <label
            className={`flex min-h-11 cursor-pointer items-center rounded-[var(--r-card)] border px-4 text-[15px] transition-[background-color,border-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] has-[:focus-visible]:shadow-[var(--focus-ring)] active:[transform:var(--press)] ${
              slotId === SLOT_OTHER
                ? "border-foreground bg-invert-bg text-invert-fg"
                : "border-border-strong bg-transparent text-foreground"
            }`}
          >
            <input
              type="radio"
              name="slot"
              className="sr-only"
              checked={slotId === SLOT_OTHER}
              onChange={() => setSlotId(SLOT_OTHER)}
            />
            Inna godzina
          </label>
        </div>
        {slotId === SLOT_OTHER ? (
          <div className="mt-4 max-w-md">
            <Field label="Napisz dwie godziny">
              <input
                className={inputClass}
                value={slotOther}
                onChange={(e) => setSlotOther(e.target.value)}
                placeholder="np. piątek 9:00 albo 19:00"
              />
            </Field>
          </div>
        ) : null}
      </fieldset>

      <div>
        <Button type="submit" loading={busy === "whiteglove"} disabled={busy != null}>
          Umów 30 minut wdrożenia
        </Button>
        <p className="t-label mt-3 tracking-[0.16em] text-muted">
          10 miejsc · 90 dni · 15 osób · 0 zł
        </p>
      </div>

      <YearCard onPay={onPay} busy={busy === "founding"} />
    </form>
  );
}
