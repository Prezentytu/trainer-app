import { LandingReveal } from "./LandingReveal";
import { ReportRows } from "./ReportRows";
import { REVIEW_MESSAGES } from "./reviewPreview";
import {
  LandingCta,
  SectionHead,
  SectionIntro,
  SECTION_SHELL,
  SECTION_STACK,
} from "./primitives";

const MESSAGE = REVIEW_MESSAGES[0];

/** 01 — zoom raportu z pary w hero, jeden artefakt. */
export function TrainerPreview() {
  return (
    <div data-theme="dark" className="bg-background text-foreground">
      <LandingReveal as="section" id="raport" className={SECTION_SHELL}>
        <div className="landing-stagger">
          <SectionHead n="01" label="Raport">
            <div className={SECTION_STACK}>
              <SectionIntro
                title="Tak wygląda Twój raport."
                lead="Jutro o tej porze — z Twoimi nazwiskami."
              />

              <div className="overflow-hidden rounded-[16px] border border-border bg-surface">
                <div className="px-5 py-1 sm:px-6">
                  <ReportRows />
                </div>

                {MESSAGE ? (
                  <div
                    aria-label="Wiadomość do wysłania"
                    className="grid gap-3 border-t border-border px-5 py-6 sm:px-6 md:grid-cols-[200px_minmax(0,1fr)] md:gap-10 md:py-7"
                  >
                    <p className="t-label m-0 tracking-[0.16em]">Do wysłania</p>
                    <div>
                      <p className="m-0 text-[15px] font-medium text-foreground">{MESSAGE.name}</p>
                      <p className="mt-2 max-w-[52ch] text-[16px] leading-[1.6] text-muted">
                        {MESSAGE.text}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              <LandingCta href="/wdrozenie">Zamów darmowy raport</LandingCta>
            </div>
          </SectionHead>
        </div>
      </LandingReveal>
    </div>
  );
}
