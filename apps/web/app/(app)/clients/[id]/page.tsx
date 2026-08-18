"use client";

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import {
  api,
  ClientCheckIn,
  ClientDetails,
  ClientIntake,
  ClientIntakeInput,
  ClientMax,
  ClientMeasurement,
  ClientNoteGroup,
  ClientProgress,
  ClientRecord,
  ClientTrendsResponse,
  Exercise,
  isIntakeBlank,
  MuscleVolumeResponse,
  PlanDay,
  PlanSummary,
  ProgressPhoto,
  ProgressReport,
  SessionSummary,
  StagnationResponse,
  TrainerNote,
} from "@/lib/api";
import { ClientNotesTab, countClientNotes } from "@/components/client/ClientNotesTab";
import { PortalAccessSection } from "@/components/client/PortalAccessSection";
import { TrainerNotesTab } from "@/components/client/TrainerNotesTab";
import { ClientMaxesSection } from "@/components/ClientMaxesSection";
import { ClientRecordsSection } from "@/components/ClientRecordsSection";
import { PlanFromHistoryDialog } from "@/components/PlanFromHistoryDialog";
import { SearchPicker } from "@/components/SearchPicker";
import { daysAgo, formatDayShort, relativeDayLabel, todayIsoLocal, withinLastDays } from "@/lib/dates";
import { refreshNavCounts } from "@/lib/navCounts";
import { markPortalLinkSent } from "@/lib/portalLinkSent";
import { WeightTrendSparkline } from "@/components/WeightTrendSparkline";
import { MuscleVolumeBars } from "@/components/MuscleVolumeBars";
import { LineChart } from "@/components/charts/LineChart";
import { ClientIntakeForm, ClientIntakeView } from "@/components/ClientIntakeForm";
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
  SegmentedControl,
  StatBlock,
  Tabs,
  useUndoToast,
} from "@/components/ui";
import { ClientDetailSkeleton } from "@/components/skeletons";
import { WeeklyActivityBar } from "@/components/WeeklyActivityBar";
import { formatDurationMinutes } from "@/lib/estimateDuration";
import { formatKg } from "@/lib/plates";
import { polishPhotoCount } from "@/lib/plural";
import { formatNextDayLine, formatSchedulePreview, nearestStartForFirstDay } from "@/lib/schedule";
import { ProgressPhotoGallery } from "@/components/ProgressPhotoGallery";
import { ClientPresenceLabel, presenceHref } from "@/components/ClientPresenceLabel";
import { useVisiblePoll } from "@/lib/useVisiblePoll";
import { ScoreSparkline } from "@/components/ScoreSparkline";

