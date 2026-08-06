const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5210";

/** Opcjonalny getter tokenu Clerk — ustawiany przez AuthTokenBridge gdy Clerk włączony. */
let authTokenGetter: (() => Promise<string | null>) | null = null;

export function setAuthTokenGetter(getter: (() => Promise<string | null>) | null) {
  authTokenGetter = getter;
}

export const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export type ClientSummary = {
  id: number;
  name: string;
  email: string | null;
  note: string | null;
  activePlans: number;
  /** Data ostatniej ukończonej sesji (YYYY-MM-DD) albo null. */
  lastSessionOn: string | null;
};

export type ClientAssignment = {
  id: number;
  planId: number;
  planName: string;
  startDate: string;
  status: string;
  note: string | null;
};

export type Assignment = {
  id: number;
  planId: number;
  clientId: number;
  startDate: string;
  status: string;
  note: string | null;
  createdAt: string;
  planName: string;
  clientName: string;
};

export type ClientDetails = {
  id: number;
  name: string;
  email: string | null;
  note: string | null;
  goalWeightKg?: number | null;
  assignments: ClientAssignment[];
};

// Cele treningowe klienta — chipy 1-tap w formularzu klienta, zapisywane jako tekst w `Client.note`
// (bez zmiany schematu backendu). Jedyne źródło prawdy dla opcji, analogicznie do EXERCISE_TYPE_LABELS.
export const CLIENT_GOALS = ["Redukcja", "Hipertrofia", "Kondycja", "Siła", "Ogólna sprawność"] as const;

/** Wywiad wstępny klienta (1:0..1). Wszystkie pola opcjonalne. */
export type ClientIntake = {
  clientId: number;
  goalType: string | null;
  goalDetails: string | null;
  injuries: string | null;
  pains: string | null;
  chronicConditions: string | null;
  medications: string | null;
  workType: string | null;
  stressLevel: number | null;
  sleepHours: string | null;
  freeTimeActivity: string | null;
  experienceLevel: string | null;
  pastActivities: string | null;
  trainingHistoryNotes: string | null;
  sessionsPerWeek: number | null;
  availability: string | null;
  equipment: string | null;
  updatedAt: string | null;
};

export type ClientIntakeInput = Omit<ClientIntake, "clientId" | "updatedAt">;

export const WORK_TYPES = ["siedząca", "stojąca", "fizyczna", "mieszana"] as const;
export const EXPERIENCE_LEVELS = ["brak", "początkujący", "średniozaawansowany", "zaawansowany"] as const;
export const SLEEP_HOURS_OPTIONS = ["poniżej 6h", "6–7h", "7–8h", "powyżej 8h"] as const;

/** Istotny wpis (cel / zdrowie / doświadczenie) — baner portalu znika. */
export function hasEssentialIntake(i: ClientIntake): boolean {
  return Boolean(
    i.goalType ||
      i.goalDetails ||
      i.injuries ||
      i.pains ||
      i.chronicConditions ||
      i.medications ||
      i.experienceLevel ||
      i.pastActivities ||
      i.trainingHistoryNotes,
  );
}

/** Całkowicie pusty wywiad (brak jakiegokolwiek pola). */
export function isIntakeBlank(i: ClientIntake): boolean {
  return (
    !hasEssentialIntake(i) &&
    !i.workType &&
    i.stressLevel == null &&
    !i.sleepHours &&
    !i.freeTimeActivity &&
    i.sessionsPerWeek == null &&
    !i.availability &&
    !i.equipment
  );
}

export function emptyIntakeInput(): ClientIntakeInput {
  return {
    goalType: null,
    goalDetails: null,
    injuries: null,
    pains: null,
    chronicConditions: null,
    medications: null,
    workType: null,
    stressLevel: null,
    sleepHours: null,
    freeTimeActivity: null,
    experienceLevel: null,
    pastActivities: null,
    trainingHistoryNotes: null,
    sessionsPerWeek: null,
    availability: null,
    equipment: null,
  };
}

