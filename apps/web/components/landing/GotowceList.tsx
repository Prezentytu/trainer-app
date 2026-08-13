"use client";

import { useState } from "react";
import { LandingCta } from "@/components/landing/primitives";
import { Button } from "@/components/ui";
import { PUBLIC_SILENCE_TEMPLATES, type SilenceKind } from "@/lib/silenceProtocol";

export function GotowceList() {
  const [copied, setCopied] = useState<SilenceKind | null>(null);

  const copy = async (kind: SilenceKind, body: string) => {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(kind);
    } catch {
      setCopied(null);
    }
  };

  return (
    <>
      <ul className="mt-12 space-y-10">
        {PUBLIC_SILENCE_TEMPLATES.map((item) => (
          <li key={item.kind} className="border-t border-border pt-8">
            <p className="t-label m-0 tracking-[0.16em] text-muted">{item.label}</p>
            <p className="mt-4 text-[17px] leading-[1.6] text-foreground-secondary">{item.body}</p>
            <div className="mt-5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void copy(item.kind, item.body)}
              >
                {copied === item.kind ? "Skopiowano" : "Skopiuj wiadomość"}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-16 max-w-[46ch] text-[15px] leading-relaxed text-muted">
        W panelu RepMaxer kolejka pokazuje, komu napisać, a przycisk wstawia tę samą treść z
        linkiem do planu.
      </p>
      <div className="mt-8">
        <LandingCta href="/wdrozenie">Umów 30 minut wdrożenia</LandingCta>
      </div>
    </>
  );
}
