"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { playRestEndAlarm, unlockAudio } from "@/lib/restAlarm";

const STORAGE_KEY = "wa-rest-timer";

type StoredRest = {
  endsAt: number;
  totalSeconds: number;
  sessionId: number;
};

function readStored(sessionId: number): StoredRest | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredRest;
    if (parsed.sessionId !== sessionId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(data: StoredRest | null) {
  if (typeof window === "undefined") return;
  try {
    if (!data) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export type RestTimerState = {
  endsAt: number;
  totalSeconds: number;
  leftSeconds: number;
  expanded: boolean;
};

function initialRest(sessionId: number): RestTimerState | null {
  const stored = readStored(sessionId);
  if (!stored) return null;
  const left = Math.max(0, Math.ceil((stored.endsAt - Date.now()) / 1000));
  if (left <= 0) {
    writeStored(null);
    return null;
  }
  return {
    endsAt: stored.endsAt,
    totalSeconds: stored.totalSeconds,
    leftSeconds: left,
    expanded: false,
  };
}

export function useRestTimer(sessionId: number) {
  const [rest, setRest] = useState<RestTimerState | null>(() => initialRest(sessionId));
  const alarmedRef = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const ensureTick = useCallback(() => {
    if (tickRef.current) return;
    tickRef.current = setInterval(() => {
      setRest((prev) => {
        if (!prev) return null;
        const left = Math.max(0, Math.ceil((prev.endsAt - Date.now()) / 1000));
        if (left <= 0) {
          clearTick();
          writeStored(null);
          if (!alarmedRef.current) {
            alarmedRef.current = true;
            playRestEndAlarm();
          }
          return null;
        }
        if (left === prev.leftSeconds) return prev;
        return { ...prev, leftSeconds: left };
      });
    }, 250);
  }, []);

  const restActive = rest != null;
  const restEndsAt = rest?.endsAt ?? 0;

  // Ticker gdy jest aktywna przerwa (nie restartuj przy każdej sekundzie)
  useEffect(() => {
    if (!restActive) {
      clearTick();
      return;
    }
    ensureTick();
    return () => clearTick();
  }, [restActive, restEndsAt, ensureTick]);

  // Po powrocie z tła — dograj czas / alarm
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      setRest((prev) => {
        if (!prev) return null;
        const left = Math.max(0, Math.ceil((prev.endsAt - Date.now()) / 1000));
        if (left <= 0) {
          writeStored(null);
          if (!alarmedRef.current) {
            alarmedRef.current = true;
            playRestEndAlarm();
          }
          return null;
        }
        return { ...prev, leftSeconds: left };
      });
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Jeśli przy starcie przerwa już minęła (initialRest zwrócił null, ale był zapis) — alarm
  useEffect(() => {
    const stored = readStored(sessionId);
    if (stored && stored.endsAt <= Date.now()) {
      writeStored(null);
      if (!alarmedRef.current) {
        alarmedRef.current = true;
        // odłóż poza sync effect — unikamy setState w efekcie
        queueMicrotask(() => playRestEndAlarm());
      }
    }
  }, [sessionId]);

  const startRest = useCallback(
    (seconds: number) => {
      unlockAudio();
      alarmedRef.current = false;
      const endsAt = Date.now() + seconds * 1000;
      writeStored({ endsAt, totalSeconds: seconds, sessionId });
      setRest({ endsAt, totalSeconds: seconds, leftSeconds: seconds, expanded: false });
    },
    [sessionId],
  );

  const adjustRest = useCallback(
    (deltaSeconds: number) => {
      setRest((prev) => {
        if (!prev) return null;
        const nextEnds = Math.max(Date.now() + 1000, prev.endsAt + deltaSeconds * 1000);
        const left = Math.max(0, Math.ceil((nextEnds - Date.now()) / 1000));
        const totalSeconds = Math.max(prev.totalSeconds, left);
        writeStored({ endsAt: nextEnds, totalSeconds, sessionId });
        return { ...prev, endsAt: nextEnds, leftSeconds: left, totalSeconds };
      });
    },
    [sessionId],
  );

  const dismissRest = useCallback(() => {
    clearTick();
    writeStored(null);
    alarmedRef.current = true;
    setRest(null);
  }, []);

  const setExpanded = useCallback((expanded: boolean) => {
    setRest((prev) => (prev ? { ...prev, expanded } : null));
  }, []);

  return { rest, startRest, adjustRest, dismissRest, setExpanded };
}
