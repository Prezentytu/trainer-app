"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { api, Exercise, LastPrescription, Plan } from "@/lib/api";
import { DEFAULT_EXERCISE_INPUT, ExerciseInput } from "@/lib/exerciseDraft";
import { ExerciseName } from "@/components/ExerciseName";
import { ErrorBanner, SegmentedControl } from "@/components/ui";
import { PlanBuilderLibrarySkeleton } from "@/components/skeletons";
import { DayBoard } from "./DayBoard";
import { ExerciseDrawer } from "./ExerciseDrawer";
import {
  ExerciseLibraryProvider,
  NewExerciseRequest,
} from "./ExerciseLibraryContext";
import { ItemPanel } from "./ItemPanel";
import { ListView } from "./ListView";
import { MethodTemplateDialog } from "./MethodTemplateDialog";
import { ExerciseFormDialog } from "@/components/ExerciseFormDialog";
import { PlanToolbar, AssignedClientInfo } from "./PlanToolbar";
import { PlanTable } from "./PlanTable";
import { ProgressionView } from "./ProgressionView";
import { polishExerciseCount } from "@/lib/plural";
import { estimateDaysMinutes, formatDurationApprox } from "./summaryText";
import { useBuilderDnd } from "./useBuilderDnd";
import { useExerciseLibrary } from "./useExerciseLibrary";
import { BuilderDay, BuilderItem } from "./types";
import { usePlanDraft } from "./usePlanDraft";
import { usePlanPersistence } from "./usePlanPersistence";
import { LastPrescriptionProvider } from "./lastPrescription";
import { ComposerChromeProvider, useComposerChrome } from "./ComposerChrome";
import { WeekTabs } from "./WeekTabs";
import { downloadSavedPlan } from "@/lib/clientBundle";

type ActiveItem = { dayKey: string; itemKey: string };

type ViewMode = "list" | "board" | "table" | "progression";
const VIEW_MODE_STORAGE_KEY = "trainer-app:plan-builder-view-mode:v2";

/** Ten sam podgląd przeciąganego ćwiczenia w Tablicy, Liście i Arkuszu. */
function DragGhost({ item }: { item: BuilderItem }) {
  return (
    <div className="w-[280px] rounded-[10px] border border-border-strong bg-surface-active px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="text-muted-faint">⠿</span>
        <span className="text-[15px] font-medium">
          <ExerciseName name={item.exerciseName} />
        </span>
      </div>
      <p className="mt-1 pl-5 font-mono text-[12px] text-muted">Przenoszenie…</p>
    </div>
  );
}

