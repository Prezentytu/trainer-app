"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  api,
  AttentionItem,
  ClientActivityItem,
  DashboardData,
  DashboardFromClientItem,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/api";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  PageHeader,
  Dialog,
  OverflowMenu,
  OverflowMenuItem,
  ProgressRing,
  StatBlock,
} from "@/components/ui";
import { Icon } from "@/components/Icon";
import { DashboardSkeleton } from "@/components/skeletons";
import { markPortalLinkSent } from "@/lib/portalLinkSent";
import { refreshNavCounts } from "@/lib/navCounts";
import { formatKg } from "@/lib/plates";
import { formatTrainingsFraction } from "@/lib/plural";
import { canWriteSilence, silenceKind, silenceLabel, silenceMessage } from "@/lib/silenceProtocol";

type RowStatus = {
  kind: "no_plan" | "attention" | "ok";
  label: string;
  action?: AttentionItem["action"];
  portalToken?: string | null;
  attention?: AttentionItem;
};

type InboxRow = {
  key: string;
  clientId: number;
  clientName: string;
  label: string;
  href: string;
  rank: number;
  ctaLabel: string;
  ctaKind: "link" | "copy" | "assign" | "remind";
  ctaHref?: string;
  portalToken?: string | null;
  attention?: AttentionItem | null;
  notificationId?: number;
};

