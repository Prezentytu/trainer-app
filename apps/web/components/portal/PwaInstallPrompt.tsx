"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";

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
    <Card className="border-accent-border" title="Dodaj do ekranu głównego">
      <p className="text-sm text-muted">
        Otwieraj swój plan jak aplikację — jednym tapnięciem, bez szukania linku.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
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
          onClick={() => {
            localStorage.setItem(dismissedKey, "1");
            setPromptEvent(null);
          }}
        >
          Nie teraz
        </Button>
      </div>
    </Card>
  );
}
