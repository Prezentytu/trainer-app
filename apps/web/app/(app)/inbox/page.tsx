"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, TrainerNotification } from "@/lib/api";
import { refreshNavCounts } from "@/lib/navCounts";
import {
  Avatar,
  Button,
  EmptyState,
  ErrorBanner,
  ListRow,
  PageHeader,
  Pill,
  SegmentedControl,
} from "@/components/ui";

const KIND_CHIPS: { id: string; label: string }[] = [
  { id: "all", label: "Wszystkie" },
  { id: "session_note", label: "Notatki" },
  { id: "session_reply", label: "Odpowiedzi" },
  { id: "low_checkin", label: "Check-iny" },
  { id: "photo", label: "Zdjęcia" },
  { id: "measurement", label: "Pomiary" },
  { id: "rest", label: "Reszta" },
];

function hrefFor(item: TrainerNotification): string {
  if (item.kind === "history_import") return `/clients/${item.clientId}/import`;
  if (item.sessionId != null) return `/clients/${item.clientId}/sessions/${item.sessionId}`;
  return `/clients/${item.clientId}`;
}

function kindLabel(kind: string): string {
  switch (kind) {
    case "session_reply":
      return "Odpowiedź";
    case "session_note":
      return "Notatka z treningu";
    case "low_checkin":
      return "Słabe samopoczucie";
    case "out_of_order":
      return "Poza kolejką";
    case "history_import":
      return "Import historii";
    case "photo":
      return "Zdjęcie postępu";
    case "measurement":
      return "Pomiar";
    case "intake":
      return "Wywiad";
    default:
      return "Sygnał";
  }
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startItem = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startToday - startItem) / 86_400_000);
  if (diff === 0) return "Dzisiaj";
  if (diff === 1) return "Wczoraj";
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "long" });
}

export default function InboxPage() {
  const router = useRouter();
  const [rows, setRows] = useState<TrainerNotification[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [kind, setKind] = useState("all");
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(() => {
    api.inbox
      .list({ unreadOnly, kind, take: 50 })
      .then(setRows)
      .catch((e: Error) => setError(e.message));
  }, [unreadOnly, kind]);
  useEffect(load, [load]);

  const unread = rows?.filter((r) => r.unread).length ?? 0;

  const groups = useMemo(() => {
    if (!rows?.length) return [];
    const map = new Map<string, TrainerNotification[]>();
    for (const item of rows) {
      const label = dayLabel(item.at);
      const list = map.get(label) ?? [];
      list.push(item);
      map.set(label, list);
    }
    return [...map.entries()];
  }, [rows]);

  const open = (item: TrainerNotification) => {
    if (item.unread) {
      setRows((prev) =>
        prev?.map((r) => (r.id === item.id ? { ...r, unread: false, readAt: new Date().toISOString() } : r)) ?? null,
      );
      void api.inbox
        .markRead(item.id)
        .then(() => refreshNavCounts())
        .catch(() => {
          /* stary stan wróci przy następnym load */
        });
    }
    router.push(hrefFor(item));
  };

  const markAll = async () => {
    setMarkingAll(true);
    setError(null);
    try {
      await api.inbox.markAllRead();
      setRows((prev) => prev?.map((r) => ({ ...r, unread: false })) ?? null);
      await refreshNavCounts();
      if (unreadOnly) load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Od klientów"
        subtitle={
          rows
            ? unread > 0
              ? `${unread} do obejrzenia na tej liście.`
              : unreadOnly
                ? "Nic nieprzeczytanego."
                : "Nic nowego — wróć po kolejnych treningach."
            : "Notatki, odpowiedzi i check-iny w jednym miejscu."
        }
        action={
          unread > 0 ? (
            <Button variant="ghost" disabled={markingAll} onClick={() => void markAll()}>
              {markingAll ? "Oznaczam…" : "Oznacz wszystkie jako przeczytane"}
            </Button>
          ) : null
        }
      />
      <ErrorBanner message={error} />

      <div className="mb-4 flex flex-col gap-3">
        <SegmentedControl
          value={unreadOnly ? "unread" : "all"}
          onChange={(v) => setUnreadOnly(v === "unread")}
          items={[
            { value: "all", label: "Wszystkie" },
            { value: "unread", label: "Nieprzeczytane" },
          ]}
        />
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {KIND_CHIPS.map((chip) => (
            <Pill key={chip.id} active={kind === chip.id} onClick={() => setKind(chip.id)}>
              {chip.label}
            </Pill>
          ))}
        </div>
      </div>

      {rows == null ? (
        <p className="text-sm text-muted">Ładuję skrzynkę…</p>
      ) : rows.length === 0 ? (
        <EmptyState title={unreadOnly ? "Nic nieprzeczytanego" : "Pusto"} action={null}>
          {unreadOnly
            ? "Nowe notatki i odpowiedzi pojawią się tutaj, dopóki ich nie otworzysz."
            : "Gdy klient dopisze notatkę do treningu, wrzuci zdjęcie albo odpisze, pojawi się tutaj."}
        </EmptyState>
      ) : (
        <div>
          {groups.map(([label, items]) => (
            <section key={label} className="mb-4">
              <h2 className="t-label mb-1 px-2 text-muted">{label}</h2>
              {items.map((item) => (
                <ListRow
                  key={item.id}
                  leading={<Avatar name={item.clientName} size="sm" />}
                  title={<span className="break-words">{item.clientName}</span>}
                  sub={
                    <span className="break-words">
                      {kindLabel(item.kind)} · {item.preview}
                    </span>
                  }
                  right={
                    item.unread ? (
                      <span className="font-mono text-[11px] uppercase tracking-[var(--track-label)] text-muted">
                        Nowe
                      </span>
                    ) : null
                  }
                  onClick={() => open(item)}
                />
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
