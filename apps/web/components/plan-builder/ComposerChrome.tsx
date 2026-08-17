"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ComposerHelpDialog } from "./ComposerHelp";

type ComposerChromeValue = {
  registerComposer: (dayKey: string, el: HTMLInputElement | null) => void;
  markFocused: (dayKey: string) => void;
  focusComposer: (dayKey?: string) => void;
  helpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
};

const ComposerChromeContext = createContext<ComposerChromeValue | null>(null);

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export function ComposerChromeProvider({
  children,
  preferredDayKey,
}: {
  children: ReactNode;
  preferredDayKey?: string | null;
}) {
  const mapRef = useRef(new Map<string, HTMLInputElement>());
  const lastFocusedRef = useRef<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const registerComposer = useCallback((dayKey: string, el: HTMLInputElement | null) => {
    if (el) mapRef.current.set(dayKey, el);
    else mapRef.current.delete(dayKey);
  }, []);

  const markFocused = useCallback((dayKey: string) => {
    lastFocusedRef.current = dayKey;
  }, []);

  const focusComposer = useCallback((dayKey?: string) => {
    const fallback = mapRef.current.keys().next().value as string | undefined;
    const key = dayKey ?? preferredDayKey ?? lastFocusedRef.current ?? fallback;
    if (!key) return;
    mapRef.current.get(key)?.focus();
  }, [preferredDayKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      focusComposer();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [focusComposer]);

  const value = useMemo(
    () => ({ registerComposer, markFocused, focusComposer, helpOpen, setHelpOpen }),
    [registerComposer, markFocused, focusComposer, helpOpen],
  );

  return (
    <ComposerChromeContext.Provider value={value}>
      {children}
      <ComposerHelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </ComposerChromeContext.Provider>
  );
}

export function useComposerChrome() {
  const ctx = useContext(ComposerChromeContext);
  if (!ctx) {
    throw new Error("useComposerChrome wymaga ComposerChromeProvider");
  }
  return ctx;
}
