"use client";

import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";

const HISTORY_LIMIT = 60;
/** Wpisywanie ciężaru znak po znaku to jedna zmiana, nie osiem. */
const COALESCE_MS = 600;

export type UndoRedoApi = {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

/**
 * Historia dowolnego stanu trzymanego w `useState`. Obserwuje wartość i zapamiętuje
 * poprzednie wersje, więc trener nigdy nie traci tego, co właśnie wpisał — a wołający
 * dalej używa zwykłego, stabilnego settera (bez zmian w setkach callbacków).
 */
export function useUndoRedo<T>(value: T, setValue: Dispatch<SetStateAction<T>>): UndoRedoApi {
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const previous = useRef(value);
  const lastPushAt = useRef(0);
  const travelling = useRef(false);
  // Głębokości trzymamy w stanie — przyciski Cofnij/Ponów muszą się przerysować.
  const [depth, setDepth] = useState({ past: 0, future: 0 });

  const syncDepth = useCallback(() => {
    setDepth((prev) =>
      prev.past === past.current.length && prev.future === future.current.length
        ? prev
        : { past: past.current.length, future: future.current.length },
    );
  }, []);

  useEffect(() => {
    const prior = previous.current;
    if (prior === value) return;
    previous.current = value;
    if (travelling.current) {
      travelling.current = false;
      syncDepth();
      return;
    }
    const now = Date.now();
    // Zmiany w jednym ciągu (pisanie w polu) scalamy w jeden krok Cofnij.
    if (now - lastPushAt.current >= COALESCE_MS || past.current.length === 0) {
      past.current = [...past.current, prior].slice(-HISTORY_LIMIT);
    }
    lastPushAt.current = now;
    future.current = [];
    syncDepth();
  }, [value, syncDepth]);

  const undo = useCallback(() => {
    if (past.current.length === 0) return;
    const target = past.current[past.current.length - 1];
    past.current = past.current.slice(0, -1);
    future.current = [previous.current, ...future.current].slice(0, HISTORY_LIMIT);
    lastPushAt.current = 0;
    travelling.current = true;
    setValue(target);
  }, [setValue]);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    const target = future.current[0];
    future.current = future.current.slice(1);
    past.current = [...past.current, previous.current].slice(-HISTORY_LIMIT);
    lastPushAt.current = 0;
    travelling.current = true;
    setValue(target);
  }, [setValue]);

  return { undo, redo, canUndo: depth.past > 0, canRedo: depth.future > 0 };
}
