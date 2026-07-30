"use client";

import { FormEvent, useState } from "react";
import { Exercise, ExerciseType, EXERCISE_TYPE_LABELS } from "@/lib/api";
import { DEFAULT_EXERCISE_INPUT, ExerciseInput } from "@/lib/exerciseDraft";
import { Dialog, Field, SegmentedControl, inputClass } from "@/components/ui";

type Mode = "create" | "edit";

function initialForm(
  mode: Mode,
  prefill: ExerciseInput,
  editExercise?: Exercise
): ExerciseInput {
  if (mode === "edit" && editExercise) {
    return {
      name: editExercise.name,
      description: editExercise.description,
      type: editExercise.type,
      defaultSets: editExercise.defaultSets,
      defaultReps: editExercise.defaultReps,
      defaultRepDurationSeconds: editExercise.defaultRepDurationSeconds,
      defaultDistanceMeters: editExercise.defaultDistanceMeters,
      defaultRestBetweenSetsSeconds: editExercise.defaultRestBetweenSetsSeconds,
      defaultLoadKg: editExercise.defaultLoadKg,
      category: editExercise.category,
      pattern: editExercise.pattern,
      isUnilateral: editExercise.isUnilateral,
      equipment: editExercise.equipment ?? [],
      primaryMuscles: editExercise.primaryMuscles ?? [],
      instructions: editExercise.instructions,
      media: editExercise.media ?? [],
    };
  }
  return { ...DEFAULT_EXERCISE_INPUT, ...prefill };
}

function NewExerciseDialogBody({
  mode,
  prefill,
  editExercise,
  onClose,
  onSubmit,
}: {
  mode: Mode;
  prefill: ExerciseInput;
  editExercise?: Exercise;
  onClose: () => void;
  onSubmit: (input: ExerciseInput) => Promise<void>;
}) {
  const [form, setForm] = useState<ExerciseInput>(() => initialForm(mode, prefill, editExercise));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setType = (type: ExerciseType) => {
    setForm((f) => ({
      ...f,
      type,
      defaultReps: type === "time" ? Math.max(f.defaultReps, 1) : f.defaultReps || 10,
      defaultRepDurationSeconds:
        type === "time" ? f.defaultRepDurationSeconds ?? 30 : null,
      defaultDistanceMeters: type === "distance" ? f.defaultDistanceMeters ?? 20 : null,
    }));
  };

  const handleConfirm = async () => {
    if (saving) return;
    const name = form.name.trim().replace(/\s+/g, " ");
    if (!name) {
      setError("Podaj nazwę ćwiczenia.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload: ExerciseInput = {
      ...form,
      name,
      defaultRepDurationSeconds: form.type === "time" ? form.defaultRepDurationSeconds ?? 30 : null,
      defaultDistanceMeters: form.type === "distance" ? form.defaultDistanceMeters ?? 20 : null,
    };
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

  return (
    <Dialog
      open
      title={mode === "edit" ? "Popraw ćwiczenie" : "Nowe ćwiczenie"}
      description={
        mode === "edit"
          ? "Zmień typ lub domyślne parametry — pozycja w planie zostaje."
          : "Dodaj do biblioteki i wstaw do dnia. Typ możesz zmienić później."
      }
      confirmLabel={
        saving
          ? mode === "edit"
            ? "Zapisywanie…"
            : "Tworzę…"
          : mode === "edit"
            ? "Zapisz"
            : "Utwórz i dodaj"
      }
      cancelLabel="Anuluj"
      onCancel={onClose}
      onConfirm={() => void handleConfirm()}
    >
      <form onSubmit={onFormSubmit} className="space-y-4">
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Field label="Nazwa *">
          <input
            autoFocus
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="np. Wyciskanie jednorącz"
          />
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
        <div className="grid grid-cols-2 gap-3">
          <Field label="Serie">
            <input
              className={inputClass}
              type="number"
              min={1}
              value={form.defaultSets}
              onChange={(e) => setForm((f) => ({ ...f, defaultSets: Number(e.target.value) || 1 }))}
            />
          </Field>
          {form.type === "reps" && (
            <Field label="Powtórzenia">
              <input
                className={inputClass}
                type="number"
                min={1}
                value={form.defaultReps}
                onChange={(e) => setForm((f) => ({ ...f, defaultReps: Number(e.target.value) || 1 }))}
              />
            </Field>
          )}
          {form.type === "time" && (
            <Field label="Czas powt. (s)">
              <input
                className={inputClass}
                type="number"
                min={5}
                value={form.defaultRepDurationSeconds ?? 30}
                onChange={(e) =>
                  setForm((f) => ({ ...f, defaultRepDurationSeconds: Number(e.target.value) || 30 }))
                }
              />
            </Field>
          )}
          {form.type === "distance" && (
            <Field label="Dystans (m)">
              <input
                className={inputClass}
                type="number"
                min={1}
                value={form.defaultDistanceMeters ?? 20}
                onChange={(e) =>
                  setForm((f) => ({ ...f, defaultDistanceMeters: Number(e.target.value) || 20 }))
                }
              />
            </Field>
          )}
          <Field label="Przerwa (s)">
            <input
              className={inputClass}
              type="number"
              min={0}
              value={form.defaultRestBetweenSetsSeconds}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  defaultRestBetweenSetsSeconds: Number(e.target.value) || 0,
                }))
              }
            />
          </Field>
        </div>
        <button type="submit" className="hidden" tabIndex={-1} aria-hidden />
      </form>
    </Dialog>
  );
}

export function NewExerciseDialog({
  open,
  mode = "create",
  prefill,
  editExercise,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode?: Mode;
  prefill: ExerciseInput;
  editExercise?: Exercise;
  onClose: () => void;
  onSubmit: (input: ExerciseInput) => Promise<void>;
}) {
  if (!open) return null;
  const remountKey =
    mode === "edit" && editExercise
      ? `edit-${editExercise.id}`
      : `create-${prefill.name}-${prefill.type}-${prefill.defaultSets}-${prefill.defaultReps}`;

  return (
    <NewExerciseDialogBody
      key={remountKey}
      mode={mode}
      prefill={prefill}
      editExercise={editExercise}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
