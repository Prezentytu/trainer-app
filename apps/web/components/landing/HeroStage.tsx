"use client";

import { useEffect, useRef, useState } from "react";
import { LANDING_CAPS } from "./primitives";
import { useProductDemo } from "./productDemo";
import { SessionPhone } from "./SessionPhone";
import { TrainerPanel } from "./TrainerPanel";

/**
 * Para Ty / Podopieczny pod H1. Jedna historia: seria odhaczona na telefonie
 * dopisuje rekord do wiersza Michała w panelu.
 */
export function HeroStage({ className = "" }: { className?: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const { clock, completed } = useProductDemo(active);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setActive(true);
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={stageRef}
      aria-label="Panel trenera i telefon podopiecznego"
      className={`w-full min-w-0 ${className}`.trim()}
    >
      <div className="mx-auto flex max-w-[1044px] flex-col items-center gap-12 lg:flex-row lg:items-end lg:gap-10">
        <div className="w-full min-w-0 lg:flex-1">
          <div
            data-theme="dark"
            className="rounded-[16px] bg-background p-2.5 pb-3 text-foreground"
          >
            <div className="overflow-hidden rounded-[10px] lg:aspect-[800/453]">
              <TrainerPanel completed={completed} />
            </div>
            <p className={`${LANDING_CAPS} m-0 mt-2 text-center text-fg-ghost`}>RepMaxer</p>
          </div>
          <p className={`${LANDING_CAPS} m-0 mt-4 text-center text-fg-ghost`}>Ty</p>
        </div>

        <div className="w-[220px] shrink-0 sm:w-[240px] lg:w-[200px]">
          <SessionPhone clock={clock} />
          <p className={`${LANDING_CAPS} m-0 mt-4 text-center text-fg-ghost`}>Podopieczny</p>
        </div>
      </div>
    </div>
  );
}
