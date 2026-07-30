"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, AttentionItem, ClientSummary, DashboardData, PlanSummary } from "@/lib/api";
import { Avatar, Badge, Button, Card, EmptyState, ErrorBanner, PageHeader, StatBlock } from "@/components/ui";

export function TrainerDashboard() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([api.dashboard(), api.clients.list(), api.plans.list()])
      .then(([d, c, p]) => {
        setDash(d);
        setClients(c);
        setPlans(p);
      })
      .catch((e: Error) => setError(`${e.message}. Czy backend działa na porcie 5210?`))
      .finally(() => setLoading(false));
  }, []);

  const templates = plans.filter((p) => p.isTemplate);
  const clientPlans = plans.filter((p) => !p.isTemplate);
  const activeAssignments = clients.reduce((sum, c) => sum + c.activePlans, 0);
  const attention: AttentionItem[] = dash?.attention ?? [];
  const recentSessions = dash?.recentSessions ?? [];
  const recentPrs = dash?.recentPrs ?? [];
  const showOnboarding = !loading && clients.length === 0;

  const copyPortalLink = async (item: AttentionItem) => {
    if (!item.portalToken) return;
    const url = `${window.location.origin}/portal/${item.portalToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(item.clientId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError("Nie udało się skopiować linku.");
    }
  };

  if (loading) return <p className="text-muted">Ładowanie…</p>;

  return (
    <div>
      <PageHeader
        title="Panel"
        subtitle="Szybki przegląd Twojej pracy"
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
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
              Eksportuj dane
            </Button>
            <Link href="/plans/new">
              <Button>+ Nowa formuła</Button>
            </Link>
          </div>
        }
      />
      <ErrorBanner message={error} />

      {showOnboarding && (
        <Card className="mb-6" eyebrow="Start" title="Pierwsze 15 minut" meta="3 kroki do wartości">
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

      {attention.length > 0 && (
        <Card className="mb-6" eyebrow="Priorytet" title="Wymaga uwagi" meta={`${attention.length} sygnałów`}>
          <ul className="divide-y divide-border">
            {attention.map((item) => (
              <li key={`${item.clientId}-${item.reason}`} className="flex items-center justify-between gap-3 py-2.5">
                <Link href={`/clients/${item.clientId}`} className="flex min-w-0 items-center gap-2.5">
                  <Avatar name={item.clientName} size="sm" />
                  <span className="min-w-0">
                    <span className="block break-words text-sm font-medium">{item.clientName}</span>
                    <span className="block text-xs text-muted">{item.message}</span>
                  </span>
                </Link>
                {item.action === "assign_plan" ? (
                  <Link
                    href={`/clients/${item.clientId}`}
                    className="shrink-0 rounded-[10px] bg-accent-dim px-2.5 py-1 text-xs font-semibold text-accent-strong hover:bg-accent-border"
                  >
                    Przypisz plan
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => void copyPortalLink(item)}
                    disabled={!item.portalToken}
                    className="shrink-0 rounded-[10px] bg-accent-dim px-2.5 py-1 text-xs font-semibold text-accent-strong hover:bg-accent-border disabled:opacity-40"
                  >
                    {copiedId === item.clientId ? "Skopiowano" : "Skopiuj link"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Klienci" value={clients.length} href="/clients" />
        <StatCard label="Formuły" value={templates.length} href="/plans" />
        <StatCard label="Plany klientów" value={clientPlans.length} href="/plans" />
        <StatCard label="Aktywne przypisania" value={activeAssignments} href="/clients" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Ostatnie sesje</h2>
          </div>
          {recentSessions.length === 0 ? (
            <EmptyState>Brak zalogowanych treningów. Wejdź w klienta → Loguj trening.</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {recentSessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link
                    href={`/clients/${s.clientId}/sessions/${s.id}`}
                    className="min-w-0 text-sm hover:text-accent"
                  >
                    <span className="font-medium">{s.clientName}</span>
                    <span className="mt-0.5 block font-mono text-xs tabular-nums text-muted">
                      {s.dayLabel ?? "Trening"} · {s.performedOn}
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Ostatnie rekordy</h2>
          </div>
          {recentPrs.length === 0 ? (
            <EmptyState>PR-y pojawią się po zalogowaniu serii z ciężarem.</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {recentPrs.map((r, i) => (
                <li
                  key={`${r.clientId}-${r.exerciseId}-${r.performedOn}-${r.estimated1Rm}-${i}`}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0 text-sm">
                    <span className="font-medium">{r.clientName}</span>
                    <span className="mt-0.5 block break-words text-xs text-muted">{r.exerciseName}</span>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-pr">
                    {r.estimated1Rm} kg
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Klienci</h2>
            <Link href="/clients" className="text-xs font-medium text-muted-strong hover:text-accent-strong">
              Wszyscy ›
            </Link>
          </div>
          {clients.length === 0 ? (
            <EmptyState>
              Brak klientów. <Link className="text-accent underline" href="/clients">Dodaj pierwszego</Link>.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {clients.slice(0, 6).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link href={`/clients/${c.id}`} className="flex min-w-0 items-center gap-2.5 text-sm hover:text-accent">
                    <Avatar name={c.name} size="sm" />
                    <span className="min-w-0 break-words">{c.name}</span>
                  </Link>
                  <Badge tone={c.activePlans > 0 ? "positive" : "neutral"}>
                    {c.activePlans > 0 ? `${c.activePlans} aktywny plan(y)` : "brak planu"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Ostatnie plany</h2>
            <Link href="/plans" className="text-xs font-medium text-muted-strong hover:text-accent-strong">
              Wszystkie ›
            </Link>
          </div>
          {plans.length === 0 ? (
            <EmptyState>
              Brak planów. <Link className="text-accent underline" href="/plans/new">Stwórz pierwszy</Link>.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {plans.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/plans/${p.id}`} className="min-w-0 break-words hover:text-accent">
                    {p.name}
                  </Link>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                    {p.isTemplate ? "formuła" : "plan"} · {p.exerciseCount} ćw.
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="block">
      <Card className="transition-colors hover:border-border-strong">
        <StatBlock label={label} value={value} size="lg" />
      </Card>
    </Link>
  );
}
