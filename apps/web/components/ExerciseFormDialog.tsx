"use client";

import {
  Dispatch,
  FormEvent,
  KeyboardEvent,
  SetStateAction,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  EQUIPMENT_LABELS,
  Exercise,
  ExercisePattern,
  ExerciseType,
  EXERCISE_TYPE_LABELS,
  PATTERN_LABELS,
} from "@/lib/api";
import {
  DEFAULT_EXERCISE_INPUT,
  ExerciseInput,
  exerciseInputFromExercise,
} from "@/lib/exerciseDraft";
import { parseYoutubeId } from "@/lib/youtube";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import {
  Dialog,
  ErrorBanner,
  Field,
  formatRest,
  inputClass,
  inputNumericClass,
  Pill,
  SegmentedControl,
  Switch,
  Tag,
  textareaClass,
} from "@/components/ui";

type Mode = "create" | "edit";
type Variant = "quick" | "full";

const REST_PRESETS = [45, 60, 90, 120] as const;
const EQUIPMENT_ORDER = Object.keys(EQUIPMENT_LABELS);
const PATTERN_ORDER = Object.keys(PATTERN_LABELS) as ExercisePattern[];

function initialForm(
  mode: Mode,
  prefill: ExerciseInput,
  editExercise?: Exercise,
): ExerciseInput {
  if (mode === "edit" && editExercise) return exerciseInputFromExercise(editExercise);
  return { ...DEFAULT_EXERCISE_INPUT, ...prefill };
}

function demoYoutubeId(input: ExerciseInput): string | null {
  const m = input.media?.find((x) => x.kind === "demo") ?? input.media?.[0];
  return m?.youtubeId ?? null;
}

function volumeSummary(form: ExerciseInput): string {
  let core: string;
  if (form.type === "time") {
    core = form.defaultRepDurationSeconds ? `${form.defaultRepDurationSeconds}s` : "—";
  } else if (form.type === "distance") {
    core = form.defaultDistanceMeters ? `${form.defaultDistanceMeters} m` : "—";
  } else {
    core = `${form.defaultReps}`;
  }
  return `${form.defaultSets}×${core} · przerwa ${formatRest(form.defaultRestBetweenSetsSeconds)}`;
}

/** Bufor tekstowy dla liczb — commit na blur, nie kasuje „10.” w trakcie pisania. */
function useNumericDraft(
  value: number | null,
  onCommit: (n: number | null) => void,
  opts?: { min?: number; allowEmpty?: boolean; fallback?: number },
) {
  const [text, setText] = useState(value == null ? "" : String(value));
  const [prev, setPrev] = useState(value);
  // Sync z props gdy zmieni się wartość z zewnątrz (np. chip przerwy) — bez useEffect.
  if (value !== prev) {
    setPrev(value);
    setText(value == null ? "" : String(value));
  }

  const commit = () => {
    const trimmed = text.trim().replace(",", ".");
    if (trimmed === "") {
      if (opts?.allowEmpty) {
        onCommit(null);
        return;
      }
      const fb = opts?.fallback ?? opts?.min ?? 0;
      onCommit(fb);
      setText(String(fb));
      return;
    }
    const n = Number(trimmed);
    if (!Number.isFinite(n)) {
      setText(value == null ? "" : String(value));
      return;
    }
    const clamped = opts?.min != null ? Math.max(opts.min, n) : n;
    onCommit(clamped);
    setText(String(clamped));
  };

  return {
    value: text,
    onChange: (raw: string) => setText(raw),
    onBlur: commit,
  };
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">{children}</p>
  );
}

type NumericField = {
  value: string;
  onChange: (raw: string) => void;
  onBlur: () => void;
};