export function intakeToInput(i: ClientIntake): ClientIntakeInput {
  return {
    goalType: i.goalType,
    goalDetails: i.goalDetails,
    injuries: i.injuries,
    pains: i.pains,
    chronicConditions: i.chronicConditions,
    medications: i.medications,
    workType: i.workType,
    stressLevel: i.stressLevel,
    sleepHours: i.sleepHours,
    freeTimeActivity: i.freeTimeActivity,
    experienceLevel: i.experienceLevel,
    pastActivities: i.pastActivities,
    trainingHistoryNotes: i.trainingHistoryNotes,
    sessionsPerWeek: i.sessionsPerWeek,
    availability: i.availability,
    equipment: i.equipment,
  };
}

export type ExerciseType = "reps" | "time" | "distance";
export type PercentBase = "1rm" | "top";
export type ExerciseMediaKind = "demo" | "tip" | "mistakes";
export type ExerciseCategory =
  | "shoulders"
  | "chest"
  | "back"
  | "arms"
  | "core"
  | "legs"
  | "fullbody";
export type ExercisePattern =
  | "vertical-push"
  | "horizontal-push"
  | "vertical-pull"
  | "horizontal-pull"
  | "isolation"
  | "scapular"
  | "rotation"
  | "anti-rotation"
  | "anti-extension"
  | "carry"
  | "squat"
  | "hinge";

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  reps: "powtórzenia",
  time: "czas",
  distance: "dystans",
};

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  shoulders: "Barki",
  chest: "Klatka",
  back: "Plecy",
  arms: "Ramiona",
  core: "Core",
  legs: "Nogi",
  fullbody: "Całe ciało",
};

export const PATTERN_LABELS: Record<ExercisePattern, string> = {
  "vertical-push": "Wyciskanie pionowe",
  "horizontal-push": "Wyciskanie poziome",
  "vertical-pull": "Ściąganie pionowe",
  "horizontal-pull": "Wiosłowanie",
  isolation: "Izolacja",
  scapular: "Łopatka",
  rotation: "Rotacja",
  "anti-rotation": "Anti-rotacja",
  "anti-extension": "Anti-extensja",
  carry: "Carry",
  squat: "Przysiad",
  hinge: "Zawias biodrowy",
};

export const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: "Sztanga",
  dumbbell: "Hantle",
  cable: "Wyciąg",
  machine: "Maszyna",
  bodyweight: "Masa ciała",
  band: "Guma",
  kettlebell: "Kettlebell",
  landmine: "Landmine",
  smith: "Smith",
  trx: "TRX",
  rings: "Kółka",
  ghd: "GHD",
  sled: "Sanie",
  "foam-roller": "Wałek",
  other: "Inne",
};

export const MEDIA_KIND_LABELS: Record<ExerciseMediaKind, string> = {
  demo: "Demonstracja",
  tip: "Wskazówki",
  mistakes: "Błędy",
};

export const CATEGORY_ORDER: ExerciseCategory[] = [
  "shoulders",
  "chest",
  "back",
  "arms",
  "core",
  "legs",
  "fullbody",
];

export const SET_ROLE_LABELS: Record<string, string> = {
  warmup: "rozgrzewka",
  ramp: "rampa",
  top: "top",
  backoff: "back-off",
  work: "robocza",
};

export const PERCENT_BASE_LABELS: Record<PercentBase, string> = {
  "1rm": "% 1RM",
  top: "% od topu",
};

export const RIR_HELP = "Liczba powtórzeń w zapasie do upadku mięśniowego";

/** RIR (Reps In Reserve) i RPE to dwie skale tej samej intensywności: RIR = 10 − RPE. */
export function rirFromRpe(rpe: number): number {
  return 10 - rpe;
}

export function rpeFromRir(rir: number): number {
  return 10 - rir;
}

export type ExerciseMedia = {
  youtubeId: string;
  title: string;
  seconds: number | null;
  kind: ExerciseMediaKind | string;
};

export type Exercise = {
  id: number;
  name: string;
  description: string | null;
  type: ExerciseType;
  defaultSets: number;
  defaultReps: number;
  defaultRepDurationSeconds: number | null;
  defaultDistanceMeters: number | null;
  defaultRestBetweenSetsSeconds: number;
  defaultLoadKg: number | null;
  category: ExerciseCategory | string | null;
  pattern: ExercisePattern | string | null;
  isUnilateral: boolean;
  equipment: string[];
  primaryMuscles: string[];
  instructions: string | null;
  media: ExerciseMedia[];
};