export function TrainerDashboard() {
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [reminder, setReminder] = useState<AttentionItem | null>(null);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const referralDismissed = useSyncExternalStore(
    subscribeReferralDismissed,
    getReferralDismissed,
    () => false,
  );

  useEffect(() => {
    let cancelled = false;
    api
      .dashboard()
      .then((data) => {
        if (!cancelled) setDash(data);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .dashboard()
      .then(setDash)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const recentSessions = dash?.recentSessions ?? [];
  const recentPrs = dash?.recentPrs ?? [];
  const hasCompletedSession =
    dash?.activation?.hasCompletedSession ?? (dash?.sessionsLast7Days ?? 0) > 0;
  const onboardingSteps = [
    (dash?.clients ?? 0) > 0,
    (dash?.clientActivity.some((client) => client.activePlans > 0) ?? false),
    Boolean(hasCompletedSession),
  ];
  const onboardingDone = onboardingSteps.filter(Boolean).length;
  const onboardingPct = Math.round((onboardingDone / onboardingSteps.length) * 100);
  const showOnboarding = !loading && onboardingDone < onboardingSteps.length;

  const rows = useMemo(() => {
    const activity = dash?.clientActivity ?? [];
    const attentionList = dash?.attention ?? [];
    const attentionByClient = new Map<number, AttentionItem>();
    for (const item of attentionList) attentionByClient.set(item.clientId, item);

    return activity
      .map((c) => {
        const att = attentionByClient.get(c.clientId);
        const status = resolveStatus(c, att);
        return { client: c, status };
      })
      .sort((a, b) => {
        const rank = (s: RowStatus) => (s.kind === "no_plan" ? 0 : s.kind === "attention" ? 1 : 2);
        const d = rank(a.status) - rank(b.status);
        if (d !== 0) return d;
        return a.client.clientName.localeCompare(b.client.clientName, "pl");
      });
  }, [dash]);

  const clientActivity = dash?.clientActivity ?? [];

  const needsAttention = useMemo(
    () => rows.filter((r) => r.status.kind !== "ok"),
    [rows],
  );
  const attentionIds = useMemo(
    () => new Set(needsAttention.map((r) => r.client.clientId)),
    [needsAttention],
  );
  /** Bez duplikacji z kolejką „Do zrobienia". */
  const weeklyOkRows = rows.filter((r) => !attentionIds.has(r.client.clientId));
  const trainedCount = clientActivity.filter((c) => c.sessions7d > 0).length;
  const silent14 = (dash?.attention ?? []).filter(
    (a) => a.reason === "silent" && (a.daysSilent ?? 0) >= 14,
  ).length;
  const sessionsThisWeek = dash?.sessionsLast7Days ?? 0;
  const sessionsPrevWeek = dash?.sessionsPrev7Days ?? 0;
  const sessionsDelta = sessionsThisWeek - sessionsPrevWeek;
  const prsLast7Days = dash?.prsLast7Days ?? 0;

  const firstClient = clientActivity[0] ?? null;
  const clientNeedingPlan =
    clientActivity.find((c) => c.activePlans === 0) ?? firstClient;
  const clientForLink =
    clientActivity.find((c) => c.portalToken) ?? firstClient;

  const inbox = useMemo(() => {
    if (!dash) return [];
    const byClient = new Map<number, InboxRow>();
    const take = (row: InboxRow) => {
      const prev = byClient.get(row.clientId);
      if (!prev || row.rank < prev.rank) byClient.set(row.clientId, row);
    };

    for (const item of dash.fromClients ?? []) {
      const href =
        item.kind === "history_import"
          ? `/clients/${item.clientId}/import`
          : item.sessionId != null
            ? `/clients/${item.clientId}/sessions/${item.sessionId}`
            : `/clients/${item.clientId}`;
      take({
        key: fromClientKey(item),
        clientId: item.clientId,
        clientName: item.clientName,
        label: item.preview,
        href,
        rank: inboxRank(item.kind),
        ctaLabel:
          item.kind === "history_import"
            ? "Sprawdź import"
            : item.sessionId != null
              ? "Otwórz"
              : "Przejdź do klienta",
        ctaKind: "link",
        ctaHref: href,
        notificationId: item.id,
      });
    }

    for (const { client, status } of needsAttention) {
      const assign = status.kind === "no_plan";
      const remind = canWriteSilence(status.attention);
      const copy = status.action === "copy_portal_link" && !remind;
      take({
        key: `att-${client.clientId}`,
        clientId: client.clientId,
        clientName: client.clientName,
        label: status.label,
        href: `/clients/${client.clientId}`,
        rank: inboxRank(status.kind, status.attention?.reason),
        ctaLabel: assign ? "Przypisz plan" : remind ? "Napisz" : copy ? "Skopiuj link" : "Przejdź do klienta",
        ctaKind: assign ? "assign" : remind ? "remind" : copy ? "copy" : "link",
        ctaHref: `/clients/${client.clientId}`,
        portalToken: status.portalToken,
        attention: status.attention ?? null,
      });
    }

    return [...byClient.values()]
      .sort((a, b) => a.rank - b.rank || a.clientName.localeCompare(b.clientName, "pl"))
      .slice(0, 8);
  }, [dash, needsAttention]);

  const markInboxRow = (row: InboxRow) => {
    if (row.notificationId == null) return;
    void api.inbox
      .markRead(row.notificationId)
      .then(() => refreshNavCounts())
      .catch(() => {});
  };

  const copyPortalLink = async (clientId: number, portalToken: string | null | undefined) => {
    if (!portalToken) return;
    const url = `${window.location.origin}/portal/${portalToken}`;
    try {
      await navigator.clipboard.writeText(url);
      markPortalLinkSent();
      setCopiedId(clientId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError("Nie udało się skopiować linku.");
    }
  };

  const reminderKind = reminder ? silenceKind(reminder) : "day7";
  const reminderUrl =
    reminder?.portalToken && typeof window !== "undefined"
      ? `${window.location.origin}/portal/${reminder.portalToken}`
      : "";
  const reminderText = reminder ? silenceMessage(reminderKind, reminder.clientName, reminderUrl) : "";

  const copyReminderMessage = async () => {
    if (!reminderText) return;
    try {
      await navigator.clipboard.writeText(reminderText);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    } catch {
      setError("Nie udało się skopiować wiadomości.");
    }
  };

  const sendReminder = async () => {
    if (!reminder) return;
    setSendingReminder(true);
    try {
      await api.clients.sendReminder(reminder.clientId, reminderText);
      setReminder(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSendingReminder(false);
    }
  };

  const dismissReferral = () => {
    try {
      localStorage.setItem(REFERRAL_DISMISSED_KEY, "1");
      window.dispatchEvent(new Event(REFERRAL_DISMISSED_EVENT));
    } catch {
      /* private mode */
    }
  };

  const copyReferral = async () => {
    const origin = window.location.origin;
    const text = `Prowadzę plany w RepMaxer — klient otwiera link w przeglądarce, bez konta. Jak chcesz zobaczyć, kto nie trenował: ${origin}/wdrozenie`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(-1);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError("Nie udało się skopiować wiadomości.");
    }
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div>
      <PageHeader
        title="Panel"
        subtitle="Przegląd ostatnich 7 dni"
        action={
          showOnboarding && !onboardingSteps[0] ? (
            <Link href="/clients">
              <Button>Dodaj klienta</Button>
            </Link>
          ) : showOnboarding && !onboardingSteps[1] ? (
            <Link
              href={
                clientNeedingPlan
                  ? `/plans/new?clientId=${clientNeedingPlan.clientId}`
                  : "/plans/new"
              }
            >
              <Button>Przypisz plan</Button>
            </Link>
          ) : showOnboarding ? (
            <Button
              disabled={!clientForLink?.portalToken}
              onClick={() =>
                void copyPortalLink(clientForLink?.clientId ?? 0, clientForLink?.portalToken)
              }
            >
              {copiedId === clientForLink?.clientId ? "Skopiowano" : "Skopiuj link"}
            </Button>
          ) : (
            <Link href="/plans/new">
              <Button>Utwórz plan</Button>
            </Link>
          )
        }
      />
      <ErrorBanner
        message={error}
        action={
          error && error !== SESSION_EXPIRED_MESSAGE ? (
            <Button size="sm" variant="secondary" onClick={retry}>
              Spróbuj ponownie
            </Button>
          ) : undefined
        }
      />

      {showOnboarding && (
        <Card className="mb-6" title="Pierwsze 15 minut">
          <div className="mb-4 flex items-center gap-3">
            <ProgressRing value={onboardingPct / 100} size={48} label={`${onboardingPct}%`} />
            <p className="text-sm text-muted-strong">
              Konto założone · {onboardingPct}%<br />
              {onboardingDone}/3 kroków wykonanych
            </p>
          </div>
          <ol className="space-y-3 text-sm text-foreground-secondary">
            <OnboardingStep done={onboardingSteps[0]}>
              {onboardingSteps[0] ? (
                <span>Klient dodany</span>
              ) : (
                <span>
                  <Link href="/clients" className="font-semibold text-accent-text hover:underline">
                    Dodaj klienta
                  </Link>{" "}
                  — imię i cel wystarczą.
                </span>
              )}
            </OnboardingStep>
            <OnboardingStep done={onboardingSteps[1]}>
              {onboardingSteps[1] ? (
                <span>Plan przypisany</span>
              ) : (
                <span>
                  <Link
                    href={
                      clientNeedingPlan
                        ? `/plans/new?clientId=${clientNeedingPlan.clientId}`
                        : "/plans/new"
                    }
                    className="font-semibold text-accent-text hover:underline"
                  >
                    Przypisz plan
                  </Link>{" "}
                  — szablon albo nowy plan dla klienta.
                </span>
              )}
            </OnboardingStep>
            <OnboardingStep done={onboardingSteps[2]}>
              {onboardingSteps[2] ? (
                <span>Klient dokończył trening</span>
              ) : (
                <span className="flex flex-wrap items-center gap-2">
                  <span>Wyślij link i poproś o jeden trening w tym tygodniu.</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!clientForLink?.portalToken}
                    onClick={() =>
                      void copyPortalLink(clientForLink?.clientId ?? 0, clientForLink?.portalToken)
                    }
                  >
                    {copiedId === clientForLink?.clientId ? "Skopiowano" : "Skopiuj link"}
                  </Button>
                </span>
              )}
            </OnboardingStep>
          </ol>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <StatCard
            label="Trenowało"
            value={`${trainedCount} z ${clientActivity.length}`}
            href={showOnboarding ? "#ostatnie-sesje" : "#klienci-tygodnia"}
          />
          <StatCard
            label="Sesje"
            value={sessionsThisWeek}
            href="#ostatnie-sesje"
            delta={
              sessionsDelta === 0
                ? "bez zmian vs poprzedni tydzień"
                : `${sessionsDelta > 0 ? "+" : ""}${sessionsDelta} vs poprzedni tydzień`
            }
          />
          <StatCard
            label="Nowe rekordy"
            value={prsLast7Days > 0 ? `★ ${prsLast7Days}` : prsLast7Days}
            href="#nowe-rekordy"
            valueClassName={prsLast7Days > 0 ? "text-pr" : undefined}
          />
        </div>

      {inbox.length > 0 ? (
        <Card
          className="mb-6"
          title="Do zrobienia"
          pending
          headerAction={
            <Link href="/inbox" className="font-mono text-xs tabular-nums text-muted underline-offset-2 hover:underline">
              {(dash?.inboxUnread ?? 0) > 0 ? `Wszystkie · ${dash?.inboxUnread}` : "Wszystkie"}
            </Link>
          }
        >
          <ul className="divide-y divide-border">
            {inbox.map((row) => (
              <li
                key={row.key}
                className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <Link
                  href={row.href}
                  className="flex min-w-0 items-center gap-2.5"
                  onClick={() => markInboxRow(row)}
                >
                  <Avatar name={row.clientName} size="sm" />
                  <span className="min-w-0">
                    <span className="block break-words text-sm font-medium">{row.clientName}</span>
                    <span className="block break-words text-xs text-muted">{row.label}</span>
                  </span>
                </Link>
                <div className="flex w-full items-center gap-2 sm:w-auto">
                  {row.ctaKind === "copy" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 sm:flex-none"
                      disabled={!row.portalToken}
                      onClick={() => void copyPortalLink(row.clientId, row.portalToken)}
                    >
                      {copiedId === row.clientId ? "Skopiowano" : row.ctaLabel}
                    </Button>
                  ) : row.ctaKind === "remind" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 sm:flex-none"
                      onClick={() => setReminder(row.attention ?? null)}
                    >
                      {row.ctaLabel}
                    </Button>
                  ) : (
                    <Link
                      href={row.ctaHref ?? row.href}
                      className="flex-1 sm:flex-none"
                      onClick={() => markInboxRow(row)}
                    >
                      <Button size="sm" variant="secondary" className="w-full">
                        {row.ctaLabel}
                      </Button>
                    </Link>
                  )}
                  <OverflowMenu>
                    {({ close }) => (
                      <>
                        <OverflowMenuItem href={`/clients/${row.clientId}`} onClick={close}>
                          Przejdź do klienta
                        </OverflowMenuItem>
                        {row.portalToken ? (
                          <OverflowMenuItem
                            onClick={() => {
                              void copyPortalLink(row.clientId, row.portalToken);
                              close();
                            }}
                          >
                            Skopiuj link
                          </OverflowMenuItem>
                        ) : null}
                        {canWriteSilence(row.attention) ? (
                          <OverflowMenuItem
                            onClick={() => {
                              setReminder(row.attention ?? null);
                              close();
                            }}
                          >
                            Napisz
                          </OverflowMenuItem>
                        ) : null}
                      </>
                    )}
                  </OverflowMenu>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {silent14 > 0 ? (
        <p className="mb-6 text-sm text-muted">
          {silent14 === 1
            ? "1 osoba bez treningu od 14 dni — napisz z kolejki powyżej."
            : silent14 < 5
              ? `${silent14} osoby bez treningu od 14 dni — napisz z kolejki powyżej.`
              : `${silent14} osób bez treningu od 14 dni — napisz z kolejki powyżej.`}
        </p>
      ) : null}

      {!showOnboarding && (
        <div id="klienci-tygodnia" className="mb-6 scroll-mt-20">
        <Card title="Klienci w tym tygodniu">
          {rows.length === 0 ? (
            <EmptyState
              title="Dodaj pierwszego klienta"
              action={
                <Link href="/clients">
                  <Button size="sm">Dodaj klienta</Button>
                </Link>
              }
            >
              Podopieczny z planem i treningami pojawi się tutaj — zacznij od profilu klienta.
            </EmptyState>
          ) : weeklyOkRows.length === 0 ? (
            <p className="text-sm text-muted">
              Wszyscy klienci wymagający uwagi są powyżej — reszta w normie.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {weeklyOkRows.map(({ client, status }) => (
                <li
                  key={client.clientId}
                  className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                >
                  <Link
                    href={`/clients/${client.clientId}`}
                    className="flex min-w-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
                  >
                    <StatusIcon status={status} />
                    <Avatar name={client.clientName} size="sm" />
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-medium">{client.clientName}</span>
                      <span className="block text-xs text-muted">{status.label}</span>
                    </span>
                  </Link>

                  <div className="flex flex-wrap items-center gap-3 pl-8 sm:pl-0">
                    <span className="font-mono text-xs tabular-nums text-muted-strong">
                      {formatSessions(client.sessions7d, client.weeklyTarget)}
                      <span className="text-muted"> · </span>
                      {formatRelativeDate(client.lastSessionOn)}
                    </span>
                    {formatCompliance(status.attention) ? (
                      <span className="font-mono text-xs tabular-nums text-muted">
                        {formatCompliance(status.attention)}
                      </span>
                    ) : null}
                    {status.kind === "no_plan" ? (
                      <Link href={`/clients/${client.clientId}`}>
                        <Button size="sm" variant="secondary">
                          Przypisz plan
                        </Button>
                      </Link>
                    ) : status.kind === "attention" && status.action === "copy_portal_link" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!status.portalToken}
                        onClick={() => void copyPortalLink(client.clientId, status.portalToken)}
                      >
                        {copiedId === client.clientId ? "Skopiowano" : "Skopiuj link"}
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div id="ostatnie-sesje" className="scroll-mt-20">
        <Card title="Ostatnie sesje">
          {recentSessions.length === 0 ? (
            <EmptyState
              title="Tu zobaczysz ostatnie treningi"
              action={
                <Link href="/clients">
                  <Button size="sm">Otwórz klientów</Button>
                </Link>
              }
            >
              Wejdź w klienta i dodaj pierwszy trening — albo poczekaj, aż klient zaloguje sesję w portalu.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {recentSessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link
                    href={`/clients/${s.clientId}/sessions/${s.id}`}
                    className="flex min-w-0 items-center gap-2.5 text-sm hover:text-accent focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
                  >
                    <Avatar name={s.clientName} size="sm" />
                    <span className="min-w-0">
                      <span className="font-medium">{s.clientName}</span>
                      <span className="mt-0.5 block font-mono text-xs tabular-nums text-muted">
                        {s.dayLabel ?? "Trening"} · {formatRelativeDate(s.performedOn)}
                        {s.outOfOrder ? " · poza kolejką" : ""}
                      </span>
                    </span>
                  </Link>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                    {Math.round(s.totalVolumeKg)} kg
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        </div>

        <div id="nowe-rekordy" className="scroll-mt-20">
        <Card title="Nowe rekordy">
          {recentPrs.length === 0 ? (
            <EmptyState
              title="Dodaj pierwszą serię z ciężarem"
              action={
                <Link href="/clients">
                  <Button size="sm">Otwórz klientów</Button>
                </Link>
              }
            >
              PR-y pojawią się po zapisaniu serii z ciężarem i powtórzeniami.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {recentPrs.map((r, i) => (
                <li
                  key={`${r.clientId}-${r.exerciseId}-${r.performedOn}-${r.estimated1Rm}-${i}`}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <Link
                    href={`/clients/${r.clientId}`}
                    className="flex min-w-0 items-center gap-2.5 text-sm hover:text-accent focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
                  >
                    <Avatar name={r.clientName} size="sm" />
                    <span className="min-w-0">
                      <span className="block break-words font-medium">{r.exerciseName}</span>
                      <span className="mt-0.5 block text-xs text-muted">{r.clientName}</span>
                    </span>
                  </Link>
                  <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-pr">
                    ★ {formatKg(r.estimated1Rm)} kg
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        </div>
      </div>

      {hasCompletedSession && !referralDismissed && !showOnboarding ? (
        <Card className="mt-6" title="Poleć RepMaxer trenerowi">
          <p className="text-sm text-foreground-secondary">
            Miesiąc przy limicie 15 osób za polecenie, które dojdzie do zalogowanego treningu — nie do rejestracji.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => void copyReferral()}>
              {copiedId === -1 ? "Skopiowano" : "Skopiuj wiadomość"}
            </Button>
            <Button size="sm" variant="ghost" onClick={dismissReferral}>
              Ukryj
            </Button>
          </div>
        </Card>
      ) : null}

      <Dialog
        open={Boolean(reminder)}
        title={reminder ? `Napisz do ${reminder.clientName}` : "Napisz"}
        description={reminder ? silenceLabel(reminderKind) : undefined}
        confirmLabel={sendingReminder ? "Wysyłanie…" : "Wyślij e-mail lub push"}
        cancelLabel="Zamknij"
        busy={sendingReminder}
        onConfirm={() => void sendReminder()}
        onCancel={() => setReminder(null)}
        className="max-w-md"
      >
        {reminder ? (
          <div className="space-y-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground-secondary">
              {reminderText}
            </p>
            <Button size="sm" variant="secondary" onClick={() => void copyReminderMessage()}>
              {copiedMessage ? "Skopiowano" : "Skopiuj na WhatsApp"}
            </Button>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

const REFERRAL_DISMISSED_KEY = "rm-referral-dismissed";
const REFERRAL_DISMISSED_EVENT = "rm-referral-dismissed";

function getReferralDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(REFERRAL_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeReferralDismissed(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(REFERRAL_DISMISSED_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(REFERRAL_DISMISSED_EVENT, onChange);
  };
}

function formatCompliance(att?: AttentionItem | null): string | null {
  if (!att) return null;
  return formatTrainingsFraction(att.completedInWindow ?? 0, att.expectedInWindow ?? 0);
}

function fromClientKey(item: DashboardFromClientItem): string {
  return `n-${item.id}`;
}

function inboxRank(kind: string, reason?: string): number {
  if (kind === "session_reply") return 0;
  if (kind === "history_import") return 1;
  if (kind === "low_checkin") return 2;
  if (kind === "session_note") return 3;
  if (kind === "photo" || kind === "measurement" || kind === "intake") return 3;
  if (kind === "no_plan" || reason === "no_plan") return 4;
  if (kind === "out_of_order") return 5;
  return 6;
}

function OnboardingStep({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <li className={`flex items-start gap-3 ${done ? "text-muted" : ""}`}>
      {done ? (
        <Icon name="check-circle" size={16} className="mt-0.5 shrink-0 text-gain" decorative />
      ) : (
        <Icon name="circle" size={16} className="mt-0.5 shrink-0 text-muted-faint" decorative />
      )}
      <span className={done ? "line-through decoration-border-strong" : undefined}>{children}</span>
    </li>
  );
}

/** KPI bez boxa — liczby stoją na tle strony, ramki zostają dla treści. */
function StatCard({
  label,
  value,
  href,
  delta,
  valueClassName,
}: {
  label: string;
  value: string | number;
  href: string;
  delta?: string;
  valueClassName?: string;
}) {
  return (
    <Link
      href={href}
      className="-mx-2 block rounded-lg px-2 py-1.5 transition-colors duration-[var(--dur-fast)] hover:bg-surface focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
    >
      <StatBlock
        label={label}
        value={value}
        size="lg"
        delta={delta}
        reserveDelta
        valueClassName={valueClassName}
      />
    </Link>
  );
}

function StatusIcon({ status }: { status: RowStatus }) {
  if (status.kind === "no_plan") {
    return <Icon name="clipboard-text" size={16} className="shrink-0 text-muted-strong" decorative />;
  }
  if (status.kind === "attention") {
    return <Icon name="warning" size={16} className="shrink-0 text-danger" decorative />;
  }
  return <Icon name="check-circle" size={16} className="shrink-0 text-gain" decorative />;
}

function resolveStatus(client: ClientActivityItem, att?: AttentionItem): RowStatus {
  if (att?.reason === "no_plan" || client.activePlans === 0) {
    return {
      kind: "no_plan",
      label: att?.message ?? "Brak planu",
      action: "assign_plan",
      portalToken: att?.portalToken ?? client.portalToken,
      attention: att,
    };
  }
  if (att) {
    return {
      kind: "attention",
      label: att.message,
      action: att.action,
      portalToken: att.portalToken ?? client.portalToken,
      attention: att,
    };
  }
  return {
    kind: "ok",
    label: client.sessions7d > 0 ? "W normie" : "Bez sesji w tym tygodniu",
  };
}

function formatSessions(sessions7d: number, weeklyTarget: number | null): string {
  // Ułamek tylko w drodze do celu; „3/1 sesji" po przekroczeniu wygląda jak błąd.
  if (weeklyTarget != null && weeklyTarget > 0 && sessions7d < weeklyTarget) {
    return `${sessions7d}/${weeklyTarget} sesji`;
  }
  return sessionsLabel(sessions7d);
}

function sessionsLabel(n: number): string {
  if (n === 1) return "1 sesja";
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} sesje`;
  return `${n} sesji`;
}

/** Daty ISO YYYY-MM-DD → dziś / wczoraj / N dni temu / brak sesji. */
export function formatRelativeDate(iso: string | null | undefined): string {
  if (!iso) return "brak sesji";
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  const days = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  if (days <= 0) return "dziś";
  if (days === 1) return "wczoraj";
  if (days < 30) return `${days} dni temu`;
  return iso.slice(0, 10);
}