function DefaultsSection({
  form,
  setForm,
  setsField,
  measureLabel,
  measureField,
  restField,
  loadField,
  showLoad,
}: {
  form: ExerciseInput;
  setForm: Dispatch<SetStateAction<ExerciseInput>>;
  setsField: NumericField;
  measureLabel: string;
  measureField: NumericField;
  restField: NumericField;
  loadField: NumericField;
  showLoad: boolean;
}) {
  return (
    <div className="space-y-3">
      <SectionLabel>Domyślne w planie</SectionLabel>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Serie">
          <input
            className={inputNumericClass}
            type="text"
            inputMode="numeric"
            value={setsField.value}
            onChange={(e) => setsField.onChange(e.target.value)}
            onBlur={setsField.onBlur}
          />
        </Field>
        <Field label={measureLabel}>
          <input
            className={inputNumericClass}
            type="text"
            inputMode="decimal"
            value={measureField.value}
            onChange={(e) => measureField.onChange(e.target.value)}
            onBlur={measureField.onBlur}
          />
        </Field>
        <Field label="Przerwa (s)">
          <input
            className={inputNumericClass}
            type="text"
            inputMode="numeric"
            value={restField.value}
            onChange={(e) => restField.onChange(e.target.value)}
            onBlur={restField.onBlur}
          />
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {REST_PRESETS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm((f) => ({ ...f, defaultRestBetweenSetsSeconds: s }))}
                className={`rounded-full px-2.5 py-0.5 font-mono text-xs tabular-nums transition-colors ${
                  form.defaultRestBetweenSetsSeconds === s
                    ? "bg-accent-dim text-foreground"
                    : "bg-surface-hover text-muted hover:bg-surface-active"
                }`}
              >
                {s}s
              </button>
            ))}
          </div>
        </Field>
        {showLoad ? (
          <Field label="Obciążenie (kg)">
            <input
              className={inputNumericClass}
              type="text"
              inputMode="decimal"
              value={loadField.value}
              onChange={(e) => loadField.onChange(e.target.value)}
              onBlur={loadField.onBlur}
              placeholder="brak"
            />
          </Field>
        ) : null}
      </div>
      <p className="font-mono text-xs tabular-nums text-muted">{volumeSummary(form)}</p>
    </div>
  );
}

