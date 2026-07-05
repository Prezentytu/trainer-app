"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ClientSummary, Plan } from "@/lib/api";
import { Card, EmptyState, ErrorBanner, PageHeader } from "@/components/ui";

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

  if (loading) return <p className="text-zinc-500">Ładowanie…</p>;

  return (
    <div>
      <PageHeader title="Panel trenera" subtitle="Szybki przegląd Twojej pracy" />
      <ErrorBanner message={error} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Klienci" value={clients.length} href="/clients" />
        <StatCard label="Szablony planów" value={templates.length} href="/plans" />
        <StatCard label="Plany klientów" value={clientPlans.length} href="/plans" />
        <StatCard label="Aktywne przypisania" value={activeAssignments} href="/clients" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Klienci</h2>
          {clients.length === 0 ? (
            <EmptyState>
              Brak klientów. <Link className="text-yellow-400 underline" href="/clients">Dodaj pierwszego</Link>.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-zinc-800">
              {clients.slice(0, 6).map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2.5 text-sm">
                  <Link href={`/clients/${c.id}`} className="hover:text-yellow-400">
                    {c.name}
                  </Link>
                  <span className="text-xs text-zinc-500">
                    {c.activePlans > 0 ? `${c.activePlans} aktywny plan(y)` : "brak planu"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Ostatnie plany</h2>
          {plans.length === 0 ? (
            <EmptyState>
              Brak planów. <Link className="text-yellow-400 underline" href="/plans/new">Stwórz pierwszy</Link>.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-zinc-800">
              {plans.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                  <Link href={`/plans/${p.id}`} className="hover:text-yellow-400">
                    {p.name}
                  </Link>
                  <span className="text-xs text-zinc-500">
                    {p.isTemplate ? "szablon" : "plan klienta"} · {p.exerciseCount} ćw.
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
    <Link href={href}>
      <Card className="transition-colors hover:border-yellow-400/50">
        <p className="text-3xl font-bold text-yellow-400">{value}</p>
        <p className="mt-1 text-sm text-zinc-400">{label}</p>
      </Card>
    </Link>
  );
}
