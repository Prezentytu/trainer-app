"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, Exercise } from "@/lib/api";
import { draftToBuilderHandoff, saveImportHandoff } from "@/lib/planImportHandoff";
import { Button, Dialog, SegmentedControl } from "@/components/ui";

export function PlanFromHistoryDialog({
  open,
  clientId,
  clientName,
  exercises,
  hasHistory,
  onClose,
}: {
  open: boolean;
  clientId: number;
  clientName: string;
  exercises: Exercise[];
  /** Ukończone treningi z okna, z którego składa endpoint (120 dni). */
  hasHistory: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [delta, setDelta] = useState<"0" | "2.5">("2.5");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [fetched, setFetched] = useState<Exercise[]>([]);
  const library = exercises.length > 0 ? exercises : fetched;

  useEffect(() => {
    if (!open || exercises.length > 0) return;
    let cancelled = false;
    api.exercises
      .list()
      .then((list) => {
        if (!cancelled) setFetched(list);
      })
      .catch((err: Error) => {
        if (!cancelled) setLocalError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [open, exercises.length]);

  const confirm = async () => {
    setBusy(true);
    setLocalError(null);
    try {
      const result = await api.clients.planFromHistory(clientId, {
        topKgDelta: delta === "2.5" ? 2.5 : 0,
      });
      const planMap: Record<string, number> = {};
      result.planDraft.days?.forEach((day, di) => {
        day.items?.forEach((it, ii) => {
          if (it.matchedExerciseId != null) planMap[`${di}:${ii}`] = it.matchedExerciseId;
        });
      });
      saveImportHandoff(
        draftToBuilderHandoff(result.planDraft, planMap, library, {
          isTemplate: false,
          clientId,
        }),
      );
      router.push(`/plans/new?clientId=${clientId}`);
    } catch (err) {
      setLocalError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      title="Złóż plan z historii"
      description={
        hasHistory
          ? `Wezmę ukończone treningi ${clientName} z ostatnich 120 dni i złożę z nich draft planu.`
          : `Nie mam ukończonych treningów ${clientName} z ostatnich 120 dni.`
      }
      confirmLabel="Złóż plan"
      busy={busy}
      footer={
        hasHistory ? undefined : (
          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => { setLocalError(null); onClose(); }}>
              Zamknij
            </Button>
          </div>
        )
      }
      onCancel={() => {
        setLocalError(null);
        onClose();
      }}
      onConfirm={hasHistory ? () => void confirm() : undefined}
      className="max-w-md"
    >
      {hasHistory ? (
        <>
          <p className="t-label mb-2 text-muted">Na najcięższej serii</p>
          <SegmentedControl
            items={[
              { value: "0", label: "Bez zmian" },
              { value: "2.5", label: "+2,5 kg" },
            ]}
            value={delta}
            onChange={(v) => setDelta(v === "0" ? "0" : "2.5")}
          />
          <p className="mt-3 text-sm text-muted-strong">
            Sprawdzisz i zapiszesz plan w kreatorze. Cofnięcie nie kasuje draftu.
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-strong">
          Wpisz trening albo wgraj historię — wtedy wróć tutaj i złożę z tego plan.
        </p>
      )}
      {localError ? <p className="mt-3 text-sm text-danger">{localError}</p> : null}
    </Dialog>
  );
}
