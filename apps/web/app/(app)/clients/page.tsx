"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, CLIENT_GOALS, ClientSummary } from "@/lib/api";
import { daysAgo, relativeDayLabel } from "@/lib/dates";
import {
  Avatar,
  Badge,
  Button,
  Dialog,
  EmptyState,
  ErrorBanner,
  Field,
  inputClass,
  PageHeader,
  Pill,
  Tabs,
} from "@/components/ui";
import { ClientListSkeleton } from "@/components/skeletons";

type TabFilter = "all" | "active" | "idle";

function activePlansLabel(count: number): string {
  if (count === 1) return "1 aktywny plan";
  const lastDigit = count % 10;
  const lastTwo = count % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) {
    return `${count} aktywne plany`;
  }
  return `${count} aktywnych planów`;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setGoal(null);
  };

  const handleCreate = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      await api.clients.create({ name: name.trim(), email: email.trim() || null, note: goal });
      resetForm();
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

  const clearFilters = () => {
    setQuery("");
    setTab("all");
  };

  return (
    <div>
      <PageHeader
        title="Klienci"
        subtitle="Twoi podopieczni i ich aktywne plany"
        action={<Button onClick={() => setShowForm(true)}>Dodaj klienta</Button>}
      />
      <ErrorBanner message={error} />

      <Dialog
        open={showForm}
        title="Dodaj klienta"
        confirmLabel={saving ? "Dodawanie…" : "Dodaj klienta"}
        onConfirm={() => void handleCreate()}
        onCancel={() => {
          if (saving) return;
          resetForm();
          setShowForm(false);
        }}
      >
        <div className="grid gap-4">
          <Field label="Imię i nazwisko *">
            <input
              className={inputClass}
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </Field>
          <Field label="E-mail">
            <input
              className={inputClass}
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
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
      </Dialog>

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

      {loading ? (
        <ClientListSkeleton />
      ) : clients.length === 0 ? (
        <EmptyState
          title="Nie masz jeszcze klientów"
          action={<Button onClick={() => setShowForm(true)}>Dodaj pierwszego klienta</Button>}
        >
          Dodaj podopiecznego, żeby przypisać plan i śledzić treningi.
        </EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Brak wyników"
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Wyczyść filtry
            </Button>
          }
        >
          Zmień filtr albo wyszukiwanie — albo dodaj nowego klienta.
        </EmptyState>
      ) : (
        <div className="grid gap-2">
          {filtered.map((c) => {
            const ago = c.lastSessionOn ? daysAgo(c.lastSessionOn) : null;
            const stale = ago != null && ago > 7;
            return (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-card transition-[background-color,border-color] duration-[var(--dur-fast)] hover:bg-surface-hover focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="relative shrink-0">
                    <Avatar name={c.name} size="lg" />
                    <span
                      aria-hidden
                      className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface ${
                        ago == null
                          ? "bg-muted-faint"
                          : stale
                            ? "bg-danger"
                            : "bg-positive"
                      }`}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="break-words text-base font-medium text-foreground">{c.name}</p>
                    <p className="mt-0.5 break-words text-sm text-muted">
                      {[c.email, c.note].filter(Boolean).join(" · ") || "Brak e-maila i celu"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                  <span
                    className={`text-sm ${stale ? "text-danger" : "text-muted"}`}
                  >
                    {c.lastSessionOn
                      ? `Ostatni trening: ${relativeDayLabel(c.lastSessionOn)}`
                      : "Brak treningów"}
                  </span>
                  {c.activePlans > 0 ? (
                    <Badge tone="positive">{activePlansLabel(c.activePlans)}</Badge>
                  ) : (
                    <Badge tone="neutral">bez planu</Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
