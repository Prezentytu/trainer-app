"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { api, Exercise, Plan } from "@/lib/api";
import { DEFAULT_EXERCISE_INPUT, ExerciseInput } from "@/lib/exerciseDraft";
import { ErrorBanner, SegmentedControl } from "@/components/ui";
import { DayBoard } from "./DayBoard";
import { ExerciseDrawer } from "./ExerciseDrawer";
import {
  ExerciseLibraryProvider,
  NewExerciseRequest,
} from "./ExerciseLibraryContext";
import { ListView } from "./ListView";
import { NewExerciseDialog } from "./NewExerciseDialog";
import { PlanHeader, AssignedClientInfo } from "./PlanHeader";
import { PlanTable } from "./PlanTable";
import { estimateWeekMinutes, formatDurationApprox } from "./summaryText";
import { useBuilderDnd } from "./useBuilderDnd";
import { useExerciseLibrary } from "./useExerciseLibrary";
import { usePlanDraft } from "./usePlanDraft";
import { usePlanPersistence } from "./usePlanPersistence";
import { WeekTabs } from "./WeekTabs";

type ViewMode = "list" | "board" | "table";
const VIEW_MODE_STORAGE_KEY = "trainer-app:plan-builder-view-mode:v2";

function loadInitialViewMode(): ViewMode {
  if (typeof window === "undefined") return "list";
  const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  if (stored === "board" || stored === "table" || stored === "list") return stored;
  return "list";
}

type DialogState =
  | { open: false }
  | {
      open: true;
      mode: "create" | "edit";
      prefill: ExerciseInput;
      editExercise?: Exercise;
      onCreated?: (exercise: Exercise) => void;
    };