function loadInitialViewMode(): ViewMode {
  if (typeof window === "undefined") return "list";
  const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  if (stored === "board" || stored === "table" || stored === "list" || stored === "progression") {
    return stored;
  }
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
  assignTo,
  onExit,
}: {
  plan?: Plan;
  initialName?: string;
  initialDescription?: string | null;
  initialIsTemplate?: boolean;
  initialDayCount?: number;
  initialWeekCount?: number;
  initialDays?: BuilderDay[];
  /** np. „Krok 2 z 2 · zbuduj plan ćwiczeniami” — tylko nowy plan */
  stepLabel?: string;
  /** Po utworzeniu planu automatycznie przypisz do klienta i wróć na jego profil. */
  assignTo?: { id: number; name: string };
  /** Wyjście z edycji istniejącego planu (menu ··· → Anuluj edycję). */
  onExit?: () => void;
}) {
  const library = useExerciseLibrary();
  const panelId = useId();
  const [viewMode, setViewMode] = useState<ViewMode>(loadInitialViewMode);
  const [drawerDayKey, setDrawerDayKey] = useState<string | null>(null);
  const [swapTarget, setSwapTarget] = useState<{ dayKey: string; itemKey: string } | null>(null);
  const [selectionDayKey, setSelectionDayKey] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null);
  const [assigned, setAssigned] = useState<AssignedClientInfo>(null);
  const [dialog, setDialog] = useState<DialogState>({ open: false });
  const [createdToast, setCreatedToast] = useState<Exercise | null>(null);
  const [methodOpen, setMethodOpen] = useState(false);
  const [listDayKey, setListDayKey] = useState<string | null>(null);
  const [lastById, setLastById] = useState<Map<number, LastPrescription>>(() => new Map());
  const getLastPrescription = useCallback((id: number) => lastById.get(id), [lastById]);

  const draft = usePlanDraft({
    plan,
    initialName,
    initialDescription,
    initialIsTemplate,
    initialDayCount,
    initialWeekCount,
    initialDays,
    getExerciseById: library.getExerciseById,
    getLastPrescription,
  });

  const persistence = usePlanPersistence({
    plan,
    name: draft.name,
    description: draft.description,
    isTemplate: draft.isTemplate,
    days: draft.days,
    assignTo,
    onSavedIds: draft.applySavedIds,
  });

  const dnd = useBuilderDnd({ days: draft.days, setDays: draft.setDays });

  useEffect(() => {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  const setPersistenceError = persistence.setError;
  useEffect(() => {
    if (library.error) setPersistenceError(library.error);
  }, [library.error, setPersistenceError]);

  const clientIdForHistory = assignTo?.id ?? assigned?.id;
  useEffect(() => {
    if (!clientIdForHistory || library.exercises.length === 0) return;
    let cancelled = false;
    api.clients
      .lastPrescription(
        clientIdForHistory,
        library.exercises.map((e) => e.id),
      )
      .then((r) => {
        if (!cancelled) setLastById(new Map(r.items.map((i) => [i.exerciseId, i])));
      })
      .catch(() => {
        /* historia jest opcjonalna */
      });
    return () => {
      cancelled = true;
    };
  }, [clientIdForHistory, library.exercises]);

  useEffect(() => {
    if (!plan) return;
    api.assignments
      .list()
      .then((list) => {
        const active = list.find((a) => a.planId === plan.id && a.status === "active");
        if (active) {
          setAssigned({
            id: active.clientId,
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
    if (weekItems.length === 0) return undefined;
    const mins = estimateDaysMinutes(draft.visibleDays, library.exercises);
    return `${polishExerciseCount(weekItems.length)} · ${formatDurationApprox(mins)}`;
  }, [weekItems, draft.visibleDays, library.exercises]);

  const resolvedListDayKey =
    listDayKey && draft.visibleDays.some((d) => d.key === listDayKey)
      ? listDayKey
      : (draft.visibleDays[0]?.key ?? null);

  const composerDayKey =
    viewMode === "list" ? resolvedListDayKey : (draft.visibleDays[0]?.key ?? null);

  const assignFirstName = assignTo?.name.split(/\s+/)[0] ?? null;
  const submitLabel = plan
    ? "Zapisz plan"
    : assignFirstName
      ? `Zapisz i przypisz do ${assignFirstName}`
      : "Utwórz plan";

  const boardCallbacks = {
    onAddDay: () => draft.addDay(draft.activeWeek),
    onPatchDay: draft.patchDay,
    onRemoveDay: draft.removeDay,
    onDuplicateDay: draft.duplicateDay,
    onMoveDay: draft.moveDay,
    onAddItem: draft.addItem,
    onPatchItem: draft.patchItem,
    onRemoveItem: draft.removeItem,
    onMoveItem: draft.moveItem,
    onToggleLink: draft.toggleLink,
    onAddSet: draft.addSet,
    onInsertSet: draft.insertSet,
    onPatchSet: draft.patchSet,
    onRemoveSet: draft.removeSet,
    onApplyPreset: draft.applyPreset,
    onApplyRestToAll: draft.applyRestToAllSets,
    onClearSets: draft.clearSets,
  };

  const activeDay = activeItem
    ? draft.days.find((d) => d.key === activeItem.dayKey) ?? null
    : null;
  const activeBuilderItem: BuilderItem | null =
    activeDay && activeItem
      ? activeDay.items.find((i) => i.key === activeItem.itemKey) ?? null
      : null;

  const handleSelectItem = useCallback((dayKey: string, itemKey: string) => {
    setActiveItem((prev) =>
      prev?.dayKey === dayKey && prev.itemKey === itemKey ? null : { dayKey, itemKey },
    );
  }, []);

  const handleViewModeChange = useCallback((v: string) => {
    setActiveItem(null);
    setViewMode(v as ViewMode);
  }, []);

  const { undo, redo } = draft;
  // ⌘Z / ⇧⌘Z na całym kreatorze — poza polami tekstowymi, gdzie cofa natywna edycja.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const setActiveWeek = draft.setActiveWeek;
  const handleWeekSelect = useCallback(
    (week: number) => {
      setActiveItem(null);
      setActiveWeek(week);
    },
    [setActiveWeek],
  );

  return (
    <ExerciseLibraryProvider value={libraryActions}>
      <LastPrescriptionProvider value={{ get: getLastPrescription }}>
      <ComposerChromeProvider preferredDayKey={composerDayKey}>
      <form
        onSubmit={persistence.handleSubmit}
        onKeyDown={(e) => {
          if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
          if (e.metaKey || e.ctrlKey) return;
          const target = e.target as HTMLElement;
          if (target.tagName === "TEXTAREA") return;
          if (target.tagName === "BUTTON" && (target as HTMLButtonElement).type === "submit") return;
          if (target.tagName !== "INPUT") return;
          e.preventDefault();
          target.blur();
        }}
        className="flex min-h-0 min-w-0 flex-1 flex-col"
      >
        <div className="shrink-0">
          <ErrorBanner message={persistence.error} />

          <PlanToolbarWithHelp
            name={draft.name}
            onNameChange={draft.setName}
            isTemplate={draft.isTemplate}
            onIsTemplateChange={draft.setIsTemplate}
            description={draft.description}
            onDescriptionChange={draft.setDescription}
            weeksCount={draft.weeks.length}
            lastSavedAt={persistence.lastSavedAt}
            isDirty={persistence.isDirty}
            autosaveFailed={persistence.autosaveFailed}
            onRetrySave={persistence.retryAutosave}
            planId={plan?.id}
            assigned={assigned}
            onAssigned={setAssigned}
            saving={persistence.saving}
            submitLabel={submitLabel}
            stepLabel={stepLabel}
            onExit={onExit}
            onApplyMethod={() => setMethodOpen(true)}
            onDownloadPlan={
              plan?.id
                ? () => {
                    void downloadSavedPlan(plan.id, draft.name || plan.name).catch((err: Error) =>
                      setPersistenceError(err.message),
                    );
                  }
                : undefined
            }
          />

          <WeekTabs
            weeks={draft.weeks}
            activeWeek={draft.activeWeek}
            onSelect={handleWeekSelect}
            onAddWeek={draft.addWeek}
            onCopyWeek={draft.copyWeek}
            onInsertWeek={draft.insertWeek}
            onDuplicateWeek={draft.duplicateWeek}
            onRemoveWeek={draft.removeWeek}
            onUndo={draft.undo}
            onRedo={draft.redo}
            canUndo={draft.canUndo}
            canRedo={draft.canRedo}
            days={viewMode === "list" ? draft.visibleDays : undefined}
            activeDayKey={viewMode === "list" ? resolvedListDayKey : undefined}
            onSelectDay={viewMode === "list" ? setListDayKey : undefined}
            onAddDay={viewMode === "list" ? () => draft.addDay(draft.activeWeek) : undefined}
            metaLabel={viewMode === "progression" ? undefined : weekMeta}
            right={
              <SegmentedControl
                items={[
                  { value: "list", label: "Lista" },
                  { value: "board", label: "Tablica" },
                  { value: "table", label: "Arkusz" },
                  { value: "progression", label: "Progresja" },
                ]}
                value={viewMode}
                onChange={handleViewModeChange}
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
            <DndContext
              sensors={dnd.sensors}
              collisionDetection={dnd.collisionDetection}
              onDragStart={dnd.handleDragStart}
              onDragOver={dnd.handleDragOver}
              onDragEnd={dnd.handleDragEnd}
            >
            <ListView
              days={draft.visibleDays}
              exercises={library.exercises}
              selectedDayKey={resolvedListDayKey}
              onAddDay={() => draft.addDay(draft.activeWeek)}
              onPatchDay={draft.patchDay}
              onRemoveDay={draft.removeDay}
              onDuplicateDay={draft.duplicateDay}
              onMoveDay={draft.moveDay}
              weeks={draft.weeks}
              onApplyWeekdays={draft.applyWeekdaysToOtherWeeks}
              onAddItem={draft.addItem}
              onAddItemAt={draft.addItemAt}
              onPatchItem={draft.patchItem}
              onRemoveItem={draft.removeItem}
              onDuplicateItem={draft.duplicateItem}
              onToggleWarmup={draft.toggleWarmup}
              onMoveItem={draft.moveItem}
              onUnlinkGroup={draft.unlinkGroup}
              onSwapItem={(dayKey, itemKey) => setSwapTarget({ dayKey, itemKey })}
              onAddSet={draft.addSet}
              onInsertSet={draft.insertSet}
              onPatchSet={draft.patchSet}
              onRemoveSet={draft.removeSet}
              onApplyPreset={draft.applyPreset}
              onApplyRestToAll={draft.applyRestToAllSets}
              onClearSets={draft.clearSets}
            />
            <DragOverlay>{dnd.activeDragItem ? <DragGhost item={dnd.activeDragItem} /> : null}</DragOverlay>
            </DndContext>
          </div>
        ) : viewMode === "board" ? (
          <div className="flex min-h-0 flex-1">
            <div className="min-h-0 min-w-0 flex-1">
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
                  activeItemKey={activeItem?.itemKey ?? null}
                  panelId={panelId}
                  onSelectionChange={(dayKey, keys) => {
                    setSelectionDayKey(dayKey);
                    setSelectedKeys(keys);
                  }}
                  onSelectItem={handleSelectItem}
                  onOpenDrawer={setDrawerDayKey}
                  onLinkSelected={draft.linkSelected}
                  onUnlinkGroup={draft.unlinkGroup}
                  onDuplicateItem={draft.duplicateItem}
                  onSwapItem={(dayKey, itemKey) => setSwapTarget({ dayKey, itemKey })}
                  onToggleWarmup={draft.toggleWarmup}
                  onAddDay={boardCallbacks.onAddDay}
                  onPatchDay={boardCallbacks.onPatchDay}
                  onRemoveDay={boardCallbacks.onRemoveDay}
                  onDuplicateDay={boardCallbacks.onDuplicateDay}
                  onMoveDay={boardCallbacks.onMoveDay}
                  weeks={draft.weeks}
                  onApplyWeekdays={draft.applyWeekdaysToOtherWeeks}
                  onAddItem={boardCallbacks.onAddItem}
                  onRemoveItem={(dayKey, itemKey) => {
                    if (activeItem?.dayKey === dayKey && activeItem.itemKey === itemKey) {
                      setActiveItem(null);
                    }
                    boardCallbacks.onRemoveItem(dayKey, itemKey);
                  }}
                  onMoveItem={boardCallbacks.onMoveItem}
                  onToggleLink={boardCallbacks.onToggleLink}
                />
                <DragOverlay>
                  {dnd.activeDragItem ? <DragGhost item={dnd.activeDragItem} /> : null}
                </DragOverlay>
              </DndContext>
            </div>
            <ItemPanel
              item={activeBuilderItem}
              dayItems={activeDay?.items ?? []}
              weekNumber={activeDay?.weekNumber ?? draft.activeWeek}
              exercise={
                activeBuilderItem
                  ? library.getExerciseById(activeBuilderItem.exerciseId)
                  : undefined
              }
              open={activeItem != null && activeBuilderItem != null}
              panelId={panelId}
              onClose={() => setActiveItem(null)}
              onSelectItem={(itemKey) => {
                if (activeItem) setActiveItem({ dayKey: activeItem.dayKey, itemKey });
              }}
              onPatch={(patch) => {
                if (activeItem) draft.patchItem(activeItem.dayKey, activeItem.itemKey, patch);
              }}
              onAddSet={() => {
                if (activeItem) draft.addSet(activeItem.dayKey, activeItem.itemKey);
              }}
              onInsertSet={(index, side) =>
                activeItem
                  ? draft.insertSet(activeItem.dayKey, activeItem.itemKey, index, side)
                  : undefined
              }
              onApplyRestToAll={(seconds) => {
                if (activeItem) {
                  draft.applyRestToAllSets(activeItem.dayKey, activeItem.itemKey, seconds);
                }
              }}
              onPatchSet={(setKey, patch) => {
                if (activeItem) draft.patchSet(activeItem.dayKey, activeItem.itemKey, setKey, patch);
              }}
              onRemoveSet={(setKey) => {
                if (activeItem) draft.removeSet(activeItem.dayKey, activeItem.itemKey, setKey);
              }}
              onApplyPreset={(presetId) => {
                if (activeItem) draft.applyPreset(activeItem.dayKey, activeItem.itemKey, presetId);
              }}
              onClearSets={() => {
                if (activeItem) draft.clearSets(activeItem.dayKey, activeItem.itemKey);
              }}
              onDuplicate={() => {
                if (activeItem) draft.duplicateItem(activeItem.dayKey, activeItem.itemKey);
              }}
              onSwap={() => {
                if (activeItem) setSwapTarget({ dayKey: activeItem.dayKey, itemKey: activeItem.itemKey });
              }}
              onRemove={() => {
                if (!activeItem) return;
                const { dayKey, itemKey } = activeItem;
                setActiveItem(null);
                draft.removeItem(dayKey, itemKey);
              }}
            />
          </div>
        ) : viewMode === "progression" ? (
          <ProgressionView
            days={draft.days}
            activeWeek={draft.activeWeek}
            onPatchItem={draft.patchItem}
          />
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <DndContext
              sensors={dnd.sensors}
              collisionDetection={dnd.collisionDetection}
              onDragStart={dnd.handleDragStart}
              onDragOver={dnd.handleDragOver}
              onDragEnd={dnd.handleDragEnd}
            >
              <PlanTable
                days={draft.visibleDays}
                exercises={library.exercises}
                weeks={draft.weeks}
                onApplyWeekdays={draft.applyWeekdaysToOtherWeeks}
                {...boardCallbacks}
              />
              <DragOverlay>{dnd.activeDragItem ? <DragGhost item={dnd.activeDragItem} /> : null}</DragOverlay>
            </DndContext>
          </div>
        )}

        <ExerciseDrawer
          open={drawerDayKey != null || swapTarget != null}
          exercises={library.exercises}
          onClose={() => {
            setDrawerDayKey(null);
            setSwapTarget(null);
          }}
          onAdd={(exerciseId) => {
            if (swapTarget) {
              draft.swapItem(swapTarget.dayKey, swapTarget.itemKey, exerciseId);
              setSwapTarget(null);
              return;
            }
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

        <MethodTemplateDialog
          open={methodOpen}
          days={draft.days}
          onClose={() => setMethodOpen(false)}
          onApply={draft.applyMethodTemplate}
        />

        {draft.toastNode}

        {createdToast && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-[10px] border border-border-strong bg-surface px-4 py-3 text-sm">
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
      </ComposerChromeProvider>
      </LastPrescriptionProvider>
    </ExerciseLibraryProvider>
  );
}

function PlanToolbarWithHelp(props: Omit<Parameters<typeof PlanToolbar>[0], "onOpenComposerHelp">) {
  const { setHelpOpen } = useComposerChrome();
  return <PlanToolbar {...props} onOpenComposerHelp={() => setHelpOpen(true)} />;
}
