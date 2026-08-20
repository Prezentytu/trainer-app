"use client";

import { RIR_HELP } from "@/lib/api";
import { inputClass } from "@/components/ui";
import { NumInput } from "./NumInput";
import { FloatingMenu, FloatingMenuItem, FloatingMenuLabel } from "./FloatingMenu";
import { BuilderItem } from "./types";

const RIR_OPTIONS = [0, 1, 2, 3] as const;
const REST_OPTIONS = [45, 60, 90, 120, 180, 240] as const;

function restLabel(seconds: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${seconds} s`;
  const min = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${min} min` : `${min}:${String(rest).padStart(2, "0")}`;
}

function Slot({
  name,
  value,
  title,
  children,
}: {
  name: string;
  value: string;
  title?: string;
  children: (api: { close: () => void }) => React.ReactNode;
}) {
  return (
    <FloatingMenu
      label={name}
      minWidth="13rem"
      trigger={({ open, toggle, ref }) => (
        <button
          ref={ref}
          type="button"
          onClick={toggle}
          title={title}
          aria-haspopup="menu"
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-[var(--r-field)] px-1.5 py-1 transition-colors hover:bg-surface-hover"
        >
          <span className="t-label text-muted-faint">{name}</span>
          <span className="font-mono text-[13px] font-semibold tabular-nums text-foreground">
            {value}
          </span>
        </button>
      )}
    >
      {children}
    </FloatingMenu>
  );
}

/**
 * Jeden pas „DOMYŚLNIE” zamiast osobnych, wysokich sekcji na przerwę, RIR i tempo.
 * Ustawiona tu przerwa obowiązuje wszystkie serie, które nie mają własnego override’u.
 */
export function ItemDefaultsBar({
  item,
  fallbackRestSeconds,
  onPatch,
}: {
  item: BuilderItem;
  fallbackRestSeconds?: number | null;
  onPatch: (patch: Partial<BuilderItem>) => void;
}) {
  const rest = item.restBetweenSetsSeconds ?? fallbackRestSeconds ?? null;

  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 border-y border-border py-1">
      <span className="t-label mr-1 shrink-0 text-muted-faint">Domyślnie</span>

      <Slot name="przerwa" value={restLabel(rest)} title="Domyślna przerwa między seriami">
        {({ close }) => (
          <>
            <FloatingMenuLabel>Przerwa między seriami</FloatingMenuLabel>
            {REST_OPTIONS.map((s) => (
              <FloatingMenuItem
                key={s}
                active={item.restBetweenSetsSeconds === s}
                onClick={() => {
                  onPatch({ restBetweenSetsSeconds: s });
                  close();
                }}
              >
                {restLabel(s)}
              </FloatingMenuItem>
            ))}
            <div className="px-2.5 pb-1 pt-2">
              <NumInput
                value={item.restBetweenSetsSeconds}
                min={0}
                onChange={(v) => onPatch({ restBetweenSetsSeconds: v })}
                placeholder="własna, w s"
                aria-label="Własna przerwa w sekundach"
              />
            </div>
          </>
        )}
      </Slot>

      <span className="text-muted-faint" aria-hidden>
        ·
      </span>

      <Slot name="RIR" value={item.targetRir != null ? String(item.targetRir) : "—"} title={RIR_HELP}>
        {({ close }) => (
          <>
            <FloatingMenuLabel>Powtórzenia w zapasie</FloatingMenuLabel>
            {RIR_OPTIONS.map((v) => (
              <FloatingMenuItem
                key={v}
                active={item.targetRir === v}
                onClick={() => {
                  onPatch({ targetRir: v });
                  close();
                }}
              >
                {v === 3 ? "3 lub więcej" : String(v)}
              </FloatingMenuItem>
            ))}
            <FloatingMenuItem
              active={item.targetRir == null}
              onClick={() => {
                onPatch({ targetRir: null });
                close();
              }}
            >
              Bez celu
            </FloatingMenuItem>
          </>
        )}
      </Slot>

      <span className="text-muted-faint" aria-hidden>
        ·
      </span>

      <Slot name="tempo" value={item.tempo ?? "—"} title="Tempo ruchu, np. 3110">
        {() => (
          <div className="px-2.5 py-2">
            <input
              className={inputClass}
              autoFocus
              value={item.tempo ?? ""}
              onChange={(e) => onPatch({ tempo: e.target.value.toUpperCase().slice(0, 5) || null })}
              placeholder="3110"
              aria-label="Tempo ruchu"
            />
            <p className="mt-1.5 text-xs text-muted">Ekscentryka, pauza, koncentryka, pauza.</p>
          </div>
        )}
      </Slot>
    </div>
  );
}
