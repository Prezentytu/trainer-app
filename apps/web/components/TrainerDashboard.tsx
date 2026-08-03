"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardX,
  Download,
  Trophy,
} from "lucide-react";
import {
  api,
  AttentionItem,
  ClientActivityItem,
  DashboardData,
} from "@/lib/api";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  IconButton,
  PageHeader,
  Dialog,
  ProgressRing,
  StatBlock,
} from "@/components/ui";
import { DashboardSkeleton } from "@/components/skeletons";

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

  useEffect(() => {
    api
      .dashboard()
      .then(setDash)
      .catch((e: Error) => setError(`${e.message}. Czy backend działa na porcie 5210?`))
      .finally(() => setLoading(false));
  }, []);

  const recentSessions = dash?.recentSessions ?? [];
  const recentPrs = dash?.recentPrs ?? [];
  const portalLinkSent = typeof window !== "undefined" && localStorage.getItem("wa-portal-link-sent") === "1";
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
      localStorage.setItem("wa-portal-link-sent", "1");
      setCopiedId(clientId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError("Nie udało się skopiować linku.");
    }
  };

  const downloadCsv = async () => {
    try {
      const csv = await api.exportCsv();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `workout-alchemist-export-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
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
        action={
          <div className="flex flex-wrap items-center gap-2">
            <IconButton
              title="Eksportuj dane"
              size="md"
              onClick={async () => {
                try {
                  const data = await api.export();
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `workout-alchemist-export-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(a.href);
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <Download aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            </IconButton>
            <Button variant="secondary" size="sm" onClick={() => void downloadCsv()}>
              CSV
            </Button>
            <Link href="/plans/new">
              <Button>+ Nowy szablon</Button>
            </Link>
          </div>
        }
      />
      <ErrorBanner message={error} />

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
            <li className="flex items-start gap-3">
              <span className="font-mono text-accent">1.</span>
              <span>
                <Link href="/clients" className="font-semibold text-accent hover:underline">
                  Dodaj klienta
                </Link>{" "}
                — imię i cel wystarczą.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-mono text-accent">2.</span>
              <span>
                <Link href="/plans" className="font-semibold text-accent hover:underline">
                  Przypisz plan
                </Link>{" "}
                — użyj szablonu startowego albo zbuduj własny.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-mono text-accent">3.</span>
              <span>Skopiuj link portalu z karty klienta i wyślij go podopiecznemu.</span>
            </li>
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
            value={prsLast7Days}
            href="/clients"
            valueClassName="text-pr"
          />
        </div>
      )}

      {needsAttention.length > 0 ? (
        <Card className="mb-6 border-accent-border" title="Wymagają uwagi">
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
                  <Link href={`/clients/${client.clientId}`} className="text-sm font-medium text-accent hover:text-accent-strong">
                    Otwórz klienta
                  </Link>
                  {status.action === "copy_portal_link" && status.portalToken ? (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => void copyPortalLink(client.clientId, status.portalToken)}>
                        Skopiuj link
                      </Button>
                      <Button size="sm" onClick={() => setReminder(status.attention ?? null)}>
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
        <Card className={`mb-6 ${needsAttention.length > 0 ? "border-accent-border" : ""}`}>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">Klienci w tym tygodniu</h2>
            {needsAttention.length === 0 ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-positive">
                <CheckCircle2 aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                Wszyscy trenują zgodnie z planem
              </span>
            ) : (
              <span className="font-mono text-xs tabular-nums text-muted">
                {needsAttention.length} wymaga uwagi
              </span>
            )}
          </div>

          {rows.length === 0 ? (
            <EmptyState
              title="Brak klientów"
              action={
                <Link href="/clients">
                  <Button size="sm">Dodaj pierwszego klienta</Button>
                </Link>
              }
            >
              Dodaj podopiecznego, żeby przypisać plan i śledzić treningi.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map(({ client, status }) => (
                <li
                  key={client.clientId}
                  className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                >
                  <Link
                    href={`/clients/${client.clientId}`}
                    className="flex min-w-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
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
                      <Link
                        href={`/clients/${client.clientId}`}
                        className="shrink-0 rounded-md bg-accent-dim px-2.5 py-2 text-xs font-semibold text-accent-strong hover:bg-accent-border focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
                      >
                        Przypisz plan
                      </Link>
                    ) : status.kind === "attention" && status.action === "copy_portal_link" ? (
                      <button
                        type="button"
                        onClick={() => void copyPortalLink(client.clientId, status.portalToken)}
                        disabled={!status.portalToken}
                        className="shrink-0 rounded-md bg-accent-dim px-2.5 py-2 text-xs font-semibold text-accent-strong hover:bg-accent-border focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] disabled:opacity-40"
                      >
                        {copiedId === client.clientId ? "Skopiowano" : "Skopiuj link"}
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Ostatnie sesje</h2>
          </div>
          {recentSessions.length === 0 ? (
            <EmptyState
              title="Brak treningów"
              action={
                <Link href="/clients">
                  <Button size="sm">Otwórz klientów</Button>
                </Link>
              }
            >
              Wejdź w klienta i dodaj pierwszy trening — pojawi się tutaj.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {recentSessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link
                    href={`/clients/${s.clientId}/sessions/${s.id}`}
                    className="flex min-w-0 items-center gap-2.5 text-sm hover:text-accent focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
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

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Trophy aria-hidden className="h-4 w-4 text-pr" strokeWidth={1.75} />
            <h2 className="font-display text-lg font-semibold">Rekordy PR</h2>
          </div>
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
                    className="flex min-w-0 items-center gap-2.5 text-sm hover:text-accent focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
                  >
                    <Avatar name={r.clientName} size="sm" />
                    <span className="min-w-0">
                      <span className="font-medium">{r.clientName}</span>
                      <span className="mt-0.5 block break-words text-xs text-muted">{r.exerciseName}</span>
                    </span>
                  </Link>
                  <span className="shrink-0 rounded-full bg-pr-dim px-2.5 py-0.5 font-mono text-sm font-semibold tabular-nums text-pr">
                    {r.estimated1Rm} kg
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
      className="block h-full rounded-xl focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
    >
      <Card className="h-full transition-colors hover:border-border-strong">
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
    return <ClipboardX aria-hidden className="h-4 w-4 shrink-0 text-muted-strong" strokeWidth={1.75} />;
  }
  if (status.kind === "attention") {
    return <AlertTriangle aria-hidden className="h-4 w-4 shrink-0 text-danger" strokeWidth={1.75} />;
  }
  return <CheckCircle2 aria-hidden className="h-4 w-4 shrink-0 text-positive" strokeWidth={1.75} />;
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
