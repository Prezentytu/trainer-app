import { groupConsecutiveBySuperset } from "@/lib/supersets";

export type RoundSet = { completed: boolean; isWarmup: boolean };

export type RoundExercise = {
  supersetGroup?: number | null;
  sets: RoundSet[];
};

export type SessionBlock =
  | { kind: "single"; exIdx: number }
  | { kind: "superset"; group: number; members: number[]; roundCount: number };

export type SetFocus = { exIdx: number; setIdx: number };

export function buildSessionBlocks(exercises: RoundExercise[]): SessionBlock[] {
  const grouped = groupConsecutiveBySuperset(exercises, (ex) => ex.supersetGroup ?? null);
  return grouped.map((g) => {
    if (!g.multi) {
      return { kind: "single", exIdx: g.startIndex };
    }
    const members = g.items.map((_, i) => g.startIndex + i);
    const roundCount = Math.max(
      ...members.map((idx) => workingSetCount(exercises[idx])),
      0,
    );
    return {
      kind: "superset",
      group: g.group ?? 0,
      members,
      roundCount,
    };
  });
}

function workingSetCount(ex: RoundExercise | undefined): number {
  if (!ex) return 0;
  return ex.sets.filter((s) => !s.isWarmup).length;
}

function workingSetIndex(ex: RoundExercise, round: number): number | null {
  let seen = 0;
  for (let i = 0; i < ex.sets.length; i++) {
    if (ex.sets[i].isWarmup) continue;
    if (seen === round) return i;
    seen++;
  }
  return null;
}

/** Kolejność wykonania: warmupy członków, potem serie robocze A→B→… */
export function executionOrder(exercises: RoundExercise[]): SetFocus[] {
  const order: SetFocus[] = [];
  for (const block of buildSessionBlocks(exercises)) {
    if (block.kind === "single") {
      const ex = exercises[block.exIdx];
      if (!ex) continue;
      for (let setIdx = 0; setIdx < ex.sets.length; setIdx++) {
        order.push({ exIdx: block.exIdx, setIdx });
      }
      continue;
    }
    for (const exIdx of block.members) {
      const ex = exercises[exIdx];
      if (!ex) continue;
      ex.sets.forEach((s, setIdx) => {
        if (s.isWarmup) order.push({ exIdx, setIdx });
      });
    }
    for (let r = 0; r < block.roundCount; r++) {
      for (const exIdx of block.members) {
        const setIdx = workingSetIndex(exercises[exIdx], r);
        if (setIdx != null) order.push({ exIdx, setIdx });
      }
    }
  }
  return order;
}

export function nextIncompleteFocus(exercises: RoundExercise[]): SetFocus | null {
  for (const step of executionOrder(exercises)) {
    const set = exercises[step.exIdx]?.sets[step.setIdx];
    if (set && !set.completed) return step;
  }
  return null;
}

function blockFor(exercises: RoundExercise[], exIdx: number): SessionBlock | null {
  return buildSessionBlocks(exercises).find((b) =>
    b.kind === "single" ? b.exIdx === exIdx : b.members.includes(exIdx),
  ) ?? null;
}

function workingRoundOf(ex: RoundExercise, setIdx: number): number | null {
  const set = ex.sets[setIdx];
  if (!set || set.isWarmup) return null;
  let round = 0;
  for (let i = 0; i < setIdx; i++) {
    if (!ex.sets[i].isWarmup) round++;
  }
  return round;
}

/**
 * Rest po zaliczeniu serii (stan już z completed=true na tej serii).
 * Solo: po każdej serii, gdy została jeszcze praca.
 * Superseria: tylko po ostatnim ruchu pary (A→B), gdy została jeszcze praca.
 */
export function shouldStartRest(
  exercises: RoundExercise[],
  exIdx: number,
  setIdx: number,
): boolean {
  const next = nextIncompleteFocus(exercises);
  if (!next) return false;

  const block = blockFor(exercises, exIdx);
  if (!block) return false;

  if (block.kind === "single") return true;

  const ex = exercises[exIdx];
  if (!ex) return false;
  const set = ex.sets[setIdx];
  if (!set || set.isWarmup) return false;

  const round = workingRoundOf(ex, setIdx);
  if (round == null) return false;

  for (const memberIdx of block.members) {
    const member = exercises[memberIdx];
    const memberSetIdx = workingSetIndex(member, round);
    if (memberSetIdx == null) continue;
    if (!member.sets[memberSetIdx]?.completed) return false;
  }
  return true;
}

export function groupRestSeconds(
  exercises: Array<{ restSeconds: number | null }>,
  members: number[],
  overrideByEx: Record<number, number>,
): number {
  for (const idx of members) {
    if (overrideByEx[idx] != null) return overrideByEx[idx];
  }
  const first = members[0];
  return exercises[first]?.restSeconds ?? 90;
}
