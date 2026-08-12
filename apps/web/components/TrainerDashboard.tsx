"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  api,
  AttentionItem,
  ClientActivityItem,
  DashboardData,
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
  ProgressRing,
  StatBlock,
} from "@/components/ui";
import { Icon } from "@/components/Icon";
import { DashboardSkeleton } from "@/components/skeletons";
import {
  getPortalLinkSent,
  markPortalLinkSent,
  subscribePortalLinkSent,
} from "@/lib/portalLinkSent";
import { formatKg } from "@/lib/plates";

type RowStatus = {
  kind: "no_plan" | "attention" | "ok";
  label: string;
  action?: AttentionItem["action"];
  portalToken?: string | null;
  attention?: AttentionItem;
};

export function TrainerDashboard() {
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [reminder, setReminder] = useState<AttentionItem | null>(null);
  const [sendingReminder, setSendingReminder] = useState(false);
  const portalLinkSent = useSyncExternalStore(subscribePortalLinkSent, getPortalLinkSent, () => false);

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

  // Klient już trenował / ma PR → link musiał dotrzeć; zsynchronizuj flagę onboardingu.
  useEffect(() => {
    if (portalLinkSent || !dash) return;
    const evidence =
      dash.recentSessions.length > 0 ||
      dash.sessionsLast7Days > 0 ||
      dash.prsLast7Days > 0 ||
      dash.recentPrs.length > 0;
    if (evidence) markPortalLinkSent();
  }, [dash, portalLinkSent]);

  const recentSessions = dash?.recentSessions ?? [];
  const recentPrs = dash?.recentPrs ?? [];
  const onboardingSteps = [
    (dash?.clients ?? 0) > 0,
    (dash?.clientActivity.some((client) => client.activePlans > 0) ?? false),
    portalLinkSent,
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

  const needsAttention = rows.filter((r) => r.status.kind !== "ok");
  const attentionIds = useMemo(
    () => new Set(needsAttention.map((r) => r.client.clientId)),
    [needsAttention],
  );
  /** Bez duplikacji z kartą „Wymagają uwagi". */
  const weeklyOkRows = rows.filter((r) => !attentionIds.has(r.client.clientId));
  const trainedCount = clientActivity.filter((c) => c.sessions7d > 0).length;
  const sessionsThisWeek = dash?.sessionsLast7Days ?? 0;
  const sessionsPrevWeek = dash?.sessionsPrev7Days ?? 0;
  const sessionsDelta = sessionsThisWeek - sessionsPrevWeek;
  const prsLast7Days = dash?.prsLast7Days ?? 0;

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

  const sendReminder = async () => {
    if (!reminder) return;
    setSendingReminder(true);
    try {
      await api.clients.sendReminder(reminder.clientId);
      setReminder(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSendingReminder(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div>
      <PageHeader
        title="Panel"
        subtitle="Przegląd ostatnich 7 dni"
        action={
          <Link href="/plans/new">
            <Button>+ Nowy plan</Button>
          </Link>
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
                  <Link href="/plans" className="font-semibold text-accent-text hover:underline">
                    Przypisz plan
                  </Link>{" "}
                  — wybierz gotowy plan z biblioteki albo zbuduj własny.
                </span>
              )}
            </OnboardingStep>
            <OnboardingStep done={onboardingSteps[2]}>
              {onboardingSteps[2] ? (
                <span>Link portalu wysłany</span>
              ) : (
                <span>Skopiuj link portalu z karty klienta i wyślij go podopiecznemu.</span>
              )}
            </OnboardingStep>
          </ol>
        </Card>
      )}

      {!showOnboarding && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Trenowało (7 dni)"
            value={`${trainedCount} z ${clientActivity.length}`}
            href="/clients"
          />
          <StatCard
            label="Sesje (7 dni)"
            value={sessionsThisWeek}
            href="/clients"
            delta={
              sessionsDelta === 0
                ? "bez zmian vs poprz. tydz."
                : `${sessionsDelta > 0 ? "+" : ""}${sessionsDelta} vs poprz. tydz.`
            }
          />
          <StatCard
            label="Nowe rekordy (7 dni)"
            value={prsLast7Days > 0 ? `★ ${prsLast7Days}` : prsLast7Days}
            href="/clients"
            valueClassName={prsLast7Days > 0 ? "text-pr" : undefined}
          />
        </div>
      )}

      {needsAttention.length > 0 ? (
        <Card
          className="mb-6"
          eyebrow="Wymagają uwagi"
          eyebrowMark
          pending
          icon={<Icon name="warning" size={16} decorative />}
          iconTone="danger"
          headerAction={
            <span className="font-mono text-xs tabular-nums text-muted">
              {needsAttention.length}
            </span>
          }
        >
          <ul className="divide-y divide-border">
            {needsAttention.map(({ client, status }) => (
              <li key={client.clientId} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <Link href={`/clients/${client.clientId}`} className="flex min-w-0 items-center gap-2.5">
                  <Avatar name={client.clientName} size="sm" />
                  <span className="min-w-0">
                    <span className="block break-words text-sm font-medium">{client.clientName}</span>
                    <span className="block text-xs text-muted">{status.label}</span>
                  </span>
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  {status.attention?.compliancePct != null ? (
                    <span className="font-mono text-xs tabular-nums text-muted-strong">
                      zgodność {status.attention.compliancePct}%
                    </span>
                  ) : null}
                  <Link href={`/clients/${client.clientId}`}>
                    <Button size="sm" variant="ghost">
                      Przejdź do klienta
                    </Button>
                  </Link>
                  {status.action === "copy_portal_link" && status.portalToken ? (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => void copyPortalLink(client.clientId, status.portalToken)}>
                        Skopiuj link
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setReminder(status.attention ?? null)}
                      >
                        Wyślij przypomnienie
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {!showOnboarding && (
        <Card
          className="mb-6"
          eyebrow="Ten tydzień"
          eyebrowMark
          title="Klienci w tym tygodniu"
          icon={<Icon name="clients" size={16} decorative />}
          headerAction={
            needsAttention.length === 0 ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-gain">
                <span aria-hidden>▲</span>
                Wszyscy trenują zgodnie z planem
              </span>
            ) : (
              <span className="font-mono text-xs tabular-nums text-muted">
                {needsAttention.length} wymaga uwagi
              </span>
            )
          }
        >
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
                    {status.attention?.compliancePct != null ? (
                      <span className="font-mono text-xs tabular-nums text-muted">
                        zgodność {status.attention.compliancePct}%
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
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          eyebrow="Historia"
          eyebrowMark
          title="Ostatnie sesje"
          icon={<Icon name="history" size={16} decorative />}
        >
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

        <Card
          eyebrow="Rekordy"
          eyebrowMark
          title="Nowe rekordy"
          icon={<Icon name="trophy" size={16} decorative />}
          iconTone="pr"
        >
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
                      <span className="font-medium">{r.clientName}</span>
                      <span className="mt-0.5 block break-words text-xs text-muted">{r.exerciseName}</span>
                    </span>
                  </Link>
                  <span className="shrink-0 rounded-[var(--radius-pill)] border border-pr-border bg-pr-dim px-2.5 py-0.5 font-mono text-sm font-semibold tabular-nums text-pr">
                    ★ {formatKg(r.estimated1Rm)} kg
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <Dialog
        open={Boolean(reminder)}
        title="Wyślij przypomnienie"
        description={reminder ? `Do ${reminder.clientName}: „Przypomnienie od trenera — Twój trening czeka.”` : undefined}
        confirmLabel={sendingReminder ? "Wysyłanie…" : "Wyślij przypomnienie"}
        onConfirm={() => void sendReminder()}
        onCancel={() => setReminder(null)}
      />
    </div>
  );
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

function StatCard({
  label,
  value,
  href,
  delta,
  valueClassName,
  icon,
}: {
  label: string;
  value: string | number;
  href: string;
  delta?: string;
  valueClassName?: string;
  icon?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block h-full rounded-xl focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
    >
      <Card className="relative h-full transition-colors hover:border-border-strong">
        {icon ? <span className="absolute top-5 right-5 sm:top-6 sm:right-6">{icon}</span> : null}
        <StatBlock
          label={label}
          value={value}
          size="lg"
          delta={delta}
          reserveDelta
          valueClassName={valueClassName}
        />
      </Card>
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
  if (weeklyTarget != null && weeklyTarget > 0) return `${sessions7d}/${weeklyTarget} sesji`;
  return `${sessions7d} sesji`;
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
