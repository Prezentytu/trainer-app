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

export type ClientDetails = {
  id: number;
  name: string;
  email: string | null;
  note: string | null;
  assignments: ClientAssignment[];
};

export type Exercise = {
  id: number;
  name: string;
  description: string | null;
  type: "reps" | "time";
  defaultSets: number;
  defaultReps: number;
  defaultRepDurationSeconds: number | null;
  defaultRestBetweenSetsSeconds: number;
  defaultLoadKg: number | null;
};

export type PlanItem = {
  id: number;
  exerciseId: number;
  order: number;
  exerciseName: string;
  exerciseType: "reps" | "time";
  sets: number;
  reps: number;
  repDurationSeconds: number | null;
  restBetweenSetsSeconds: number;
  restAfterExerciseSeconds: number;
  loadKg: number | null;
  notes: string | null;
  overrides: {
    sets: number | null;
    reps: number | null;
    repDurationSeconds: number | null;
    restBetweenSetsSeconds: number | null;
    loadKg: number | null;
  };
};

export type Plan = {
  id: number;
  name: string;
  description: string | null;
  isTemplate: boolean;
  items: PlanItem[];
  assignedCount: number;
};

export type PlanItemInput = {
  exerciseId: number;
  order: number;
  sets: number | null;
  reps: number | null;
  repDurationSeconds: number | null;
  restBetweenSetsSeconds: number | null;
  restAfterExerciseSeconds: number | null;
  loadKg: number | null;
  notes: string | null;
};

export type PlanInput = {
  name: string;
  description: string | null;
  isTemplate: boolean;
  items: PlanItemInput[];
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
    create: (input: Omit<Exercise, "id">) =>
      request("/api/exercises", { method: "POST", body: JSON.stringify(input) }),
    update: (id: number, input: Omit<Exercise, "id">) =>
      request(`/api/exercises/${id}`, { method: "PUT", body: JSON.stringify(input) }),
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
