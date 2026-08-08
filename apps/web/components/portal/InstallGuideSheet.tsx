"use client";

import { useCallback, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { Button, Sheet } from "@/components/ui";
import {
  installGuide,
  type InstallEnv,
  type InstallStep,
} from "@/lib/installEnv";

type Props = {
  open: boolean;
  onClose: () => void;
  env: InstallEnv;
  /** Pełny URL portalu do skopiowania / escape. */
  pageUrl: string;
};

const STEP_ICON: Record<InstallStep["icon"], IconName> = {
  share: "share",
  more: "more",
  plus: "plus",
  download: "download",
  warning: "warning",
};

export function InstallGuideSheet({ open, onClose, env, pageUrl }: Props) {
  const guide = installGuide(env);
  const [copied, setCopied] = useState(false);
  const fallbackInputRef = useRef<HTMLInputElement>(null);

  const copyLink = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(pageUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
        return;
      }
    } catch {
      /* fallback poniżej */
    }
    const input = fallbackInputRef.current;
    if (input) {
      input.focus();
      input.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        /* użytkownik może skopiować ręcznie z pola */
      }
    }
  }, [pageUrl]);

  const escapeHref = env.escapeUrl;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={guide.title}
      footer={
        <div className="flex w-full flex-col gap-2">
          {escapeHref && guide.escapeLabel ? (
            <a
              href={escapeHref}
              className="inline-flex h-[var(--h-control)] w-full items-center justify-center rounded-[var(--r-pill)] bg-invert-bg px-4 text-sm font-semibold text-invert-fg transition-[transform,opacity] duration-[var(--dur-fast)] ease-[var(--ease-out)] active:scale-[0.97]"
            >
              {guide.escapeLabel}
            </a>
          ) : null}
          {guide.showCopyLink ? (
            <Button variant="secondary" full onClick={() => void copyLink()}>
              {copied ? "Skopiowano" : "Kopiuj link"}
            </Button>
          ) : null}
          <Button variant="ghost" full onClick={onClose}>
            Zamknij
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted">{guide.description}</p>

      {guide.steps.length > 0 ? (
        <ol className="mt-4 space-y-2.5">
          {guide.steps.map((step, index) => (
            <li key={index} className="flex items-start gap-2.5 text-sm text-foreground-secondary">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-active text-foreground">
                <Icon name={STEP_ICON[step.icon]} size={14} decorative />
              </span>
              <span>
                <span className="sr-only">Krok {index + 1}. </span>
                {step.text}
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      {guide.showCopyLink ? (
        <div className="mt-4">
          <p className="mb-1.5 text-xs text-muted">
            Albo skopiuj link i wklej w Safari / Chrome:
          </p>
          <input
            ref={fallbackInputRef}
            readOnly
            value={pageUrl}
            aria-label="Link do portalu"
            className="w-full truncate rounded-[var(--r-field)] border border-border bg-surface-raised px-3 py-2 font-mono text-xs text-foreground-secondary"
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>
      ) : null}
    </Sheet>
  );
}
