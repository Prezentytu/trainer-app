"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, Badge, Button, Field, inputClass } from "@/components/ui";
import { AssignDialog } from "./AssignDialog";

export type AssignedClientInfo = {
  name: string;
  startDate: string;
  weeksCount: number;
} | null;

export function PlanHeader({
  name,
  onNameChange,
  isTemplate,
  onIsTemplateChange,
  description,
  onDescriptionChange,
  daysPerWeek,
  activeWeek,
  weeksCount,
  lastSavedAt,
  isDirty,
  planId,
  assigned,
  onAssigned,
  saving,
  submitLabel,
  stepLabel,
}: {
  name: string;
  onNameChange: (v: string) => void;
  isTemplate: boolean;
  onIsTemplateChange: (v: boolean) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  daysPerWeek: number;
  activeWeek: number;
  weeksCount: number;
  lastSavedAt: Date | null;
  isDirty?: boolean;
  planId?: number;
  assigned: AssignedClientInfo;
  onAssigned: (info: AssignedClientInfo) => void;
  saving: boolean;
  submitLabel: string;
  stepLabel?: string;
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
    <div className="mb-4 border-b border-border pb-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="eyebrow mb-2 text-muted">
            {"/// "}
            {isTemplate ? "Szablon" : "Plan klienta"} · Tydzień {activeWeek}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {editingName ? (
              <input
                autoFocus
                className={`${inputClass} max-w-md font-display text-xl font-bold`}
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="break-words text-left font-display text-xl font-bold tracking-tight text-foreground hover:text-accent-strong"
              >
                {name.trim() || "Bez nazwy"}
              </button>
            )}
            <Badge tone={isTemplate ? "accent" : "neutral"}>{isTemplate ? "Szablon" : "Plan"}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-strong">
            {daysPerWeek} {daysPerWeek === 1 ? "dzień" : "dni"}/tydz. ·{" "}
            <span className="font-mono tabular-nums">
              tydzień {activeWeek} z {weeksCount || 1}
            </span>
            {stepLabel ? (
              <>
                {" "}
                · <span className="text-muted">{stepLabel}</span>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isDirty ? (
            <span className="text-sm text-muted">Niezapisane zmiany</span>
          ) : lastSavedAt ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-positive">
              <span className="h-1.5 w-1.5 rounded-full bg-positive" />
              Zapisano
            </span>
          ) : null}

          {assigned && (
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2">
              <Avatar name={assigned.name} size="sm" />
              <div className="min-w-0">
                <p className="text-xs text-muted-faint">Przypisany klient</p>
                <p className="break-words text-sm font-semibold">{assigned.name}</p>
                <p className="font-mono text-xs tabular-nums text-muted">
                  start {assigned.startDate.slice(5).replace("-", ".")} · {assigned.weeksCount} tyg.
                </p>
              </div>
            </div>
          )}

          {planId ? (
            <Link href={`/plans/${planId}`}>
              <Button variant="secondary" type="button">
                Podgląd klienta
              </Button>
            </Link>
          ) : null}

          {assignCta && !assigned ? (
            <Button type="button" onClick={() => setAssignOpen(true)}>
              {assignCta}
            </Button>
          ) : (
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Zapisywanie…" : submitLabel}
            </Button>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setSettingsOpen((v) => !v)}
        className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted hover:text-foreground-secondary"
      >
        Ustawienia planu {settingsOpen ? "▴" : "▾"}
      </button>
      {settingsOpen && (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Rodzaj">
            <select
              className={inputClass}
              value={isTemplate ? "template" : "plan"}
              onChange={(e) => onIsTemplateChange(e.target.value === "template")}
            >
              <option value="plan">Plan klienta (przypisywalny)</option>
              <option value="template">Szablon (wielokrotnego użytku)</option>
            </select>
          </Field>
          <Field label="Zasady ogólne / opis">
            <textarea
              className={inputClass}
              rows={2}
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="np. tempo, nawodnienie, zasady progresji…"
            />
          </Field>
        </div>
      )}

      {planId && (
        <AssignDialog
          open={assignOpen}
          planId={planId}
          onClose={() => setAssignOpen(false)}
          onAssigned={(clientName, startDate) =>
            onAssigned({ name: clientName, startDate, weeksCount: weeksCount || 1 })
          }
        />
      )}
    </div>
  );
}
