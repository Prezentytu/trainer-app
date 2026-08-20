import { isClerkPublishableKey } from "@/lib/clerkKey";

function resolveApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  // Produkcja bez URL = twardy błąd (nie strzał w localhost:5210).
  // CI ustawia SKIP_ENV_VALIDATION=true przy `npm run build` bez sekretów Vercel.
  if (process.env.NODE_ENV === "production" && process.env.SKIP_ENV_VALIDATION !== "true") {
    throw new Error(
      "Brak NEXT_PUBLIC_API_URL. Ustaw zmienną w Vercel (Production) i przebuduj front.",
    );
  }
  return "http://localhost:5210";
}

const API = resolveApiBase();

/** Błąd API gotowy do pokazania użytkownikowi (`message` = userMessage). */
export class ApiError extends Error {
  readonly status: number | null;
  readonly userMessage: string;
  readonly technical: string | null;
  readonly code: string | null;

  constructor(
    userMessage: string,
    opts?: { status?: number | null; technical?: string | null; code?: string | null },
  ) {
    super(userMessage);
    this.name = "ApiError";
    this.userMessage = userMessage;
    this.status = opts?.status ?? null;
    this.technical = opts?.technical ?? null;
    this.code = opts?.code ?? null;
  }
}

/** Stały komunikat 401 — ErrorBanner rozpoznaje go i dokłada CTA „Zaloguj się ponownie". */
export const SESSION_EXPIRED_MESSAGE = "Sesja wygasła. Zaloguj się ponownie.";

function userMessageForStatus(status: number, bodyMessage?: string, code?: string | null): string {
  if (code === "pin_required") return bodyMessage || "Podaj PIN.";
  if (status === 401) return SESSION_EXPIRED_MESSAGE;
  if (status === 429) return "Za dużo prób. Odczekaj chwilę i spróbuj ponownie.";
  if (bodyMessage && status >= 400) {
    // Komunikaty z backendu (walidacja, 502/503 AI) — po polsku, przechodzą bez zmian.
    return bodyMessage;
  }
  switch (status) {
    case 403:
      return "Brak uprawnień do tej operacji.";
    case 404:
      return "Nie znaleziono zasobu.";
    default:
      if (status >= 500) return "Serwer chwilowo niedostępny. Spróbuj ponownie za chwilę.";
      return bodyMessage || `Błąd ${status}`;
  }
}

function isRetriableStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504;
}

export function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.name === "AbortError")
  );
}

