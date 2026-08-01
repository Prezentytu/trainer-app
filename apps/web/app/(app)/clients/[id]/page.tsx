"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  CalendarCheck,
  Dumbbell,
  Ruler,
  Trophy,
  Weight,
} from "lucide-react";
import {
  api,
  ClientDetails,
  ClientMax,
  ClientMeasurement,
  ClientProgress,
  ClientRecord,
  Exercise,
  ExerciseStats,
  PlanSummary,
  SessionSummary,
} from "@/lib/api";
import { daysAgo, formatDayShort, relativeDayLabel, withinLastDays } from "@/lib/dates";
import { TrendSparkline } from "@/components/TrendSparkline";
import { WeightTrendSparkline } from "@/components/WeightTrendSparkline";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  ErrorBanner,
  Field,
  inputClass,
  ProgressRing,
  StatBlock,
  Tabs,
  useUndoToast,
} from "@/components/ui";
import { ClientDetailSkeleton } from "@/components/skeletons";
import { WeeklyActivityBar } from "@/components/WeeklyActivityBar";
import { formatDurationMinutes } from "@/lib/estimateDuration";

function PlanPickerCard({ plan, selected, onSelect }: { plan: PlanSummary; selected: boolean; onSelect: () => void }) {
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

  const [tab, setTab] = useState<string | null>(null);
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [maxes, setMaxes] = useState<ClientMax[]>([]);
  const [measurements, setMeasurements] = useState<ClientMeasurement[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [records, setRecords] = useState<ClientRecord[]>([]);
  const [progress, setProgress] = useState<ClientProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showUndoToast, toastNode } = useUndoToast();

  const [planId, setPlanId] = useState<number | "">("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const [maxExerciseId, setMaxExerciseId] = useState<number | "">("");
  const [maxKg, setMaxKg] = useState("");
  const [maxDate, setMaxDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [showMaxForm, setShowMaxForm] = useState(false);

  const [measureDate, setMeasureDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [measureWeight, setMeasureWeight] = useState("");
  const [measureWaist, setMeasureWaist] = useState("");
  const [showMeasureForm, setShowMeasureForm] = useState(false);

  const [expandedRecordId, setExpandedRecordId] = useState<number | null>(null);
  const [statsCache, setStatsCache] = useState<Record<number, ExerciseStats | "loading" | "error">>({});
  const [nextDay, setNextDay] = useState<{ assignmentId: number; label: string } | null>(null);
  const [deleteClientOpen, setDeleteClientOpen] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      api.clients.get(clientId),
      api.plans.list(),
      api.exercises.list(),
      api.clients.maxes(clientId),
      api.clients.measurements(clientId),
      api.clients.sessions(clientId),
      api.clients.records(clientId),
      api.clients.progress(clientId),
    ])
      .then(([c, p, ex, m, meas, s, r, prog]) => {
        setClient(c);
        const assignable = p.filter((plan) => !plan.isTemplate);
        setPlans(assignable);
        setExercises(ex);
        setMaxes(m);
        setMeasurements(meas);
        setSessions(s);
        setRecords(r);
        setProgress(prog);
        setPlanId((prev) => (prev === "" && assignable.length > 0 ? assignable[0].id : prev));
        setMaxExerciseId((prev) => (prev === "" && ex.length > 0 ? ex[0].id : prev));
        const hasActive = c.assignments.some((a) => a.status === "active");
        setAssignOpen(!hasActive);
        setTab((prev) => prev ?? (s.length > 0 ? "history" : "plans"));
      })
      .catch((e: Error) => setError(e.message));
  }, [clientId]);

  useEffect(load, [load]);

  const activeAssignment = useMemo(
    () =>
      client?.assignments.find((a) => a.status === "active" && a.id === progress?.assignmentId) ??
      client?.assignments.find((a) => a.status === "active") ??
      null,
    [client, progress],
  );

  useEffect(() => {
    if (!activeAssignment) return;
    const assignmentId = activeAssignment.id;
    let cancelled = false;
    api.plans
      .get(activeAssignment.planId, clientId)
      .then((plan) => {
        if (cancelled) return;
        const days = [...plan.days].sort((a, b) => a.weekNumber - b.weekNumber || a.order - b.order);
        const doneDayIds = new Set(
          sessions
            .filter(
              (s) => s.status === "completed" && s.assignmentId === assignmentId && s.planDayId != null,
            )
            .map((s) => s.planDayId!),
        );
        const next = days.find((d) => !doneDayIds.has(d.id)) ?? days[0] ?? null;
        setNextDay(next ? { assignmentId, label: next.label } : null);
      })
      .catch(() => {
        if (!cancelled) setNextDay(null);
      });
    return () => {
      cancelled = true;
    };
  }, [activeAssignment, clientId, sessions]);

  const nextDayLabel =
    activeAssignment && nextDay?.assignmentId === activeAssignment.id ? nextDay.label : null;

  const completedSessions = useMemo(
    () => sessions.filter((s) => s.status === "completed"),
    [sessions],
  );
  const lastSession = completedSessions[0] ?? null;
  const sessions30 = completedSessions.filter((s) => withinLastDays(s.performedOn, 30)).length;
  const prs30 = records.filter((r) => withinLastDays(r.performedOn, 30)).length;
  const lastAgo = lastSession ? daysAgo(lastSession.performedOn) : null;

  const weightTrend = [...measurements]
    .filter((m) => m.weightKg != null)
    .sort((a, b) => a.measuredOn.localeCompare(b.measuredOn) || a.id - b.id)
    .map((m) => ({ date: m.measuredOn, value: m.weightKg! }));

  const handleAssign = async (e: FormEvent) => {
    e.preventDefault();
    if (planId === "") return;
    setSaving(true);
    setError(null);
    try {
      await api.assignments.create({ planId, clientId, startDate, note: note.trim() || null });
      setNote("");
      setAssignOpen(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (assignmentId: number, status: string) => {
    if (!client) return;
    const snapshot = client.assignments;
    setClient((c) =>
      c
        ? {
            ...c,
            assignments: c.assignments.map((a) => (a.id === assignmentId ? { ...a, status } : a)),
          }
        : c,
    );
    try {
      await api.assignments.setStatus(assignmentId, status);
    } catch (err) {
      setClient((c) => (c ? { ...c, assignments: snapshot } : c));
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

  const handleRemoveMax = async (m: ClientMax) => {
    setMaxes((prev) => prev.filter((x) => x.id !== m.id));
    try {
      await api.clients.removeMax(m.id);
      showUndoToast(`Usunięto max „${m.exerciseName}”`, async () => {
        try {
          await api.clients.addMax(clientId, {
            exerciseId: m.exerciseId,
            maxKg: m.maxKg,
            measuredOn: m.measuredOn,
            note: m.note,
          });
          load();
        } catch (err) {
          setError((err as Error).message);
        }
      });
    } catch (err) {
      setError((err as Error).message);
      load();
    }
  };

  const handleRemoveMeasurement = async (m: ClientMeasurement) => {
    setMeasurements((prev) => prev.filter((x) => x.id !== m.id));
    try {
      await api.clients.removeMeasurement(m.id);
      showUndoToast(`Usunięto pomiar z ${m.measuredOn}`, async () => {
        try {
          await api.clients.addMeasurement(clientId, {
            measuredOn: m.measuredOn,
            weightKg: m.weightKg,
            waistCm: m.waistCm,
            chestCm: m.chestCm,
            hipsCm: m.hipsCm,
            note: m.note,
          });
          load();
        } catch (err) {
          setError((err as Error).message);
        }
      });
    } catch (err) {
      setError((err as Error).message);
      load();
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
      setShowMaxForm(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleAddMeasurement = async (e: FormEvent) => {
    e.preventDefault();
    if (!measureWeight && !measureWaist) return;
    try {
      await api.clients.addMeasurement(clientId, {
        measuredOn: measureDate,
        weightKg: measureWeight ? Number(measureWeight.replace(",", ".")) : null,
        waistCm: measureWaist ? Number(measureWaist.replace(",", ".")) : null,
      });
      setMeasureWeight("");
      setMeasureWaist("");
      setShowMeasureForm(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const resolveNextDayId = async (assignment: ClientDetails["assignments"][number]) => {
    const plan = await api.plans.get(assignment.planId, clientId);
    const days = [...plan.days].sort((a, b) => a.weekNumber - b.weekNumber || a.order - b.order);
    if (days.length === 0) return null;
    const doneDayIds = new Set(
      sessions
        .filter(
          (s) => s.status === "completed" && s.assignmentId === assignment.id && s.planDayId != null,
        )
        .map((s) => s.planDayId!),
    );
    return days.find((d) => !doneDayIds.has(d.id)) ?? days[0];
  };

  const handleStartSession = async (assignment: ClientDetails["assignments"][number]) => {
    try {
      const day = await resolveNextDayId(assignment);
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
      showUndoToast("Skopiowano link portalu");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteClient = async () => {
    if (!client) return;
    setDeleteClientOpen(false);
    try {
      await api.clients.remove(client.id);
      router.push("/clients");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const toggleRecord = (exerciseId: number) => {
    if (expandedRecordId === exerciseId) {
      setExpandedRecordId(null);
      return;
    }
    setExpandedRecordId(exerciseId);
    if (statsCache[exerciseId]) return;
    setStatsCache((prev) => ({ ...prev, [exerciseId]: "loading" }));
    api.clients
      .exerciseStats(clientId, exerciseId)
      .then((stats) => setStatsCache((prev) => ({ ...prev, [exerciseId]: stats })))
      .catch(() => setStatsCache((prev) => ({ ...prev, [exerciseId]: "error" })));
  };

  if (!client) {
    return (
      <div>
        <ErrorBanner message={error} />
        {error ? null : <ClientDetailSkeleton />}
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

  const openAssignTab = () => {
    setTab("plans");
    setAssignOpen(true);
  };

  const activeTab = tab ?? "plans";

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar name={client.name} size="lg" />
          <div className="min-w-0">
            <h1 className="break-words font-display text-xl font-bold sm:text-2xl">{client.name}</h1>
            <p className="mt-1 max-w-[70ch] break-words text-sm leading-[var(--leading-body)] text-muted-strong">
              {[client.email, client.note].filter(Boolean).join(" · ") || "Profil klienta"}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <Button variant="ghost" onClick={() => void copyPortalLink()}>
            Skopiuj link dla klienta
          </Button>
        </div>
      </div>

      <ErrorBanner message={error} />

      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="flex flex-col gap-4" eyebrow="Aktywny plan" title={activeAssignment?.planName ?? "Brak planu"}>
          {activeAssignment && progress?.assignmentId === activeAssignment.id ? (
            <>
              <div className="flex items-center gap-4">
                <ProgressRing
                  value={progress.percent / 100}
                  size={72}
                  stroke={6}
                  label={`${progress.percent}%`}
                />
                <div className="min-w-0">
                  <p className="font-mono text-sm tabular-nums text-foreground">
                    {progress.completed}/{progress.total} treningów
                  </p>
                  {nextDayLabel ? (
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-muted">
                      <Dumbbell aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={1.75} />
                      <span>
                        Następny: <span className="font-medium text-foreground">{nextDayLabel}</span>
                      </span>
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => void handleStartSession(activeAssignment)}>Dodaj trening</Button>
                <Link href={`/plans/${activeAssignment.planId}`} className="text-sm text-accent hover:text-accent-strong">
                  Otwórz plan
                </Link>
              </div>
            </>
          ) : (
            <EmptyState>
              <p className="mb-3">Przypisz plan, żeby klient mógł zacząć trenować.</p>
              <Button onClick={openAssignTab}>Przypisz plan</Button>
            </EmptyState>
          )}
        </Card>

        <Card className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-surface-hover text-foreground-secondary">
              <CalendarCheck aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <StatBlock
              label="Ostatni trening"
              value={lastSession ? relativeDayLabel(lastSession.performedOn) : "—"}
              delta={
                lastAgo != null && lastAgo > 7
                  ? `${lastAgo} dni przerwy`
                  : lastSession
                    ? formatDayShort(lastSession.performedOn)
                    : undefined
              }
              valueClassName={lastAgo != null && lastAgo > 7 ? "text-danger" : undefined}
            />
          </div>
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-surface-hover text-foreground-secondary">
              <Activity aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <StatBlock label="Treningi (30 dni)" value={sessions30} />
          </div>
          <div className="flex items-start gap-3">
            <span
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
                prs30 > 0 ? "bg-pr-dim text-pr" : "bg-surface-hover text-foreground-secondary"
              }`}
            >
              <Trophy aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <StatBlock label="Nowe PR (30 dni)" value={prs30} valueClassName={prs30 > 0 ? "text-pr" : undefined} />
          </div>
        </Card>
      </div>

      <Tabs
        items={[
          { value: "plans", label: "Plany", count: client.assignments.length },
          { value: "history", label: "Historia", count: sessions.length },
          { value: "results", label: "Wyniki", count: records.length + latestMaxes.length + measurements.length },
        ]}
        value={activeTab}
        onChange={setTab}
      />

      <div className="mt-6">
        {activeTab === "plans" && (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">Przypisane plany</h2>
              {!assignOpen ? (
                <Button onClick={() => setAssignOpen(true)}>Przypisz plan</Button>
              ) : null}
            </div>

            {assignOpen ? (
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
                      <div className="flex flex-wrap items-end gap-2">
                        <Button type="submit" disabled={saving || planId === ""}>
                          {saving ? "Przypisywanie…" : "Przypisz plan"}
                        </Button>
                        {client.assignments.some((a) => a.status === "active") ? (
                          <Button type="button" variant="ghost" onClick={() => setAssignOpen(false)}>
                            Anuluj
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </form>
                )}
              </Card>
            ) : null}

            {client.assignments.length === 0 ? (
              <EmptyState>Ten klient nie ma jeszcze żadnych przypisań.</EmptyState>
            ) : (
              <div className="grid gap-2">
                {client.assignments.map((a) => (
                  <Card key={a.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <Link href={`/plans/${a.planId}`} className="break-words text-base font-medium hover:text-accent">
                        {a.planName}
                      </Link>
                      <p className="mt-0.5 text-sm text-muted">
                        od {formatDayShort(a.startDate)}
                        {a.note ? ` · ${a.note}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Badge tone={statusTone(a.status)}>{statusLabel(a.status)}</Badge>
                      {a.status === "active" ? (
                        <Button variant="ghost" onClick={() => handleStatus(a.id, "completed")}>
                          Zakończ
                        </Button>
                      ) : (
                        <Button variant="ghost" onClick={() => handleStatus(a.id, "active")}>
                          Wznów
                        </Button>
                      )}
                      <Button variant="ghost" onClick={() => void handleRemove(a)}>
                        Usuń
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "history" && (
          <>
            {completedSessions.length > 0 ? (
              <Card className="mb-6">
                <WeeklyActivityBar dates={completedSessions.map((s) => s.performedOn)} weeks={8} />
              </Card>
            ) : null}

            {sessions.length === 0 ? (
              <EmptyState
                title="Brak treningów"
                action={
                  activeAssignment ? (
                    <Button onClick={() => void handleStartSession(activeAssignment)}>Dodaj trening</Button>
                  ) : (
                    <Button onClick={openAssignTab}>Przypisz plan</Button>
                  )
                }
              >
                Dodaj pierwszy trening — historia i aktywność pojawią się tutaj.
              </EmptyState>
            ) : (
              <div className="grid gap-2">
                {sessions.map((s) => (
                  <Link key={s.id} href={`/clients/${clientId}/sessions/${s.id}`}>
                    <Card className="flex flex-wrap items-center justify-between gap-3 transition-colors hover:border-border-strong">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-surface-hover text-foreground-secondary">
                          <Dumbbell aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0">
                          <p className="break-words text-base font-medium">
                            {s.dayLabel ?? s.planName ?? "Trening"}
                          </p>
                          <p className="mt-0.5 text-sm text-muted">
                            {s.status === "completed" ? relativeDayLabel(s.performedOn) : formatDayShort(s.performedOn)}
                            {` · ${s.exerciseCount} ćw.`}
                            {formatDurationMinutes(s.durationSeconds)
                              ? ` · ${formatDurationMinutes(s.durationSeconds)}`
                              : ""}
                          </p>
                        </div>
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

        {activeTab === "results" && (
          <div className="space-y-8">
            <section>
              <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
                <Trophy aria-hidden className="h-4 w-4 text-pr" strokeWidth={1.75} />
                Rekordy
              </h2>
              {records.length === 0 ? (
                <EmptyState>Rekordy pojawią się po zapisaniu treningów z ciężarem i powtórzeniami.</EmptyState>
              ) : (
                <div className="grid gap-2">
                  {records.map((r) => {
                    const open = expandedRecordId === r.exerciseId;
                    const stats = statsCache[r.exerciseId];
                    return (
                      <div
                        key={r.exerciseId}
                        className="overflow-hidden rounded-xl border border-border bg-surface shadow-card"
                      >
                        <button
                          type="button"
                          onClick={() => toggleRecord(r.exerciseId)}
                          className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          aria-expanded={open}
                        >
                          <div className="min-w-0">
                            <p className="break-words text-base font-medium">{r.exerciseName}</p>
                            <p className="font-mono text-sm tabular-nums text-muted">
                              {r.weightKg} × {r.reps} · {formatDayShort(r.performedOn)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-mono text-lg font-semibold tabular-nums text-pr">
                                {r.estimated1Rm} kg
                              </p>
                              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                                Szacowany max
                              </p>
                            </div>
                            <span
                              className={`text-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`}
                              aria-hidden
                            >
                              ▾
                            </span>
                          </div>
                        </button>
                        {open ? (
                          <div className="border-t border-border px-4 py-3">
                            {stats === "loading" || stats == null ? (
                              <p className="text-sm text-muted">Ładowanie trendu…</p>
                            ) : stats === "error" ? (
                              <p className="text-sm text-danger">Nie udało się wczytać trendu.</p>
                            ) : (
                              <TrendSparkline points={stats.trend} />
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <Weight aria-hidden className="h-4 w-4 text-foreground-secondary" strokeWidth={1.75} />
                  Maxy (1RM)
                </h2>
                {!showMaxForm ? (
                  <Button variant="secondary" onClick={() => setShowMaxForm(true)}>
                    Dodaj max
                  </Button>
                ) : null}
              </div>

              {showMaxForm ? (
                <Card className="mb-4" title="Dodaj max (1RM)">
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
                    <div className="flex flex-wrap items-end gap-2">
                      <Button type="submit">Dodaj max</Button>
                      <Button type="button" variant="ghost" onClick={() => setShowMaxForm(false)}>
                        Anuluj
                      </Button>
                    </div>
                  </form>
                </Card>
              ) : null}

              {latestMaxes.length === 0 ? (
                <EmptyState>Brak maxów — dodaj 1RM, żeby plany procentowe wyliczały kg.</EmptyState>
              ) : (
                <div className="grid gap-2">
                  {latestMaxes.map((m) => (
                    <Card key={m.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-base font-medium">{m.exerciseName}</p>
                        <p className="text-sm text-muted">
                          {formatDayShort(m.measuredOn)}
                          {m.note ? ` · ${m.note}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-lg font-semibold tabular-nums text-accent">{m.maxKg} kg</span>
                        <Button variant="ghost" onClick={() => void handleRemoveMax(m)}>
                          Usuń
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <Ruler aria-hidden className="h-4 w-4 text-foreground-secondary" strokeWidth={1.75} />
                  Pomiary
                </h2>
                {!showMeasureForm ? (
                  <Button variant="secondary" onClick={() => setShowMeasureForm(true)}>
                    Dodaj pomiar
                  </Button>
                ) : null}
              </div>

              {showMeasureForm ? (
                <Card className="mb-4" title="Dodaj pomiar">
                  <form onSubmit={handleAddMeasurement} className="grid gap-3 sm:grid-cols-4">
                    <Field label="Data">
                      <input
                        className={inputClass}
                        type="date"
                        value={measureDate}
                        onChange={(e) => setMeasureDate(e.target.value)}
                      />
                    </Field>
                    <Field label="Waga (kg)">
                      <input
                        className={inputClass}
                        value={measureWeight}
                        onChange={(e) => setMeasureWeight(e.target.value)}
                        inputMode="decimal"
                        placeholder="75,5"
                      />
                    </Field>
                    <Field label="Talia (cm)">
                      <input
                        className={inputClass}
                        value={measureWaist}
                        onChange={(e) => setMeasureWaist(e.target.value)}
                        inputMode="decimal"
                        placeholder="82"
                      />
                    </Field>
                    <div className="flex flex-wrap items-end gap-2">
                      <Button type="submit">Dodaj pomiar</Button>
                      <Button type="button" variant="ghost" onClick={() => setShowMeasureForm(false)}>
                        Anuluj
                      </Button>
                    </div>
                  </form>
                </Card>
              ) : null}

              {weightTrend.length >= 2 ? (
                <Card className="mb-4" eyebrow="Trend" title="Waga">
                  <WeightTrendSparkline points={weightTrend} />
                </Card>
              ) : null}

              {measurements.length === 0 ? (
                <EmptyState>Brak pomiarów — dodaj wagę lub obwód talii.</EmptyState>
              ) : (
                <div className="grid gap-2">
                  {measurements.map((m) => (
                    <Card key={m.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-medium">{formatDayShort(m.measuredOn)}</p>
                        <p className="font-mono text-sm tabular-nums text-muted">
                          {[
                            m.weightKg != null ? `${m.weightKg} kg` : null,
                            m.waistCm != null ? `talia ${m.waistCm} cm` : null,
                            m.chestCm != null ? `klatka ${m.chestCm} cm` : null,
                            m.hipsCm != null ? `biodra ${m.hipsCm} cm` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                          {m.note ? ` · ${m.note}` : ""}
                        </p>
                      </div>
                      <Button variant="ghost" onClick={() => void handleRemoveMeasurement(m)}>
                        Usuń
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <div className="mt-10 border-t border-border pt-4">
        <Button variant="ghost" onClick={() => setDeleteClientOpen(true)}>
          Usuń klienta
        </Button>
      </div>

      <Dialog
        open={deleteClientOpen}
        title="Usunąć klienta?"
        description={
          client
            ? `Klient „${client.name}” i wszystkie przypisania zostaną trwale usunięte. Tej operacji nie można cofnąć.`
            : undefined
        }
        confirmLabel="Usuń klienta"
        danger
        onConfirm={() => void handleDeleteClient()}
        onCancel={() => setDeleteClientOpen(false)}
      />

      {toastNode}
    </div>
  );
}