function trendChartPoints(
  weeks: { weekStart: string; volumeKg: number; sessions: number }[] | undefined,
  pick: "volumeKg" | "sessions",
) {
  const points = (weeks ?? []).map((w) => ({
    label: formatDayShort(w.weekStart),
    value: w[pick],
  }));
  return points.filter((p) => p.value !== 0).length < 2 ? [] : points;
}

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
        className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-xs ${
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

function ClientDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = Number(params.id);
  const assignedToastShown = useRef(false);

  const [tab, setTab] = useState<string | null>(null);
  const [notesSegment, setNotesSegment] = useState<"mine" | "client">("mine");
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [plansForClient, setPlansForClient] = useState<number | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exercisesForClient, setExercisesForClient] = useState<number | null>(null);
  const [maxes, setMaxes] = useState<ClientMax[]>([]);
  const [measurements, setMeasurements] = useState<ClientMeasurement[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [records, setRecords] = useState<ClientRecord[]>([]);
  const [checkIns, setCheckIns] = useState<ClientCheckIn[]>([]);
  const [checkInsForClient, setCheckInsForClient] = useState<number | null>(null);
  const [progress, setProgress] = useState<ClientProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showUndoToast, toastNode } = useUndoToast();
  const plansLoaded = plansForClient === clientId;
  const exercisesLoaded = exercisesForClient === clientId;
  const checkInsLoaded = checkInsForClient === clientId;

  const [planId, setPlanId] = useState<number | "">("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const [measureDate, setMeasureDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [measureWeight, setMeasureWeight] = useState("");
  const [measureWaist, setMeasureWaist] = useState("");
  const [showMeasureForm, setShowMeasureForm] = useState(false);
  const [goalWeightDraft, setGoalWeightDraft] = useState("");
  const [goalWeightSaving, setGoalWeightSaving] = useState(false);

  const [planFromHistoryOpen, setPlanFromHistoryOpen] = useState(false);
  const [photosOpen, setPhotosOpen] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [assignDays, setAssignDays] = useState<PlanDay[]>([]);
  const [deleteClientOpen, setDeleteClientOpen] = useState(false);
  const [logBehalfOpen, setLogBehalfOpen] = useState(false);
  const [logBehalfDays, setLogBehalfDays] = useState<{ id: number; label: string; weekNumber: number }[]>([]);
  const [logBehalfDayId, setLogBehalfDayId] = useState<number | "">("");
  const [logBehalfDate, setLogBehalfDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [logBehalfStarting, setLogBehalfStarting] = useState(false);
  const [intake, setIntake] = useState<ClientIntake | null>(null);
  const [intakeForClient, setIntakeForClient] = useState<number | null>(null);
  const [intakeEditing, setIntakeEditing] = useState(false);
  const [muscleVolume, setMuscleVolume] = useState<MuscleVolumeResponse | null>(null);
  const [trends, setTrends] = useState<ClientTrendsResponse | null>(null);
  const [stagnation, setStagnation] = useState<StagnationResponse | null>(null);
  const [progressReport, setProgressReport] = useState<ProgressReport | null>(null);
  const [trainerNotes, setTrainerNotes] = useState<TrainerNote[]>([]);
  const [clientNotes, setClientNotes] = useState<ClientNoteGroup[]>([]);
  const [notesForClient, setNotesForClient] = useState<number | null>(null);
  const intakeLoaded = intakeForClient === clientId;
  const notesLoaded = notesForClient === clientId;

  const load = useCallback(() => {
    // Eager: hero (profil, postęp, sesje, rekordy). Reszta lazy per zakładka.
    Promise.all([
      api.clients.get(clientId),
      api.clients.sessions(clientId),
      api.clients.progress(clientId),
      api.clients.records(clientId),
    ])
      .then(([c, s, prog, r]) => {
        setClient(c);
        setGoalWeightDraft(c.goalWeightKg != null ? String(c.goalWeightKg).replace(".", ",") : "");
        setSessions(s);
        setProgress(prog);
        setRecords(r);
        setAssignOpen(false);
        setTab((prev) => {
          if (prev === "client-notes") return "notes";
          return prev ?? (s.length > 0 ? "history" : "plans");
        });
      })
      .catch((e: Error) => setError(e.message));
  }, [clientId]);

  useEffect(load, [load]);
  useVisiblePoll(load, 20_000);

  // Peak-End: toast po zamkniętej pętli kreator → auto-przypisanie.
  useEffect(() => {
    if (searchParams.get("assigned") !== "1" || assignedToastShown.current) return;
    assignedToastShown.current = true;
    showUndoToast("Plan przypisany — klient widzi go w portalu");
    router.replace(`/clients/${clientId}`, { scroll: false });
  }, [searchParams, clientId, router, showUndoToast]);

  const loadAssignPreview = useCallback((id: number) => {
    api.plans
      .get(id)
      .then((plan) => {
        setAssignDays(plan.days);
        setStartDate(nearestStartForFirstDay(plan.days, todayIsoLocal()));
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const selectAssignPlan = (id: number) => {
    setPlanId(id);
    loadAssignPreview(id);
  };

  const openAssignForm = () => {
    setAssignOpen(true);
    if (planId !== "") loadAssignPreview(planId);
  };

  // Plany: zakładka lub dialog przypisania.
  useEffect(() => {
    if (tab !== "plans" && !assignOpen) return;
    if (plansLoaded) return;
    let cancelled = false;
    api.plans
      .list()
      .then((p) => {
        if (cancelled) return;
        const assignable = p.filter((plan) => !plan.isTemplate);
        setPlans(assignable);
        setPlansForClient(clientId);
        const first = assignable[0]?.id;
        setPlanId((prev) => (prev === "" && first != null ? first : prev));
        if (first != null) loadAssignPreview(first);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, assignOpen, plansLoaded, clientId, loadAssignPreview]);

  // Historia: check-iny.
  useEffect(() => {
    if (tab !== "history" || checkInsLoaded) return;
    let cancelled = false;
    api.clients
      .checkIns(clientId)
      .then((rows) => {
        if (!cancelled) {
          setCheckIns(rows);
          setCheckInsForClient(clientId);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, clientId, checkInsLoaded]);

  // Notatki.
  useEffect(() => {
    if (tab !== "notes" || notesLoaded) return;
    let cancelled = false;
    Promise.all([api.clients.notes(clientId), api.clients.clientNotes(clientId)])
      .then(([notes, cNotes]) => {
        if (cancelled) return;
        setTrainerNotes(notes);
        setClientNotes(cNotes);
        setNotesForClient(clientId);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, clientId, notesLoaded]);

  // Wywiad.
  useEffect(() => {
    if (tab !== "intake" || intakeLoaded) return;
    let cancelled = false;
    api.clients
      .getIntake(clientId)
      .then((intk) => {
        if (!cancelled) {
          setIntake(intk);
          setIntakeForClient(clientId);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, clientId, intakeLoaded]);

  const activeAssignment = useMemo(
    () =>
      client?.assignments.find((a) => a.status === "active" && a.id === progress?.assignmentId) ??
      client?.assignments.find((a) => a.status === "active") ??
      null,
    [client, progress],
  );

  // Wyniki (+ biblioteka ćwiczeń do formularza maxów).
  useEffect(() => {
    if (tab !== "results") return;
    let cancelled = false;
    Promise.all([
      api.clients.maxes(clientId),
      api.clients.measurements(clientId),
      api.clients.muscleVolume(clientId, 4),
      api.clients.trends(clientId, 12),
      api.clients.stagnation(clientId),
      api.clients.progressReport(clientId).catch(() => null),
      exercisesLoaded ? Promise.resolve(undefined) : api.exercises.list(),
      api.clients.photos(clientId).catch(() => [] as ProgressPhoto[]),
    ])
      .then(([m, meas, mv, tr, st, report, ex, photos]) => {
        if (cancelled) return;
        setMaxes(m);
        setMeasurements(meas);
        setMuscleVolume(mv);
        setTrends(tr);
        setStagnation(st);
        setProgressReport(report);
        setPhotoCount(photos.length);
        if (ex) {
          setExercises(ex);
          setExercisesForClient(clientId);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, clientId, exercisesLoaded]);

  const nextDayLabel =
    activeAssignment && progress?.assignmentId === activeAssignment.id && progress.nextDay
      ? formatNextDayLine(progress.nextDay)
      : null;
  const assignPreview = formatSchedulePreview(assignDays, startDate);

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

  const handleAddMax = async (input: { exerciseId: number; maxKg: number; measuredOn: string }) => {
    try {
      await api.clients.addMax(clientId, input);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleUpdateMax = async (
    id: number,
    input: { maxKg: number; measuredOn: string; note: string | null },
  ) => {
    try {
      await api.clients.updateMax(id, input);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const saveGoalWeight = async () => {
    if (!client) return;
    setGoalWeightSaving(true);
    setError(null);
    try {
      const raw = goalWeightDraft.trim().replace(",", ".");
      const goalWeightKg = raw === "" ? null : Number(raw);
      if (goalWeightKg != null && (!Number.isFinite(goalWeightKg) || goalWeightKg <= 0)) {
        setError("Podaj prawidłową wagę docelową.");
        return;
      }
      await api.clients.update(client.id, {
        name: client.name,
        email: client.email,
        note: client.note,
        goalWeightKg,
      });
      setClient({ ...client, goalWeightKg });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGoalWeightSaving(false);
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

  const openLogBehalf = async (assignment?: ClientDetails["assignments"][number] | null) => {
    setError(null);
    setLogBehalfDate(new Date().toISOString().slice(0, 10));
    if (!assignment) {
      setLogBehalfDays([]);
      setLogBehalfDayId("");
      setLogBehalfOpen(true);
      return;
    }
    try {
      const plan = await api.plans.get(assignment.planId, clientId);
      const days = [...plan.days]
        .sort((a, b) => a.weekNumber - b.weekNumber || a.order - b.order)
        .map((d) => ({ id: d.id, label: d.label, weekNumber: d.weekNumber }));
      if (days.length === 0) {
        setLogBehalfDays([]);
        setLogBehalfDayId("");
        setLogBehalfOpen(true);
        return;
      }
      const next = await resolveNextDayId(assignment);
      setLogBehalfDays(days);
      setLogBehalfDayId(next?.id ?? days[0].id);
      setLogBehalfOpen(true);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const confirmLogBehalf = async () => {
    setLogBehalfStarting(true);
    setError(null);
    try {
      const session = await api.sessions.start({
        clientId,
        assignmentId: activeAssignment?.id ?? null,
        planId: activeAssignment?.planId ?? null,
        planDayId: logBehalfDayId === "" ? null : logBehalfDayId,
        performedOn: logBehalfDate,
      });
      setLogBehalfOpen(false);
      router.push(`/clients/${clientId}/sessions/${session.id}/edit`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLogBehalfStarting(false);
    }
  };

  const copyPortalLink = async (toastMessage = "Skopiowano link portalu") => {
    try {
      const { token } = await api.clients.accessToken(clientId);
      const url = `${window.location.origin}/portal/${token}`;
      await navigator.clipboard.writeText(url);
      markPortalLinkSent();
      showUndoToast(toastMessage);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSaveIntake = async (input: ClientIntakeInput) => {
    setError(null);
    try {
      const saved = await api.clients.saveIntake(clientId, input);
      setIntake(saved);
      setIntakeEditing(false);
      showUndoToast("Zapisano wywiad");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteClient = async () => {
    if (!client) return;
    setDeleteClientOpen(false);
    try {
      await api.clients.remove(client.id);
      void refreshNavCounts();
      router.push("/clients");
    } catch (err) {
      setError((err as Error).message);
    }
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
    status === "active" || status === "completed" ? ("neutral" as const) : ("danger" as const);
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
    openAssignForm();
  };

  const activeTab = tab ?? "plans";
  const presenceLink = presenceHref(client.id, client.liveSession, client.needsReview);

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
            {presenceLink ? (
              <p className="mt-2">
                <Link
                  href={presenceLink}
                  className="hover:underline focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
                >
                  <ClientPresenceLabel
                    liveSession={client.liveSession}
                    needsReview={client.needsReview}
                    idle=""
                  />
                </Link>
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="ghost" onClick={() => void copyPortalLink()}>
            Skopiuj link dla klienta
          </Button>
        </div>
      </div>

      <ErrorBanner message={error} />

      {activeAssignment ? (
        <div className="mb-6 flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
              Aktywny plan
            </p>
            <p className="mt-1 break-words text-lg font-semibold tracking-tight text-foreground">
              {activeAssignment.planName}
            </p>
            <p className="mt-1 text-sm text-muted">
              {lastAgo != null && lastAgo > 7
                ? `${lastAgo} dni ciszy`
                : lastSession
                  ? `Ostatni trening ${relativeDayLabel(lastSession.performedOn)}`
                  : "Jeszcze bez sesji"}
              {progress?.assignmentId === activeAssignment.id
                ? ` · ukończone ${progress.completed}/${progress.total}`
                : ""}
              {nextDayLabel ? ` · dalej: ${nextDayLabel}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link href={`/plans/${activeAssignment.planId}`}>
              <Button>Otwórz plan</Button>
            </Link>
            <Button variant="secondary" onClick={() => void openLogBehalf(activeAssignment)}>
              Wpisz trening za klienta
            </Button>
            <Link href={`/clients/${clientId}/import`}>
              <Button variant="secondary">Wgraj stare treningi</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <EmptyState
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={openAssignTab}>Przypisz plan</Button>
                <Link href={`/clients/${clientId}/import`}>
                  <Button variant="secondary">Wgraj stare treningi</Button>
                </Link>
                <Button variant="secondary" onClick={() => setPlanFromHistoryOpen(true)}>
                  Złóż plan z historii
                </Button>
                <Button variant="secondary" onClick={() => void openLogBehalf(null)}>
                  Wpisz trening za klienta
                </Button>
              </div>
            }
          >
            Przypisz plan, żeby klient mógł zacząć trenować — albo wrzuć zdjęcia z poprzedniej apki.
          </EmptyState>
        </div>
      )}

      <Tabs
        items={[
          { value: "plans", label: "Plany", count: client.assignments.length },
          { value: "history", label: "Historia", count: sessions.length },
          { value: "results", label: "Wyniki", count: records.length + latestMaxes.length + measurements.length },
          {
            value: "notes",
            label: "Notatki",
            count: notesLoaded ? trainerNotes.length + countClientNotes(clientNotes) : undefined,
          },
          { value: "intake", label: "Wywiad" },
        ]}
        value={activeTab}
        onChange={(v) => {
          setTab(v);
          if (v !== "intake") setIntakeEditing(false);
        }}
      />

      <div className="mt-6">
        {activeTab === "plans" && (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">Przypisane plany</h2>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setPlanFromHistoryOpen(true)}>
                  Złóż plan z historii
                </Button>
                {!assignOpen ? (
                  <Button variant="secondary" onClick={openAssignForm}>
                    Przypisz plan
                  </Button>
                ) : null}
              </div>
            </div>

            {assignOpen ? (
              <Card className="mb-6" eyebrow="Akcja" title="Przypisz plan">
                {plans.length === 0 ? (
                  <EmptyState
                    action={
                      <Link href={`/plans/new?clientId=${clientId}`}>
                        <Button variant="secondary">Stwórz plan</Button>
                      </Link>
                    }
                  >
                    Nie masz jeszcze planów klienta.
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
                            onSelect={() => selectAssignPlan(p.id)}
                          />
                        ))}
                        <Link
                          href={`/plans/new?clientId=${clientId}`}
                          className="flex min-h-11 items-start gap-2 rounded-[10px] border border-dashed border-border-strong bg-surface p-3 text-left transition-colors duration-[var(--dur-fast)] hover:border-foreground hover:bg-surface-hover focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
                        >
                          <span
                            className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center text-muted"
                            aria-hidden
                          >
                            <Icon name="plus" size={14} decorative />
                          </span>
                          <span className="min-w-0">
                            <span className="block break-words text-sm font-medium text-foreground">
                              Stwórz nowy plan
                            </span>
                            <span className="mt-0.5 block font-mono text-xs text-muted">
                              Wrócisz tu z przypisanym planem
                            </span>
                          </span>
                        </Link>
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
                        {assignPreview ? (
                          <p className="mt-2 font-mono text-xs text-muted">
                            Pierwsze treningi: {assignPreview}
                          </p>
                        ) : null}
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
              <EmptyState
                title="Jeszcze bez przypisanego planu"
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button onClick={openAssignForm}>Przypisz plan</Button>
                    <Button variant="secondary" onClick={() => setPlanFromHistoryOpen(true)}>
                      Złóż plan z historii
                    </Button>
                  </div>
                }
              >
                Przypisz plan z biblioteki — klient zobaczy dzień treningowy w portalu.
              </EmptyState>
            ) : (
              <div className="grid gap-2">
                {client.assignments.map((a) => (
                  <Card
                    key={a.id}
                    className="group flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <Link href={`/plans/${a.planId}`} className="break-words text-base font-medium hover:text-accent">
                        {a.planName}
                      </Link>
                      <p className="mt-0.5 text-sm text-muted">
                        od {formatDayShort(a.startDate)}
                        {a.status === "active" && progress?.assignmentId === a.id
                          ? ` · ukończone ${progress.completed}/${progress.total}`
                          : ""}
                        {a.note ? ` · ${a.note}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Badge tone={statusTone(a.status)}>{statusLabel(a.status)}</Badge>
                      <div className="flex flex-wrap items-center gap-2 opacity-100 transition-opacity duration-[var(--dur-fast)] lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
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
                title="Tu pojawią się treningi klienta"
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Link href={`/clients/${clientId}/import`}>
                      <Button>Wgraj stare treningi</Button>
                    </Link>
                    <Button variant="ghost" onClick={() => void openLogBehalf(activeAssignment)}>
                      Wpisz trening za klienta
                    </Button>
                  </div>
                }
              >
                Wrzuć zdjęcia z poprzedniej apki — albo wpisz trening ręcznie, także bez planu.
              </EmptyState>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-[var(--r-card)] border border-border bg-surface">
                {sessions.map((s) => {
                  const wellness = [
                    s.feelingScore != null ? `samopoczucie ${s.feelingScore}/5` : null,
                    s.energyScore != null ? `energia ${s.energyScore}/5` : null,
                    s.sleepScore != null ? `sen ${s.sleepScore}/5` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  const volume =
                    s.totalVolumeKg > 0
                      ? `${Math.round(s.totalVolumeKg).toLocaleString("pl-PL")} kg`
                      : null;
                  return (
                    <li key={s.id}>
                      <Link
                        href={`/clients/${clientId}/sessions/${s.id}`}
                        className="flex min-h-[var(--tap-min)] flex-wrap items-center justify-between gap-3 px-3.5 py-3 transition-colors duration-[var(--dur-fast)] hover:bg-surface-hover focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] sm:px-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-base font-medium">
                            {s.dayLabel ?? s.planName ?? "Trening"}
                          </p>
                          <p className="mt-0.5 text-sm text-muted">
                            {s.status === "completed"
                              ? relativeDayLabel(s.performedOn)
                              : formatDayShort(s.performedOn)}
                            {` · ${s.exerciseCount} ćw.`}
                            {formatDurationMinutes(s.durationSeconds)
                              ? ` · ${formatDurationMinutes(s.durationSeconds)}`
                              : ""}
                            {volume ? ` · ${volume}` : ""}
                            {wellness ? ` · ${wellness}` : ""}
                          </p>
                          {s.note?.trim() ? (
                            <p className="mt-1 break-words text-sm text-foreground-secondary">
                              {s.note.trim()}
                            </p>
                          ) : null}
                          {s.hasUnreadClientReply ? (
                            <p className="mt-1 text-xs font-medium text-foreground">Nowa odpowiedź</p>
                          ) : null}
                        </div>
                        {s.status !== "completed" || s.outOfOrder ? (
                          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                            {s.outOfOrder ? <Badge tone="accent">Poza kolejką</Badge> : null}
                            {s.status !== "completed" ? (
                              <Badge tone="accent">w trakcie</Badge>
                            ) : null}
                          </div>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            {checkInsLoaded && checkIns.length > 0 ? (
              <section className="mt-8">
                <h2 className="mb-3 font-display text-lg font-semibold">Check-iny</h2>
                <ul className="divide-y divide-border rounded-[var(--r-card)] border border-border bg-surface">
                  {checkIns.map((c) => (
                    <li key={c.id} className="flex flex-col gap-1 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{relativeDayLabel(c.date)}</p>
                        <p className="mt-0.5 font-mono text-xs tabular-nums text-muted">
                          {[
                            c.moodScore != null ? `samopoczucie ${c.moodScore}/5` : null,
                            c.sleepScore != null ? `sen ${c.sleepScore}/5` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "bez ocen"}
                        </p>
                        {c.note?.trim() ? (
                          <p className="mt-1 break-words text-sm text-foreground-secondary">{c.note.trim()}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        )}

        {activeTab === "results" && (
          <div className="space-y-8">
            {progressReport && progressReport.facts.length > 0 ? (
              <section aria-label="Ostatnio">
                <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
                  Ostatnio
                </p>
                <ul className="mt-3 space-y-2">
                  {progressReport.facts.slice(0, 3).map((fact, index) => (
                    <li
                      key={`${fact.kind}-${index}`}
                      className={`text-[15px] leading-snug ${
                        fact.kind === "pr" ? "font-medium text-pr" : "text-foreground-secondary"
                      }`}
                    >
                      {fact.kind === "pr" && !String(fact.text).includes("★")
                        ? `★ ${fact.text}`
                        : fact.deltaKg != null && fact.deltaKg > 0
                          ? `▲ ${fact.text}`
                          : fact.text}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section
              aria-label="Podsumowanie"
              className="grid grid-cols-2 gap-3 border-y border-border py-5 sm:grid-cols-3"
            >
              <StatBlock
                label="Ostatni trening"
                value={lastSession ? relativeDayLabel(lastSession.performedOn) : "—"}
                delta={
                  lastAgo != null && lastAgo > 7
                    ? `−${lastAgo} dni ciszy`
                    : lastSession
                      ? formatDayShort(lastSession.performedOn)
                      : undefined
                }
                valueClassName={lastAgo != null && lastAgo > 7 ? "text-loss" : undefined}
              />
              <StatBlock label="Treningi (30 dni)" value={sessions30} />
              <StatBlock
                label="Nowe PR (30 dni)"
                value={prs30 > 0 ? `★ ${prs30}` : prs30}
                valueClassName={prs30 > 0 ? "text-pr" : undefined}
              />
            </section>

            {completedSessions.filter((s) => s.feelingScore != null).length >= 2 ? (
              <section aria-label="Samopoczucie">
                <h2 className="mb-3 font-display text-lg font-semibold">Samopoczucie</h2>
                <ScoreSparkline
                  points={completedSessions
                    .filter((s) => s.feelingScore != null)
                    .slice()
                    .reverse()
                    .map((s) => ({ date: s.performedOn, score: s.feelingScore as number }))}
                  ariaLabel="Trend samopoczucia klienta"
                />
              </section>
            ) : null}

            {stagnation && stagnation.items.length > 0 ? (
              <section>
                <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
                  <Icon name="warning" size={16} className="text-danger" decorative />
                  Zastój
                </h2>
                <div className="grid gap-2">
                  {stagnation.items.map((item) => (
                    <Card key={`${item.exerciseId}-${item.reason}`} className="border-danger/30">
                      <p className="break-words text-base font-medium text-foreground">
                        {item.exerciseName}
                      </p>
                      <p className="mt-1 text-sm text-muted">{item.message}</p>
                    </Card>
                  ))}
                </div>
              </section>
            ) : null}

            <ClientRecordsSection
              clientId={clientId}
              records={records}
              exercises={exercises}
              onExercisesChange={setExercises}
              onReload={load}
              onError={setError}
              emptyAction={
                activeAssignment ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void openLogBehalf(activeAssignment)}
                  >
                    Wpisz trening za klienta
                  </Button>
                ) : (
                  <Button size="sm" onClick={openAssignTab}>
                    Przypisz plan
                  </Button>
                )
              }
            />

            <ClientMaxesSection
              maxes={maxes}
              exercises={exercises}
              onExercisesChange={setExercises}
              onAdd={handleAddMax}
              onUpdate={handleUpdateMax}
              onRemove={(m) => void handleRemoveMax(m)}
            />

            <section>
              <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
                <Icon name="activity" size={16} className="text-foreground-secondary" decorative />
                Trendy
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card eyebrow="12 tyg." title="Tonaż tygodniowy">
                  <LineChart
                    points={trendChartPoints(trends?.weeks, "volumeKg")}
                    unit="kg"
                    emptyHint="Za mało treningów na trend tonażu."
                    ariaLabel="Tonaż tygodniowy"
                  />
                </Card>
                <Card eyebrow="12 tyg." title="Częstotliwość">
                  <LineChart
                    points={trendChartPoints(trends?.weeks, "sessions")}
                    emptyHint="Za mało treningów na trend częstotliwości."
                    ariaLabel="Liczba treningów tygodniowo"
                  />
                </Card>
              </div>
            </section>

            <section>
              <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
                <Icon name="dumbbell" size={16} className="text-foreground-secondary" decorative />
                Objętość mięśniowa
              </h2>
              <Card eyebrow="4 tyg." title="Serie robocze">
                <MuscleVolumeBars
                  groups={muscleVolume?.groups ?? []}
                  mode="sets"
                  emptyHint="Objętość pojawi się po zapisanych seriach z przypisanymi mięśniami."
                />
              </Card>
            </section>

            <section>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <Icon name="ruler" size={16} className="text-foreground-secondary" decorative />
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

              <Card className="mb-4" eyebrow="Cel" title="Waga docelowa">
                <div className="flex flex-wrap items-end gap-3">
                  <Field label="Cel (kg)">
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={goalWeightDraft}
                      onChange={(e) => setGoalWeightDraft(e.target.value)}
                      placeholder="np. 78"
                    />
                  </Field>
                  <Button
                    variant="secondary"
                    disabled={goalWeightSaving}
                    onClick={() => void saveGoalWeight()}
                  >
                    {goalWeightSaving ? "Zapis…" : "Zapisz cel"}
                  </Button>
                </div>
                {client.goalWeightKg != null ? (
                  <p className="mt-2 font-mono text-sm tabular-nums text-muted">
                    Aktualny cel: {formatKg(client.goalWeightKg)} kg
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted">
                    Klient zobaczy cel i dystans na stronie pomiarów.
                  </p>
                )}
              </Card>

              {weightTrend.length >= 2 ? (
                <Card className="mb-4" eyebrow="Trend" title="Waga">
                  <WeightTrendSparkline points={weightTrend} />
                </Card>
              ) : null}

              {measurements.length === 0 ? (
                <EmptyState
                  title="Zacznij od pierwszego pomiaru"
                  action={
                    <Button size="sm" onClick={() => setShowMeasureForm(true)}>
                      Dodaj pomiar
                    </Button>
                  }
                >
                  Waga lub obwód talii — klient też może dopisywać pomiary w portalu.
                </EmptyState>
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

            <Card
              title="Zdjęcia postępu"
              meta={photoCount > 0 ? polishPhotoCount(photoCount) : "Jeszcze bez zdjęć"}
              headerAction={
                <Button variant="ghost" size="sm" onClick={() => setPhotosOpen((v) => !v)}>
                  {photosOpen ? "Zwiń" : "Pokaż"}
                </Button>
              }
            >
              {photosOpen ? (
                <ProgressPhotoGallery mode="trainer" clientId={clientId} onError={setError} />
              ) : (
                <p className="text-sm text-muted-strong">To samo ujęcie, to samo światło.</p>
              )}
            </Card>
          </div>
        )}

        {activeTab === "notes" && (
          <div className="space-y-4">
            <SegmentedControl
              items={[
                { value: "mine", label: "Moje", count: notesLoaded ? trainerNotes.length : undefined },
                {
                  value: "client",
                  label: "Klienta",
                  count: notesLoaded ? countClientNotes(clientNotes) : undefined,
                },
              ]}
              value={notesSegment}
              onChange={(v) => setNotesSegment(v as "mine" | "client")}
            />
            {notesSegment === "mine" ? (
              <TrainerNotesTab
                clientId={clientId}
                notes={trainerNotes}
                onChange={setTrainerNotes}
                onUndoToast={showUndoToast}
              />
            ) : (
              <ClientNotesTab clientId={clientId} groups={clientNotes} />
            )}
          </div>
        )}

        {activeTab === "intake" && intake && (
          <>
            {isIntakeBlank(intake) && !intakeEditing ? (
              <EmptyState
                title="Wywiad jeszcze pusty"
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button onClick={() => setIntakeEditing(true)}>Przeprowadź wywiad</Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        void copyPortalLink("Skopiowano link — klient uzupełni ankietę w portalu")
                      }
                    >
                      Wyślij klientowi do wypełnienia
                    </Button>
                  </div>
                }
              >
                Zapisz cele, zdrowie i styl życia — albo wyślij link, żeby klient uzupełnił ankietę u siebie.
              </EmptyState>
            ) : intakeEditing ? (
              <ClientIntakeForm
                key={intake.updatedAt ?? "new"}
                initial={intake}
                submitLabel="Zapisz wywiad"
                onSubmit={handleSaveIntake}
                onCancel={() => setIntakeEditing(false)}
              />
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-semibold">Wywiad</h2>
                  <Button variant="ghost" onClick={() => setIntakeEditing(true)}>
                    Edytuj
                  </Button>
                </div>
                <ClientIntakeView intake={intake} />
              </>
            )}
          </>
        )}
      </div>

      <div className="mt-10 space-y-4">
        <PortalAccessSection
          key={clientId}
          clientId={clientId}
          clientName={client.name}
          email={client.email}
          hasPortalPin={Boolean(client.hasPortalPin)}
          lastSession={lastSession ? { dayLabel: lastSession.dayLabel } : null}
          lastRecord={records[0] ? { exerciseName: records[0].exerciseName, weightKg: records[0].weightKg } : null}
          lastAgo={lastAgo}
          onPinChange={(hasPin) =>
            setClient((c) => (c ? { ...c, hasPortalPin: hasPin } : c))
          }
          onUndoToast={showUndoToast}
        />
        <div className="border-t border-border pt-4">
          <Button
            variant="ghost"
            className="hover:text-danger hover:decoration-danger"
            onClick={() => setDeleteClientOpen(true)}
          >
            Usuń klienta
          </Button>
        </div>
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

      <Dialog
        open={logBehalfOpen}
        title="Wpisz trening za klienta"
        description="Wynik zapisze się na profilu klienta — np. po sesji na sali. Klient loguje sam w portalu."
        confirmLabel={logBehalfStarting ? "Startuję…" : "Otwórz logger"}
        busy={logBehalfStarting}
        onConfirm={() => void confirmLogBehalf()}
        onCancel={() => setLogBehalfOpen(false)}
      >
        <div className="space-y-3">
          {logBehalfDays.length > 0 ? (
            <Field label="Dzień planu">
              <SearchPicker
                size="sm"
                ariaLabel="Dzień planu"
                searchPlaceholder="Szukaj dnia…"
                emptyHint="Brak dnia o tej nazwie."
                value={logBehalfDayId === "" ? "" : String(logBehalfDayId)}
                onChange={(v) => setLogBehalfDayId(v ? Number(v) : "")}
                items={[
                  { value: "", label: "Bez dnia planu", meta: "trening spoza planu" },
                  ...logBehalfDays.map((d) => ({
                    value: String(d.id),
                    label: d.label,
                    meta: `Tydz. ${d.weekNumber}`,
                  })),
                ]}
              />
            </Field>
          ) : (
            <p className="text-sm text-muted-strong">
              Trening bez dnia planu — dodasz ćwiczenia w loggerze.
            </p>
          )}
          <Field label="Data treningu">
            <input
              type="date"
              className={inputClass}
              value={logBehalfDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setLogBehalfDate(e.target.value)}
            />
          </Field>
        </div>
      </Dialog>


      <PlanFromHistoryDialog
        open={planFromHistoryOpen}
        clientId={clientId}
        clientName={client.name}
        exercises={exercises}
        hasHistory={completedSessions.some((s) => withinLastDays(s.performedOn, 120))}
        onClose={() => setPlanFromHistoryOpen(false)}
      />

      {toastNode}
    </div>
  );
}

export default function ClientDetailsPageRoute() {
  return (
    <Suspense fallback={<ClientDetailSkeleton />}>
      <ClientDetailsPage />
    </Suspense>
  );
}