function isNetworkError(err: unknown): boolean {
  if (isAbortError(err)) return false;
  if (err instanceof TypeError) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /failed to fetch|networkerror|load failed|network request failed/i.test(msg);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type AuthTokenOptions = { skipCache?: boolean };
type AuthTokenGetter = (opts?: AuthTokenOptions) => Promise<string | null>;

/** Opcjonalny getter tokenu Clerk — ustawiany przez AuthTokenBridge gdy Clerk włączony. */
let authTokenGetter: AuthTokenGetter | null = null;

export function setAuthTokenGetter(getter: AuthTokenGetter | null) {
  authTokenGetter = getter;
}

export { isClerkPublishableKey };
export const clerkEnabled = isClerkPublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/** Max czas czekania na Clerk przed pierwszym requestem (ms). */
const AUTH_READY_TIMEOUT_MS = 8_000;

let resolveAuthReady: (() => void) | null = null;
const authReady: Promise<void> = clerkEnabled
  ? new Promise<void>((resolve) => {
      resolveAuthReady = resolve;
    })
  : Promise.resolve();

/** Clerk załadowany i getter tokenu podpięty — dopiero teraz requesty trenera mają sens. */
export function markAuthReady(): void {
  resolveAuthReady?.();
  resolveAuthReady = null;
}

export type LiveSession = {
  sessionId: number;
  startedAt: string;
  doneSets: number;
  totalSets: number;
};

export type NeedsReview = {
  sessionId: number;
  belowTargetCount: number;
};

export type ClientSummary = {
  id: number;
  name: string;
  email: string | null;
  note: string | null;
  activePlans: number;
  /** Data ostatniej ukończonej sesji (YYYY-MM-DD) albo null. */
  lastSessionOn: string | null;
  liveSession?: LiveSession | null;
  needsReview?: NeedsReview | null;
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
  hasPortalPin?: boolean;
  liveSession?: LiveSession | null;
  needsReview?: NeedsReview | null;
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

/** Prywatna notatka trenera o kliencie (nigdy w portalu). */
export type TrainerNote = {
  id: number;
  clientId: number;
  body: string;
  pinned: boolean;
  pinnedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type TrainerNoteInput = {
  body: string;
  pinned?: boolean;
};

/** Notatka klienta z treningu (seria lub ćwiczenie). */
export type ClientNoteItem = {
  exerciseId: number;
  exerciseName: string;
  setNumber: number | null;
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
  note: string;
};

/** Grupa notatek klienta z jednej sesji. */
export type ClientNoteGroup = {
  sessionId: number;
  performedOn: string;
  planName: string | null;
  dayLabel: string | null;
  sessionNote: string | null;
  items: ClientNoteItem[];
};

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
  reps: "Powtórzenia",
  time: "Czas",
  distance: "Dystans",
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
  top: "szczytowa",
  backoff: "zejście",
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
  /** Przerwa po tej serii. null = dziedziczy `PlanItem.restBetweenSetsSeconds`. */
  restSeconds: number | null;
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
  dayOfWeek?: number | null;
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
  /** Przerwa po tej serii. null = dziedziczy `PlanItem.restBetweenSetsSeconds`. */
  restSeconds: number | null;
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

export type HistoryImportImage = { mimeType: string; base64: string };

export type HistoryImportSet = {
  reps: number;
  weightKg: number | null;
  isBodyweight: boolean;
};

export type HistoryImportExercise = {
  exerciseName: string;
  matchedExerciseId: number | null;
  order: number;
  sets: HistoryImportSet[];
};

export type HistoryImportSession = {
  performedOn: string | null;
  label: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  durationSeconds?: number | null;
  summarySets?: number | null;
  summaryReps?: number | null;
  summaryVolumeKg?: number | null;
  exercises: HistoryImportExercise[];
};

export type HistoryImportDraft = {
  sessions: HistoryImportSession[];
  warnings?: string[] | null;
};

export type HistoryImportPending = {
  id: number;
  draft: HistoryImportDraft;
  createdAt: string;
};

export type HistoryImportCluster = {
  key: string;
  label: string;
  exerciseNames: string[];
  lastIsTest: boolean;
  latestFullDate: string | null;
  sessionCount: number;
};

export type HistoryImportSuggestedMax = {
  exerciseId: number;
  exerciseName: string;
  maxKg: number;
  measuredOn: string;
};

export type HistoryImportAnalyzeResult = {
  clusters: HistoryImportCluster[];
  suggestedMaxes: HistoryImportSuggestedMax[];
  hasTestWeek: boolean;
  planDraft: PlanImportDraft;
};

export type PlanItemInput = {
  id?: number;
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
  /** Poprzedni best e1RM przed tym PR-em (null = pierwszy rekord). */
  previousBest1Rm?: number | null;
  /** Cel z planu (additive — nie w encji). */
  targetWeightKg?: number | null;
  targetReps?: number | null;
  targetDurationSeconds?: number | null;
  /** Przerwa po tej serii z planu. null = fallback do przerwy ćwiczenia. */
  targetRestSeconds?: number | null;
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
  /** Ta sama wartość = klamra superserii; null = straight. */
  supersetGroup: number | null;
  /** `"2a"` / `"2b"`; null gdy solo. */
  supersetLabel: string | null;
  /** Cel RIR / tempo / notatka trenera z planu (additive). */
  targetRir?: number | null;
  tempo?: string | null;
  planNote?: string | null;
  formCheck?: { id: number; contentType: string; fileName?: string; createdAt: string } | null;
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
  previousBest1Rm?: number | null;
};

export type SessionSummary = {
  id: number;
  clientId: number;
  assignmentId: number | null;
  planDayId: number | null;
  planId: number | null;
  planName: string | null;
  dayLabel: string | null;
  /** Trening wystartowany poza aktualną kolejką planu. */
  outOfOrder?: boolean;
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
    previousBest1Rm?: number | null;
  }[];
  exercises: LoggedExercise[];
};

export type ClientProgressNextDay = {
  id: number;
  label: string;
  scheduledOn?: string | null;
  movedFrom?: string | null;
};

export type ClientProgress = {
  assignmentId: number | null;
  planId?: number;
  planName?: string;
  completed: number;
  total: number;
  percent: number;
  nextDay?: ClientProgressNextDay | null;
};

export type ClientRecord = {
  exerciseId: number;
  exerciseName: string;
  category?: string | null;
  estimated1Rm: number;
  weightKg: number | null;
  reps: number | null;
  performedOn: string;
  lastPerformedOn?: string;
  sessionCount?: number;
  sessionId?: number;
};

export type LastPrescriptionSet = {
  reps: number | null;
  repsMax: number | null;
  loadKg: number | null;
};

export type LastPrescription = {
  exerciseId: number;
  performedOn: string | null;
  source: "logged" | "planned";
  label: string;
  sets: LastPrescriptionSet[];
};

export type ExerciseUsage = {
  sessions: number;
  sets: number;
  firstOn: string | null;
  lastOn: string | null;
};

export type ExerciseRemapResult = {
  sessions: number;
  sets: number;
  maxes: number;
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
  dayOfWeek?: number | null;
  scheduledOn?: string | null;
  completed: boolean;
  isToday: boolean;
  /** Ostatnia ukończona sesja tego dnia — prefill „Powtórz”. */
  lastCompletedSessionId?: number | null;
};

/** Podgląd dnia planu z portalu (GET /days/{dayId}). */
export type PortalDayPreview = {
  assignmentId: number;
  planId: number;
  planName: string;
  day: PlanDay;
  completed: boolean;
  isDue: boolean;
  lastCompletedSessionId: number | null;
};

/** Sesja w toku (świeża lub zalegająca) zwracana z home portalu. */
export type PortalSessionProgress = {
  id: number;
  planDayId: number | null;
  performedOn: string;
  dayLabel: string | null;
  completedSets: number;
  totalSets: number;
};

export type PortalHome = {
  client: { id: number; name: string; goalWeightKg?: number | null };
  trainerName?: string | null;
  today: {
    assignmentId: number;
    planId: number;
    planName: string;
    day: PlanDay;
    scheduledOn?: string | null;
    movedFrom?: string | null;
    completed: number;
    total: number;
    percent: number;
    cycleRestart?: boolean;
  } | null;
  week: PortalWeekDay[] | null;
  inProgressSession: PortalSessionProgress | null;
  staleSession: PortalSessionProgress | null;
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
  /** Ukończone treningi w oknie compliance (14 dni) — do copy „N z M”. */
  completedInWindow?: number | null;
  expectedInWindow?: number | null;
  portalToken: string | null;
  action: "assign_plan" | "copy_portal_link" | string;
};

/** Sygnały od klientów na Panelu i w skrzynce. */
export type TrainerNotificationKind =
  | "session_reply"
  | "session_note"
  | "low_checkin"
  | "out_of_order"
  | "history_import"
  | "photo"
  | "measurement"
  | "intake";

export type TrainerNotification = {
  id: number;
  kind: TrainerNotificationKind;
  clientId: number;
  clientName: string;
  sessionId?: number | null;
  checkInId?: number | null;
  preview: string;
  at: string;
  unread: boolean;
  readAt?: string | null;
};

/** Alias — ten sam kształt na dashboardzie. */
export type DashboardFromClientItem = TrainerNotification;

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

export type DashboardActivation = {
  hasCompletedSession: boolean;
  firstCompletedSessionOn: string | null;
  clientsWithActivePlan: number;
  clientsWithSessionLast14Days: number;
  trainerCreatedAt: string;
};

export type DashboardLiveSession = LiveSession & {
  clientId: number;
  clientName: string;
};

export type DashboardData = {
  clients: number;
  plans: number;
  exercises: number;
  liveSessions?: DashboardLiveSession[];
  recentSessions: (SessionSummary & { clientName: string; needsReview?: NeedsReview | null })[];
  recentPrs: (ClientRecord & { clientId: number; clientName: string })[];
  attention: AttentionItem[];
  /** Nieprzeczytane od klientów. */
  fromClients?: TrainerNotification[];
  inboxUnread?: number;
  clientActivity: ClientActivityItem[];
  sessionsLast7Days: number;
  sessionsPrev7Days: number;
  prsLast7Days: number;
  activation?: DashboardActivation;
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
  planKey?: string;
  planName?: string;
  clientCount?: number;
  clientLimit?: number | null;
  billingConfigured?: boolean;
  notifyDailySummary?: boolean;
  notifyClientReply?: boolean;
  notifyWeeklyDigest?: boolean;
  wdrozeniePaidAt?: string | null;
  wdrozenieCreditGrosze?: number;
  wdrozenieGuaranteeEligible?: boolean;
};

export type ProgressPhoto = {
  id: number;
  clientId: number;
  takenOn: string;
  view: string;
  note: string | null;
  contentType: string;
  createdAt: string;
};

export type ClientsImportResult = {
  created: number;
  skipped: number;
  errors: string[];
  ids: number[];
};

export type ClientBundleImportResult = {
  clientId: number;
  name: string;
  createdPlans: number;
  createdExercises: number;
  sessionCount: number;
  warnings: string[];
};

export type PlanBundleImportResult = {
  planIds: number[];
  names: string[];
  createdExercises: number;
  warnings: string[];
};

export type NavCounts = {
  clients: number;
  plans: number;
  exercises: number;
  inboxUnread?: number;
};

export type PlanDayInput = {
  id?: number;
  weekNumber: number;
  order: number;
  label: string;
  notes: string | null;
  dayOfWeek?: number | null;
  items: PlanItemInput[];
};

export type PlanInput = {
  name: string;
  description: string | null;
  isTemplate: boolean;
  days: PlanDayInput[];
};

export type PlanSaveIds = {
  id: number;
  days: {
    id: number;
    weekNumber: number;
    order: number;
    items: { id: number; order: number }[];
  }[];
};

function isPublicApiPath(path: string): boolean {
  return (
    path.startsWith("/api/portal/") ||
    path.startsWith("/api/founding/") ||
    path.startsWith("/api/stripe/webhook")
  );
}

const PORTAL_PIN_STORAGE = "repmaxer-portal-pin:";

export function portalPinStorageKey(token: string): string {
  return `${PORTAL_PIN_STORAGE}${token}`;
}

function portalPinFromStorage(path: string): string | null {
  if (typeof window === "undefined") return null;
  const match = path.match(/^\/api\/portal\/([^/]+)/);
  if (!match || match[1] === "recover") return null;
  try {
    return sessionStorage.getItem(portalPinStorageKey(match[1]));
  } catch {
    return null;
  }
}

async function buildHeaders(
  path: string,
  init?: RequestInit,
  withJsonContentType = true,
  tokenOpts?: AuthTokenOptions,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    ...(withJsonContentType ? { "Content-Type": "application/json" } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };
  const pin = portalPinFromStorage(path);
  if (pin) headers["X-Portal-Pin"] = pin;
  const needsAuth = clerkEnabled && !isPublicApiPath(path);
  if (needsAuth) {
    // Efekty dzieci biegną przed efektem AuthTokenBridge — czekamy na markAuthReady().
    await Promise.race([authReady, sleep(AUTH_READY_TIMEOUT_MS)]);
  }
  if (authTokenGetter && !isPublicApiPath(path)) {
    const token = await authTokenGetter(tokenOpts);
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseError(res: Response): Promise<{ message: string; code: string | null }> {
  let bodyMessage: string | undefined;
  let code: string | null = null;
  try {
    const body = await res.json();
    if (body?.message && typeof body.message === "string") bodyMessage = body.message;
    if (body?.code && typeof body.code === "string") code = body.code;
  } catch {
    // brak body
  }
  return { message: userMessageForStatus(res.status, bodyMessage, code), code };
}

async function parseErrorMessage(res: Response): Promise<string> {
  return (await parseError(res)).message;
}

const WARMING_MESSAGE = "Uruchamiamy serwer. Odśwież za chwilę.";
const NETWORK_MESSAGE = "Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.";

async function fetchWithRetry(
  path: string,
  init: RequestInit | undefined,
  headers: Record<string, string>,
): Promise<Response> {
  const method = (init?.method ?? "GET").toUpperCase();
  const canRetry = method === "GET" || method === "HEAD";
  const maxAttempts = canRetry ? 3 : 1;
  let lastNetworkError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(`${API}${path}`, { ...init, headers });
      if (canRetry && isRetriableStatus(res.status) && attempt < maxAttempts) {
        await sleep(400 * attempt);
        continue;
      }
      return res;
    } catch (err) {
      if (isAbortError(err)) throw err;
      lastNetworkError = err;
      if (!canRetry || !isNetworkError(err) || attempt >= maxAttempts) {
        throw new ApiError(attempt > 1 ? WARMING_MESSAGE : NETWORK_MESSAGE, {
          status: null,
          technical: err instanceof Error ? err.message : String(err),
        });
      }
      await sleep(400 * attempt);
    }
  }

  throw new ApiError(WARMING_MESSAGE, {
    status: null,
    technical: lastNetworkError instanceof Error ? lastNetworkError.message : null,
  });
}

/** Jednorazowy retry po 401 na świeżym tokenie (Clerk cache mógł być przeterminowany). */
async function sendRequest(
  path: string,
  init: RequestInit | undefined,
  withJsonContentType: boolean,
): Promise<Response> {
  const headers = await buildHeaders(path, init, withJsonContentType);
  let res = await fetchWithRetry(path, init, headers);
  if (res.status === 401 && authTokenGetter && !isPublicApiPath(path)) {
    const retryHeaders = await buildHeaders(path, init, withJsonContentType, { skipCache: true });
    res = await fetchWithRetry(path, init, retryHeaders);
  }
  return res;
}

function messageForFailedResponse(status: number, parsedMessage: string, method: string): string {
  const safe = method === "GET" || method === "HEAD";
  // Cold start Azure — tylko idempotentne GET. POST 503 (np. brak klucza AI) ma własny `message`.
  if (safe && isRetriableStatus(status)) return WARMING_MESSAGE;
  return parsedMessage;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await sendRequest(path, init, true);
  if (!res.ok) {
    const parsed = await parseError(res);
    const method = (init?.method ?? "GET").toUpperCase();
    const message = messageForFailedResponse(res.status, parsed.message, method);
    throw new ApiError(message, { status: res.status, technical: parsed.message, code: parsed.code });
  }
  if (res.status === 204) return undefined as T;
  // Puste body (np. Results.Ok(null) w Minimal API) — nie wywołuj res.json().
  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

async function requestText(path: string, init?: RequestInit): Promise<string> {
  const res = await sendRequest(path, init, false);
  if (!res.ok) {
    const parsedMessage = await parseErrorMessage(res);
    const method = (init?.method ?? "GET").toUpperCase();
    const message = messageForFailedResponse(res.status, parsedMessage, method);
    throw new ApiError(message, { status: res.status, technical: parsedMessage });
  }
  return res.text();
}

async function requestBlob(path: string, init?: RequestInit): Promise<Blob> {
  const res = await sendRequest(path, init, false);
  if (!res.ok) {
    const parsed = await parseError(res);
    throw new ApiError(parsed.message, { status: res.status, technical: parsed.message, code: parsed.code });
  }
  return res.blob();
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
  updatePreferences: (input: {
    notifyDailySummary?: boolean;
    notifyClientReply?: boolean;
    notifyWeeklyDigest?: boolean;
  }) =>
    request<{
      notifyDailySummary: boolean;
      notifyClientReply: boolean;
      notifyWeeklyDigest: boolean;
    }>("/api/me/preferences", { method: "PUT", body: JSON.stringify(input) }),
  billing: {
    checkout: (planKey: string) =>
      request<{ checkoutUrl: string; message: string }>("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ planKey }),
      }),
    portal: () =>
      request<{ portalUrl: string; message: string }>("/api/billing/portal", { method: "POST" }),
    wdrozenieGwarancja: () =>
      request<{ ok: boolean; message: string }>("/api/billing/wdrozenie-gwarancja", {
        method: "POST",
      }),
  },
  inbox: {
    list: (opts?: { unreadOnly?: boolean; kind?: string; take?: number }) => {
      const q = new URLSearchParams();
      if (opts?.unreadOnly) q.set("unreadOnly", "true");
      if (opts?.kind && opts.kind !== "all") q.set("kind", opts.kind);
      if (opts?.take != null) q.set("take", String(opts.take));
      const qs = q.toString();
      return request<TrainerNotification[]>(`/api/inbox${qs ? `?${qs}` : ""}`);
    },
    markRead: (id: number) => request<void>(`/api/inbox/${id}/read`, { method: "POST" }),
    markAllRead: () => request<{ marked: number }>("/api/inbox/read-all", { method: "POST" }),
  },
  founding: {
    apply: (input: {
      name: string;
      email: string;
      phone?: string;
      preferredSlot?: string;
      howYouWork?: string;
      track: "whiteglove" | "founding" | "personal";
    }) =>
      request<{
        ok: boolean;
        checkoutUrl?: string | null;
        message: string;
        emailSent?: boolean;
      }>("/api/founding/apply", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  },
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
    }) => request<{ id: number }>("/api/clients", { method: "POST", body: JSON.stringify(input) }),
    importCsv: (csv: string) =>
      request<ClientsImportResult>("/api/clients/import", {
        method: "POST",
        body: JSON.stringify({ csv }),
      }),
    exportBundle: (id: number) => request<unknown>(`/api/clients/${id}/bundle`),
    importBundle: (bundle: unknown) =>
      request<ClientBundleImportResult>("/api/clients/bundle", {
        method: "POST",
        body: JSON.stringify(bundle),
      }),
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
    updateMax: (
      id: number,
      input: { maxKg: number; measuredOn: string; note?: string | null },
    ) =>
      request<{ id: number }>(`/api/maxes/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    removeMax: (id: number) => request(`/api/maxes/${id}`, { method: "DELETE" }),
    planFromHistory: (
      clientId: number,
      input?: { topKgDelta?: number; sinceDays?: number },
    ) =>
      request<HistoryImportAnalyzeResult>(`/api/clients/${clientId}/plan-from-history`, {
        method: "POST",
        body: JSON.stringify({
          topKgDelta: input?.topKgDelta ?? 2.5,
          sinceDays: input?.sinceDays ?? 120,
        }),
      }),
    lastPrescription: (clientId: number, exerciseIds: number[]) => {
      const q = exerciseIds.filter((id) => id > 0).join(",");
      return request<{ items: LastPrescription[] }>(
        `/api/clients/${clientId}/exercises/last-prescription${q ? `?exerciseIds=${q}` : ""}`,
      );
    },
    exerciseUsage: (clientId: number, exerciseId: number) =>
      request<ExerciseUsage>(`/api/clients/${clientId}/exercises/${exerciseId}/usage`),
    remapExercise: (clientId: number, exerciseId: number, targetExerciseId: number) =>
      request<ExerciseRemapResult>(`/api/clients/${clientId}/exercises/${exerciseId}/remap`, {
        method: "POST",
        body: JSON.stringify({ targetExerciseId }),
      }),
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
    historyImportPending: (clientId: number) =>
      request<HistoryImportPending | undefined>(`/api/clients/${clientId}/history-imports/pending`),
    saveHistoryImport: (clientId: number, draft: HistoryImportDraft) =>
      request<{ id: number }>(`/api/clients/${clientId}/history-imports`, {
        method: "POST",
        body: JSON.stringify(draft),
      }),
    updateHistoryImport: (clientId: number, importId: number, draft: HistoryImportDraft) =>
      request<{ id: number }>(`/api/clients/${clientId}/history-imports/${importId}`, {
        method: "PUT",
        body: JSON.stringify(draft),
      }),
    applyHistoryImport: (
      clientId: number,
      importId: number,
      input: {
        saveHistory: boolean;
        saveMaxes: boolean;
        sessions?: WorkoutSessionInput[];
        maxes?: { exerciseId: number; maxKg: number; measuredOn: string; note?: string | null }[];
      },
    ) =>
      request<{ sessionIds: number[]; maxIds: number[] }>(
        `/api/clients/${clientId}/history-imports/${importId}/apply`,
        { method: "POST", body: JSON.stringify(input) },
      ),
    dismissHistoryImport: (clientId: number, importId: number) =>
      request<void>(`/api/clients/${clientId}/history-imports/${importId}/dismiss`, {
        method: "POST",
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
    expireAccessToken: (clientId: number, days: number | null) =>
      request<{ token: string; createdAt: string; expiresAt: string | null }>(
        `/api/clients/${clientId}/access-token/expire`,
        { method: "POST", body: JSON.stringify({ days }) },
      ),
    setPortalPin: (clientId: number, pin: string | null) =>
      request<{ hasPortalPin: boolean }>(`/api/clients/${clientId}/portal-pin`, {
        method: "POST",
        body: JSON.stringify({ pin }),
      }),
    photos: (clientId: number) => request<ProgressPhoto[]>(`/api/clients/${clientId}/photos`),
    photoBlob: (clientId: number, photoId: number) =>
      requestBlob(`/api/clients/${clientId}/photos/${photoId}/image`),
    addPhoto: (
      clientId: number,
      input: { imageBase64: string; contentType?: string; takenOn?: string; view?: string; note?: string | null },
    ) =>
      request<ProgressPhoto>(`/api/clients/${clientId}/photos`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    removePhoto: (clientId: number, photoId: number) =>
      request(`/api/clients/${clientId}/photos/${photoId}`, { method: "DELETE" }),
    getIntake: (clientId: number) => request<ClientIntake>(`/api/clients/${clientId}/intake`),
    saveIntake: (clientId: number, input: ClientIntakeInput) =>
      request<ClientIntake>(`/api/clients/${clientId}/intake`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    notes: (clientId: number) => request<TrainerNote[]>(`/api/clients/${clientId}/notes`),
    addNote: (clientId: number, input: TrainerNoteInput) =>
      request<TrainerNote>(`/api/clients/${clientId}/notes`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    updateNote: (clientId: number, noteId: number, input: TrainerNoteInput) =>
      request<TrainerNote>(`/api/clients/${clientId}/notes/${noteId}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    removeNote: (clientId: number, noteId: number) =>
      request(`/api/clients/${clientId}/notes/${noteId}`, { method: "DELETE" }),
    clientNotes: (clientId: number, limit = 30) =>
      request<ClientNoteGroup[]>(`/api/clients/${clientId}/client-notes?limit=${limit}`),
    muscleVolume: (clientId: number, weeks = 4) =>
      request<MuscleVolumeResponse>(`/api/clients/${clientId}/muscle-volume?weeks=${weeks}`),
    trends: (clientId: number, weeks = 12) =>
      request<ClientTrendsResponse>(`/api/clients/${clientId}/trends?weeks=${weeks}`),
    stagnation: (clientId: number) =>
      request<StagnationResponse>(`/api/clients/${clientId}/stagnation`),
    progressReport: (clientId: number) =>
      request<ProgressReport>(`/api/clients/${clientId}/progress-report`),
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
    importHistory: (
      input: { text?: string; images?: HistoryImportImage[] },
      init?: Pick<RequestInit, "signal">,
    ) =>
      request<HistoryImportDraft>("/api/ai/history-import", {
        method: "POST",
        body: JSON.stringify(input),
        signal: init?.signal,
      }),
    analyzeHistory: (input: {
      sessions: HistoryImportSession[];
      clientName?: string;
      topKgDelta?: number;
    }) =>
      request<HistoryImportAnalyzeResult>("/api/ai/history-import/analyze", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  },
  plans: {
    list: () => request<PlanSummary[]>("/api/plans"),
    get: (id: number, clientId?: number) =>
      request<Plan>(`/api/plans/${id}${clientId != null ? `?clientId=${clientId}` : ""}`),
    create: (input: PlanInput) =>
      request<{ id: number }>("/api/plans", { method: "POST", body: JSON.stringify(input) }),
    update: (id: number, input: PlanInput) =>
      request<PlanSaveIds>(`/api/plans/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    duplicate: (id: number, input: { name: string | null; isTemplate: boolean | null }) =>
      request<{ id: number }>(`/api/plans/${id}/duplicate`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    exportBundle: (id: number) => request<unknown>(`/api/plans/${id}/bundle`),
    importBundle: (data: unknown) =>
      request<PlanBundleImportResult>("/api/plans/bundle", {
        method: "POST",
        body: JSON.stringify(data),
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
    formCheckBlob: (sessionId: number, exerciseId: number) =>
      requestBlob(`/api/sessions/${sessionId}/exercises/${exerciseId}/form-check`),
  },
  portal: {
    recover: (email: string) =>
      request<{ message: string }>("/api/portal/recover", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    pinStatus: (token: string) =>
      request<{ pinRequired: boolean; trainerName?: string | null }>(`/api/portal/${token}/pin-status`),
    unlock: (token: string, pin: string) =>
      request<{ ok: boolean }>(`/api/portal/${token}/unlock`, {
        method: "POST",
        body: JSON.stringify({ pin }),
      }),
    home: (token: string, today?: string) =>
      request<PortalHome>(
        `/api/portal/${token}${today ? `?today=${encodeURIComponent(today)}` : ""}`,
      ),
    day: (token: string, dayId: number) =>
      request<PortalDayPreview>(`/api/portal/${token}/days/${dayId}`),
    rescheduleDay: (token: string, dayId: number, input: { date: string }) =>
      request<{ date: string }>(`/api/portal/${token}/days/${dayId}/reschedule`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
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
    abandonSession: (token: string, id: number) =>
      request<SessionDetail>(`/api/portal/${token}/sessions/${id}/abandon`, {
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
    photos: (token: string) => request<ProgressPhoto[]>(`/api/portal/${token}/photos`),
    photoBlob: (token: string, photoId: number) =>
      requestBlob(`/api/portal/${token}/photos/${photoId}/image`),
    addPhoto: (
      token: string,
      input: { imageBase64: string; contentType?: string; takenOn?: string; view?: string; note?: string | null },
    ) =>
      request<ProgressPhoto>(`/api/portal/${token}/photos`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    removePhoto: (token: string, photoId: number) =>
      request(`/api/portal/${token}/photos/${photoId}`, { method: "DELETE" }),
    getIntake: (token: string) => request<ClientIntake>(`/api/portal/${token}/intake`),
    saveIntake: (token: string, input: ClientIntakeInput) =>
      request<ClientIntake>(`/api/portal/${token}/intake`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    exportCsv: (token: string) => requestText(`/api/portal/${token}/export`),
    maxes: (token: string) =>
      request<
        { id: number; exerciseId: number; exerciseName: string; maxKg: number; measuredOn: string; note: string | null }[]
      >(`/api/portal/${token}/maxes`),
    importPending: (token: string) =>
      request<{ id: number; status: string; createdAt: string } | null>(
        `/api/portal/${token}/history-import/pending`,
      ),
    addFormCheck: (
      token: string,
      sessionId: number,
      exerciseId: number,
      input: { fileBase64: string; contentType?: string; fileName?: string },
    ) =>
      request<{ id: number; loggedExerciseId: number; contentType: string; fileName: string; createdAt: string }>(
        `/api/portal/${token}/sessions/${sessionId}/exercises/${exerciseId}/form-check`,
        { method: "POST", body: JSON.stringify(input) },
      ),
    formCheckBlob: (token: string, sessionId: number, exerciseId: number) =>
      requestBlob(`/api/portal/${token}/sessions/${sessionId}/exercises/${exerciseId}/form-check`),
    importHistory: (
      token: string,
      input: { text?: string; images?: HistoryImportImage[] },
      init?: Pick<RequestInit, "signal">,
    ) =>
      request<{ id: number }>(`/api/portal/${token}/history-import`, {
        method: "POST",
        body: JSON.stringify(input),
        signal: init?.signal,
      }),
    muscleVolume: (token: string, weeks = 4) =>
      request<MuscleVolumeResponse>(`/api/portal/${token}/muscle-volume?weeks=${weeks}`),
    trends: (token: string, weeks = 12) =>
      request<ClientTrendsResponse>(`/api/portal/${token}/trends?weeks=${weeks}`),
  },
};
