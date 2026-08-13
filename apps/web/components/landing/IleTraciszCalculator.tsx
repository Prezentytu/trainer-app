"use client";

import { useMemo, useState } from "react";
import { LandingCta } from "@/components/landing/primitives";
import { Field, inputNumericClass } from "@/components/ui";

const SESSIONS_PER_MONTH = 8;
const DEFAULT_RATE = 150;
const DEFAULT_LEFT = 1;

function parsePositive(raw: string): number {
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function formatZl(n: number): string {
  return `${Math.round(n).toLocaleString("pl-PL")} zł`;
}

function osobyWord(n: number): string {
  if (n === 1) return "osoba";
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "osoby";
  return "osób";
}

export function IleTraciszCalculator() {
  const [rateRaw, setRateRaw] = useState(String(DEFAULT_RATE));
  const [leftRaw, setLeftRaw] = useState(String(DEFAULT_LEFT));

  const rate = parsePositive(rateRaw);
  const left = parsePositive(leftRaw);
  const loss = useMemo(() => left * rate * SESSIONS_PER_MONTH, [left, rate]);

  return (
    <>
      <form
        className="mt-12 grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => e.preventDefault()}
      >
        <Field label="Stawka za sesję (zł)">
          <input
            className={inputNumericClass}
            inputMode="decimal"
            value={rateRaw}
            onChange={(e) => setRateRaw(e.target.value)}
            aria-describedby="ile-tracisz-rate-hint"
          />
        </Field>
        <Field label="Ile osób skończyło współpracę w tym roku">
          <input
            className={inputNumericClass}
            inputMode="numeric"
            value={leftRaw}
            onChange={(e) => setLeftRaw(e.target.value)}
            aria-describedby="ile-tracisz-left-hint"
          />
        </Field>
      </form>
      <p id="ile-tracisz-rate-hint" className="sr-only">
        Kwota, którą bierzesz za jeden trening.
      </p>
      <p id="ile-tracisz-left-hint" className="sr-only">
        Liczba podopiecznych, którzy skończyli współpracę w tym roku.
      </p>

      <div className="mt-12 border-t border-border pt-10">
        <p className="t-label m-0 tracking-[0.16em] text-muted">Nie odbyło się</p>
        <p className="t-num mt-3 text-[clamp(2.75rem,8vw,5.5rem)] leading-none tracking-[-0.03em]">
          {formatZl(loss)}
        </p>
        <p className="mt-6 max-w-[46ch] text-[17px] leading-[1.6] text-muted">
          {formatZl(rate)} × {SESSIONS_PER_MONTH} sesji × {left.toLocaleString("pl-PL")}{" "}
          {osobyWord(left)}. 39 zł za 15 osób.
        </p>
      </div>

      <div className="mt-10">
        <LandingCta href="/wdrozenie">Umów 30 minut wdrożenia</LandingCta>
      </div>
    </>
  );
}
