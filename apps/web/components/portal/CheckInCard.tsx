"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button, Card, ErrorBanner, inputClass } from "@/components/ui";

export function CheckInCard({ token, onSaved }: { token: string; onSaved?: () => void }) {
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

  return (
    <Card title="Krótki check-in" meta="Dwie liczby pomagają trenerowi dopasować plan.">
      <ErrorBanner message={error} />
      <Score label="Samopoczucie" value={moodScore} onChange={setMoodScore} />
      <div className="mt-3">
        <Score label="Sen ostatniej nocy" value={sleepScore} onChange={setSleepScore} />
      </div>
      {showNote ? (
        <textarea
          className={`${inputClass} mt-3 min-h-[80px] resize-none py-3`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Opcjonalna notatka dla trenera…"
          rows={3}
        />
      ) : (
        <button
          type="button"
          className="mt-3 text-sm font-medium text-accent hover:text-accent-strong focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
          onClick={() => setShowNote(true)}
        >
          Dodaj notatkę
        </button>
      )}
      <div className="mt-4">
        <Button disabled={saving || (moodScore == null && sleepScore == null)} onClick={() => void submit()}>
          {saving ? "Wysyłanie…" : "Wyślij check-in"}
        </Button>
      </div>
    </Card>
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
            className={`min-h-11 rounded-md border font-mono text-sm font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] ${
              value === score
                ? "border-accent bg-accent text-accent-foreground"
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
