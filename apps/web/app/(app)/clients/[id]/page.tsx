"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  PageHeader,
  StatBlock,
  Tabs,
  useUndoToast,
} from "@/components/ui";
import { ClientDetailSkeleton } from "@/components/skeletons";
import { ComplianceHeatmap } from "@/components/ComplianceHeatmap";
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

function daysAgo(iso: string): number {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return 0;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - d.getTime()) / 86400000));
}

function relativeDayLabel(iso: string): string {
  const n = daysAgo(iso);
  if (n === 0) return "dziś";
  if (n === 1) return "wczoraj";
  if (n < 7) return `${n} dni temu`;
  if (n < 14) return "tydzień temu";
  return `${n} dni temu`;
}

function formatDayShort(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

function withinLastDays(iso: string, days: number): boolean {
  return daysAgo(iso) <= days;
}

export default function ClientDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const clientId = Number(params.id);

  const [tab, setTab] = useState("plans");
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [maxes, setMaxes] = useState<ClientMax[]>([]);
  const [measurements, setMeasurements] = useState<ClientMeasurement[]>([]);
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
  const [assignOpen, setAssignOpen] = useState(false);

  const [maxExerciseId, setMaxExerciseId] = useState<number | "">("");
  const [maxKg, setMaxKg] = useState("");
  const [maxDate, setMaxDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [measureDate, setMeasureDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [measureWeight, setMeasureWeight] = useState("");
  const [measureWaist, setMeasureWaist] = useState("");

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
      })
      .catch((e: Error) => setError(e.message));
  }, [clientId]);

  useEffect(load, [load]);

  const activeAssignment = useMemo(
    () => client?.assignments.find((a) => a.status === "active" && a.id === progress?.assignmentId)
      ?? client?.assignments.find((a) => a.status === "active")
      ?? null,
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
        const days = [...plan.days].sort(
          (a, b) => a.weekNumber - b.weekNumber || a.order - b.order,
        );
        const doneDayIds = new Set(
          sessions
            .filter(
              (s) =>
                s.status === "completed" &&
                s.assignmentId === assignmentId &&
                s.planDayId != null,
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

  const recentCheckins = completedSessions
    .filter((s) => s.feelingScore != null)
    .slice(0, 3);
  const avgFeeling =
    recentCheckins.length > 0
      ? recentCheckins.reduce((sum, s) => sum + (s.feelingScore ?? 0), 0) / recentCheckins.length
      : null;
  const avgSleep =
    recentCheckins.filter((s) => s.sleepScore != null).length > 0
      ? recentCheckins
          .filter((s) => s.sleepScore != null)
          .reduce((sum, s) => sum + (s.sleepScore ?? 0), 0) /
        recentCheckins.filter((s) => s.sleepScore != null).length
      : null;
  const avgEnergy =
    recentCheckins.filter((s) => s.energyScore != null).length > 0
      ? recentCheckins
          .filter((s) => s.energyScore != null)
          .reduce((sum, s) => sum + (s.energyScore ?? 0), 0) /
        recentCheckins.filter((s) => s.energyScore != null).length
      : null;

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
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const resolveNextDayId = async (assignment: ClientDetails["assignments"][number]) => {
    const plan = await api.plans.get(assignment.planId, clientId);
    const days = [...plan.days].sort(
      (a, b) => a.weekNumber - b.weekNumber || a.order - b.order,
    );
    if (days.length === 0) return null;
    const doneDayIds = new Set(
      sessions
        .filter(
          (s) =>
            s.status === "completed" &&
            s.assignmentId === assignment.id &&
            s.planDayId != null,
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
      setPortalLink(url);
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

      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="flex flex-col gap-4" eyebrow="Aktywny plan" title={activeAssignment?.planName ?? "Brak planu"}>
          {activeAssignment && progress?.assignmentId === activeAssignment.id ? (
            <>
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-mono text-sm tabular-nums text-foreground">
                    {progress.completed}/{progress.total} treningów
                  </p>
                  <p className="font-mono text-xs tabular-nums text-muted">{progress.percent}%</p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-200"
                    style={{ width: `${Math.min(100, progress.percent)}%` }}
                  />
                </div>
                {nextDayLabel ? (
                  <p className="mt-2 text-sm text-muted">
                    Następny: <span className="font-medium text-foreground">{nextDayLabel}</span>
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => void handleStartSession(activeAssignment)}>Loguj trening</Button>
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <Card>
            <StatBlock
              label="Ostatni trening"
              value={lastSession ? relativeDayLabel(lastSession.performedOn) : "—"}
              delta={lastSession && lastAgo != null && lastAgo <= 7 ? formatDayShort(lastSession.performedOn) : undefined}
            />
            {lastAgo != null && lastAgo > 7 ? (
              <p className="mt-1 font-mono text-xs tabular-nums text-danger">
                {lastAgo} dni przerwy
              </p>
            ) : null}
          </Card>
          <Card>
            <StatBlock label="Treningi (30 dni)" value={sessions30} />
          </Card>
          <Card>
            <StatBlock label="Nowe PR (30 dni)" value={prs30} />
          </Card>
        </div>
      </div>

      {recentCheckins.length > 0 ? (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card>
            <StatBlock
              label="Samopoczucie"
              value={avgFeeling != null ? `${avgFeeling.toFixed(1)}/5` : "—"}
            />
          </Card>
          <Card>
            <StatBlock label="Sen" value={avgSleep != null ? `${avgSleep.toFixed(1)}/5` : "—"} />
          </Card>
          <Card>
            <StatBlock label="Energia" value={avgEnergy != null ? `${avgEnergy.toFixed(1)}/5` : "—"} />
          </Card>
        </div>
      ) : null}

      <Card className="mb-6">
        <ComplianceHeatmap
          dates={sessions.filter((s) => s.status === "completed").map((s) => s.performedOn)}
          weeks={8}
          title="Zgodność klienta"
        />
      </Card>

      <Tabs
        items={[
          { value: "plans", label: "Plany", count: client.assignments.length },
          { value: "history", label: "Historia", count: sessions.length },
          { value: "records", label: "Rekordy", count: records.length },
          { value: "maxes", label: "Maxy", count: latestMaxes.length },
          { value: "measurements", label: "Pomiary", count: measurements.length },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div className="mt-6">
        {tab === "plans" && (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">Przypisane plany</h2>
              {!assignOpen ? (
                <Button variant="secondary" onClick={() => setAssignOpen(true)}>
                  Przypisz plan
                </Button>
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
                        <Button variant="secondary" onClick={() => void handleStartSession(a)}>
                          Loguj trening
                        </Button>
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
                        <p className="break-words font-semibold">
                          {s.dayLabel ?? s.planName ?? "Trening"}
                        </p>
                        <p className="font-mono text-xs tabular-nums text-muted">
                          {formatDayShort(s.performedOn)}
                          {s.status === "completed" ? ` · ${relativeDayLabel(s.performedOn)}` : ""}
                          {formatDurationMinutes(s.durationSeconds)
                            ? ` · ${formatDurationMinutes(s.durationSeconds)}`
                            : ""}
                          {" · "}
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
                <p className="mb-1 text-xs text-muted">
                  Szacowany max (e1RM) — ile mniej więcej klient uniesie na 1 powtórzenie, z serii.
                </p>
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
                          <p className="break-words font-semibold">{r.exerciseName}</p>
                          <p className="font-mono text-xs tabular-nums text-muted">
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
                            <p className="text-xs text-muted">Ładowanie trendu…</p>
                          ) : stats === "error" ? (
                            <p className="text-xs text-danger">Nie udało się wczytać trendu.</p>
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
                  <Button type="submit">Dodaj max</Button>
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
                      <Button variant="ghost" onClick={() => void handleRemoveMax(m)}>
                        Usuń
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "measurements" && (
          <>
            <Card className="mb-6" title="Dodaj pomiar">
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
                <div className="flex items-end">
                  <Button type="submit">Dodaj pomiar</Button>
                </div>
              </form>
            </Card>

            {weightTrend.length >= 2 ? (
              <Card className="mb-6" eyebrow="Trend" title="Waga">
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
                      <p className="font-mono text-sm font-semibold tabular-nums">{m.measuredOn}</p>
                      <p className="font-mono text-xs tabular-nums text-muted">
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
          </>
        )}
      </div>

      <div className="mt-10 border-t border-border pt-4">
        <Button variant="ghost" onClick={() => setDeleteClientOpen(true)}>
          Usuń klienta wraz z przypisaniami
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