export type PlanSet = {
  id: number;
  order: number;
  reps: number | null;
  repsMax: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  loadKg: number | null;
  loadPercent: number | null;
  percentOf: PercentBase | null;
  targetRpe: number | null;
  targetRir: number | null;
  tempo: string | null;
  role: string | null;
  note: string | null;
  computedLoadKg: number | null;
};

export type PlanItem = {
  id: number;
  exerciseId: number;
  order: number;
  supersetGroup: number | null;
  isWarmup: boolean;
  exerciseName: string;
  exerciseType: ExerciseType;
  category?: string | null;
  demoYoutubeId?: string | null;
  /** Efektywna miara pozycji (`MeasureType ?? Exercise.Type`). */
  measureType: ExerciseType;
  sets: number;
  reps: number;
  repsMax: number | null;
  repDurationSeconds: number | null;
  repDurationSecondsMax: number | null;
  distanceMeters: number | null;
  tempo: string | null;
  targetRpe: number | null;
  targetRir: number | null;
  setScheme: string | null;
  restBetweenSetsSeconds: number;
  restAfterExerciseSeconds: number;
  loadKg: number | null;
  loadPercent: number | null;
  computedLoadKg: number | null;
  notes: string | null;
  overrides: {
    measureType: ExerciseType | null;
    sets: number | null;
    reps: number | null;
    repsMax: number | null;
    repDurationSeconds: number | null;
    repDurationSecondsMax: number | null;
    distanceMeters: number | null;
    restBetweenSetsSeconds: number | null;
    loadKg: number | null;
    loadPercent: number | null;
  };
  prescribedSets: PlanSet[];
};

export type PlanDay = {
  id: number;
  weekNumber: number;
  order: number;
  label: string;
  notes: string | null;
  items: PlanItem[];
};

export type PlanSummary = {
  id: number;
  name: string;
  description: string | null;
  isTemplate: boolean;
  createdAt?: string;
  weeksCount: number;
  daysCount: number;
  exerciseCount: number;
  assignedCount: number;
};

export type Plan = PlanSummary & {
  days: PlanDay[];
};

export type PlanSetInput = {
  order: number;
  reps: number | null;
  repsMax: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  loadKg: number | null;
  loadPercent: number | null;
  percentOf: PercentBase | null;
  targetRpe: number | null;
  targetRir: number | null;
  tempo: string | null;
  role: string | null;
  note: string | null;
};

export type PlanImportItem = {
  exerciseName: string;
  matchedExerciseId: number | null;
  order: number;
  supersetGroup: number | null;
  isWarmup: boolean;
  measureType: ExerciseType | null;
  sets: number | null;
  reps: number | null;
  repsMax: number | null;
  repDurationSeconds: number | null;
  distanceMeters: number | null;
  tempo: string | null;
  targetRpe: number | null;
  targetRir: number | null;
  setScheme: string | null;
  restBetweenSetsSeconds: number | null;
  restAfterExerciseSeconds: number | null;
  loadKg: number | null;
  loadPercent: number | null;
  notes: string | null;
  prescribedSets: PlanSetInput[] | null;
};

export type PlanImportDay = {
  weekNumber: number;
  order: number;
  label: string;
  notes: string | null;
  items: PlanImportItem[];
};

export type PlanImportDraft = {
  name: string | null;
  description: string | null;
  days: PlanImportDay[];
  /** Ostrzeżenia o niekompletności (np. brakujący tydzień po chunkingu AI). */
  warnings?: string[] | null;
  /** Numery tygodni, których nie udało się odczytać — do ponowienia. */
  failedWeeks?: number[] | null;
};

export type PlanItemInput = {
  exerciseId: number;
  order: number;
  supersetGroup: number | null;
  isWarmup: boolean;
  /** null = dziedziczy z Exercise.Type przy zapisie. */
  measureType: ExerciseType | null;
  sets: number | null;
  reps: number | null;
  repsMax: number | null;
  repDurationSeconds: number | null;
  repDurationSecondsMax: number | null;
  distanceMeters: number | null;
  tempo: string | null;
  targetRpe: number | null;
  targetRir: number | null;
  setScheme: string | null;
  restBetweenSetsSeconds: number | null;
  restAfterExerciseSeconds: number | null;
  loadKg: number | null;
  loadPercent: number | null;
  notes: string | null;
  prescribedSets: PlanSetInput[];
};

