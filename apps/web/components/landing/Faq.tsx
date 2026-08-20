"use client";

import { useId, useState } from "react";
import { FAQ_ITEMS } from "./faqItems";
import { LandingReveal } from "./LandingReveal";
import { SectionHead, SECTION_SHELL } from "./primitives";

export { FAQ_ITEMS };

export function Faq() {
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div data-theme="dark" className="bg-background text-foreground">
      <LandingReveal
        as="section"
        id="pytania"
        className={SECTION_SHELL}
      >
        <div className="landing-stagger">
          <SectionHead n="05" label="Pytania">
            <h2 className="sr-only">Najczęstsze pytania</h2>
            <div className="max-w-[900px] border-t border-border-strong">
              {FAQ_ITEMS.map((item, i) => {
                const isOpen = open === i;
                const panelId = `${baseId}-panel-${i}`;
                const buttonId = `${baseId}-button-${i}`;
                return (
                  <div key={item.q} className="border-b border-border last:border-b-0">
                    <h3 className="m-0">
                      <button
                        type="button"
                        id={buttonId}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        className="flex min-h-11 w-full cursor-pointer items-center gap-6 border-0 bg-transparent py-6 text-left text-foreground transition-colors duration-[var(--dur-fast)] hover:text-muted focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
                        onClick={() => setOpen(isOpen ? null : i)}
                      >
                        <span className="min-w-0 flex-1 break-words text-[22px] font-medium leading-snug">
                          {item.q}
                        </span>
                        <span
                          className="landing-faq-icon t-num shrink-0 text-[20px] text-muted"
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
                        <p className="m-0 max-w-[62ch] pb-6 text-[16px] leading-[1.65] text-muted">
                          {item.a}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionHead>
        </div>
      </LandingReveal>
    </div>
  );
}
