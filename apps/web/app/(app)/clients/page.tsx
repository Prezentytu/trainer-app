"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError, CLIENT_GOALS, ClientSummary } from "@/lib/api";
import { daysAgo, relativeDayLabel } from "@/lib/dates";
import { refreshNavCounts } from "@/lib/navCounts";
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
  SearchInput,
  Switch,
  Tabs,
  useUndoToast,
} from "@/components/ui";
import { ClientListSkeleton } from "@/components/skeletons";

type TabFilter = "all" | "active" | "idle";

const DAYS_PER_WEEK = [1, 2, 3, 4, 5, 6, 7] as const;

function activePlansLabel(count: number): string {
  if (count === 1) return "1 aktywny plan";
  const lastDigit = count % 10;
  const lastTwo = count % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) {
    return `${count} aktywne plany`;
  }
  return `${count} aktywnych planów`;
}

/** Notatka listy klientów: cele + dostępność (zgodne z seedem „Cel: …, Nx w tygodniu”). */
function buildClientNote(goals: string[], daysPerWeek: number | null): string | null {
  const parts: string[] = [];
  if (goals.length > 0) {
    parts.push(`Cel: ${goals.map((g) => g.toLowerCase()).join(", ")}`);
  }
  if (daysPerWeek != null) {
    parts.push(`${daysPerWeek}× w tygodniu`);
  }
  return parts.length > 0 ? parts.join(", ") : null;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [daysPerWeek, setDaysPerWeek] = useState<number | null>(null);
  const [hasScreens, setHasScreens] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [limitHit, setLimitHit] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabFilter>("all");
  const { showUndoToast, toastNode } = useUndoToast();

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
    setGoals([]);
    setDaysPerWeek(null);
    setHasScreens(false);
  };

  const toggleGoal = (g: string) => {
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  const handleCreate = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError(null);
    setLimitHit(false);
    const payload = {
      name: name.trim(),
      email: email.trim() || null,
      note: buildClientNote(goals, daysPerWeek),
    };
    const tempId = -Date.now();
    const optimistic: ClientSummary = {
      id: tempId,
      name: payload.name,
      email: payload.email,
      note: payload.note,
      activePlans: 0,
      lastSessionOn: null,
    };
    setClients((prev) => [optimistic, ...prev]);
    resetForm();
    setShowForm(false);
    try {
      const created = await api.clients.create(payload);
      void refreshNavCounts();
      if (hasScreens && created.id > 0) {
        router.push(`/clients/${created.id}/import`);
        return;
      }
      load();
    } catch (err) {
      setClients((prev) => prev.filter((c) => c.id !== tempId));
      const apiErr = err as ApiError;
      setError(apiErr.message);
      setLimitHit(apiErr.code === "client_limit");
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
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setShowImport(true)}>
              Wklej listę
            </Button>
            <Button onClick={() => setShowForm(true)}>Dodaj klienta</Button>
          </div>
        }
      />
      <ErrorBanner message={error} />
      {limitHit ? (
        <p className="mb-4 text-sm text-foreground-secondary">
          <Link href="/settings" className="underline-offset-2 hover:underline">
            Zmień plan w ustawieniach
          </Link>
          , żeby dodać kolejną osobę.
        </p>
      ) : null}

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
          <Field label="E-mail" hint="Bez e-maila klient nie odzyska zgubionego linku.">
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
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Cele treningowe">
              {CLIENT_GOALS.map((g) => (
                <Pill key={g} active={goals.includes(g)} onClick={() => toggleGoal(g)}>
                  {g}
                </Pill>
              ))}
            </div>
          </Field>
          <Field label="Dni w tygodniu na trening">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Dostępne dni w tygodniu">
              {DAYS_PER_WEEK.map((n) => (
                <Pill
                  key={n}
                  active={daysPerWeek === n}
                  onClick={() => setDaysPerWeek((prev) => (prev === n ? null : n))}
                >
                  {n}×
                </Pill>
              ))}
            </div>
          </Field>
          <Switch
            label="Mam zdjęcia treningów z poprzedniej aplikacji"
            checked={hasScreens}
            onChange={setHasScreens}
          />
        </div>
      </Dialog>

      <Dialog
        open={showImport}
        title="Wklej listę klientów"
        confirmLabel={importing ? "Dodaję…" : "Dodaj z listy"}
        onConfirm={() => {
          void (async () => {
            if (!csvText.trim() || importing) return;
            setImporting(true);
            setError(null);
            setLimitHit(false);
            try {
              const result = await api.clients.importCsv(csvText);
              void refreshNavCounts();
              setShowImport(false);
              setCsvText("");
              load();
              const parts = [`Dodano ${result.created}`];
              if (result.skipped) parts.push(`pominięto ${result.skipped} (już są)`);
              if (result.errors.length) {
                setError(result.errors[0] ?? null);
                setLimitHit(result.errors[0]?.includes("limicie") ?? false);
              }
              showUndoToast(parts.join(" · "));
            } catch (err) {
              const apiErr = err as ApiError;
              setError(apiErr.message);
              setLimitHit(apiErr.code === "client_limit");
            } finally {
              setImporting(false);
            }
          })();
        }}
        onCancel={() => {
          if (importing) return;
          setShowImport(false);
        }}
      >
        <Field label="CSV" hint="imię, e-mail — jedna osoba w wierszu">
          <textarea
            className={`${inputClass} min-h-32 py-2`}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={"Anna Nowak, anna@example.com\nPiotr Lis"}
          />
        </Field>
      </Dialog>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Szukaj klienta…"
            aria-label="Szukaj klienta"
          />
        </div>
        <div className="sm:shrink-0">
          <Tabs
            items={[
              { value: "all", label: "Wszyscy", count: counts.all },
              { value: "active", label: "Z planem", count: counts.active },
              { value: "idle", label: "Bez planu", count: counts.idle },
            ]}
            value={tab}
            onChange={(v) => setTab(v as TabFilter)}
          />
        </div>
      </div>

      {toastNode}
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
          title="Żaden klient nie pasuje"
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Wyczyść filtry
            </Button>
          }
        >
          Zmień filtr albo wyszukiwanie — albo dodaj nowego klienta.
        </EmptyState>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {filtered.map((c) => {
            const ago = c.lastSessionOn ? daysAgo(c.lastSessionOn) : null;
            const stale = ago != null && ago > 7;
            return (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className="flex flex-col gap-3 px-2 py-4 transition-colors duration-[var(--dur-fast)] hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <Avatar name={c.name} size="lg" />
                  <div className="min-w-0">
                    <p className="break-words text-base font-medium text-foreground">{c.name}</p>
                    <p className="mt-0.5 break-words text-sm text-muted">
                      {[c.email, c.note].filter(Boolean).join(" · ") || "Brak e-maila i celu"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                  <span
                    className={`text-sm ${
                      ago == null ? "text-muted" : stale ? "text-loss" : "text-gain"
                    }`}
                  >
                    {ago == null
                      ? "Brak treningów"
                      : stale
                        ? `▼ Nieaktywny · ${relativeDayLabel(c.lastSessionOn!)}`
                        : `▲ Aktywny · ${relativeDayLabel(c.lastSessionOn!)}`}
                  </span>
                  {c.activePlans > 0 ? (
                    <Badge tone="neutral">{activePlansLabel(c.activePlans)}</Badge>
                  ) : (
                    <Badge tone="neutral">Bez planu</Badge>
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
