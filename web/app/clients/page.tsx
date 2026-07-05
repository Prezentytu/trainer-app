"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, ClientSummary } from "@/lib/api";
import { Badge, Button, Card, EmptyState, ErrorBanner, Field, inputClass, PageHeader } from "@/components/ui";

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
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
      await api.clients.create({ name: name.trim(), email: email.trim() || null, note: note.trim() || null });
      setName("");
      setEmail("");
      setNote("");
      setShowForm(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (client: ClientSummary) => {
    if (!confirm(`Usunąć klienta „${client.name}” wraz z przypisaniami?`)) return;
    try {
      await api.clients.remove(client.id);
      load();
    } catch (err) {
      setError((err as Error).message);
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
            <Field label="Notatka (cel, uwagi)">
              <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <div className="sm:col-span-3">
              <Button type="submit" disabled={saving}>{saving ? "Zapisywanie…" : "Zapisz klienta"}</Button>
            </div>
          </form>
        </Card>
      )}

      {clients.length === 0 ? (
        <EmptyState>Brak klientów — dodaj pierwszego przyciskiem powyżej.</EmptyState>
      ) : (
        <div className="grid gap-3">
          {clients.map((c) => (
            <Card key={c.id} className="flex items-center justify-between gap-4">
              <div>
                <Link href={`/clients/${c.id}`} className="font-semibold hover:text-yellow-400">
                  {c.name}
                </Link>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {c.email ?? "brak e-maila"}
                  {c.note ? ` · ${c.note}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={c.activePlans > 0 ? "green" : "neutral"}>
                  {c.activePlans > 0 ? `${c.activePlans} aktywny plan(y)` : "brak planu"}
                </Badge>
                <Button variant="danger" onClick={() => handleDelete(c)}>Usuń</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
