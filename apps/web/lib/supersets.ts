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