export default function PlanBuilder({
  plan,
  initialName,
  initialIsTemplate,
  initialDayCount,
  initialWeekCount,
  stepLabel,
}: {
  plan?: Plan;
  initialName?: string;
  initialIsTemplate?: boolean;
  initialDayCount?: number;
  initialWeekCount?: number;
  /** np. „Krok 2 z 3 · zbuduj plan ćwiczeniami” — tylko nowy plan */
  stepLabel?: string;
}) {
  const library = useExerciseLibrary();
  const [viewMode, setViewMode] = useState<ViewMode>(loadInitialViewMode);
  const [drawerDayKey, setDrawerDayKey] = useState<string | null>(null);
  const [selectionDayKey, setSelectionDayKey] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [assigned, setAssigned] = useState<AssignedClientInfo>(null);
  const [dialog, setDialog] = useState<DialogState>({ open: false });
  const [createdToast, setCreatedToast] = useState<Exercise | null>(null);

  const draft = usePlanDraft({
    plan,
    initialName,
    initialIsTemplate,
    initialDayCount,
    initialWeekCount,
    getExerciseById: library.getExerciseById,
  });

  const persistence = usePlanPersistence({
    plan,
    name: draft.name,
    description: draft.description,
    isTemplate: draft.isTemplate,
    days: draft.days,
  });

  const dnd = useBuilderDnd({ days: draft.days, setDays: draft.setDays });

  useEffect(() => {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  const setPersistenceError = persistence.setError;
  useEffect(() => {
    if (library.error) setPersistenceError(library.error);
  }, [library.error, setPersistenceError]);

  useEffect(() => {
    if (!plan) return;
    api.assignments
      .list()
      .then((list) => {
        const active = list.find((a) => a.planId === plan.id && a.status === "active");
        if (active) {
          setAssigned({
            name: active.clientName,
            startDate: active.startDate,
            weeksCount: plan.weeksCount || draft.weeks.length,
          });
        }
      })
      .catch(() => {
        /* kontekst klienta jest opcjonalny */
      });
  }, [plan, draft.weeks.length]);

  useEffect(() => {
    if (!createdToast) return;
    const t = window.setTimeout(() => setCreatedToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [createdToast]);

  const notifyCreated = useCallback((exercise: Exercise, created: boolean) => {
    if (created) setCreatedToast(exercise);
  }, []);

  const requestNewExercise = useCallback((req: NewExerciseRequest) => {
    setDialog({
      open: true,
      mode: req.editExercise ? "edit" : "create",
      prefill: req.prefill,
      editExercise: req.editExercise,
      onCreated: req.onCreated,
    });
  }, []);

  const libraryActions = useMemo(
    () => ({
      createExercise: async (input: ExerciseInput) => {
        const result = await library.createExercise(input);
        notifyCreated(result.exercise, result.created);
        return result;
      },
      updateExercise: library.updateExercise,
      requestNewExercise,
    }),
    [library, notifyCreated, requestNewExercise]
  );

  const handleDialogSubmit = async (input: ExerciseInput) => {
    if (!dialog.open) return;
    if (dialog.mode === "edit" && dialog.editExercise) {
      await library.updateExercise(dialog.editExercise.id, input);
      return;
    }
    const result = await library.createExercise(input);
    notifyCreated(result.exercise, result.created);
    dialog.onCreated?.(result.exercise);
  };

  const weekItems = useMemo(
    () => draft.visibleDays.flatMap((d) => d.items),
    [draft.visibleDays]
  );
  const weekMeta = useMemo(() => {
    const count = weekItems.length;
    const mins = estimateWeekMinutes(weekItems, library.exercises);
    return `${count} ćwiczeń · ${formatDurationApprox(mins)}`;
  }, [weekItems, library.exercises]);

  const daysPerWeek = draft.visibleDays.length;
  const submitLabel = plan
    ? draft.isTemplate
      ? "Zapisz szablon"
      : "Zapisz plan"
    : draft.isTemplate
      ? "Utwórz szablon"
      : "Utwórz plan";

  const boardCallbacks = {
    onAddDay: () => draft.addDay(draft.activeWeek),
    onPatchDay: draft.patchDay,
    onRemoveDay: draft.removeDay,
    onDuplicateDay: draft.duplicateDay,
    onAddItem: draft.addItem,
    onPatchItem: draft.patchItem,
    onRemoveItem: draft.removeItem,
    onMoveItem: draft.moveItem,
    onToggleLink: draft.toggleLink,
    onAddSet: draft.addSet,
    onPatchSet: draft.patchSet,
    onRemoveSet: draft.removeSet,
    onApplyPreset: draft.applyPreset,
    onClearSets: draft.clearSets,
  };

  return (
    <ExerciseLibraryProvider value={libraryActions}>
      <form onSubmit={persistence.handleSubmit}>
        <ErrorBanner message={persistence.error} />

        <PlanHeader
          name={draft.name}
          onNameChange={draft.setName}
          isTemplate={draft.isTemplate}
          onIsTemplateChange={draft.setIsTemplate}
          description={draft.description}
          onDescriptionChange={draft.setDescription}
          daysPerWeek={daysPerWeek}
          activeWeek={draft.activeWeek}
          weeksCount={draft.weeks.length}
          lastSavedAt={persistence.lastSavedAt}
          isDirty={persistence.isDirty}
          planId={plan?.id}
          assigned={assigned}
          onAssigned={setAssigned}
          saving={persistence.saving}
          submitLabel={submitLabel}
          stepLabel={stepLabel}
        />

        <div className="mb-3 flex justify-end">
          <SegmentedControl
            items={[
              { value: "list", label: "Lista" },
              { value: "board", label: "Tablica" },
              { value: "table", label: "Arkusz" },
            ]}
            value={viewMode}
            onChange={(v) => setViewMode(v as ViewMode)}
          />
        </div>

        <WeekTabs
          weeks={draft.weeks}
          activeWeek={draft.activeWeek}
          onSelect={draft.setActiveWeek}
          onAddWeek={draft.addWeek}
          onCopyWeek={draft.copyWeek}
          metaLabel={viewMode === "list" ? undefined : weekMeta}
        />

        {viewMode === "list" ? (
          <ListView
            days={draft.visibleDays}
            exercises={library.exercises}
            onAddDay={() => draft.addDay(draft.activeWeek)}
            onPatchDay={draft.patchDay}
            onRemoveDay={draft.removeDay}
            onDuplicateDay={draft.duplicateDay}
            onAddItem={draft.addItem}
            onAddItemAt={draft.addItemAt}
            onPatchItem={draft.patchItem}
            onRemoveItem={draft.removeItem}
            onToggleWarmup={draft.toggleWarmup}
            onAddSet={draft.addSet}
            onPatchSet={draft.patchSet}
            onRemoveSet={draft.removeSet}
            onApplyPreset={draft.applyPreset}
            onClearSets={draft.clearSets}
          />
        ) : viewMode === "board" ? (
          <DndContext
            sensors={dnd.sensors}
            collisionDetection={dnd.collisionDetection}
            onDragStart={dnd.handleDragStart}
            onDragOver={dnd.handleDragOver}
            onDragEnd={dnd.handleDragEnd}
          >
            <DayBoard
              days={draft.visibleDays}
              exercises={library.exercises}
              dropTarget={dnd.dropTarget}
              selectionDayKey={selectionDayKey}
              selectedKeys={selectedKeys}
              onSelectionChange={(dayKey, keys) => {
                setSelectionDayKey(dayKey);
                setSelectedKeys(keys);
              }}
              onOpenDrawer={setDrawerDayKey}
              onLinkSelected={draft.linkSelected}
              onUnlinkGroup={draft.unlinkGroup}
              {...boardCallbacks}
            />
            <DragOverlay>
              {dnd.activeDragItem && (
                <div
                  className="w-[248px] rounded-[10px] border border-accent-strong bg-surface-hover px-3 py-2.5 shadow-raised"
                  style={{ transform: "rotate(-2deg)" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-accent-strong">⠿</span>
                    <span className="text-sm font-semibold">{dnd.activeDragItem.exerciseName}</span>
                  </div>
                  <p className="mt-1 pl-6 font-mono text-xs text-muted">Przenoszenie…</p>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        ) : (
          <PlanTable days={draft.visibleDays} exercises={library.exercises} {...boardCallbacks} />
        )}

        <ExerciseDrawer
          open={drawerDayKey != null}
          exercises={library.exercises}
          onClose={() => setDrawerDayKey(null)}
          onAdd={(exerciseId) => {
            if (drawerDayKey) draft.addItem(drawerDayKey, exerciseId);
          }}
        />

        <NewExerciseDialog
          open={dialog.open}
          mode={dialog.open ? dialog.mode : "create"}
          prefill={dialog.open ? dialog.prefill : DEFAULT_EXERCISE_INPUT}
          editExercise={dialog.open ? dialog.editExercise : undefined}
          onClose={() => setDialog({ open: false })}
          onSubmit={handleDialogSubmit}
        />

        {draft.toastNode}

        {createdToast && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-[10px] border border-border-strong bg-surface px-4 py-3 text-sm shadow-raised">
            <span className="text-foreground-secondary">
              Nowe ćwiczenie „{createdToast.name}” w bibliotece
            </span>
            <button
              type="button"
              onClick={() => {
                const exercise = createdToast;
                setCreatedToast(null);
                setDialog({
                  open: true,
                  mode: "edit",
                  prefill: DEFAULT_EXERCISE_INPUT,
                  editExercise: exercise,
                });
              }}
              className="font-semibold text-accent hover:text-accent-strong"
            >
              Popraw szczegóły
            </button>
          </div>
        )}
      </form>
    </ExerciseLibraryProvider>
  );
}
