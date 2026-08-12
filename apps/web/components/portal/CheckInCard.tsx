"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Icon } from "@/components/Icon";
import { Button, ErrorBanner, inputClass } from "@/components/ui";

export function CheckInCard({
  token,
  onSaved,
  defaultCollapsed = false,
}: {
  token: string;
  onSaved?: () => void;
  /** Na ekranie Dziś: zwinięty wiersz; tap rozwija formularz. */
  defaultCollapsed?: boolean;
}) {
  const [open, setOpen] = useState(!defaultCollapsed);
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [sleepScore, setSleepScore] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.portal.createCheckIn(token, { moodScore, sleepScore, note: note.trim() || null });
      onSaved?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (defaultCollapsed && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={false}
        className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-border bg-surface-raised px-4 py-3 text-left transition-[background-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-surface-hover focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] active:scale-[0.98]"
      >
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
            Jak się masz
          </p>
          <p className="mt-1 text-sm text-muted">Samopoczucie i sen — 10 sekund</p>
        </div>
        <Icon name="caret-down" size={18} className="shrink-0 text-muted" decorative />
      </button>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-surface-raised px-4 py-4">
      {defaultCollapsed ? (
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-expanded={true}
          className="flex min-h-11 w-full items-center gap-3 text-left focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
        >
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
              Jak się masz
            </p>
            <p className="mt-1 text-sm text-muted">Dwie liczby pomagają trenerowi dopasować plan.</p>
          </div>
          <Icon
            name="caret-down"
            size={18}
            className="shrink-0 rotate-180 text-muted transition-transform duration-[var(--dur-med)] ease-[var(--ease-out)]"
            decorative
          />
        </button>
      ) : (
        <>
          <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
            Jak się masz
          </p>
          <p className="mt-1 text-sm text-muted">Dwie liczby pomagają trenerowi dopasować plan.</p>
        </>
      )}
      <ErrorBanner message={error} />
      <div className="mt-4 space-y-4">
        <Score label="Samopoczucie" value={moodScore} onChange={setMoodScore} />
        <Score label="Sen ostatniej nocy" value={sleepScore} onChange={setSleepScore} />
      </div>
      {showNote ? (
        <textarea
          className={`${inputClass} mt-4 min-h-[80px] resize-none py-3`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Opcjonalna notatka dla trenera…"
          rows={3}
        />
      ) : (
        <button
          type="button"
          className="mt-4 min-h-11 text-sm font-medium text-foreground-secondary transition-colors duration-[var(--dur-fast)] hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
          onClick={() => setShowNote(true)}
        >
          Dodaj notatkę
        </button>
      )}
      <div className="mt-4">
        <Button
          variant="secondary"
          full
          disabled={saving || (moodScore == null && sleepScore == null)}
          loading={saving}
          onClick={() => void submit()}
        >
          {saving ? "Wysyłanie…" : "Wyślij check-in"}
        </Button>
      </div>
    </section>
  );
}

function Score({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-foreground-secondary">{label}</p>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            aria-pressed={value === score}
            onClick={() => onChange(score)}
            className={`min-h-11 rounded-[10px] border font-mono text-sm font-semibold tabular-nums transition-[background-color,border-color,transform,color] duration-[var(--dur-fast)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] active:scale-[0.98] ${
              value === score
                ? "border-accent-border bg-accent-dim text-foreground"
                : "border-border-strong bg-surface-sunken text-muted-strong hover:bg-surface-hover"
            }`}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );
}
