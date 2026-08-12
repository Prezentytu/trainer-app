// Superseria = sąsiadujące pozycje w tym samym dniu połączone jednym numerem grupy
// (`PlanItem.supersetGroup`). Te funkcje zamieniają numery grup na czytelne etykiety (A1/A2, B1/B2/B3…)
// oraz konwertują między "flagą połączenia z następną pozycją" (używaną w kreatorze jako akcja,
// nie surowe pole liczbowe) i numerami grup (używanymi przez backend/API).

export function buildGroupLabels(groups: Array<number | null>): Array<string | null> {
  const letterForGroup = new Map<number, string>();
  const counts = new Map<number, number>();
  let nextLetterCode = 65; // 'A'
  return groups.map((group) => {
    if (group == null) return null;
    if (!letterForGroup.has(group)) {
      letterForGroup.set(group, String.fromCharCode(nextLetterCode));
      nextLetterCode++;
    }
    const count = (counts.get(group) ?? 0) + 1;
    counts.set(group, count);
    return `${letterForGroup.get(group)}${count}`;
  });
}

// Odtwarza flagi „połączone z następną pozycją” z numerów grup wczytanych z API.
export function deriveLinkedToNext(groups: Array<number | null>): boolean[] {
  return groups.map((group, idx) => group != null && groups[idx + 1] === group);
}

// Wylicza numery grup z flag „połączone z następną pozycją” (łańcuchy sąsiadujących pozycji).
export function computeGroupsFromLinks(linked: boolean[]): Array<number | null> {
  const n = linked.length;
  const groups: Array<number | null> = new Array(n).fill(null);
  let nextGroupId = 1;
  let i = 0;
  while (i < n) {
    let end = i;
    while (linked[end]) end++;
    if (end > i) {
      for (let j = i; j <= end; j++) groups[j] = nextGroupId;
      nextGroupId++;
    }
    i = end + 1;
  }
  return groups;
}

export type ConsecutiveGroup<T> = {
  group: number | null;
  items: T[];
  startIndex: number;
  multi: boolean;
  positionNum: number;
  labels: Array<string | null>;
};

/** Sąsiadujące pozycje z tym samym `supersetGroup` = jedna klamra. Solo / orphan = osobny blok. */
export function groupConsecutiveBySuperset<T>(
  items: T[],
  groupOf: (item: T) => number | null,
  opts?: { startAt?: number },
): ConsecutiveGroup<T>[] {
  const groups: ConsecutiveGroup<T>[] = [];
  let position = opts?.startAt ?? 1;
  let i = 0;
  while (i < items.length) {
    const g = groupOf(items[i]);
    const start = i;
    if (g != null) {
      while (i + 1 < items.length && groupOf(items[i + 1]) === g) i++;
    }
    const slice = items.slice(start, i + 1);
    const multi = slice.length > 1;
    const labels = slice.map((_, idx) =>
      multi ? `${position}${String.fromCharCode(97 + idx)}` : null,
    );
    groups.push({
      group: multi ? g : null,
      items: slice,
      startIndex: start,
      multi,
      positionNum: position,
      labels,
    });
    position++;
    i++;
  }
  return groups;
}
