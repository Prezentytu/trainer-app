"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ClientDetails, Plan } from "@/lib/api";
import { Badge, Button, Card, EmptyState, ErrorBanner, Field, inputClass, PageHeader } from "@/components/ui";

export default function ClientDetailsPage() {
  const params = useParams<{ id: string }>();
  const clientId = Number(params.id);

  const [client, setClient] = useState<ClientDetails | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [planId, setPlanId] = useState<number | "">("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    Promise.all([api.clients.get(clientId), api.plans.list()])
      .then(([c, p]) => {
        setClient(c);
        setPlans(p.filter((plan) => !plan.isTemplate));
      })
      .catch((e: Error) => setError(e.message));
  }, [clientId]);

  useEffect(load, [load]);

  const handleAssign = async (e: FormEvent) => {
    e.preventDefault();
    if (planId === "") return;
    setSaving(true);
    setError(null);
    try {
      await api.assignments.create({ planId, clientId, startDate, note: note.trim() || null });
      setPlanId("");
      setNote("");
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (assignmentId: number, status: string) => {
    try {
      await api.assignments.setStatus(assignmentId, status);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleRemove = async (assignmentId: number) => {
    if (!confirm("Usunąć to przypisanie?")) return;
    try {
      await api.assignments.remove(assignmentId);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!client) {
    return (
      <div>
        <ErrorBanner message={error} />
        <p className="text-zinc-500">Ładowanie…</p>
      </div>
    );
  }

  const statusTone = (status: string) =>
    status === "active" ? "green" : status === "completed" ? "yellow" : "red";
  const statusLabel = (status: string) =>
    status === "active" ? "aktywny" : status === "completed" ? "zakończony" : "anulowany";

  return (
    <div>
      <PageHeader
        title={client.name}
        subtitle={[client.email, client.note].filter(Boolean).join(" · ") || "Profil klienta"}
      />
      <ErrorBanner message={error} />

      <Card className="mb-6">
        <h2 className="mb-4 font-semibold">Przypisz plan</h2>
        {plans.length === 0 ? (
          <EmptyState>
            Nie masz jeszcze planów klienta.{" "}
            <Link href="/plans/new" className="text-yellow-400 underline">Stwórz plan</Link>{" "}
            (szablony najpierw zduplikuj do planu klienta).
          </EmptyState>
        ) : (
          <form onSubmit={handleAssign} className="grid gap-4 sm:grid-cols-4">
            <Field label="Plan *">
              <select
                className={inputClass}
                value={planId}
                onChange={(e) => setPlanId(e.target.value === "" ? "" : Number(e.target.value))}
                required
              >
                <option value="">— wybierz plan —</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.items.length} ćw.)
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Data startu">
              <input className={inputClass} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="Notatka">
              <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <div className="flex items-end">
              <Button type="submit" disabled={saving || planId === ""}>
                {saving ? "Przypisywanie…" : "Przypisz"}
              </Button>
            </div>
          </form>
        )}
      </Card>

      <h2 className="mb-3 font-semibold">Przypisane plany</h2>
      {client.assignments.length === 0 ? (
        <EmptyState>Ten klient nie ma jeszcze żadnych przypisań.</EmptyState>
      ) : (
        <div className="grid gap-3">
          {client.assignments.map((a) => (
            <Card key={a.id} className="flex items-center justify-between gap-4">
              <div>
                <Link href={`/plans/${a.planId}`} className="font-semibold hover:text-yellow-400">
                  {a.planName}
                </Link>
                <p className="mt-0.5 text-xs text-zinc-500">
                  start: {a.startDate}
                  {a.note ? ` · ${a.note}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={statusTone(a.status)}>{statusLabel(a.status)}</Badge>
                {a.status === "active" && (
                  <>
                    <Button variant="ghost" onClick={() => handleStatus(a.id, "completed")}>Zakończ</Button>
                    <Button variant="ghost" onClick={() => handleStatus(a.id, "cancelled")}>Anuluj</Button>
                  </>
                )}
                {a.status !== "active" && (
                  <Button variant="ghost" onClick={() => handleStatus(a.id, "active")}>Wznów</Button>
                )}
                <Button variant="danger" onClick={() => handleRemove(a.id)}>Usuń</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
