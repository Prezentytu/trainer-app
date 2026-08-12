"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PortalStickyCta = {
  label: string;
  disabled?: boolean;
  /** Spinner w Button — bez przygaszenia (perceived performance przy starcie sesji). */
  loading?: boolean;
  onClick: () => void;
};

type PortalChromeValue = {
  stickyCta: PortalStickyCta | null;
  setStickyCta: (cta: PortalStickyCta | null) => void;
};

const PortalChromeContext = createContext<PortalChromeValue | null>(null);

export function PortalChromeProvider({ children }: { children: ReactNode }) {
  const [stickyCta, setStickyCtaState] = useState<PortalStickyCta | null>(null);
  const setStickyCta = useCallback((cta: PortalStickyCta | null) => {
    setStickyCtaState(cta);
  }, []);
  const value = useMemo(() => ({ stickyCta, setStickyCta }), [stickyCta, setStickyCta]);
  return <PortalChromeContext.Provider value={value}>{children}</PortalChromeContext.Provider>;
}

export function usePortalStickyCta() {
  const ctx = useContext(PortalChromeContext);
  if (!ctx) {
    throw new Error("usePortalStickyCta wymaga PortalChromeProvider");
  }
  return ctx;
}
