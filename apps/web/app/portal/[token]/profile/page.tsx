"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, PortalHome } from "@/lib/api";
import { Avatar, ErrorBanner, Switch } from "@/components/ui";
import { PortalPageSkeleton } from "@/components/skeletons";
import { PwaInstallPrompt } from "@/components/portal/PwaInstallPrompt";
import {
  readAutoRest,
  readLogRir,
  readRestLockScreen,
  writeAutoRest,
  writeLogRir,
  writeRestLockScreen,
} from "@/lib/portalPrefs";
import { isIosDevice, isStandaloneDisplay, useIsIos, useIsStandalone } from "@/lib/pwa";
import { useTheme } from "@/lib/theme";

export default function PortalProfilePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [home, setHome] = useState<PortalHome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRest, setAutoRest] = useState(() => readAutoRest());
  const [restLockScreen, setRestLockScreen] = useState(() => readRestLockScreen());
  const [logRir, setLogRir] = useState(() => readLogRir());
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSaving, setPushSaving] = useState(false);
  const { theme, setTheme } = useTheme();
  const standalone = useIsStandalone();
  const ios = useIsIos();
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const pushNeedsInstall = ios && !standalone;

  const load = useCallback(() => {
    api.portal
      .home(token)
      .then(setHome)
      .catch((e: Error) => setError(e.message));
  }, [token]);

  useEffect(load, [load]);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    void navigator.serviceWorker.ready.then(async (registration) => {
      const subscription = await registration.pushManager.getSubscription();
      setPushEnabled(Boolean(subscription));
    });
  }, []);

  const togglePush = async (enabled: boolean) => {
    if (!vapidKey || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (isIosDevice() && !isStandaloneDisplay()) {
      setError("Najpierw dodaj apkę do ekranu głównego — na iPhonie push działa tylko z ikony.");
      return;
    }
    setPushSaving(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const current = await registration.pushManager.getSubscription();
      if (!enabled) {
        if (current) {
          const json = current.toJSON();
          await api.portal.unsubscribePush(token, {
            endpoint: current.endpoint,
            p256dh: json.keys?.p256dh ?? "",
            auth: json.keys?.auth ?? "",
          });
          await current.unsubscribe();
        }
        setPushEnabled(false);
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Powiadomienia są wyłączone w ustawieniach przeglądarki.");
        return;
      }
      const subscription =
        current ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToUint8Array(vapidKey),
        }));
      const json = subscription.toJSON();
      await api.portal.subscribePush(token, {
        endpoint: subscription.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
      });
      setPushEnabled(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPushSaving(false);
    }
  };

  if (!home) {
    return (
      <div className="mx-auto max-w-lg space-y-6 pb-24">
        <ErrorBanner message={error} />
        {error ? null : <PortalPageSkeleton label="Wczytuję profil…" />}
      </div>
    );
  }

  const today = home.today;

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-24">
      <ErrorBanner message={error} />

      <header className="flex items-center gap-3.5">
        <Avatar name={home.client.name} size="lg" />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-caps text-muted">Profil</p>
          <h1 className="mt-1 break-words text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground">
            {home.client.name}
          </h1>
        </div>
      </header>

      {today ? (
        <section aria-label="Aktualny plan">
          <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
            Aktualny plan
          </p>
          <p className="mt-2 break-words text-lg font-semibold tracking-tight text-foreground">
            {today.planName}
          </p>
          <p className="mt-0.5 text-sm text-muted">
            Tydzień {today.day.weekNumber} · {today.day.label}
          </p>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-surface-active">
            <div
              className="h-full rounded-full bg-invert-bg transition-[width] duration-[var(--dur-med)] ease-[var(--ease-out)]"
              style={{ width: `${Math.min(100, today.percent)}%` }}
            />
          </div>
          <p className="mt-2 font-mono text-sm tabular-nums text-muted">
            {today.completed}/{today.total} sesji · {today.percent}%
          </p>
        </section>
      ) : (
        <section>
          <p className="text-sm text-muted">Brak aktywnego planu. Poproś trenera o przypisanie.</p>
        </section>
      )}

      <section aria-label="Ustawienia">
        <p className="mb-1 font-mono text-xs font-medium uppercase tracking-caps text-muted">
          Ustawienia
        </p>
        <ul className="divide-y divide-border border-y border-border">
          <li className="flex min-h-14 items-center gap-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] text-foreground-secondary">Jasny motyw</p>
              <p className="mt-0.5 text-xs text-muted">
                Wyłączony = ciemny interfejs. Zapisuje się w tej przeglądarce.
              </p>
            </div>
            <Switch
              checked={theme === "light"}
              onChange={(light) => setTheme(light ? "light" : "dark")}
            />
          </li>
          <li className="flex min-h-14 items-center gap-3 py-2">
            <div className="min-w-0 flex-1 text-[15px] text-foreground-secondary">
              Auto-timer odpoczynku
            </div>
            <Switch
              checked={autoRest}
              onChange={(v) => {
                setAutoRest(v);
                writeAutoRest(v);
              }}
            />
          </li>
          <li className="flex min-h-14 items-center gap-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] text-foreground-secondary">Przerwa na ekranie blokady</p>
              <p className="mt-0.5 text-xs text-muted">
                Pokazuje odliczanie w kontrolkach odtwarzania — działa przy zgaszonym ekranie.
              </p>
            </div>
            <Switch
              checked={restLockScreen}
              onChange={(v) => {
                setRestLockScreen(v);
                writeRestLockScreen(v);
              }}
            />
          </li>
          <li className="flex min-h-14 items-center gap-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] text-foreground-secondary">Zapisuj RIR</p>
              <p className="mt-0.5 text-xs text-muted">
                Kolumna wysiłku przy każdej serii — domyślnie wyłączona.
              </p>
            </div>
            <Switch
              checked={logRir}
              onChange={(v) => {
                setLogRir(v);
                writeLogRir(v);
              }}
            />
          </li>
          <li className="flex min-h-14 items-center gap-3 py-2">
            <div className="min-w-0 flex-1 text-[15px] text-foreground-secondary">Jednostki</div>
            <span className="font-mono text-sm tabular-nums text-muted">kg</span>
          </li>
          <li className="flex min-h-14 items-center gap-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] text-foreground-secondary">Przypomnienia push</p>
              {!vapidKey ? (
                <p className="mt-0.5 text-xs text-muted">
                  Push wymaga konfiguracji. Przypomnienia e-mail ustawia trener.
                </p>
              ) : pushNeedsInstall ? (
                <p className="mt-0.5 text-xs text-muted">
                  Najpierw dodaj apkę do ekranu głównego — na iPhonie push działa tylko z ikony.
                </p>
              ) : null}
            </div>
            <Switch
              checked={pushEnabled}
              disabled={!vapidKey || pushSaving || pushNeedsInstall}
              onChange={(v) => void togglePush(v)}
            />
          </li>
        </ul>
      </section>

      {!standalone ? (
        <section aria-label="Aplikacja">
          <p className="mb-3 font-mono text-xs font-medium uppercase tracking-caps text-muted">
            Aplikacja
          </p>
          <PwaInstallPrompt token={token} requireCompletedSession={false} persistent />
        </section>
      ) : null}

      <section aria-label="Więcej">
        <p className="mb-1 font-mono text-xs font-medium uppercase tracking-caps text-muted">
          Więcej
        </p>
        <ul className="divide-y divide-border border-y border-border">
          <li>
            <Link
              href={`/portal/${token}/intake`}
              className="flex min-h-14 items-center justify-between gap-3 py-2 text-[15px] font-medium text-foreground transition-colors duration-[var(--dur-fast)] hover:text-foreground-secondary focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
            >
              Ankieta startowa
              <span className="text-muted-faint" aria-hidden>
                ›
              </span>
            </Link>
          </li>
          <li>
            <Link
              href={`/portal/${token}/measurements`}
              className="flex min-h-14 items-center justify-between gap-3 py-2 text-[15px] font-medium text-foreground transition-colors duration-[var(--dur-fast)] hover:text-foreground-secondary focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
            >
              Pomiary
              <span className="text-muted-faint" aria-hidden>
                ›
              </span>
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}

function base64UrlToUint8Array(value: string): ArrayBuffer {
  const padded = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index++) bytes[index] = raw.charCodeAt(index);
  return bytes.buffer;
}
