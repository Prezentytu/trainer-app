"use client";

import {
  KeyboardEvent,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  CATEGORY_LABELS,
  Exercise,
  ExerciseCategory,
  EXERCISE_TYPE_LABELS,
} from "@/lib/api";
import {
  createExercisePreviewLabel,
  ExerciseInput,
  exerciseInputFromQuickEntry,
} from "@/lib/exerciseDraft";
import { foldDiacritics, matchExercisesByName } from "@/lib/exerciseSearch";
import { demoMedia } from "@/lib/youtube";
import { CreateExerciseRow } from "@/components/CreateExerciseRow";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { Button, inputClass } from "@/components/ui";

function metaLabel(exercise: Exercise): string {
  if (exercise.category && exercise.category in CATEGORY_LABELS) {
    return CATEGORY_LABELS[exercise.category as ExerciseCategory];
  }
  return EXERCISE_TYPE_LABELS[exercise.type];
}

function exactNameExists(query: string, exercises: Exercise[]): boolean {
  const folded = foldDiacritics(query.trim());
  if (!folded) return false;
  return exercises.some((e) => foldDiacritics(e.name) === folded);
}

export function ExerciseCombobox({
  exercises,
  value,
  onSelect,
  onCreate,
  buildCreateInput,
  suggestedName,
  placeholder = "Szukaj ćwiczenia…",
  autoFocus,
  disabled,
  id,
  ariaLabel = "Ćwiczenie",
}: {
  exercises: Exercise[];
  value: number | null;
  onSelect: (exercise: Exercise) => void;
  /** Brak → brak wiersza „Utwórz”. */
  onCreate?: (input: ExerciseInput) => Promise<Exercise>;
  buildCreateInput?: (name: string) => ExerciseInput;
  suggestedName?: string;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
}) {
  const listboxId = useId();
  const selected = value != null ? exercises.find((e) => e.id === value) ?? null : null;
  /** Użytkownik kliknął „Zmień” — nawet gdy value jest ustawione. */
  const [forceEdit, setForceEdit] = useState(false);
  const editing = forceEdit || value == null;

  const [query, setQuery] = useState(() => suggestedName ?? "");
  const [highlighted, setHighlighted] = useState(0);
  const [focused, setFocused] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [menuBox, setMenuBox] = useState<{
    left: number;
    width: number;
    top: number | null;
    bottom: number | null;
    maxHeight: number;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(
    () => matchExercisesByName(query, exercises, 8),
    [query, exercises]
  );
  const q = query.trim();
  const showCreate =
    Boolean(onCreate) && q.length > 0 && !exactNameExists(q, exercises);
  const optionCount = matches.length + (showCreate ? 1 : 0);
  const createIndex = showCreate ? matches.length : -1;
  const activeIndex = optionCount === 0 ? 0 : Math.min(highlighted, optionCount - 1);
  const createActive = showCreate && activeIndex === createIndex;
  const active = !createActive ? (matches[activeIndex] ?? null) : null;
  const menuOpen = editing && focused && optionCount > 0;

  const draftInput = useMemo(
    () => (buildCreateInput ? buildCreateInput(q) : exerciseInputFromQuickEntry(q)),
    [buildCreateInput, q]
  );
  const previewLabel = createExercisePreviewLabel(draftInput);

  useLayoutEffect(() => {
    if (!menuOpen) return;
    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const gap = 6;
      const spaceAbove = rect.top - gap - 8;
      const spaceBelow = window.innerHeight - rect.bottom - gap - 8;
      const openUp = spaceAbove >= 160 || spaceAbove >= spaceBelow;
      const maxHeight = Math.min(280, Math.max(120, openUp ? spaceAbove : spaceBelow));
      setMenuBox({
        left: rect.left,
        width: Math.max(rect.width, 240),
        maxHeight,
        top: openUp ? null : rect.bottom + gap,
        bottom: openUp ? window.innerHeight - rect.top + gap : null,
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [menuOpen, query, optionCount]);

  const commitSelect = (exercise: Exercise) => {
    onSelect(exercise);
    setForceEdit(false);
    setQuery("");
    setHighlighted(0);
    setCreateError(null);
    setFocused(false);
  };

  const startEdit = () => {
    if (disabled) return;
    setForceEdit(true);
    setQuery(selected?.name ?? suggestedName ?? "");
    setHighlighted(0);
    setCreateError(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const createAndSelect = async () => {
    if (!onCreate || !showCreate || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const exercise = await onCreate(draftInput);
      commitSelect(exercise);
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (optionCount) setHighlighted((h) => Math.min(h + 1, optionCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (creating) return;
      if (createActive) void createAndSelect();
      else if (active) commitSelect(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (selected) {
        setForceEdit(false);
        setQuery("");
        setCreateError(null);
      } else {
        setQuery(suggestedName ?? "");
        setHighlighted(0);
        setCreateError(null);
        inputRef.current?.blur();
      }
    } else if (e.key === "Tab" && active && !createActive) {
      if (q && active.name.toLowerCase() !== q.toLowerCase()) {
        e.preventDefault();
        setQuery(active.name);
      }
    }
  };

  const activeDescendant =
    menuOpen && optionCount > 0
      ? createActive
        ? `${listboxId}-create`
        : `${listboxId}-opt-${active?.id ?? activeIndex}`
      : undefined;

  if (!editing && selected) {
    return (
      <div
        ref={anchorRef}
        className="flex min-h-[var(--h-field)] items-center gap-2 rounded-[var(--r-field)] border border-border-strong bg-field px-2.5"
      >
        <div className="h-7 w-7 shrink-0">
          <ExerciseThumb
            variant="square"
            youtubeId={demoMedia(selected).youtubeId}
            category={selected.category}
            alt={selected.name}
          />
        </div>
        <span className="min-w-0 flex-1 break-words text-sm font-medium text-foreground">
          {selected.name}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={startEdit}
        >
          Zmień
        </Button>
      </div>
    );
  }

  const menuList =
    menuOpen && menuBox ? (
      <div
        id={listboxId}
        role="listbox"
        aria-label={ariaLabel}
        className="fixed z-[60] overflow-hidden rounded-[10px] border border-border-strong bg-surface"
        style={{
          left: menuBox.left,
          width: menuBox.width,
          top: menuBox.top ?? undefined,
          bottom: menuBox.bottom ?? undefined,
          maxHeight: menuBox.maxHeight,
        }}
      >
        <ul className="max-h-[inherit] overflow-y-auto py-1">
          {matches.map((exercise, idx) => {
            const isActive = idx === activeIndex && !createActive;
            return (
              <li key={exercise.id} role="presentation">
                <button
                  type="button"
                  id={`${listboxId}-opt-${exercise.id}`}
                  role="option"
                  aria-selected={isActive}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commitSelect(exercise)}
                  onMouseEnter={() => setHighlighted(idx)}
                  className={`flex min-h-11 w-full items-center gap-2.5 px-3 py-2 text-left text-sm ${
                    isActive
                      ? "bg-surface-hover text-foreground"
                      : "text-foreground-secondary"
                  }`}
                >
                  <div className="h-8 w-8 shrink-0">
                    <ExerciseThumb
                      variant="square"
                      youtubeId={demoMedia(exercise).youtubeId}
                      category={exercise.category}
                      alt={exercise.name}
                    />
                  </div>
                  <span className="min-w-0 flex-1 break-words">{exercise.name}</span>
                  <span className="shrink-0 text-xs text-muted">{metaLabel(exercise)}</span>
                </button>
              </li>
            );
          })}
          {showCreate ? (
            <li
              id={`${listboxId}-create`}
              role="option"
              aria-selected={createActive}
              onMouseEnter={() => setHighlighted(createIndex)}
              className="px-1"
            >
              <CreateExerciseRow
                name={q}
                previewLabel={previewLabel}
                active={createActive}
                creating={creating}
                error={createError}
                onCreate={() => void createAndSelect()}
              />
            </li>
          ) : null}
        </ul>
      </div>
    ) : null;

  return (
    <div ref={anchorRef} className="relative">
      <input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={menuOpen}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={activeDescendant}
        className={`${inputClass} w-full`}
        placeholder={placeholder}
        value={query}
        disabled={disabled || creating}
        autoFocus={autoFocus}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlighted(0);
          setCreateError(null);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          if (selected && !creating) {
            setForceEdit(false);
            setQuery("");
            setCreateError(null);
          }
        }}
      />
      {typeof document !== "undefined" && menuList
        ? createPortal(menuList, document.body)
        : null}
    </div>
  );
}
