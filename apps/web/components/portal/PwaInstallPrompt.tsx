"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallPrompt({ token }: { token: string }) {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const dismissedKey = `wa-install-dismissed-${token}`;

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      if (
        localStorage.getItem(`wa-completed-session-${token}`) &&
        !localStorage.getItem(dismissedKey)
      ) {
        setPromptEvent(event as InstallPromptEvent);
      }
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, [dismissedKey, token]);

  if (!promptEvent) return null;

  return (
    <section className="rounded-xl border border-border bg-surface-raised px-4 py-4">
      <p className="text-[15px] font-semibold text-foreground">Dodaj do ekranu głównego</p>
      <p className="mt-1 text-sm text-muted">
        Otwieraj plan jak aplikację — z ikony na ekranie, bez szukania linku.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          variant="secondary"
          full
          onClick={() => {
            void promptEvent.prompt().then(async () => {
              await promptEvent.userChoice;
              setPromptEvent(null);
            });
          }}
        >
          Dodaj do ekranu
        </Button>
        <Button
          variant="ghost"
          full
          onClick={() => {
            localStorage.setItem(dismissedKey, "1");
            setPromptEvent(null);
          }}
        >
          Nie teraz
        </Button>
      </div>
    </section>
  );
}
