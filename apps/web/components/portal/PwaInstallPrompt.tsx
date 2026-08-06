"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui";
import { isIosDevice, useIsStandalone } from "@/lib/pwa";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Props = {
  token: string;
  /** Po ukończonej sesji (peak-end) — na home. W profilu zawsze widoczny. */
  requireCompletedSession?: boolean;
  /** Wariant stały (profil) — bez przycisku „Nie teraz” chowającego na zawsze. */
  persistent?: boolean;
};

function useClientReady(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function PwaInstallPrompt({
  token,
  requireCompletedSession = true,
  persistent = false,
}: Props) {
  const standalone = useIsStandalone();
  const clientReady = useClientReady();
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const dismissedKey = `wa-install-dismissed-${token}`;

  const completed =
    clientReady &&
    (!requireCompletedSession ||
      Boolean(localStorage.getItem(`wa-completed-session-${token}`)));
  const storedDismissed =
    clientReady && !persistent && Boolean(localStorage.getItem(dismissedKey));
  const showIos =
    clientReady &&
    !standalone &&
    isIosDevice() &&
    completed &&
    !dismissed &&
    !storedDismissed;

  useEffect(() => {
    if (standalone || isIosDevice()) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      const sessionOk =
        !requireCompletedSession ||
        Boolean(localStorage.getItem(`wa-completed-session-${token}`));
      const wasDismissed = !persistent && Boolean(localStorage.getItem(dismissedKey));
      if (sessionOk && !wasDismissed) {
        setPromptEvent(event as InstallPromptEvent);
      }
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, [dismissedKey, persistent, requireCompletedSession, standalone, token]);

  if (standalone) return null;
  if (!showIos && !promptEvent) return null;

  return (
    <section className="rounded-xl border border-border bg-surface-raised px-4 py-4">
      <p className="text-[15px] font-semibold text-foreground">Dodaj do ekranu głównego</p>
      <p className="mt-1 text-sm text-muted">
        Otwieraj plan jak aplikację — z ikony na ekranie, bez szukania linku.
      </p>

      {showIos ? (
        <ol className="mt-4 space-y-2.5 text-sm text-foreground-secondary">
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-active text-accent">
              <Icon name="share" size={14} decorative />
            </span>
            <span>
              Kliknij ikonę <strong className="font-semibold text-foreground">Udostępnij</strong>{" "}
              na dole Safari.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-active font-mono text-xs font-semibold text-accent">
              2
            </span>
            <span>
              Wybierz{" "}
              <strong className="font-semibold text-foreground">Dodaj do ekranu początkowego</strong>.
            </span>
          </li>
        </ol>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {promptEvent ? (
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
        ) : null}
        {!persistent ? (
          <Button
            variant="ghost"
            full
            onClick={() => {
              localStorage.setItem(dismissedKey, "1");
              setDismissed(true);
              setPromptEvent(null);
            }}
          >
            Nie teraz
          </Button>
        ) : null}
      </div>
    </section>
  );
}