export type ClientMax = {
  id: number;
  clientId: number;
  exerciseId: number;
  exerciseName: string;
  maxKg: number;
  measuredOn: string;
  note: string | null;
};

export type ClientMeasurement = {
  id: number;
  clientId: number;
  measuredOn: string;
  weightKg: number | null;
  waistCm: number | null;
  chestCm: number | null;
  hipsCm: number | null;
  note: string | null;
  createdAt: string;
};

export type SessionCheckinInput = {
  feelingScore: number | null;
  sleepScore: number | null;
  energyScore: number | null;
};

export type PrevLoggedSet = {
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  rir: number | null;
  rpe: number | null;
  isWarmup: boolean;
};

export type SetSide = "left" | "right";

export type LoggedSet = {
  id: number;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  rir: number | null;
  rpe: number | null;
  isWarmup: boolean;
  completed: boolean;
  note: string | null;
  side: SetSide | null;
  estimated1Rm: number | null;
  isPr: boolean;
  /** Cel z planu (additive — nie w encji). */
  targetWeightKg?: number | null;
  targetReps?: number | null;
  targetDurationSeconds?: number | null;
};

export type LoggedExercise = {
  id: number;
  exerciseId: number;
  substitutedFromExerciseId?: number | null;
  substitutedFromName?: string | null;
  exerciseName: string;
  exerciseType: ExerciseType;
  category: string | null;
  /** Sprzęt z biblioteki — `"bodyweight"` oznacza ćwiczenie z masą ciała. */
  equipment?: string[];
  isUnilateral?: boolean;
  media: ExerciseMedia[];
  order: number;
  note: string | null;
  restSeconds: number | null;
  /** Cel RIR / tempo / notatka trenera z planu (additive). */
  targetRir?: number | null;
  tempo?: string | null;
  planNote?: string | null;
  /** Data poprzedniej sesji tego ćwiczenia (nagłówek kolumny Poprz.). */
  prevPerformedOn?: string | null;
  prevSets: PrevLoggedSet[];
  sets: LoggedSet[];
};

/** Ćwiczenie w portalu z datą ostatniego wykonania przez klienta. */
export type PortalExercise = Exercise & {
  lastPerformedOn?: string | null;
};

export type SessionPr = {
  exerciseId: number;
  exerciseName: string;
  weightKg: number | null;
  reps: number | null;
  estimated1Rm: number;
};

export type SessionSummary = {
  id: number;
  clientId: number;
  assignmentId: number | null;
  planDayId: number | null;
  planId: number | null;
  planName: string | null;
  dayLabel: string | null;
  performedOn: string;
  durationSeconds: number | null;
  note: string | null;
  feelingScore: number | null;
  sleepScore: number | null;
  energyScore: number | null;
  status: string;
  createdAt: string;
  trainerComment?: string | null;
  trainerCommentAt?: string | null;
  clientReply?: string | null;
  clientReplyAt?: string | null;
  hasUnreadClientReply?: boolean;
  totalSets: number;
  totalVolumeKg: number;
  exerciseCount: number;
};

/** Lista sesji w portalu — z PR-ami ustanowionymi w danym treningu. */
export type PortalSessionSummary = SessionSummary & {
  prs: SessionPr[];
};

export type SessionDetail = SessionSummary & {
  clientName?: string | null;
  trainerName?: string | null;
  prs: {
    exerciseId: number;
    exerciseName: string;
    setNumber: number;
    weightKg: number | null;
    reps: number | null;
    estimated1Rm: number | null;
  }[];
  exercises: LoggedExercise[];
};

export type ClientProgress = {
  assignmentId: number | null;
  planId?: number;
  planName?: string;
  completed: number;
  total: number;
  percent: number;
};

export type ClientRecord = {
  exerciseId: number;
  exerciseName: string;
  estimated1Rm: number;
  weightKg: number | null;
  reps: number | null;
  performedOn: string;
  sessionId?: number;
};

export type ExerciseStats = {
  clientId: number;
  exerciseId: number;
  estimated1Rm: number | null;
  maxWeightKg: number | null;
  maxWeightDate: string | null;
  maxVolumeKg: number | null;
  maxVolumeDate: string | null;
  repMaxes: { reps: number; weightKg: number }[];
  trend: { date: string; estimated1Rm: number }[];
};

