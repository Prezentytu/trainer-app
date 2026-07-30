"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, CLIENT_GOALS, ClientSummary } from "@/lib/api";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  Field,
  inputClass,
  PageHeader,
  Pill,
  Tabs,
} from "@/components/ui";

type TabFilter = "all" | "active" | "idle";

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabFilter>("all");

  const load = useCallback(() => {
    api.clients
      .list()
      .then(setClients)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.clients.create({ name: name.trim(), email: email.trim() || null, note: goal });
      setName("");
      setEmail("");
      setGoal(null);
      setShowForm(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const counts = useMemo(() => {
    const active = clients.filter((c) => c.activePlans > 0).length;
    return { all: clients.length, active, idle: clients.length - active };
  }, [clients]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      if (tab === "active" && c.activePlans === 0) return false;
      if (tab === "idle" && c.activePlans > 0) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || (c.email?.toLowerCase().includes(q) ?? false);
    });
  }, [clients, query, tab]);

  return (
    <div>
      <PageHeader
        title="Klienci"
        subtitle="Twoi podopieczni i ich aktywne plany"
        action={
          <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Anuluj" : "+ Dodaj klienta"}</Button>
        }
      />
      <ErrorBanner message={error} />

      {showForm && (
        <Card className="mb-6" eyebrow="Nowy" title="Dodaj klienta">
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
            <Field label="Imię i nazwisko *">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="E-mail">
              <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <div className="sm:col-span-3">
              <Field label="Cel treningowy">
                <div className="flex flex-wrap gap-1.5">
                  {CLIENT_GOALS.map((g) => (
                    <Pill key={g} active={goal === g} onClick={() => setGoal((prev) => (prev === g ? null : g))}>
                      {g}
                    </Pill>
                  ))}
                </div>
              </Field>
            </div>
            <div className="sm:col-span-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Zapisywanie…" : "Dodaj klienta"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          items={[
            { value: "all", label: "Wszyscy", count: counts.all },
            { value: "active", label: "Z planem", count: counts.active },
            { value: "idle", label: "Bez planu", count: counts.idle },
          ]}
          value={tab}
          onChange={(v) => setTab(v as TabFilter)}
        />
        <input
          className={`${inputClass} sm:max-w-xs`}
          placeholder="Szukaj klienta…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {clients.length === 0 ? (
        <EmptyState>Brak klientów — dodaj pierwszego przyciskiem powyżej.</EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState>Brak wyników dla wybranych filtrów.</EmptyState>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="flex items-center justify-between gap-4">
              <Link href={`/clients/${c.id}`} className="flex min-w-0 items-center gap-3 hover:text-accent">
                <Avatar name={c.name} />
                <div className="min-w-0">
                  <p className="break-words font-semibold">{c.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {c.email ?? "brak e-maila"}
                    {c.note ? ` · ${c.note}` : ""}
                  </p>
                </div>
              </Link>
              {c.activePlans > 0 ? (
                <Badge tone="positive">
                  <span className="font-mono tabular-nums">{c.activePlans}</span> aktywny plan(y)
                </Badge>
              ) : (
                <Link
                  href={`/clients/${c.id}`}
                  className="shrink-0 rounded-full bg-surface-hover px-2.5 py-0.5 text-xs font-medium text-foreground-secondary hover:bg-accent-dim hover:text-accent-strong"
                >
                  bez planu — przypisz
                </Link>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
