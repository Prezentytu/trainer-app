import { formatSchemeLabel, PLAN_PRESETS } from "@/lib/planPresets";
import { PlanSetInput } from "@/lib/api";
import { BuilderDay, BuilderItem, newKey } from "@/components/plan-builder/types";

export type MethodTemplateId = "15105" | "642531";

export const METHOD_TEMPLATES: {
  id: MethodTemplateId;
  label: string;
  description: string;
}[] = [
  {
    id: "15105",
    label: "15-10-5",
    description: "Trzy dni FBW: 15, 10 i 5 powtórzeń. Rampa do serii roboczej. Ćwiczenia z pierwszego dnia tygodnia.",
  },
  {
    id: "642531",
    label: "6-4-2-5-3-1",
    description: "Sześć tygodni periodyzacji (Poliquin). Dni pierwszego tygodnia zostają, serie wg tygodnia.",
  },
];

export function methodTemplateHasSource(days: BuilderDay[]): boolean {
  return days.some((d) => d.items.length > 0);
}

function cloneItem(item: BuilderItem, sets: PlanSetInput[], scheme: string, order: number): BuilderItem {
  const top = [...sets].reverse().find((s) => s.role === "top") ?? sets.find((s) => s.role === "ramp") ?? sets[0];
  return {
    ...item,
    key: newKey(),
    order,
    prescribedSets: sets.map((s) => ({ ...s, key: newKey() })),
    setScheme: scheme,
    sets: sets.length,
    reps: top?.reps ?? item.reps,
    repsMax: top?.repsMax ?? item.repsMax,
  };
}

function firstWeekWithItems(days: BuilderDay[]): number | null {
  const weeks = [...new Set(days.filter((d) => d.items.length > 0).map((d) => d.weekNumber))].sort(
    (a, b) => a - b,
  );
  return weeks[0] ?? null;
}

/** Wypełnia `days[]` szablonem metody. Kreator zostaje edytowalny. */
export function applyMethodTemplate(days: BuilderDay[], id: MethodTemplateId): BuilderDay[] {
  const weekNum = firstWeekWithItems(days);
  if (weekNum == null) return days;
  const weekDays = days
    .filter((d) => d.weekNumber === weekNum)
    .sort((a, b) => a.order - b.order);
  const sourceDay = weekDays.find((d) => d.items.length > 0);
  if (!sourceDay) return days;

  if (id === "15105") {
    const items = sourceDay.items;
    const weekCount = Math.max(
      days.reduce((m, d) => Math.max(m, d.weekNumber), 0),
      4,
    );
    const defs: { order: number; label: string; presetId: "ramp15" | "ramp10" | "ramp5" }[] = [
      { order: 1, label: "Poniedziałek — Dzień 15", presetId: "ramp15" },
      { order: 2, label: "Środa — Dzień 10", presetId: "ramp10" },
      { order: 3, label: "Piątek — Dzień 5", presetId: "ramp5" },
    ];
    const out: BuilderDay[] = [];
    for (let w = 1; w <= weekCount; w++) {
      for (const def of defs) {
        const preset = PLAN_PRESETS.find((p) => p.id === def.presetId);
        if (!preset) continue;
        const sets = preset.build(w);
        out.push({
          key: newKey(),
          weekNumber: w,
          order: def.order,
          label: def.label,
          notes: null,
          dayOfWeek: null,
          items: items.map((it, idx) => cloneItem(it, sets, formatSchemeLabel(sets), idx + 1)),
        });
      }
    }
    return out;
  }

  const preset = PLAN_PRESETS.find((p) => p.id === "642531");
  if (!preset) return days;
  const filled = weekDays.filter((d) => d.items.length > 0);
  const out: BuilderDay[] = [];
  for (let w = 1; w <= 6; w++) {
    filled.forEach((d, di) => {
      const sets = preset.build(w);
      out.push({
        key: newKey(),
        weekNumber: w,
        order: di + 1,
        label: d.label,
        notes: d.notes,
        dayOfWeek: d.dayOfWeek,
        items: d.items.map((it, idx) => cloneItem(it, sets, formatSchemeLabel(sets), idx + 1)),
      });
    });
  }
  return out;
}
