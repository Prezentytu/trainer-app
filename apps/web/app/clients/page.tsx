"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, CLIENT_GOALS, ClientSummary } from "@/lib/api";
import { Avatar, Badge, Button, Card, EmptyState, ErrorBanner, Field, inputClass, PageHeader, Pill } from "@/components/ui";

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  return (
    <div>
      <PageHeader
        title="Klienci"
        subtitle="Twoi podopieczni i ich aktywne plany"
        action={<Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Anuluj" : "+ Dodaj klienta"}</Button>}
      />
      <ErrorBanner message={error} />

      {showForm && (
        <Card className="mb-6">
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
              <Button type="submit" disabled={saving}>{saving ? "Zapisywanie…" : "Dodaj klienta"}</Button>
            </div>
          </form>
        </Card>
      )}

      {clients.length === 0 ? (
        <EmptyState>Brak klientów — dodaj pierwszego przyciskiem powyżej.</EmptyState>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
          {clients.map((c) => (
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
                <Badge tone="green">{c.activePlans} aktywny plan(y)</Badge>
              ) : (
                <Link
                  href={`/clients/${c.id}`}
                  className="shrink-0 rounded-full bg-surface-hover px-2.5 py-0.5 text-xs font-medium text-foreground-secondary hover:bg-accent/15 hover:text-accent-strong"
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
