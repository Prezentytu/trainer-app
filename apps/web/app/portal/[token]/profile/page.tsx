"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, PortalHome } from "@/lib/api";
import { Avatar, ErrorBanner, Switch } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
import { PortalPageSkeleton } from "@/components/skeletons";
import { PwaInstallPrompt } from "@/components/portal/PwaInstallPrompt";
import { SectionHeader } from "@/components/portal/SectionHeader";
import {
  readAutoRest,
  readLogRir,
  readRestLockScreen,
  writeAutoRest,
  writeLogRir,
  writeRestLockScreen,
} from "@/lib/portalPrefs";
import { isIosDevice, isStandaloneDisplay, useIsIos, useIsStandalone } from "@/lib/pwa";
import { PALETTES, usePalette, useTheme } from "@/lib/theme";

function SettingsRow({
  title,
  right,
  hint,
}: {
  title: string;
  right: ReactNode;
  hint?: string;
}) {
  return (
    <li className="flex min-h-11 items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-foreground">{title}</p>
        {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
      </div>
      <div className="shrink-0">{right}</div>
    </li>
  );
}

function NavRow({
  href,
  icon,
  title,
  sub,
}: {
  href: string;
  icon: IconName;
  title: string;
  sub?: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex min-h-11 w-full items-center gap-3 py-2.5 text-left transition-colors duration-[var(--dur-fast)] hover:bg-surface focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] active:scale-[0.98]"
      >
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-raised text-foreground">
          <Icon name={icon} size={18} decorative />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium text-foreground">{title}</span>
          {sub ? <span className="mt-0.5 block text-sm text-muted">{sub}</span> : null}
        </span>
        <Icon name="caret-right" size={16} className="shrink-0 text-muted" decorative />
      </Link>
    </li>
  );
}

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
  const { palette, setPalette } = usePalette();
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

  // Bez klucza VAPID wiersz push w ogóle się nie pokazuje — nie tłumaczymy się z konfiguracji.
  const pushHint = pushNeedsInstall
    ? "Najpierw dodaj apkę do ekranu głównego — na iPhonie push działa tylko z ikony."
    : undefined;

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-24">
      <ErrorBanner message={error} />

      <header className="flex items-center gap-3.5">
        <Avatar name={home.client.name} size="lg" />
        <div className="min-w-0">
          <h1 className="break-words text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground">
            {home.client.name}
          </h1>
        </div>
      </header>

      <section aria-label="Trening">
        <SectionHeader title="Trening" />
        <ul className="divide-y divide-border">
          <SettingsRow
            title="Auto-timer przerwy"
            right={
              <Switch
                checked={autoRest}
                onChange={(v) => {
                  setAutoRest(v);
                  writeAutoRest(v);
                }}
              />
            }
          />
          <SettingsRow
            title="Przerwa na ekranie blokady"
            hint="Pauzuje muzykę na słuchawkach na czas odliczania."
            right={
              <Switch
                checked={restLockScreen}
                onChange={(v) => {
                  setRestLockScreen(v);
                  writeRestLockScreen(v);
                }}
              />
            }
          />
          <SettingsRow
            title="Zapisuj RIR"
            right={
              <Switch
                checked={logRir}
                onChange={(v) => {
                  setLogRir(v);
                  writeLogRir(v);
                }}
              />
            }
          />
        </ul>
      </section>

      <section aria-label="Aplikacja">
        <SectionHeader title="Aplikacja" />
        <ul className="divide-y divide-border">
          <SettingsRow
            title="Jasny motyw"
            right={
              <Switch
                checked={theme === "light"}
                onChange={(light) => setTheme(light ? "light" : "dark")}
              />
            }
          />
          <li className="py-3">
            <p className="text-[15px] font-medium text-foreground">Kolorystyka</p>
            <p className="mt-0.5 text-xs text-muted">
              Każda ma swój kolor. Rekordy zostają złote.
            </p>
            <div
              className="mt-3 grid grid-cols-5 gap-1"
              role="radiogroup"
              aria-label="Kolorystyka"
            >
              {PALETTES.map((p) => {
                const selected = palette === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={p.label}
                    onClick={() => setPalette(p.id)}
                    className="flex min-h-11 min-w-0 flex-col items-center gap-1.5 rounded-lg px-0.5 py-1 text-center transition-[transform,color] duration-[var(--dur-fast)] ease-[var(--ease-out)] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
                  >
                    <span
                      className={
                        selected
                          ? "palette-swatch ring-2 ring-invert-bg ring-offset-2 ring-offset-background"
                          : "palette-swatch"
                      }
                      data-swatch={p.id}
                      aria-hidden
                    />
                    <span
                      className={`break-words text-[13px] leading-tight ${
                        selected ? "font-medium text-foreground" : "text-muted"
                      }`}
                    >
                      {p.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </li>
          {vapidKey ? (
            <SettingsRow
              title="Przypomnienia push"
              hint={pushHint}
              right={
                <Switch
                  checked={pushEnabled}
                  disabled={pushSaving || pushNeedsInstall}
                  onChange={(v) => void togglePush(v)}
                />
              }
            />
          ) : null}
          <SettingsRow
            title="Jednostki"
            right={<span className="font-mono text-sm tabular-nums text-muted">kg</span>}
          />
        </ul>
      </section>

      {!standalone ? (
        <section aria-label="Zainstaluj aplikację">
          <SectionHeader title="Zainstaluj aplikację" />
          <PwaInstallPrompt token={token} requireCompletedSession={false} persistent />
        </section>
      ) : null}

      <section aria-label="Więcej">
        <SectionHeader title="Więcej" />
        <ul className="divide-y divide-border">
          <NavRow
            href={`/portal/${token}/intake`}
            icon="clipboard-text"
            title="Ankieta startowa"
            sub="Dane dla trenera na start"
          />
          <NavRow
            href={`/portal/${token}/measurements`}
            icon="ruler"
            title="Pomiary"
            sub="Waga i obwody"
          />
          <NavRow
            href={`/portal/${token}/calculator`}
            icon="calculator"
            title="Kalkulator %1RM"
            sub="Strefy ciężaru z rekordu"
          />
          <NavRow href="/prywatnosc" icon="lock-simple" title="Polityka prywatności" />
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
