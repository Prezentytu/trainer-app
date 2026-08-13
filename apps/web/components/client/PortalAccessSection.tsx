"use client";

import { useEffect, useId, useState } from "react";
import { Icon } from "@/components/Icon";
import { api } from "@/lib/api";
import { formatDayShort } from "@/lib/dates";
import { markPortalLinkSent } from "@/lib/portalLinkSent";
import { silenceKind, silenceMessage } from "@/lib/silenceProtocol";
import { afterSessionMessage, prCongratsMessage, whatsappShareUrl } from "@/lib/whatsappMessages";
import { Button, ErrorBanner, Field, inputClass } from "@/components/ui";

function expireSelectValue(expiresAt: string | null): "never" | "30" | "90" | "365" {
  if (expiresAt == null) return "never";
  const remainingDays = Math.round((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
  if (remainingDays <= 45) return "30";
  if (remainingDays <= 180) return "90";
  return "365";
}

function expireHint(expiresAt: string | null): string {
  if (expiresAt == null) return "bez daty";
  const iso = expiresAt.slice(0, 10);
  return iso.length === 10 ? `do ${formatDayShort(iso)}` : "z datą";
}

const WA_PILL =
  "inline-flex h-[var(--h-control)] min-h-11 items-center rounded-[var(--r-pill)] border border-border-strong px-3 text-sm font-medium text-foreground transition-[background-color,border-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-surface-hover focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] active:scale-[0.98]";

export function PortalAccessSection({
  clientId,
  clientName,
  email,
  hasPortalPin,
  lastSession,
  lastRecord,
  lastAgo,
  onPinChange,
  onUndoToast,
}: {
  clientId: number;
  clientName: string;
  email: string | null;
  hasPortalPin: boolean;
  lastSession?: { dayLabel: string | null } | null;
  lastRecord?: { exerciseName: string; weightKg?: number | null } | null;
  lastAgo: number | null;
  onPinChange?: (hasPin: boolean) => void;
  onUndoToast: (message: string) => void;
}) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinDraft, setPinDraft] = useState("");
  const [pinSaving, setPinSaving] = useState(false);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null);
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const [expireSaving, setExpireSaving] = useState(false);
  const [copying, setCopying] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open || tokenLoaded) return;
    let cancelled = false;
    api.clients
      .accessToken(clientId)
      .then((row) => {
        if (cancelled) return;
        setTokenExpiresAt(row.expiresAt);
        setTokenLoaded(true);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [open, clientId, tokenLoaded]);

  const copyPortalLink = async () => {
    setCopying(true);
    setError(null);
    try {
      const { token } = await api.clients.accessToken(clientId);
      const url = `${window.location.origin}/portal/${token}`;
      await navigator.clipboard.writeText(url);
      markPortalLinkSent();
      onUndoToast("Skopiowano link portalu");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCopying(false);
    }
  };

  const sendPortalLink = async () => {
    setSending(true);
    setError(null);
    try {
      await api.clients.sendPortalLink(clientId);
      markPortalLinkSent();
      onUndoToast("Wysłano link portalu e-mailem");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  const savePin = async () => {
    setPinSaving(true);
    setError(null);
    try {
      const pin = pinDraft.length === 4 ? pinDraft : null;
      const row = await api.clients.setPortalPin(clientId, pin);
      setPinDraft("");
      onPinChange?.(row.hasPortalPin);
      onUndoToast(pin ? "Ustawiono PIN" : "Usunięto PIN");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPinSaving(false);
    }
  };

  const setExpiry = async (days: number | null) => {
    setExpireSaving(true);
    setError(null);
    try {
      const row = await api.clients.expireAccessToken(clientId, days);
      setTokenExpiresAt(row.expiresAt);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setExpireSaving(false);
    }
  };

  const pinActionDisabled =
    pinSaving || (pinDraft.length > 0 && pinDraft.length !== 4) || (pinDraft.length === 0 && !hasPortalPin);

  return (
    <section className="rounded-[var(--r-card)] border border-border-strong bg-transparent">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 w-full items-center gap-3 px-3.5 py-3 text-left transition-[background-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-surface-hover focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] active:scale-[0.98] sm:px-4"
      >
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">Dostęp do portalu</p>
          <p className="mt-0.5 text-sm text-muted">{hasPortalPin ? "PIN ustawiony" : "Bez PIN-u"}</p>
        </div>
        <Icon
          name="caret-down"
          size={18}
          className={`shrink-0 text-muted transition-transform duration-[var(--dur-med)] ease-[var(--ease-out)] motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          decorative
        />
      </button>

      <div
        id={panelId}
        className={`grid overflow-hidden transition-[grid-template-rows] duration-[var(--dur-med)] ease-[var(--ease-out)] motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="min-h-0 overflow-hidden" inert={!open || undefined}>
          <div className="space-y-4 border-t border-border px-3.5 py-4 sm:px-4">
            <ErrorBanner message={error} />

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" disabled={copying} onClick={() => void copyPortalLink()}>
                {copying ? "Kopiowanie…" : "Skopiuj link"}
              </Button>
              {email ? (
                <Button variant="ghost" disabled={sending} onClick={() => void sendPortalLink()}>
                  {sending ? "Wysyłanie…" : "Wyślij e-mailem"}
                </Button>
              ) : (
                <p className="self-center text-sm text-foreground-secondary">
                  Bez e-maila klient nie odzyska zgubionego linku. Dopisz adres w edycji profilu.
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="PIN portalu" hint={hasPortalPin ? "ustawiony" : "opcjonalny"}>
                <input
                  className={inputClass}
                  inputMode="numeric"
                  maxLength={4}
                  value={pinDraft}
                  onChange={(e) => setPinDraft(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="4 cyfry"
                  autoComplete="off"
                />
              </Field>
              <div className="flex flex-wrap items-end gap-2">
                <Button variant="secondary" disabled={pinActionDisabled} onClick={() => void savePin()}>
                  {pinDraft.length === 4 ? "Zapisz PIN" : "Usuń PIN"}
                </Button>
              </div>
              <Field label="Link ważny" hint={tokenLoaded ? expireHint(tokenExpiresAt) : undefined}>
                <select
                  className={inputClass}
                  disabled={expireSaving || !tokenLoaded}
                  value={expireSelectValue(tokenExpiresAt)}
                  onChange={(e) => {
                    const days = e.target.value === "never" ? null : Number(e.target.value);
                    void setExpiry(days);
                  }}
                >
                  <option value="never">Bez daty</option>
                  <option value="30">30 dni</option>
                  <option value="90">90 dni</option>
                  <option value="365">Rok</option>
                </select>
              </Field>
            </div>

            {lastSession || lastRecord || (lastAgo != null && lastAgo >= 7) ? (
              <div className="flex flex-wrap gap-2">
                {lastSession ? (
                  <a
                    className={WA_PILL}
                    href={whatsappShareUrl(afterSessionMessage(clientName, lastSession.dayLabel))}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp po treningu
                  </a>
                ) : null}
                {lastRecord ? (
                  <a
                    className={WA_PILL}
                    href={whatsappShareUrl(
                      prCongratsMessage(clientName, lastRecord.exerciseName, lastRecord.weightKg),
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp: rekord
                  </a>
                ) : null}
                {lastAgo != null && lastAgo >= 7 ? (
                  <a
                    className={WA_PILL}
                    href={whatsappShareUrl(
                      silenceMessage(
                        silenceKind({ reason: lastAgo >= 14 ? "silent" : "silent", daysSilent: lastAgo }),
                        clientName,
                        `${typeof window !== "undefined" ? window.location.origin : ""}/portal`,
                      ),
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp: cisza
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
