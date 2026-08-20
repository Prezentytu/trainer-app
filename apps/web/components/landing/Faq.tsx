"use client";

import { useId, useState } from "react";
import { FAQ_ITEMS } from "./faqItems";
import { LandingReveal } from "./LandingReveal";
import { SECTION_SHELL, SectionSplit } from "./primitives";

export { FAQ_ITEMS };

export function Faq() {
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <LandingReveal as="section" id="pytania" className={SECTION_SHELL}>
      <div className="landing-stagger">
        <SectionSplit index="04" label="Pytania">
          <h2 className="sr-only">Najczęstsze pytania</h2>
          <div className="border-t border-border">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = open === i;
              const panelId = `${baseId}-panel-${i}`;
              const buttonId = `${baseId}-button-${i}`;
              return (
                <div key={item.q} className="border-b border-border">
                  <h3 className="m-0">
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className="flex min-h-[76px] w-full cursor-pointer items-center justify-between gap-6 border-0 bg-transparent py-5 text-left text-foreground transition-colors duration-[var(--dur-fast)] hover:text-muted focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
                      onClick={() => setOpen(isOpen ? null : i)}
                    >
                      <span className="min-w-0 flex-1 break-words text-[18px] font-medium leading-snug tracking-[-0.01em] lg:text-[20px]">
                        {item.q}
                      </span>
                      <span
                        className="landing-faq-icon t-num shrink-0 text-[20px] font-medium text-muted"
                        data-open={isOpen}
                        aria-hidden
                      >
                        +
                      </span>
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="landing-faq-content"
                    data-open={isOpen}
                  >
                    <div>
                      <p className="m-0 max-w-[52ch] pb-7 text-[16px] leading-[1.65] text-muted">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionSplit>
      </div>
    </LandingReveal>
  );
}
