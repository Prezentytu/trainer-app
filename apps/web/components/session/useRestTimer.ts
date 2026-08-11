"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { notifyRestEnd, playRestEndAlarm, unlockAudio } from "@/lib/restAlarm";
import * as restKeepAlive from "@/lib/restKeepAlive";
import { readRestLockScreen } from "@/lib/portalPrefs";

const STORAGE_KEY = "wa-rest-timer";

type StoredRest = {
  endsAt: number;
  totalSeconds: number;
  sessionId: number;
};

export type RestTimerContext = {
  /** Nazwa następnego ćwiczenia (Lock Screen / dock). */
  nextLabel?: string | null;
  /** Numer następnej serii w ćwiczeniu (nie globalnie w treningu). */
  setsDone: number;
  /** Liczba serii w tym ćwiczeniu. */
  setsTotal: number;
};

export type RestTimerState = {
  endsAt: number;
  totalSeconds: number;
  leftSeconds: number;
  expanded: boolean;
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

function keepAlivePayload(
  endsAt: number,
  totalSeconds: number,
  ctx: RestTimerContext,
) {
  return {
    endsAt,
    totalSeconds,
    nextLabel: ctx.nextLabel,
    setsDone: ctx.setsDone,
    setsTotal: ctx.setsTotal,
  };
}

export function useRestTimer(sessionId: number, context: RestTimerContext) {
  const [rest, setRest] = useState<RestTimerState | null>(() => initialRest(sessionId));
  const alarmedRef = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contextRef = useRef(context);

  useEffect(() => {
    contextRef.current = {
      nextLabel: context.nextLabel,
      setsDone: context.setsDone,
      setsTotal: context.setsTotal,
    };
  }, [context.nextLabel, context.setsDone, context.setsTotal]);

  const clearTick = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const clearEndTimer = () => {
    if (endTimerRef.current) {
      clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }
  };

  const finishRest = useCallback((opts?: { silent?: boolean }) => {
    clearTick();
    clearEndTimer();
    writeStored(null);
    restKeepAlive.stop();
    if (!opts?.silent && !alarmedRef.current) {
      alarmedRef.current = true;
      playRestEndAlarm();
      void notifyRestEnd({
        nextLabel: contextRef.current.nextLabel,
        url: typeof window !== "undefined" ? window.location.href : undefined,
      });
    } else {
      alarmedRef.current = true;
    }
    setRest(null);
  }, []);

  const scheduleEnd = useCallback(
    (endsAt: number) => {
      clearEndTimer();
      const delay = Math.max(0, endsAt - Date.now());
      endTimerRef.current = setTimeout(() => {
        finishRest();
      }, delay);
    },
    [finishRest],
  );

  const ensureTick = useCallback(() => {
    if (tickRef.current) return;
    tickRef.current = setInterval(() => {
      setRest((prev) => {
        if (!prev) return null;
        const left = Math.max(0, Math.ceil((prev.endsAt - Date.now()) / 1000));
        // Koniec obsługuje setTimeout na endsAt — tick tylko odświeża cyfry.
        if (left <= 0) return prev;
        if (left === prev.leftSeconds) return prev;
        return { ...prev, leftSeconds: left };
      });
    }, 250);
  }, []);

  const restActive = rest != null;
  const restEndsAt = rest?.endsAt ?? 0;

  // Ticker UI gdy jest aktywna przerwa
  useEffect(() => {
    if (!restActive) {
      clearTick();
      return;
    }
    ensureTick();
    return () => clearTick();
  }, [restActive, restEndsAt, ensureTick]);

  // Deterministyczny koniec + keep-alive przy hydracji / zmianie endsAt
  useEffect(() => {
    if (!restActive || !rest) {
      clearEndTimer();
      return;
    }
    scheduleEnd(rest.endsAt);
    if (readRestLockScreen() && restKeepAlive.isActive()) {
      restKeepAlive.update(keepAlivePayload(rest.endsAt, rest.totalSeconds, contextRef.current));
    }
    return () => clearEndTimer();
    // context celowo przez ref — unikamy restartu timeoutu przy każdej serii
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restActive, restEndsAt, rest?.totalSeconds, scheduleEnd]);

  // Aktualizacja metadanych Media Session przy zmianie etykiety / licznika / endsAt
  useEffect(() => {
    if (!restActive || !restKeepAlive.isActive()) return;
    restKeepAlive.update(
      keepAlivePayload(restEndsAt, rest?.totalSeconds ?? 0, contextRef.current),
    );
  }, [
    restActive,
    restEndsAt,
    rest?.totalSeconds,
    context.nextLabel,
    context.setsDone,
    context.setsTotal,
  ]);

  // Po powrocie z tła — dograj czas / alarm gdy timeout nie zdążył
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      setRest((prev) => {
        if (!prev) return null;
        const left = Math.max(0, Math.ceil((prev.endsAt - Date.now()) / 1000));
        if (left <= 0) {
          queueMicrotask(() => finishRest());
          return null;
        }
        return { ...prev, leftSeconds: left };
      });
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [finishRest]);

  // Jeśli przy starcie przerwa już minęła — alarm
  useEffect(() => {
    const stored = readStored(sessionId);
    if (stored && stored.endsAt <= Date.now()) {
      writeStored(null);
      if (!alarmedRef.current) {
        alarmedRef.current = true;
        queueMicrotask(() => {
          playRestEndAlarm();
          void notifyRestEnd({
            nextLabel: contextRef.current.nextLabel,
            url: typeof window !== "undefined" ? window.location.href : undefined,
          });
        });
      }
    }
  }, [sessionId]);

  // Cleanup keep-alive przy unmount
  useEffect(() => {
    return () => {
      clearTick();
      clearEndTimer();
      restKeepAlive.stop();
    };
  }, []);

  const startRest = useCallback(
    (seconds: number) => {
      unlockAudio();
      alarmedRef.current = false;
      const endsAt = Date.now() + seconds * 1000;
      writeStored({ endsAt, totalSeconds: seconds, sessionId });
      // Pełny ekran od razu po zaliczeniu serii — Zwiń → mini-dock, tap → z powrotem.
      setRest({ endsAt, totalSeconds: seconds, leftSeconds: seconds, expanded: true });
      scheduleEnd(endsAt);

      if (readRestLockScreen()) {
        restKeepAlive.start(keepAlivePayload(endsAt, seconds, contextRef.current), {
          onSkip: () => {
            // dismiss bez alarmu — użytkownik sam pomija z Lock Screen
            clearTick();
            clearEndTimer();
            writeStored(null);
            restKeepAlive.stop();
            alarmedRef.current = true;
            setRest(null);
          },
          onExtend: (delta) => {
            setRest((prev) => {
              if (!prev) return null;
              const nextEnds = Math.max(Date.now() + 1000, prev.endsAt + delta * 1000);
              const left = Math.max(0, Math.ceil((nextEnds - Date.now()) / 1000));
              const totalSeconds = Math.max(prev.totalSeconds, left);
              writeStored({ endsAt: nextEnds, totalSeconds, sessionId });
              scheduleEnd(nextEnds);
              if (readRestLockScreen()) {
                restKeepAlive.update(
                  keepAlivePayload(nextEnds, totalSeconds, contextRef.current),
                );
              }
              return { ...prev, endsAt: nextEnds, leftSeconds: left, totalSeconds };
            });
          },
        });
      }
    },
    [sessionId, scheduleEnd],
  );

  const adjustRest = useCallback(
    (deltaSeconds: number) => {
      setRest((prev) => {
        if (!prev) return null;
        const nextEnds = Math.max(Date.now() + 1000, prev.endsAt + deltaSeconds * 1000);
        const left = Math.max(0, Math.ceil((nextEnds - Date.now()) / 1000));
        const totalSeconds = Math.max(prev.totalSeconds, left);
        writeStored({ endsAt: nextEnds, totalSeconds, sessionId });
        scheduleEnd(nextEnds);
        if (readRestLockScreen() && restKeepAlive.isActive()) {
          restKeepAlive.update(keepAlivePayload(nextEnds, totalSeconds, contextRef.current));
        }
        return { ...prev, endsAt: nextEnds, leftSeconds: left, totalSeconds };
      });
    },
    [sessionId, scheduleEnd],
  );

  const dismissRest = useCallback(() => {
    clearTick();
    clearEndTimer();
    writeStored(null);
    restKeepAlive.stop();
    alarmedRef.current = true;
    setRest(null);
  }, []);

  const setExpanded = useCallback((expanded: boolean) => {
    setRest((prev) => (prev ? { ...prev, expanded } : null));
  }, []);

  return { rest, startRest, adjustRest, dismissRest, setExpanded };
}
