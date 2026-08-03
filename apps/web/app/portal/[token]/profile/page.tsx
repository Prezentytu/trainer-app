"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, PortalHome } from "@/lib/api";
import { Avatar, ErrorBanner, Switch } from "@/components/ui";
import { readAutoRest, writeAutoRest } from "@/lib/portalPrefs";

export default function PortalProfilePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [home, setHome] = useState<PortalHome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRest, setAutoRest] = useState(() => readAutoRest());
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSaving, setPushSaving] = useState(false);
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  const load = useCallback(() => {
    api.portal
      .home(token)
      .then(setHome)
      .catch((e: Error) => setError(e.message));
  }, [token]);

  useEffect(load, [load]);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    void navigator.serviceWorker.register("/sw.js").then(async (registration) => {
      const subscription = await registration.pushManager.getSubscription();
      setPushEnabled(Boolean(subscription));
    });
  }, []);

  const togglePush = async (enabled: boolean) => {
    if (!vapidKey || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setPushSaving(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
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
      <div>
        <ErrorBanner message={error} />
        <p className="text-sm text-muted">Ładowanie…</p>
      </div>
    );
  }

  const today = home.today;

  return (
    <div className="space-y-4 pb-8">
      <ErrorBanner message={error} />

      <div className="flex items-center gap-3.5">
        <Avatar name={home.client.name} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate font-display text-3xl font-bold">{home.client.name}</h1>
          <p className="mt-0.5 text-[13px] text-muted">Portal klienta · Workout Alchemist</p>
        </div>
      </div>

      {today ? (
        <div className="rounded-2xl border border-border bg-surface px-5 py-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-caps text-muted">Aktualny plan</p>
          <p className="mt-1.5 font-display text-lg font-semibold">{today.planName}</p>
          <p className="mt-0.5 text-[13px] text-muted">
            Tydzień {today.day.weekNumber} · {today.day.label}
          </p>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-active">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.min(100, today.percent)}%` }}
            />
          </div>
          <p className="mt-1.5 font-mono text-[13px] tabular-nums text-muted">
            {today.completed}/{today.total} sesji w bloku · {today.percent}%
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface px-5 py-4 text-[13px] text-muted shadow-card">
          Brak aktywnego planu. Poproś trenera o przypisanie.
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface px-5 py-1 shadow-card">
        <div className="flex min-h-14 items-center gap-3 border-b border-border">
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
        </div>
        <div className="flex min-h-14 items-center gap-3">
          <div className="min-w-0 flex-1 text-[15px] text-foreground-secondary">Jednostki</div>
          <span className="rounded-full border border-border bg-surface-raised px-3 py-1 font-mono text-[13px] text-muted">
            kg
          </span>
        </div>
        <div className="flex min-h-14 items-center gap-3 border-t border-border">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] text-foreground-secondary">Przypomnienia push</p>
            {!vapidKey ? (
              <p className="mt-0.5 text-xs text-muted">Push wymaga konfiguracji. Otrzymasz przypomnienia e-mail przez trenera.</p>
            ) : null}
          </div>
          <Switch checked={pushEnabled} disabled={!vapidKey || pushSaving} onChange={(v) => void togglePush(v)} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface px-5 py-1 shadow-card">
        <Link
          href={`/portal/${token}/intake`}
          className="flex min-h-14 items-center text-[15px] font-semibold text-accent"
        >
          Ankieta startowa
        </Link>
        <Link
          href={`/portal/${token}/measurements`}
          className="flex min-h-14 items-center border-t border-border text-[15px] font-semibold text-accent"
        >
          Pomiary
        </Link>
      </div>
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
