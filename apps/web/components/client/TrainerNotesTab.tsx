"use client";

import { FormEvent, KeyboardEvent, useState } from "react";
import { Icon } from "@/components/Icon";
import { api, TrainerNote } from "@/lib/api";
import {
  Badge,
  Button,
  Card,
  ErrorBanner,
  inputClass,
} from "@/components/ui";

function formatNoteWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return `dziś, ${d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) {
    return `wczoraj, ${d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return d.toLocaleString("pl-PL", {
    day: "numeric",
    month: "short",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TrainerNotesTab({
  clientId,
  notes,
  onChange,
  onUndoToast,
}: {
  clientId: number;
  notes: TrainerNote[];
  onChange: (notes: TrainerNote[]) => void;
  onUndoToast: (message: string, undo?: () => void) => void;
}) {
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState("");

  const sorted = [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || saving) return;
    setSaving(true);
    setError(null);
    try {
      const created = await api.clients.addNote(clientId, { body });
      onChange([created, ...notes]);
      setDraft("");
      onUndoToast("Dodano notatkę");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void submit();
    }
  };

  const togglePin = async (note: TrainerNote) => {
    setError(null);
    try {
      const updated = await api.clients.updateNote(clientId, note.id, {
        body: note.body,
        pinned: !note.pinned,
      });
      onChange(notes.map((n) => (n.id === note.id ? updated : n)));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const startEdit = (note: TrainerNote) => {
    setEditingId(note.id);
    setEditBody(note.body);
  };

  const saveEdit = async (note: TrainerNote) => {
    const body = editBody.trim();
    if (!body) {
      setError("Notatka nie może być pusta.");
      return;
    }
    setError(null);
    try {
      const updated = await api.clients.updateNote(clientId, note.id, {
        body,
        pinned: note.pinned,
      });
      onChange(notes.map((n) => (n.id === note.id ? updated : n)));
      setEditingId(null);
      onUndoToast("Zapisano notatkę");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const remove = async (note: TrainerNote) => {
    setError(null);
    const remaining = notes.filter((n) => n.id !== note.id);
    try {
      await api.clients.removeNote(clientId, note.id);
      onChange(remaining);
      onUndoToast("Usunięto notatkę", async () => {
        try {
          const restored = await api.clients.addNote(clientId, {
            body: note.body,
            pinned: note.pinned,
          });
          onChange([restored, ...remaining]);
        } catch (err) {
          setError((err as Error).message);
        }
      });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">Moje notatki</h2>
        <Badge tone="neutral">
          <Icon name="lock" size={12} decorative />
          Prywatne — klient tego nie widzi
        </Badge>
      </div>

      <ErrorBanner message={error} />

      <Card className="mb-6">
        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3">
          <textarea
            className={`${inputClass} min-h-[88px] resize-none py-3`}
            placeholder="Kontuzje, ustalenia, płatności, co działa na tego klienta…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            rows={3}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-fg-ghost">⌘/Ctrl + Enter — zapisz</p>
            <Button type="submit" disabled={saving || !draft.trim()}>
              {saving ? "Zapisywanie…" : "Dodaj notatkę"}
            </Button>
          </div>
        </form>
      </Card>

      {sorted.length === 0 ? (
        <p className="t-small">Jeszcze bez notatek.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((note) => (
            <li key={note.id}>
              <Card>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs tabular-nums text-fg-ghost">
                      {formatNoteWhen(note.updatedAt ?? note.createdAt)}
                      {note.updatedAt ? " · edytowano" : ""}
                    </span>
                    {note.pinned ? (
                      <Badge tone="neutral">
                        <Icon name="pin" size={11} decorative />
                        Przypięta
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button variant="ghost" onClick={() => void togglePin(note)}>
                      {note.pinned ? "Odepnij" : "Przypnij"}
                    </Button>
                    {editingId === note.id ? null : (
                      <Button variant="ghost" onClick={() => startEdit(note)}>
                        Edytuj
                      </Button>
                    )}
                    <Button variant="ghost" onClick={() => void remove(note)}>
                      Usuń
                    </Button>
                  </div>
                </div>
                {editingId === note.id ? (
                  <div className="flex flex-col gap-3">
                    <textarea
                      className={`${inputClass} min-h-[88px] resize-none py-3`}
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={3}
                      autoFocus
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => void saveEdit(note)}>Zapisz</Button>
                      <Button variant="ghost" onClick={() => setEditingId(null)}>
                        Anuluj
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground-secondary">
                    {note.body}
                  </p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
