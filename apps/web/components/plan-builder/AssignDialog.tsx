"use client";

import { useEffect, useState } from "react";
import { api, ClientSummary } from "@/lib/api";
import { Avatar, Dialog, Field, inputClass } from "@/components/ui";

export function AssignDialog({
  open,
  planId,
  onClose,
  onAssigned,
}: {
  open: boolean;
  planId: number;
  onClose: () => void;
  onAssigned: (clientName: string, startDate: string) => void;
}) {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [clientId, setClientId] = useState<number | "">("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    api.clients
      .list()
      .then((list) => {
        setClients(list);
        if (list.length > 0) setClientId(list[0].id);
      })
      .catch((e: Error) => setError(e.message));
  }, [open]);

  const handleConfirm = async () => {
    if (clientId === "" || saving) return;
    setSaving(true);
    setError(null);
    try {
      await api.assignments.create({ planId, clientId, startDate, note: null });
      const client = clients.find((c) => c.id === clientId);
      onAssigned(client?.name ?? "Klient", startDate);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      title="Przypisz plan"
      description="Wybierz klienta i datę pierwszej sesji."
      confirmLabel={saving ? "Przypisywanie…" : "Przypisz"}
      cancelLabel="Anuluj"
      onCancel={onClose}
      onConfirm={handleConfirm}
    >
      {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}
      <Field label="Klient">
        <div className="max-h-48 space-y-1 overflow-y-auto">
          {clients.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setClientId(c.id)}
              className={`flex w-full items-center gap-3 rounded-[10px] border px-3 py-2 text-left transition-colors ${
                clientId === c.id
                  ? "border-accent bg-accent-dim"
                  : "border-border hover:border-border-strong"
              }`}
            >
              <Avatar name={c.name} size="sm" />
              <span className="min-w-0 break-words text-sm font-medium">{c.name}</span>
            </button>
          ))}
          {clients.length === 0 ? <p className="text-sm text-muted">Brak klientów.</p> : null}
        </div>
      </Field>
      <div className="mt-4">
        <Field label="Data startu">
          <input
            className={inputClass}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Field>
      </div>
    </Dialog>
  );
}
