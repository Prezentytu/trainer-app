"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ProgressPhoto } from "@/lib/api";
import { compressImageFile } from "@/lib/compressImage";
import { Button, EmptyState, Field, inputClass } from "@/components/ui";

const VIEWS: { id: string; label: string }[] = [
  { id: "front", label: "Przód" },
  { id: "side", label: "Bok" },
  { id: "back", label: "Tył" },
];

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDay(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}

export function ProgressPhotoGallery({
  mode,
  clientId,
  token,
  onError,
}: {
  mode: "trainer" | "portal";
  clientId?: number;
  token?: string;
  onError: (message: string | null) => void;
}) {
  const [rows, setRows] = useState<ProgressPhoto[] | null>(null);
  const [urls, setUrls] = useState<Record<number, string>>({});
  const [leftId, setLeftId] = useState<number | null>(null);
  const [rightId, setRightId] = useState<number | null>(null);
  const [view, setView] = useState("front");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    const run = async () => {
      const list =
        mode === "trainer" && clientId != null
          ? await api.clients.photos(clientId)
          : token
            ? await api.portal.photos(token)
            : [];
      setRows(list);
      if (list.length >= 2) {
        setLeftId(list[list.length - 1].id);
        setRightId(list[0].id);
      } else if (list.length === 1) {
        setLeftId(list[0].id);
        setRightId(list[0].id);
      }
    };
    run().catch((e: Error) => onError(e.message));
  }, [mode, clientId, token, onError]);

  useEffect(load, [load]);

  useEffect(() => {
    if (!rows) return;
    let cancelled = false;
    const created: string[] = [];
    void (async () => {
      const next: Record<number, string> = {};
      for (const p of rows) {
        try {
          const blob =
            mode === "trainer" && clientId != null
              ? await api.clients.photoBlob(clientId, p.id)
              : token
                ? await api.portal.photoBlob(token, p.id)
                : null;
          if (!blob || cancelled) continue;
          const url = URL.createObjectURL(blob);
          created.push(url);
          next[p.id] = url;
        } catch {
          // pojedyncze zdjęcie może paść — reszta zostaje
        }
      }
      if (!cancelled) setUrls(next);
    })();
    return () => {
      cancelled = true;
      created.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [rows, mode, clientId, token]);

  const upload = async (file: File) => {
    setSaving(true);
    onError(null);
    try {
      const { base64, contentType } = await compressImageFile(file);
      const input = { imageBase64: base64, contentType, takenOn: todayIso(), view };
      if (mode === "trainer" && clientId != null) await api.clients.addPhoto(clientId, input);
      else if (token) await api.portal.addPhoto(token, input);
      await load();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    onError(null);
    try {
      if (mode === "trainer" && clientId != null) await api.clients.removePhoto(clientId, id);
      else if (token) await api.portal.removePhoto(token, id);
      await load();
    } catch (e) {
      onError((e as Error).message);
    }
  };

  if (rows == null) return <p className="text-sm text-muted">Ładuję zdjęcia…</p>;

  const left = rows.find((p) => p.id === leftId) ?? rows[rows.length - 1];
  const right = rows.find((p) => p.id === rightId) ?? rows[0];

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <EmptyState title="Zrób pierwsze zdjęcie sylwetki" action={null}>
          To samo ujęcie, to samo światło — łatwiej zobaczysz zmianę niż na wadze.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {[left, right].map((p, i) =>
            p ? (
              <figure key={`${p.id}-${i}`} className="min-w-0">
                {urls[p.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={urls[p.id]}
                    alt={`${p.view} ${formatDay(p.takenOn)}`}
                    className="aspect-[3/4] w-full rounded-[var(--r-card)] border border-border object-cover"
                  />
                ) : (
                  <div className="aspect-[3/4] rounded-[var(--r-card)] border border-border bg-surface" />
                )}
                <figcaption className="mt-2 text-xs text-muted">
                  {formatDay(p.takenOn)} · {VIEWS.find((v) => v.id === p.view)?.label ?? p.view}
                </figcaption>
              </figure>
            ) : null,
          )}
        </div>
      )}

      {rows.length >= 2 ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Lewa">
            <select
              className={inputClass}
              value={left?.id ?? ""}
              onChange={(e) => setLeftId(Number(e.target.value))}
            >
              {rows.map((p) => (
                <option key={p.id} value={p.id}>
                  {formatDay(p.takenOn)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Prawa">
            <select
              className={inputClass}
              value={right?.id ?? ""}
              onChange={(e) => setRightId(Number(e.target.value))}
            >
              {rows.map((p) => (
                <option key={p.id} value={p.id}>
                  {formatDay(p.takenOn)}
                </option>
              ))}
            </select>
          </Field>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={`rounded-[10px] border px-2.5 py-1.5 text-xs font-medium ${
              view === v.id
                ? "border-border-strong bg-surface-active text-foreground"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer">
          <span className="inline-flex h-[var(--h-btn)] items-center rounded-[var(--r-pill)] bg-invert-bg px-4 text-sm font-medium text-invert-fg">
            {saving ? "Wysyłam…" : "Dodaj zdjęcie"}
          </span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            disabled={saving}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void upload(file);
            }}
          />
        </label>
        {rows[0] ? (
          <Button variant="ghost" onClick={() => void remove(rows[0].id)}>
            Usuń najnowsze
          </Button>
        ) : null}
      </div>
    </div>
  );
}
