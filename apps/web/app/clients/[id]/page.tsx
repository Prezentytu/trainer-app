"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  api,
  ClientDetails,
  ClientMax,
  ClientProgress,
  ClientRecord,
  Exercise,
  Plan,
  SessionSummary,
} from "@/lib/api";
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
  Tabs,
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

  const [tab, setTab] = useState("plans");
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [maxes, setMaxes] = useState<ClientMax[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [records, setRecords] = useState<ClientRecord[]>([]);
  const [progress, setProgress] = useState<ClientProgress | null>(null);
  const [portalLink, setPortalLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showUndoToast, toastNode } = useUndoToast();

  const [planId, setPlanId] = useState<number | "">("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const [maxExerciseId, setMaxExerciseId] = useState<number | "">("");
  const [maxKg, setMaxKg] = useState("");
  const [maxDate, setMaxDate] = useState(() => new Date().toISOString().slice(0, 10));

  const load = useCallback(() => {
    Promise.all([
      api.clients.get(clientId),
      api.plans.list(),
      api.exercises.list(),
      api.clients.maxes(clientId),
      api.clients.sessions(clientId),
      api.clients.records(clientId),
      api.clients.progress(clientId),
    ])
      .then(([c, p, ex, m, s, r, prog]) => {
        setClient(c);
        const assignable = p.filter((plan) => !plan.isTemplate);
        setPlans(assignable);
        setExercises(ex);
        setMaxes(m);
        setSessions(s);
        setRecords(r);
        setProgress(prog);
        setPlanId((prev) => (prev === "" && assignable.length > 0 ? assignable[0].id : prev));
        setMaxExerciseId((prev) => (prev === "" && ex.length > 0 ? ex[0].id : prev));
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

  const handleAddMax = async (e: FormEvent) => {
    e.preventDefault();
    if (maxExerciseId === "" || !maxKg) return;
    try {
      await api.clients.addMax(clientId, {
        exerciseId: maxExerciseId,
        maxKg: Number(maxKg.replace(",", ".")),
        measuredOn: maxDate,
      });
      setMaxKg("");
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleStartSession = async (assignment: ClientDetails["assignments"][number]) => {
    try {
      const plan = await api.plans.get(assignment.planId, clientId);
      const day = plan.days.sort((a, b) => a.weekNumber - b.weekNumber || a.order - b.order)[0];
      if (!day) {
        setError("Plan nie ma dni treningowych.");
        return;
      }
      const session = await api.sessions.start({
        clientId,
        assignmentId: assignment.id,
        planId: assignment.planId,
        planDayId: day.id,
      });
      router.push(`/clients/${clientId}/sessions/${session.id}`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const copyPortalLink = async () => {
    try {
      const { token } = await api.clients.accessToken(clientId);
      const url = `${window.location.origin}/portal/${token}`;
      await navigator.clipboard.writeText(url);
      setPortalLink(url);
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

  const latestMaxes = (() => {
    const map = new Map<number, ClientMax>();
    for (const m of maxes) {
      if (!map.has(m.exerciseId)) map.set(m.exerciseId, m);
    }
    return [...map.values()];
  })();

  return (
    <div>
      <PageHeader
        title={client.name}
        subtitle={[client.email, client.note].filter(Boolean).join(" · ") || "Profil klienta"}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={() => void copyPortalLink()}>
              Skopiuj link dla klienta
            </Button>
            <Avatar name={client.name} size="lg" />
          </div>
        }
      />
      <ErrorBanner message={error} />
      {portalLink ? (
        <p className="mb-4 break-all rounded-[10px] border border-accent-border bg-accent-dim px-3 py-2 text-xs text-accent-strong">
          Skopiowano: {portalLink}
        </p>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <StatBlock
            label="Progres planu"
            value={progress ? `${progress.completed}/${progress.total}` : "—"}
          />
          {progress && progress.total > 0 ? (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-hover">
              <div className="h-full rounded-full bg-accent" style={{ width: `${progress.percent}%` }} />
            </div>
          ) : null}
        </Card>
        <Card>
          <StatBlock label="Sesje" value={sessions.length} />
        </Card>
        <Card>
          <StatBlock label="Rekordy" value={records.length} />
        </Card>
        <Card>
          <StatBlock label="Maxy" value={latestMaxes.length} />
        </Card>
      </div>

      <Tabs
        items={[
          { value: "plans", label: "Plany", count: client.assignments.length },
          { value: "history", label: "Historia", count: sessions.length },
          { value: "records", label: "Rekordy", count: records.length },
          { value: "maxes", label: "Maxy", count: latestMaxes.length },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div className="mt-6">
        {tab === "plans" && (
          <>
            <Card className="mb-6" eyebrow="Akcja" title="Przypisz plan">
              {plans.length === 0 ? (
                <EmptyState>
                  Nie masz jeszcze planów klienta.{" "}
                  <Link href="/plans/new" className="text-accent underline">
                    Stwórz plan
                  </Link>
                  .
                </EmptyState>
              ) : (
                <form onSubmit={handleAssign}>
                  <Field label="Plan *">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {plans.map((p) => (
                        <PlanPickerCard
                          key={p.id}
                          plan={p}
                          selected={planId === p.id}
                          onSelect={() => setPlanId(p.id)}
                        />
                      ))}
                    </div>
                  </Field>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <Field label="Data startu">
                      <input
                        className={inputClass}
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
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
                  <Card key={a.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <Link href={`/plans/${a.planId}`} className="break-words font-semibold hover:text-accent">
                        {a.planName}
                      </Link>
                      <p className="mt-0.5 font-mono text-xs tabular-nums text-muted">
                        start: {a.startDate}
                        {a.note ? ` · ${a.note}` : ""}
                        {progress?.assignmentId === a.id
                          ? ` · ${progress.completed} z ${progress.total} treningów (${progress.percent}%)`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={statusTone(a.status)}>{statusLabel(a.status)}</Badge>
                      {a.status === "active" && (
                        <Button onClick={() => void handleStartSession(a)}>Loguj trening</Button>
                      )}
                      {a.status === "active" && (
                        <>
                          <Button variant="ghost" onClick={() => handleStatus(a.id, "completed")}>
                            Zakończ
                          </Button>
                          <Button variant="ghost" onClick={() => handleStatus(a.id, "cancelled")}>
                            Anuluj
                          </Button>
                        </>
                      )}
                      {a.status !== "active" && (
                        <Button variant="ghost" onClick={() => handleStatus(a.id, "active")}>
                          Wznów
                        </Button>
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
          </>
        )}

        {tab === "history" && (
          <>
            {sessions.length === 0 ? (
              <EmptyState>Brak zalogowanych treningów. Start z zakładki Plany → „Loguj trening”.</EmptyState>
            ) : (
              <div className="grid gap-3">
                {sessions.map((s) => (
                  <Link key={s.id} href={`/clients/${clientId}/sessions/${s.id}`}>
                    <Card className="flex flex-wrap items-center justify-between gap-3 transition-colors hover:border-border-strong">
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {s.dayLabel ?? s.planName ?? "Trening"} · {s.performedOn}
                        </p>
                        <p className="font-mono text-xs tabular-nums text-muted">
                          {s.exerciseCount} ćw. · {s.totalSets} serii · {Math.round(s.totalVolumeKg)} kg
                          {s.status === "in_progress" ? " · w trakcie" : ""}
                        </p>
                      </div>
                      <Badge tone={s.status === "completed" ? "positive" : "accent"}>
                        {s.status === "completed" ? "ukończony" : "w trakcie"}
                      </Badge>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "records" && (
          <>
            {records.length === 0 ? (
              <EmptyState>Rekordy pojawią się po zalogowaniu treningów z ciężarem i powtórzeniami.</EmptyState>
            ) : (
              <div className="grid gap-2">
                {records.map((r) => (
                  <Card key={r.exerciseId} className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-semibold">{r.exerciseName}</p>
                      <p className="font-mono text-xs tabular-nums text-muted">{r.performedOn}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-lg font-semibold tabular-nums text-pr">
                        {r.estimated1Rm} kg e1RM
                      </p>
                      <p className="font-mono text-xs tabular-nums text-muted">
                        {r.weightKg} × {r.reps}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "maxes" && (
          <>
            <Card className="mb-6" title="Dodaj max (1RM)">
              <form onSubmit={handleAddMax} className="grid gap-3 sm:grid-cols-4">
                <Field label="Ćwiczenie">
                  <select
                    className={inputClass}
                    value={maxExerciseId}
                    onChange={(e) => setMaxExerciseId(Number(e.target.value))}
                  >
                    {exercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Kg">
                  <input
                    className={inputClass}
                    value={maxKg}
                    onChange={(e) => setMaxKg(e.target.value)}
                    inputMode="decimal"
                    placeholder="100"
                  />
                </Field>
                <Field label="Data">
                  <input
                    className={inputClass}
                    type="date"
                    value={maxDate}
                    onChange={(e) => setMaxDate(e.target.value)}
                  />
                </Field>
                <div className="flex items-end">
                  <Button type="submit">Zapisz max</Button>
                </div>
              </form>
            </Card>
            {latestMaxes.length === 0 ? (
              <EmptyState>Brak maxów — dodaj 1RM, żeby plany procentowe wyliczały kg.</EmptyState>
            ) : (
              <div className="grid gap-2">
                {latestMaxes.map((m) => (
                  <Card key={m.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-semibold">{m.exerciseName}</p>
                      <p className="font-mono text-xs tabular-nums text-muted">
                        {m.measuredOn}
                        {m.note ? ` · ${m.note}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-lg font-semibold tabular-nums text-accent">{m.maxKg} kg</span>
                      <button
                        type="button"
                        className="text-sm text-muted hover:text-danger"
                        onClick={() =>
                          api.clients
                            .removeMax(m.id)
                            .then(load)
                            .catch((err: Error) => setError(err.message))
                        }
                      >
                        Usuń
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-10 border-t border-border pt-4">
        <button type="button" onClick={handleDeleteClient} className="text-xs text-muted hover:text-danger">
          Usuń klienta wraz z przypisaniami
        </button>
      </div>

      {toastNode}
    </div>
  );
}
