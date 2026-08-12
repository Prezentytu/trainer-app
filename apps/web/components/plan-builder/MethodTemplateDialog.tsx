"use client";

import { useState } from "react";
import { Button, Dialog, SegmentedControl } from "@/components/ui";
import {
  METHOD_TEMPLATES,
  MethodTemplateId,
  methodTemplateHasSource,
} from "@/lib/methodTemplates";
import { BuilderDay } from "./types";

export function MethodTemplateDialog({
  open,
  days,
  onClose,
  onApply,
}: {
  open: boolean;
  days: BuilderDay[];
  onClose: () => void;
  onApply: (id: MethodTemplateId) => void;
}) {
  const [id, setId] = useState<MethodTemplateId>("15105");
  const hasSource = methodTemplateHasSource(days);
  const selected = METHOD_TEMPLATES.find((t) => t.id === id) ?? METHOD_TEMPLATES[0];

  return (
    <Dialog
      open={open}
      title="Zastosuj szablon metody"
      description={
        hasSource
          ? "Zastąpi obecną strukturę dni. Ćwiczenia zostaną rozpisane metodą — możesz dalej edytować."
          : "Najpierw dodaj ćwiczenia do przynajmniej jednego dnia."
      }
      onCancel={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Anuluj
          </Button>
          <Button
            disabled={!hasSource}
            onClick={() => {
              onApply(id);
              onClose();
            }}
          >
            Zastosuj
          </Button>
        </div>
      }
      className="max-w-md"
    >
      <SegmentedControl
        full
        items={METHOD_TEMPLATES.map((t) => ({ value: t.id, label: t.label }))}
        value={id}
        onChange={(v) => setId(v as MethodTemplateId)}
      />
      <p className="t-small mt-3">{selected.description}</p>
    </Dialog>
  );
}
