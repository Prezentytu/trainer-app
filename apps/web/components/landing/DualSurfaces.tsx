"use client";

import { useEffect, useRef, useState } from "react";
import { LANDING_CAPS } from "./primitives";
import { useProductDemo } from "./productDemo";
import { SessionPhone } from "./SessionPhone";
import { TrainerPanel } from "./TrainerPanel";

/**
 * Jedna scena produktu: panel wypełnia całą prawą powierzchnię, a telefon
 * leży w tej samej komórce siatki. Bez absolute i bez cropa.
 */
export function DualSurfaces() {
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
      { threshold: 0.28, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={stageRef}
      aria-label="Panel trenera i telefon podopiecznego"
      className="min-w-0 lg:py-4"
    >
      <div className="lg:grid">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <p className={`${LANDING_CAPS} m-0 mb-4 text-muted`}>Ty</p>
          <TrainerPanel completed={completed} />
        </div>

        <div className="relative z-10 mt-10 flex flex-col items-center lg:col-start-1 lg:row-start-1 lg:mr-4 lg:mt-64 lg:w-[160px] lg:justify-self-end lg:items-stretch xl:mr-5 xl:w-[176px]">
          <p className={`${LANDING_CAPS} m-0 mb-4 text-muted`}>
            Podopieczny
          </p>
          <div className="w-[188px] md:w-[200px] lg:w-full">
            <SessionPhone clock={clock} size="hero" />
          </div>
        </div>
      </div>
    </div>
  );
}
