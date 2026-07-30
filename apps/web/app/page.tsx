"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ClientSummary, Plan } from "@/lib/api";
import { Avatar, Badge, Button, Card, EmptyState, ErrorBanner, PageHeader, StatBlock } from "@/components/ui";

const ATTENTION_LIMIT = 5;

export default function DashboardPage() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.clients.list(), api.plans.list()])
      .then(([c, p]) => {
        setClients(c);
        setPlans(p);
      })
      .catch((e: Error) => setError(`${e.message}. Czy backend działa na porcie 5210?`))
      .finally(() => setLoading(false));
  }, []);

  const templates = plans.filter((p) => p.isTemplate);
  const clientPlans = plans.filter((p) => !p.isTemplate);
  const activeAssignments = clients.reduce((sum, c) => sum + c.activePlans, 0);
  const needsAttention = clients.filter((c) => c.activePlans === 0).slice(0, ATTENTION_LIMIT);

  if (loading) return <p className="text-muted">Ładowanie…</p>;

  return (
    <div>
      <PageHeader
        title="Panel"
        subtitle="Szybki przegląd Twojej pracy"
        action={
          <Link href="/plans/new">
            <Button>+ Nowa formuła</Button>
          </Link>
        }
      />
      <ErrorBanner message={error} />

      {needsAttention.length > 0 && (
        <Card className="mb-6" eyebrow="Priorytet" title="Wymaga uwagi" meta={`${needsAttention.length} bez aktywnego planu`}>
          <ul className="divide-y divide-border">
            {needsAttention.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                <Link href={`/clients/${c.id}`} className="flex min-w-0 items-center gap-2.5">
                  <Avatar name={c.name} size="sm" />
                  <span className="min-w-0 break-words text-sm font-medium">{c.name}</span>
                </Link>
                <Link
                  href={`/clients/${c.id}`}
                  className="shrink-0 rounded-[10px] bg-accent-dim px-2.5 py-1 text-xs font-semibold text-accent-strong hover:bg-accent-border"
                >
                  Przypisz plan
                </Link>
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
