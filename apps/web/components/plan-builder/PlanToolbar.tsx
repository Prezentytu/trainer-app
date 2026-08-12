"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Field,
  OverflowMenu,
  OverflowMenuItem,
  Toolbar,
  inputClass,
  textareaClass,
} from "@/components/ui";
import { AssignDialog } from "./AssignDialog";

export type AssignedClientInfo = {
  name: string;
  startDate: string;
  weeksCount: number;
} | null;

export function PlanToolbar({
  name,
  onNameChange,
  isTemplate,
  onIsTemplateChange,
  description,
  onDescriptionChange,
  weeksCount,
  lastSavedAt,
  isDirty,
  planId,
  assigned,
  onAssigned,
  saving,
  submitLabel,
  stepLabel,
  onExit,
}: {
  name: string;
  onNameChange: (v: string) => void;
  isTemplate: boolean;
  onIsTemplateChange: (v: boolean) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  weeksCount: number;
  lastSavedAt: Date | null;
  isDirty?: boolean;
  planId?: number;
  assigned: AssignedClientInfo;
  onAssigned: (info: AssignedClientInfo) => void;
  saving: boolean;
  submitLabel: string;
  stepLabel?: string;
  onExit?: () => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const firstName = assigned?.name.split(/\s+/)[0] ?? null;
  const assignCta =
    !isTemplate && planId
      ? assigned
        ? `Przypisz do ${firstName}`
        : "Przypisz do klienta"
      : null;

  return (
    <>
      <Toolbar
        left={
          <>
            {editingName ? (
              <input
                autoFocus
                className={`${inputClass} h-9 max-w-md py-0 text-base font-semibold`}
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
                aria-label="Nazwa planu"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingName(true)}
                title={name.trim() || "Bez nazwy"}
                className="min-w-0 break-words text-left text-base font-semibold tracking-tight text-foreground hover:text-foreground-secondary"
              >
                {name.trim() || "Bez nazwy"}
              </button>
            )}
            {isTemplate ? <Badge tone="accent">Wielokrotnego użytku</Badge> : null}
            {stepLabel ? (
              <span className="hidden font-mono text-xs text-muted sm:inline">{stepLabel}</span>
            ) : null}
            {isDirty ? (
              <span className="hidden text-[12px] text-muted sm:inline">Niezapisane</span>
            ) : lastSavedAt ? (
              <span className="hidden items-center gap-1.5 text-[12px] text-positive sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-positive" />
                Zapisano
              </span>
            ) : null}
          </>
        }
        right={
          <>
            <OverflowMenu
              label="Więcej opcji planu"
              align="right"
              onOpenChange={(open) => {
                if (!open) setSettingsOpen(false);
              }}
            >
              {({ close }) =>
                settingsOpen ? (
                  <div className="space-y-3 p-2">
                    <button
                      type="button"
                      onClick={() => setSettingsOpen(false)}
                      className="text-[12px] font-medium text-muted hover:text-foreground"
                    >
                      ← Menu
                    </button>
                    <Field label="Rodzaj">
                      <select
                        className={inputClass}
                        value={isTemplate ? "template" : "plan"}
                        onChange={(e) => onIsTemplateChange(e.target.value === "template")}
                      >
                        <option value="plan">Plan klienta (przypisywalny)</option>
                        <option value="template">Do wielokrotnego użytku</option>
                      </select>
                    </Field>
                    <Field label="Zasady ogólne / opis">
                      <textarea
                        className={textareaClass}
                        rows={3}
                        value={description}
                        onChange={(e) => onDescriptionChange(e.target.value)}
                        placeholder="np. tempo, nawodnienie, zasady progresji…"
                      />
                    </Field>
                  </div>
                ) : (
                  <>
                    <OverflowMenuItem
                      onClick={() => setSettingsOpen(true)}
                    >
                      Ustawienia planu
                    </OverflowMenuItem>
                    {planId ? (
                      <OverflowMenuItem
                        href={`/plans/${planId}`}
                        onClick={close}
                      >
                        Podgląd klienta
                      </OverflowMenuItem>
                    ) : null}
                    {assignCta ? (
                      <OverflowMenuItem
                        onClick={() => {
                          close();
                          setAssignOpen(true);
                        }}
                      >
                        {assignCta}
                      </OverflowMenuItem>
                    ) : null}
                    {onExit ? (
                      <OverflowMenuItem
                        danger
                        onClick={() => {
                          close();
                          onExit();
                        }}
                      >
                        Anuluj edycję
                      </OverflowMenuItem>
                    ) : null}
                  </>
                )
              }
            </OverflowMenu>
            <Button type="submit" size="sm" disabled={saving || !name.trim()}>
              {saving ? "Zapisywanie…" : submitLabel}
            </Button>
          </>
        }
      />

      {planId ? (
        <AssignDialog
          open={assignOpen}
          planId={planId}
          onClose={() => setAssignOpen(false)}
          onAssigned={(clientName, startDate) =>
            onAssigned({ name: clientName, startDate, weeksCount: weeksCount || 1 })
          }
        />
      ) : null}
    </>
  );
}
