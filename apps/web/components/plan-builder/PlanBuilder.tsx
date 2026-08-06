"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { api, Exercise, Plan } from "@/lib/api";
import { DEFAULT_EXERCISE_INPUT, ExerciseInput } from "@/lib/exerciseDraft";
import { ErrorBanner, SegmentedControl } from "@/components/ui";
import { PlanBuilderLibrarySkeleton } from "@/components/skeletons";
import { DayBoard } from "./DayBoard";
import { ExerciseDrawer } from "./ExerciseDrawer";
import {
  ExerciseLibraryProvider,
  NewExerciseRequest,
} from "./ExerciseLibraryContext";
import { ListView } from "./ListView";
import { ExerciseFormDialog } from "@/components/ExerciseFormDialog";
import { PlanToolbar, AssignedClientInfo } from "./PlanToolbar";
import { PlanTable } from "./PlanTable";
import { estimateWeekMinutes, formatDurationApprox } from "./summaryText";
import { useBuilderDnd } from "./useBuilderDnd";
import { useExerciseLibrary } from "./useExerciseLibrary";
import { BuilderDay } from "./types";
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
  initialDescription,
  initialIsTemplate,
  initialDayCount,
  initialWeekCount,
  initialDays,
  stepLabel,
  onExit,
}: {
  plan?: Plan;
  initialName?: string;
  initialDescription?: string | null;
  initialIsTemplate?: boolean;
  initialDayCount?: number;
  initialWeekCount?: number;
  initialDays?: BuilderDay[];
  /** np. „Krok 2 z 3 · zbuduj plan ćwiczeniami” — tylko nowy plan */
  stepLabel?: string;
  /** Wyjście z edycji istniejącego planu (menu ··· → Anuluj edycję). */
  onExit?: () => void;
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
    initialDescription,
    initialIsTemplate,
    initialDayCount,
    initialWeekCount,
    initialDays,
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

  const submitLabel = plan ? "Zapisz plan" : "Utwórz plan";

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
      <form
        onSubmit={persistence.handleSubmit}
        className="flex min-h-0 min-w-0 flex-1 flex-col"
      >
        <div className="shrink-0">
          <ErrorBanner message={persistence.error} />

          <PlanToolbar
            name={draft.name}
            onNameChange={draft.setName}
            isTemplate={draft.isTemplate}
            onIsTemplateChange={draft.setIsTemplate}
            description={draft.description}
            onDescriptionChange={draft.setDescription}
            weeksCount={draft.weeks.length}
            lastSavedAt={persistence.lastSavedAt}
            isDirty={persistence.isDirty}
            planId={plan?.id}
            assigned={assigned}
            onAssigned={setAssigned}
            saving={persistence.saving}
            submitLabel={submitLabel}
            stepLabel={stepLabel}
            onExit={onExit}
          />

          <WeekTabs
            weeks={draft.weeks}
            activeWeek={draft.activeWeek}
            onSelect={draft.setActiveWeek}
            onAddWeek={draft.addWeek}
            onCopyWeek={draft.copyWeek}
            metaLabel={viewMode === "list" ? undefined : weekMeta}
            right={
              <SegmentedControl
                items={[
                  { value: "list", label: "Lista" },
                  { value: "board", label: "Tablica" },
                  { value: "table", label: "Arkusz" },
                ]}
                value={viewMode}
                onChange={(v) => setViewMode(v as ViewMode)}
              />
            }
          />

          {library.loading && library.exercises.length === 0 ? (
            <div className="mb-3 rounded-xl border border-border bg-surface p-3">
              <PlanBuilderLibrarySkeleton />
            </div>
          ) : null}
        </div>

        {viewMode === "list" ? (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
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
              onDuplicateItem={draft.duplicateItem}
              onToggleWarmup={draft.toggleWarmup}
              onAddSet={draft.addSet}
              onPatchSet={draft.patchSet}
              onRemoveSet={draft.removeSet}
              onApplyPreset={draft.applyPreset}
              onClearSets={draft.clearSets}
            />
          </div>
        ) : viewMode === "board" ? (
          <div className="min-h-0 flex-1">
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
                  <div className="w-[280px] rounded-[10px] border border-border-strong bg-surface-active px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-faint">⠿</span>
                      <span className="text-[15px] font-medium">{dnd.activeDragItem.exerciseName}</span>
                    </div>
                    <p className="mt-1 pl-5 font-mono text-[12px] text-muted">Przenoszenie…</p>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <PlanTable days={draft.visibleDays} exercises={library.exercises} {...boardCallbacks} />
          </div>
        )}

        <ExerciseDrawer
          open={drawerDayKey != null}
          exercises={library.exercises}
          onClose={() => setDrawerDayKey(null)}
          onAdd={(exerciseId) => {
            if (drawerDayKey) draft.addItem(drawerDayKey, exerciseId);
          }}
        />

        <ExerciseFormDialog
          open={dialog.open}
          mode={dialog.open ? dialog.mode : "create"}
          variant="quick"
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
