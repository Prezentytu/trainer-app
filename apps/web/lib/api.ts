const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5210";

export type ClientSummary = {
  id: number;
  name: string;
  email: string | null;
  note: string | null;
  activePlans: number;
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
  assignments: ClientAssignment[];
};

// Cele treningowe klienta — chipy 1-tap w formularzu klienta, zapisywane jako tekst w `Client.note`
// (bez zmiany schematu backendu). Jedyne źródło prawdy dla opcji, analogicznie do EXERCISE_TYPE_LABELS.
export const CLIENT_GOALS = ["Redukcja", "Hipertrofia", "Kondycja", "Siła", "Ogólna sprawność"] as const;

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

export type Plan = {
  id: number;
  name: string;
  description: string | null;
  isTemplate: boolean;
  days: PlanDay[];
  weeksCount: number;
  daysCount: number;
  exerciseCount: number;
  assignedCount: number;
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
  notes: string | null;
  prescribedSets: PlanSetInput[];
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
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
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
  return res.json();
}

export const api = {
  clients: {
    list: () => request<ClientSummary[]>("/api/clients"),
    get: (id: number) => request<ClientDetails>(`/api/clients/${id}`),
    create: (input: { name: string; email: string | null; note: string | null }) =>
      request("/api/clients", { method: "POST", body: JSON.stringify(input) }),
    remove: (id: number) => request(`/api/clients/${id}`, { method: "DELETE" }),
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
  plans: {
    list: () => request<Plan[]>("/api/plans"),
    get: (id: number) => request<Plan>(`/api/plans/${id}`),
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
};
