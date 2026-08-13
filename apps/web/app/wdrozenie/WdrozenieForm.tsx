"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button, ErrorBanner, Field, inputClass } from "@/components/ui";

type Track = "whiteglove" | "founding";

const TRACKS: {
  id: Track;
  eyebrow: string;
  price: string;
  now: string;
  after: string;
  guarantee: string;
  note?: string;
}[] = [
  {
    id: "whiteglove",
    eyebrow: "10 miejsc w tym miesiącu",
    price: "0 zł",
    now: "Rozmowa 30 minut. 90 dni, do 15 osób, 0 zł.",
    after: "Potem wybierasz: 5 osób zostaje za 0 zł, albo 39 zł za 15.",
    guarantee:
      "Jeśli w 14 dni nikt nie dokończy treningu — zostajesz na 0 zł. Warunek: trzy linki na rozmowie.",
  },
  {
    id: "founding",
    eyebrow: "Rok z góry",
    price: "490 zł",
    now: "490 zł raz. 12 miesięcy, do 15 osób. Ta sama rozmowa 30 minut.",
    after:
      "Po roku: 39 zł za 15 osób. Ta kwota zostaje na Twoim koncie, nawet gdy cennik publiczny pójdzie w górę.",
    guarantee: "Ta sama gwarancja — zwrot 490 zł.",
    note: "39 zł × 12 miesięcy to 468 zł. Tu 490 zł raz — rok i rozmowa w cenie.",
  },
];

export function WdrozenieForm() {
  const params = useSearchParams();
  const status = params.get("status");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [track, setTrack] = useState<Track>("whiteglove");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(
    status === "ok" ? "Płatność przyjęta. Oddzwonimy w sprawie rozmowy wdrożeniowej." : null,
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
    <form onSubmit={(e) => void onSubmit(e)} className="mt-12 max-w-[46rem] space-y-8">
      <ErrorBanner message={error} />
      {status === "cancel" ? (
        <p className="text-sm text-muted">Płatność przerwana. Możesz wysłać zgłoszenie bez karty.</p>
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
        <Field label="Telefon (opcjonalnie)">
          <input
            className={inputClass}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </Field>
      </div>
      <fieldset>
        <legend className="t-label mb-4 tracking-[0.16em]">Co wybierasz</legend>
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2">
          {TRACKS.map((option) => {
            const selected = track === option.id;
            return (
              <label
                key={option.id}
                className={`grid min-h-11 cursor-pointer gap-4 rounded-[var(--r-card)] border p-4 text-left transition-[background-color,border-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] has-[:focus-visible]:shadow-[var(--focus-ring)] active:[transform:var(--press)] ${
                  selected
                    ? "border-foreground bg-invert-bg text-invert-fg"
                    : "border-border-strong bg-transparent text-foreground"
                }`}
              >
                <input
                  type="radio"
                  name="track"
                  className="sr-only"
                  checked={selected}
                  onChange={() => setTrack(option.id)}
                />
                <span className="t-label tracking-[0.16em]">{option.eyebrow}</span>
                <span className="t-num text-[clamp(1.75rem,4vw,2.5rem)] leading-none tracking-[-0.03em]">
                  {option.price}
                </span>
                <span className={`grid gap-3 text-[15px] leading-[1.6] ${selected ? "" : "text-muted"}`}>
                  <span>{option.now}</span>
                  <span>{option.after}</span>
                  <span>{option.guarantee}</span>
                  {option.note ? <span>{option.note}</span> : null}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <Button type="submit" loading={busy} disabled={busy}>
        {track === "founding" ? "Zapłać 490 zł" : "Umów rozmowę"}
      </Button>
    </form>
  );
}