/** Największy % przyrost e1RM w oknie (Styrka Most Improved). */
export type MostImproved = {
  exerciseId: number;
  exerciseName: string;
  percentGain: number;
  startE1Rm: number;
  endE1Rm: number;
  deltaKg: number;
  days: number;
  sessionCount: number;
};

export type PortalWeekDay = {
  id: number;
  weekNumber: number;
  order: number;
  label: string;
  completed: boolean;
  isToday: boolean;
};

export type PortalHome = {
  client: { id: number; name: string; goalWeightKg?: number | null };
  today: {
    assignmentId: number;
    planId: number;
    planName: string;
    day: PlanDay;
    completed: number;
    total: number;
    percent: number;
  } | null;
  week: PortalWeekDay[] | null;
  inProgressSession: { id: number; planDayId: number | null; performedOn: string } | null;
};

export type AttentionItem = {
  clientId: number;
  clientName: string;
  reason:
    | "no_plan"
    | "never_trained"
    | "silent"
    | "low_wellness"
    | "no_checkin"
    | "low_compliance"
    | "stagnation"
    | string;
  message: string;
  daysSilent: number | null;
  compliancePct?: number | null;
  portalToken: string | null;
  action: "assign_plan" | "copy_portal_link" | string;
};

export type MuscleVolumeGroup = {
  muscle: string;
  sets: number;
  volumeKg: number;
};

export type MuscleVolumeResponse = {
  weeks?: number;
  from?: string;
  to?: string;
  groups: MuscleVolumeGroup[];
};

export type WeekTrend = {
  weekStart: string;
  sessions: number;
  volumeKg: number;
  workingSets: number;
};

export type ClientTrendsResponse = {
  weeks: WeekTrend[];
};

export type StagnationItem = {
  exerciseId: number;
  exerciseName: string;
  reason: "no_e1rm_progress" | "volume_drop" | string;
  sessionsWithoutProgress: number | null;
  volumeDropWeeks: number | null;
  message: string;
};

export type StagnationResponse = {
  items: StagnationItem[];
};

export type ClientActivityItem = {
  clientId: number;
  clientName: string;
  sessions7d: number;
  lastSessionOn: string | null;
  activePlans: number;
  /** Liczba dni w pierwszym tygodniu aktywnego planu; null gdy brak planu. */
  weeklyTarget: number | null;
  portalToken: string | null;
};

export type DashboardData = {
  clients: number;
  plans: number;
  exercises: number;
  recentSessions: (SessionSummary & { clientName: string })[];
  recentPrs: (ClientRecord & { clientId: number; clientName: string })[];
  attention: AttentionItem[];
  clientActivity: ClientActivityItem[];
  sessionsLast7Days: number;
  sessionsPrev7Days: number;
  prsLast7Days: number;
};

export type ProgressReport = {
  clientId: number;
  lastSessionOn: string | null;
  sessionsLast7Days: number;
  sessionsLast30Days: number;
  newPrsLast30Days: number;
  facts: { kind: string; text: string; exerciseId?: number; deltaKg?: number }[];
};

export type ClientCheckIn = {
  id: number;
  date: string;
  moodScore: number | null;
  sleepScore: number | null;
  note: string | null;
  createdAt: string;
};

export type TrainerMe = {
  id: number;
  email: string;
  name: string;
  clerkUserId: string;
  createdAt: string;
};

export type NavCounts = {
  clients: number;
  plans: number;
  exercises: number;
};

export type PlanDayInput = {
  weekNumber: number;
  order: number;
  label: string;
  notes: string | null;
  items: PlanItemInput[];
};

