"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui";
import { InstallGuideSheet } from "@/components/portal/InstallGuideSheet";
import { installBannerCopy } from "@/lib/installEnv";
import { useInstallEnv } from "@/lib/pwa";

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
  const clientReady = useClientReady();
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const dismissedKey = `wa-install-dismissed-${token}`;

  const env = useInstallEnv(Boolean(promptEvent));
  const copy = installBannerCopy(env);

  const pageUrl = useMemo(() => {
    if (typeof window === "undefined") return `/portal/${token}`;
    try {
      const u = new URL(window.location.href);
      u.searchParams.delete("installEnv");
      // Kanoniczny start portalu — nie sesja / profil
      u.pathname = `/portal/${token}`;
      u.hash = "";
      return u.toString();
    } catch {
      return `${window.location.origin}/portal/${token}`;
    }
  }, [token]);

  const completed =
    clientReady &&
    (!requireCompletedSession ||
      Boolean(localStorage.getItem(`wa-completed-session-${token}`)));
  const storedDismissed =
    clientReady && !persistent && Boolean(localStorage.getItem(dismissedKey));

  // In-app: pokaż od razu (ostrzeżenie), bez peak-end
  const bypassSessionGate = env.capability === "escape-required";
  const sessionOk = bypassSessionGate || completed;

  useEffect(() => {
    if (env.capability === "installed") return;
    if (env.platform === "ios") return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      const sessionOkNow =
        env.capability === "escape-required" ||
        !requireCompletedSession ||
        Boolean(localStorage.getItem(`wa-completed-session-${token}`));
      const wasDismissed = !persistent && Boolean(localStorage.getItem(dismissedKey));
      if (sessionOkNow && !wasDismissed) {
        setPromptEvent(event as InstallPromptEvent);
      }
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, [
    dismissedKey,
    env.capability,
    env.platform,
    persistent,
    requireCompletedSession,
    token,
  ]);

  if (!clientReady) return null;
  if (env.capability === "installed") return null;
  if (!sessionOk || dismissed || storedDismissed) return null;

  const isEscape = env.capability === "escape-required";
  const isNative = env.capability === "native-prompt" && promptEvent;

  const onPrimary = () => {
    if (isNative && promptEvent) {
      void promptEvent.prompt().then(async () => {
        await promptEvent.userChoice;
        setPromptEvent(null);
      });
      return;
    }
    setSheetOpen(true);
  };

  return (
    <>
      <section className="rounded-xl border border-border bg-surface-raised px-4 py-4">
        <p className="text-[15px] font-semibold text-foreground">{copy.title}</p>
        <p className="mt-1 text-sm text-muted">{copy.description}</p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {isEscape && env.escapeUrl ? (
            <a
              href={env.escapeUrl}
              className="inline-flex h-[var(--h-control)] flex-1 items-center justify-center rounded-[var(--r-pill)] bg-invert-bg px-4 text-sm font-semibold text-invert-fg transition-[transform,opacity] duration-[var(--dur-fast)] ease-[var(--ease-out)] active:scale-[0.97]"
            >
              {copy.cta}
            </a>
          ) : (
            <Button variant="secondary" full onClick={onPrimary}>
              {copy.cta}
            </Button>
          )}
          {isEscape ? (
            <Button variant="ghost" full onClick={() => setSheetOpen(true)}>
              Jak to zrobić
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

      <InstallGuideSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        env={env}
        pageUrl={pageUrl}
      />
    </>
  );
}
