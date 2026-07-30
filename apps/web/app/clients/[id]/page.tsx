"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, ClientDetails, Plan } from "@/lib/api";
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
  StatBlock,
  useUndoToast,
} from "@/components/ui";

function PlanPickerCard({ plan, selected, onSelect }: { plan: Plan; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-start gap-2 rounded-[10px] border p-3 text-left transition-colors duration-[var(--dur-fast)] ${
        selected ? "border-accent bg-accent-dim" : "border-border bg-surface hover:border-border-strong"
      }`}
    >
      <span
        className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
          selected ? "border-accent bg-accent text-accent-foreground" : "border-border-strong"
        }`}
        aria-hidden
      >
        {selected ? "✓" : ""}
      </span>
      <span className="min-w-0">
        <span className="block break-words text-sm font-medium">{plan.name}</span>
        <span className="mt-0.5 block font-mono text-xs tabular-nums text-muted">
          {plan.weeksCount} tyg. · {plan.exerciseCount} ćw.
        </span>
      </span>
    </button>
  );
}

export default function ClientDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const clientId = Number(params.id);

  const [client, setClient] = useState<ClientDetails | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { showUndoToast, toastNode } = useUndoToast();

  const [planId, setPlanId] = useState<number | "">("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    Promise.all([api.clients.get(clientId), api.plans.list()])
      .then(([c, p]) => {
        setClient(c);
        const assignable = p.filter((plan) => !plan.isTemplate);
        setPlans(assignable);
        // Smart default: happy path do przypisania to 1 klik, nie puste pole.
        setPlanId((prev) => (prev === "" && assignable.length > 0 ? assignable[0].id : prev));
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

  const handleRemove = async (assignment: ClientDetails["assignments"][number]) => {
    try {
      await api.assignments.remove(assignment.id);
      load();
      showUndoToast(`Usunięto „${assignment.planName}”`, async () => {
        try {
          await api.assignments.create({
            planId: assignment.planId,
            clientId,
            startDate: assignment.startDate,
            note: assignment.note,
          });
          load();
        } catch (err) {
          setError((err as Error).message);
        }
      });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteClient = async () => {
    if (!client) return;
    if (!confirm(`Usunąć klienta „${client.name}” wraz z przypisaniami? Tej operacji nie można cofnąć.`)) return;
    try {
      await api.clients.remove(client.id);
      router.push("/clients");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!client) {
    return (
      <div>
        <ErrorBanner message={error} />
        <p className="text-muted">Ładowanie…</p>
      </div>
    );
  }

  const statusTone = (status: string) =>
    status === "active" ? ("positive" as const) : status === "completed" ? ("accent" as const) : ("danger" as const);
  const statusLabel = (status: string) =>
    status === "active" ? "aktywny" : status === "completed" ? "zakończony" : "anulowany";

  const activeCount = client.assignments.filter((a) => a.status === "active").length;

  return (
    <div>
      <PageHeader
        title={client.name}
        subtitle={[client.email, client.note].filter(Boolean).join(" · ") || "Profil klienta"}
        action={<Avatar name={client.name} size="lg" />}
      />
      <ErrorBanner message={error} />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <StatBlock label="Przypisania" value={client.assignments.length} />
        </Card>
        <Card>
          <StatBlock label="Aktywne" value={activeCount} />
        </Card>
        <Card>
          <StatBlock label="Zakończone" value={client.assignments.filter((a) => a.status === "completed").length} />
        </Card>
        <Card>
          <StatBlock label="Plany do wyboru" value={plans.length} />
        </Card>
      </div>

      <Card className="mb-6" eyebrow="Akcja" title="Przypisz plan">
        {plans.length === 0 ? (
          <EmptyState>
            Nie masz jeszcze planów klienta.{" "}
            <Link href="/plans/new" className="text-accent underline">Stwórz plan</Link>{" "}
            (szablony najpierw zduplikuj do planu klienta).
          </EmptyState>
        ) : (
          <form onSubmit={handleAssign}>
            <Field label="Plan *">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {plans.map((p) => (
                  <PlanPickerCard key={p.id} plan={p} selected={planId === p.id} onSelect={() => setPlanId(p.id)} />
                ))}
              </div>
            </Field>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field label="Data startu">
                <input className={inputClass} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </Field>
              <Field label="Notatka">
                <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
              <div className="flex items-end">
                <Button type="submit" disabled={saving || planId === ""}>
                  {saving ? "Przypisywanie…" : "Przypisz plan"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Card>

      <h2 className="mb-3 font-display text-lg font-semibold">Przypisane plany</h2>
      {client.assignments.length === 0 ? (
        <EmptyState>Ten klient nie ma jeszcze żadnych przypisań.</EmptyState>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {client.assignments.map((a) => (
            <Card key={a.id} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Link href={`/plans/${a.planId}`} className="break-words font-semibold hover:text-accent">
                  {a.planName}
                </Link>
                <p className="mt-0.5 font-mono text-xs tabular-nums text-muted">
                  start: {a.startDate}
                  {a.note ? ` · ${a.note}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
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
                <button
                  type="button"
                  onClick={() => handleRemove(a)}
                  className="text-sm text-muted-strong hover:text-danger"
                >
                  Usuń
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-10 border-t border-border pt-4">
        <button type="button" onClick={handleDeleteClient} className="text-xs text-muted hover:text-danger">
          Usuń klienta wraz z przypisaniami
        </button>
      </div>

      {toastNode}
    </div>
  );
}