function ExerciseFormDialogBody({
  mode,
  variant,
  prefill,
  editExercise,
  onClose,
  onSubmit,
}: {
  mode: Mode;
  variant: Variant;
  prefill: ExerciseInput;
  editExercise?: Exercise;
  onClose: () => void;
  onSubmit: (input: ExerciseInput) => Promise<void>;
}) {
  const [form, setForm] = useState<ExerciseInput>(() => initialForm(mode, prefill, editExercise));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameTouched, setNameTouched] = useState(false);
  /** Full: „Domyślne w planie”. Quick: nieużywane (parametry zawsze widoczne). */
  const [defaultsOpen, setDefaultsOpen] = useState(false);
  /** Full: „Więcej szczegółów”. Quick: „Więcej pól” (partia/sprzęt/wideo + zaawansowane). */
  const [moreOpen, setMoreOpen] = useState(false);
  const [youtubeRaw, setYoutubeRaw] = useState(() => demoYoutubeId(initialForm(mode, prefill, editExercise)) ?? "");
  const [muscleDraft, setMuscleDraft] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const parsedYt = useMemo(() => {
    if (!youtubeRaw.trim()) return { id: null as string | null, invalid: false };
    const id = parseYoutubeId(youtubeRaw);
    return { id, invalid: id == null };
  }, [youtubeRaw]);

  const isFull = variant === "full";
  /** Partia / sprzęt / wideo — zawsze w full; w quick po „Więcej pól”. */
  const showLibraryFields = isFull || moreOpen;
  /** Parametry serii — w quick zawsze; w full za „Domyślne w planie”. */
  const showDefaults = !isFull || defaultsOpen;
  /** Wzorzec / mięśnie / instrukcje — za moreOpen w obu trybach. */
  const showAdvanced = moreOpen;

  const setsField = useNumericDraft(form.defaultSets, (n) => setForm((f) => ({ ...f, defaultSets: n ?? 1 })), {
    min: 1,
    fallback: 1,
  });
  const repsField = useNumericDraft(form.defaultReps, (n) => setForm((f) => ({ ...f, defaultReps: n ?? 1 })), {
    min: 1,
    fallback: 1,
  });
  const durationField = useNumericDraft(
    form.defaultRepDurationSeconds,
    (n) => setForm((f) => ({ ...f, defaultRepDurationSeconds: n })),
    { min: 5, fallback: 30 },
  );
  const distanceField = useNumericDraft(
    form.defaultDistanceMeters,
    (n) => setForm((f) => ({ ...f, defaultDistanceMeters: n })),
    { min: 1, fallback: 20 },
  );
  const restField = useNumericDraft(
    form.defaultRestBetweenSetsSeconds,
    (n) => setForm((f) => ({ ...f, defaultRestBetweenSetsSeconds: n ?? 0 })),
    { min: 0, fallback: 60 },
  );
  const loadField = useNumericDraft(
    form.defaultLoadKg,
    (n) => setForm((f) => ({ ...f, defaultLoadKg: n })),
    { min: 0, allowEmpty: true },
  );

  const nameError = nameTouched && !form.name.trim() ? "Podaj nazwę ćwiczenia." : null;

  const unknownEquipment = useMemo(
    () => (form.equipment ?? []).filter((eq) => !(eq in EQUIPMENT_LABELS)),
    [form.equipment],
  );

  const setType = (type: ExerciseType) => {
    setForm((f) => ({
      ...f,
      type,
      defaultReps: type === "time" || type === "distance" ? Math.max(f.defaultReps, 1) : f.defaultReps || 10,
      defaultRepDurationSeconds: type === "time" ? f.defaultRepDurationSeconds ?? 30 : null,
      defaultDistanceMeters: type === "distance" ? f.defaultDistanceMeters ?? 20 : null,
    }));
  };

  const toggleEquipment = (slug: string) => {
    setForm((f) => {
      const current = f.equipment ?? [];
      const next = current.includes(slug) ? current.filter((e) => e !== slug) : [...current, slug];
      return { ...f, equipment: next };
    });
  };

  const addMuscle = () => {
    const m = muscleDraft.trim().replace(/\s+/g, " ");
    if (!m) return;
    setForm((f) => {
      if ((f.primaryMuscles ?? []).includes(m)) return f;
      return { ...f, primaryMuscles: [...(f.primaryMuscles ?? []), m] };
    });
    setMuscleDraft("");
  };

  const onMuscleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addMuscle();
    }
  };

  const buildPayload = (): ExerciseInput | null => {
    const name = form.name.trim().replace(/\s+/g, " ");
    if (!name) {
      setNameTouched(true);
      setError("Podaj nazwę ćwiczenia.");
      nameRef.current?.focus();
      return null;
    }
    const ytId = parsedYt.id;
    const existingMedia = form.media ?? [];
    const otherMedia = existingMedia.filter((m) => m.kind !== "demo" && m.youtubeId !== ytId);
    const media = ytId
      ? [{ youtubeId: ytId, title: name, seconds: null, kind: "demo" as const }, ...otherMedia]
      : otherMedia.filter((m) => m.kind !== "demo");

    return {
      ...form,
      name,
      description: form.description?.trim() || null,
      instructions: form.instructions?.trim() || null,
      category: form.category || null,
      pattern: form.pattern || null,
      defaultRepDurationSeconds: form.type === "time" ? form.defaultRepDurationSeconds ?? 30 : null,
      defaultDistanceMeters: form.type === "distance" ? form.defaultDistanceMeters ?? 20 : null,
      defaultLoadKg: form.defaultLoadKg,
      equipment: form.equipment ?? [],
      primaryMuscles: form.primaryMuscles ?? [],
      media,
    };
  };

  const handleConfirm = async () => {
    if (saving) return;
    const payload = buildPayload();
    if (!payload) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleConfirm();
  };

  const measureLabel =
    form.type === "time" ? "Czas (s)" : form.type === "distance" ? "Dystans (m)" : "Powtórzenia";
  const measureField =
    form.type === "time" ? durationField : form.type === "distance" ? distanceField : repsField;

  const title =
    mode === "edit"
      ? variant === "quick"
        ? "Popraw ćwiczenie"
        : "Edycja ćwiczenia"
      : "Nowe ćwiczenie";
  const description =
    mode === "edit"
      ? variant === "quick"
        ? "Zmień typ lub domyślne parametry — pozycja w planie zostaje."
        : undefined
      : variant === "quick"
        ? "Dodaj do biblioteki i wstaw do dnia. Typ możesz zmienić później."
        : "Nazwa i partia wystarczą; serie ustawisz w planie.";
  const confirmLabel =
    saving
      ? mode === "edit"
        ? "Zapisywanie…"
        : variant === "quick"
          ? "Tworzę…"
          : "Zapisywanie…"
      : mode === "edit"
        ? variant === "quick"
          ? "Zapisz"
          : "Zapisz ćwiczenie"
        : variant === "quick"
          ? "Utwórz i dodaj"
          : "Dodaj ćwiczenie";

  return (
    <Dialog
      open
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      cancelLabel="Anuluj"
      busy={saving}
      onCancel={onClose}
      onConfirm={() => void handleConfirm()}
      className="max-w-xl"
    >
      <form onSubmit={onFormSubmit} className="max-h-[70dvh] space-y-5 overflow-y-auto pr-0.5">
        <ErrorBanner message={error} />

        <Field label="Nazwa *">
          <input
            ref={nameRef}
            autoFocus
            className={`${inputClass} ${nameError ? "border-danger" : ""}`}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            onBlur={() => setNameTouched(true)}
            placeholder="np. Wyciskanie sztangi (Bench Press)"
            aria-invalid={Boolean(nameError)}
          />
          {nameError ? <p className="mt-1 text-xs text-danger">{nameError}</p> : null}
        </Field>

        <Field label="Typ">
          <SegmentedControl
            full
            items={[
              { value: "reps", label: EXERCISE_TYPE_LABELS.reps },
              { value: "time", label: EXERCISE_TYPE_LABELS.time },
              { value: "distance", label: EXERCISE_TYPE_LABELS.distance },
            ]}
            value={form.type}
            onChange={(v) => setType(v as ExerciseType)}
          />
        </Field>

        {/* Quick: parametry od razu (flow composera). Full: tożsamość najpierw. */}
        {!isFull && showDefaults ? (
          <DefaultsSection
            form={form}
            setForm={setForm}
            setsField={setsField}
            measureLabel={measureLabel}
            measureField={measureField}
            restField={restField}
            loadField={loadField}
            showLoad={false}
          />
        ) : null}

        {showLibraryFields ? (
          <>
            <div className="space-y-2">
              <SectionLabel>Partia</SectionLabel>
              <div className="flex flex-wrap gap-2">
                <Pill
                  quiet
                  active={!form.category}
                  onClick={() => setForm((f) => ({ ...f, category: null }))}
                >
                  Brak
                </Pill>
                {CATEGORY_ORDER.map((c) => (
                  <Pill
                    key={c}
                    quiet
                    active={form.category === c}
                    onClick={() => setForm((f) => ({ ...f, category: c }))}
                  >
                    {CATEGORY_LABELS[c]}
                  </Pill>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <SectionLabel>Sprzęt</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT_ORDER.map((eq) => (
                  <Pill
                    key={eq}
                    quiet
                    active={(form.equipment ?? []).includes(eq)}
                    onClick={() => toggleEquipment(eq)}
                  >
                    {EQUIPMENT_LABELS[eq]}
                  </Pill>
                ))}
                {unknownEquipment.map((eq) => (
                  <Pill key={eq} quiet active onClick={() => toggleEquipment(eq)}>
                    {eq}
                  </Pill>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Field label="Link do YouTube" hint="opcjonalnie">
                <input
                  className={inputClass}
                  value={youtubeRaw}
                  onChange={(e) => setYoutubeRaw(e.target.value)}
                  placeholder="https://youtu.be/… albo samo ID"
                  autoComplete="off"
                />
              </Field>
              <p className="text-xs text-muted">
                Własne wideo: wrzuć na YouTube jako niepubliczne i wklej link. Klient zobaczy je w portalu, bez osobnego konta.
              </p>
              {parsedYt.invalid ? (
                <p className="text-xs text-muted">Nie rozpoznano linku — możesz zapisać bez filmu.</p>
              ) : null}
              {parsedYt.id ? (
                <div className="flex items-start gap-3">
                  <div className="w-40 shrink-0 overflow-hidden rounded-[10px]">
                    <ExerciseThumb
                      youtubeId={parsedYt.id}
                      category={form.category}
                      alt={form.name || "Podgląd filmu"}
                      play="none"
                    />
                  </div>
                  <button
                    type="button"
                    className="text-sm font-medium text-accent-text hover:text-accent-strong"
                    onClick={() => {
                      setYoutubeRaw("");
                      setForm((f) => ({
                        ...f,
                        media: (f.media ?? []).filter((m) => m.kind !== "demo"),
                      }));
                    }}
                  >
                    Usuń film
                  </button>
                </div>
              ) : null}
            </div>
          </>
        ) : null}

        {isFull ? (
          <div className="space-y-2">
            <button
              type="button"
              className="text-sm font-medium text-accent-text hover:text-accent-strong"
              onClick={() => setDefaultsOpen((v) => !v)}
              aria-expanded={defaultsOpen}
            >
              {defaultsOpen ? "Mniej · domyślne w planie" : `Domyślne w planie · ${volumeSummary(form)}`}
            </button>
            {showDefaults ? (
              <DefaultsSection
                form={form}
                setForm={setForm}
                setsField={setsField}
                measureLabel={measureLabel}
                measureField={measureField}
                restField={restField}
                loadField={loadField}
                showLoad
              />
            ) : null}
          </div>
        ) : null}

        <div>
          <button
            type="button"
            className="text-sm font-medium text-accent-text hover:text-accent-strong"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
          >
            {isFull
              ? moreOpen
                ? "Mniej szczegółów"
                : "Więcej szczegółów"
              : moreOpen
                ? "Mniej pól"
                : "Więcej pól"}
          </button>
        </div>

        {showAdvanced ? (
          <div className="space-y-4 border-t border-border pt-4">
            <div className="space-y-2">
              <SectionLabel>Wzorzec ruchu</SectionLabel>
              <div className="flex flex-wrap gap-2">
                <Pill
                  quiet
                  active={!form.pattern}
                  onClick={() => setForm((f) => ({ ...f, pattern: null }))}
                >
                  Brak
                </Pill>
                {PATTERN_ORDER.map((p) => (
                  <Pill
                    key={p}
                    quiet
                    active={form.pattern === p}
                    onClick={() => setForm((f) => ({ ...f, pattern: p }))}
                  >
                    {PATTERN_LABELS[p]}
                  </Pill>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Field label="Mięśnie główne" hint="Enter dodaje">
                <input
                  className={inputClass}
                  value={muscleDraft}
                  onChange={(e) => setMuscleDraft(e.target.value)}
                  onKeyDown={onMuscleKey}
                  onBlur={addMuscle}
                  placeholder="np. klatka, triceps"
                />
              </Field>
              {(form.primaryMuscles?.length ?? 0) > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {form.primaryMuscles.map((m) => (
                    <Tag
                      key={m}
                      onRemove={() =>
                        setForm((f) => ({
                          ...f,
                          primaryMuscles: (f.primaryMuscles ?? []).filter((x) => x !== m),
                        }))
                      }
                    >
                      {m}
                    </Tag>
                  ))}
                </div>
              ) : null}
            </div>

            <Switch
              label="Ćwiczenie jednostronne"
              checked={form.isUnilateral}
              onChange={(checked) => setForm((f) => ({ ...f, isUnilateral: checked }))}
            />

            <Field label="Instrukcje" hint="jedna linia = jeden krok">
              <textarea
                className={textareaClass}
                rows={3}
                value={form.instructions ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value || null }))}
                placeholder={"1. Ustaw stopy…\n2. Napnij core…"}
              />
            </Field>

            <Field label="Opis">
              <textarea
                className={textareaClass}
                rows={2}
                value={form.description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value || null }))}
              />
            </Field>
          </div>
        ) : null}

        <button type="submit" className="hidden" tabIndex={-1} aria-hidden />
      </form>
    </Dialog>
  );
}

export function ExerciseFormDialog({
  open,
  mode = "create",
  variant = "full",
  prefill = DEFAULT_EXERCISE_INPUT,
  editExercise,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode?: Mode;
  variant?: Variant;
  prefill?: ExerciseInput;
  editExercise?: Exercise;
  onClose: () => void;
  onSubmit: (input: ExerciseInput) => Promise<void>;
}) {
  if (!open) return null;
  const remountKey =
    mode === "edit" && editExercise
      ? `edit-${editExercise.id}`
      : `create-${prefill.name}-${prefill.type}-${prefill.defaultSets}-${prefill.defaultReps}-${variant}`;

  return (
    <ExerciseFormDialogBody
      key={remountKey}
      mode={mode}
      variant={variant}
      prefill={prefill}
      editExercise={editExercise}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