export type PlanInput = {
  name: string;
  description: string | null;
  isTemplate: boolean;
  days: PlanDayInput[];
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (authTokenGetter && !path.startsWith("/api/portal/")) {
    const token = await authTokenGetter();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers,
  });
  if (!res.ok) {
    let message = `Błąd ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // brak body
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  // Puste body (np. Results.Ok(null) w Minimal API) — nie wywołuj res.json().
  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

async function requestText(path: string, init?: RequestInit): Promise<string> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (authTokenGetter && !path.startsWith("/api/portal/")) {
    const token = await authTokenGetter();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API}${path}`, { ...init, headers });
  if (!res.ok) {
    let message = `Błąd ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // brak body
    }
    throw new Error(message);
  }
  return res.text();
}

export type LoggedSetInput = {
  id?: number | null;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  rir: number | null;
  rpe: number | null;
  isWarmup: boolean;
  completed: boolean;
  note?: string | null;
  side?: SetSide | null;
};

export type LoggedExerciseInput = {
  id?: number | null;
  exerciseId: number;
  substitutedFromExerciseId?: number | null;
  order: number;
  note: string | null;
  sets: LoggedSetInput[];
};

export type WorkoutSessionInput = {
  clientId: number;
  performedOn: string;
  assignmentId?: number | null;
  planDayId?: number | null;
  planId?: number | null;
  durationSeconds?: number | null;
  note?: string | null;
  status?: string;
  exercises: LoggedExerciseInput[];
};

export const api = {
  counts: () => request<NavCounts>("/api/counts"),
  dashboard: () => request<DashboardData>("/api/dashboard"),
  me: () => request<TrainerMe>("/api/me"),
  export: () => request<unknown>("/api/export"),
  exportCsv: () => requestText("/api/export/csv"),
  deleteAccount: () => request<void>("/api/account", { method: "DELETE" }),
  /** Pobiera PNG karty treningu (same-origin route Next) — bez ujawniania tokenu. */
  shareSessionCardBlob: async (shareImageUrl: string): Promise<Blob> => {
    const res = await fetch(shareImageUrl);
    if (!res.ok) throw new Error("Nie udało się przygotować karty.");
    return res.blob();
  },
  clients: {
    list: () => request<ClientSummary[]>("/api/clients"),
    get: (id: number) => request<ClientDetails>(`/api/clients/${id}`),
    create: (input: {
      name: string;
      email: string | null;
      note: string | null;
      goalWeightKg?: number | null;
    }) => request("/api/clients", { method: "POST", body: JSON.stringify(input) }),
    update: (
      id: number,
      input: {
        name: string;
        email: string | null;
        note: string | null;
        goalWeightKg?: number | null;
      },
    ) => request(`/api/clients/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    remove: (id: number) => request(`/api/clients/${id}`, { method: "DELETE" }),
    maxes: (clientId: number) => request<ClientMax[]>(`/api/clients/${clientId}/maxes`),
    addMax: (
      clientId: number,
      input: { exerciseId: number; maxKg: number; measuredOn: string; note?: string | null },
    ) =>
      request<{ id: number }>(`/api/clients/${clientId}/maxes`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    removeMax: (id: number) => request(`/api/maxes/${id}`, { method: "DELETE" }),
    measurements: (clientId: number) =>
      request<ClientMeasurement[]>(`/api/clients/${clientId}/measurements`),
    addMeasurement: (
      clientId: number,
      input: {
        measuredOn: string;
        weightKg?: number | null;
        waistCm?: number | null;
        chestCm?: number | null;
        hipsCm?: number | null;
        note?: string | null;
      },
    ) =>
      request<{ id: number }>(`/api/clients/${clientId}/measurements`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    removeMeasurement: (id: number) => request(`/api/measurements/${id}`, { method: "DELETE" }),
    sendPortalLink: (clientId: number, message?: string) =>
      request(`/api/clients/${clientId}/send-portal-link`, {
        method: "POST",
        body: JSON.stringify({ message }),
      }),
    sendReminder: (clientId: number, message?: string) =>
      request(`/api/clients/${clientId}/send-reminder`, {
        method: "POST",
        body: JSON.stringify({ message }),
      }),
    checkIns: (clientId: number) => request<ClientCheckIn[]>(`/api/clients/${clientId}/check-ins`),
    sessions: (clientId: number) => request<SessionSummary[]>(`/api/clients/${clientId}/sessions`),
    records: (clientId: number) => request<ClientRecord[]>(`/api/clients/${clientId}/records`),
    progress: (clientId: number) => request<ClientProgress>(`/api/clients/${clientId}/progress`),
    exerciseStats: (clientId: number, exerciseId: number) =>
      request<ExerciseStats>(`/api/clients/${clientId}/exercises/${exerciseId}/stats`),
    mostImproved: (clientId: number, days = 90) =>
      request<MostImproved | null>(`/api/clients/${clientId}/most-improved?days=${days}`),
    accessToken: (clientId: number) =>
      request<{ token: string; createdAt: string; expiresAt: string | null }>(
        `/api/clients/${clientId}/access-token`,
      ),
    rotateAccessToken: (clientId: number) =>
      request<{ token: string; createdAt: string; expiresAt: string | null }>(
        `/api/clients/${clientId}/access-token/rotate`,
        { method: "POST" },
      ),
    getIntake: (clientId: number) => request<ClientIntake>(`/api/clients/${clientId}/intake`),
    saveIntake: (clientId: number, input: ClientIntakeInput) =>
      request<ClientIntake>(`/api/clients/${clientId}/intake`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    muscleVolume: (clientId: number, weeks = 4) =>
      request<MuscleVolumeResponse>(`/api/clients/${clientId}/muscle-volume?weeks=${weeks}`),
    trends: (clientId: number, weeks = 12) =>
      request<ClientTrendsResponse>(`/api/clients/${clientId}/trends?weeks=${weeks}`),
    stagnation: (clientId: number) =>
      request<StagnationResponse>(`/api/clients/${clientId}/stagnation`),
  },
  exercises: {
    list: () => request<Exercise[]>("/api/exercises"),
    get: (id: number) => request<Exercise>(`/api/exercises/${id}`),
    create: (input: Omit<Exercise, "id">) =>
      request<Exercise>("/api/exercises", { method: "POST", body: JSON.stringify(input) }),
    update: (id: number, input: Omit<Exercise, "id">) =>
      request<Exercise>(`/api/exercises/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    remove: (id: number) => request(`/api/exercises/${id}`, { method: "DELETE" }),
  },
  ai: {
    importPlan: (text: string, weeks?: number[]) =>
      request<PlanImportDraft>("/api/ai/plan-import", {
        method: "POST",
        body: JSON.stringify({ text, weeks: weeks?.length ? weeks : undefined }),
      }),
  },
  plans: {
    list: () => request<PlanSummary[]>("/api/plans"),
    get: (id: number, clientId?: number) =>
      request<Plan>(`/api/plans/${id}${clientId != null ? `?clientId=${clientId}` : ""}`),
    create: (input: PlanInput) =>
      request<{ id: number }>("/api/plans", { method: "POST", body: JSON.stringify(input) }),
    update: (id: number, input: PlanInput) =>
      request(`/api/plans/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    duplicate: (id: number, input: { name: string | null; isTemplate: boolean | null }) =>
      request<{ id: number }>(`/api/plans/${id}/duplicate`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    remove: (id: number) => request(`/api/plans/${id}`, { method: "DELETE" }),
    muscleVolume: (id: number) =>
      request<MuscleVolumeResponse>(`/api/plans/${id}/muscle-volume`),
  },
  assignments: {
    list: () => request<Assignment[]>("/api/assignments"),
    create: (input: { planId: number; clientId: number; startDate: string; note: string | null }) =>
      request("/api/assignments", { method: "POST", body: JSON.stringify(input) }),
    setStatus: (id: number, status: string) =>
      request(`/api/assignments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    remove: (id: number) => request(`/api/assignments/${id}`, { method: "DELETE" }),
  },
  sessions: {
    get: (id: number) => request<SessionDetail>(`/api/sessions/${id}`),
    start: (input: {
      clientId: number;
      assignmentId?: number | null;
      planDayId?: number | null;
      planId?: number | null;
      performedOn?: string | null;
    }) =>
      request<SessionDetail>("/api/sessions/start", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    create: (input: WorkoutSessionInput) =>
      request<SessionDetail>("/api/sessions", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (id: number, input: WorkoutSessionInput, opts?: { keepalive?: boolean }) =>
      request<SessionDetail>(`/api/sessions/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
        keepalive: opts?.keepalive,
      }),
    complete: (id: number) =>
      request<SessionDetail>(`/api/sessions/${id}/complete`, { method: "PATCH" }),
    checkin: (id: number, input: SessionCheckinInput) =>
      request<SessionDetail>(`/api/sessions/${id}/checkin`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    comment: (id: number, comment: string) =>
      request<SessionDetail>(`/api/sessions/${id}/comment`, {
        method: "POST",
        body: JSON.stringify({ comment }),
      }),
    markReplyRead: (id: number) =>
      request<SessionDetail>(`/api/sessions/${id}/comment/read`, { method: "POST" }),
    remove: (id: number) => request(`/api/sessions/${id}`, { method: "DELETE" }),
  },
  portal: {
    recover: (email: string) =>
      request<{ message: string }>("/api/portal/recover", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    home: (token: string) => request<PortalHome>(`/api/portal/${token}`),
    sessions: (token: string) => request<PortalSessionSummary[]>(`/api/portal/${token}/sessions`),
    records: (token: string) => request<ClientRecord[]>(`/api/portal/${token}/records`),
    mostImproved: (token: string, days = 90) =>
      request<MostImproved | null>(`/api/portal/${token}/most-improved?days=${days}`),
    stagnation: (token: string) =>
      request<StagnationResponse | null>(`/api/portal/${token}/stagnation`),
    exerciseStats: (token: string, exerciseId: number) =>
      request<ExerciseStats>(`/api/portal/${token}/exercises/${exerciseId}/stats`),
    progressReport: (token: string) =>
      request<ProgressReport>(`/api/portal/${token}/progress-report`),
    checkIns: (token: string) => request<ClientCheckIn[]>(`/api/portal/${token}/check-ins`),
    createCheckIn: (
      token: string,
      input: { moodScore: number | null; sleepScore: number | null; note?: string | null; date?: string },
    ) =>
      request<ClientCheckIn>(`/api/portal/${token}/check-ins`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    getSession: (token: string, id: number) =>
      request<SessionDetail>(`/api/portal/${token}/sessions/${id}`),
    startSession: (
      token: string,
      input: {
        clientId: number;
        assignmentId?: number | null;
        planDayId?: number | null;
        planId?: number | null;
        performedOn?: string | null;
        repeatSessionId?: number | null;
      },
    ) =>
      request<SessionDetail>(`/api/portal/${token}/sessions/start`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    updateSession: (
      token: string,
      id: number,
      input: WorkoutSessionInput,
      opts?: { keepalive?: boolean },
    ) =>
      request<SessionDetail>(`/api/portal/${token}/sessions/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
        keepalive: opts?.keepalive,
      }),
    completeSession: (token: string, id: number) =>
      request<SessionDetail>(`/api/portal/${token}/sessions/${id}/complete`, {
        method: "PATCH",
      }),
    replySession: (token: string, id: number, comment: string) =>
      request<SessionDetail>(`/api/portal/${token}/sessions/${id}/comment`, {
        method: "POST",
        body: JSON.stringify({ comment }),
      }),
    subscribePush: (token: string, input: { endpoint: string; p256dh: string; auth: string }) =>
      request<{ subscribed: boolean }>(`/api/portal/${token}/push-subscription`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    unsubscribePush: (token: string, input: { endpoint: string; p256dh: string; auth: string }) =>
      request(`/api/portal/${token}/push-subscription/unsubscribe`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    checkinSession: (token: string, id: number, input: SessionCheckinInput) =>
      request<SessionDetail>(`/api/portal/${token}/sessions/${id}/checkin`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    exercises: (token: string) => request<PortalExercise[]>(`/api/portal/${token}/exercises`),
    measurements: (token: string) => request<ClientMeasurement[]>(`/api/portal/${token}/measurements`),
    addMeasurement: (
      token: string,
      input: {
        measuredOn: string;
        weightKg?: number | null;
        waistCm?: number | null;
        chestCm?: number | null;
        hipsCm?: number | null;
        note?: string | null;
      },
    ) =>
      request<{ id: number }>(`/api/portal/${token}/measurements`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    getIntake: (token: string) => request<ClientIntake>(`/api/portal/${token}/intake`),
    saveIntake: (token: string, input: ClientIntakeInput) =>
      request<ClientIntake>(`/api/portal/${token}/intake`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    muscleVolume: (token: string, weeks = 4) =>
      request<MuscleVolumeResponse>(`/api/portal/${token}/muscle-volume?weeks=${weeks}`),
    trends: (token: string, weeks = 12) =>
      request<ClientTrendsResponse>(`/api/portal/${token}/trends?weeks=${weeks}`),
  },
};
