"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, DashboardFromClientItem } from "@/lib/api";
import { Button, EmptyState, ErrorBanner, ListRow, PageHeader } from "@/components/ui";

function hrefFor(item: DashboardFromClientItem): string {
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
    default:
      return "Sygnał";
  }
}

export default function InboxPage() {
  const router = useRouter();
  const [rows, setRows] = useState<DashboardFromClientItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .inbox()
      .then(setRows)
      .catch((e: Error) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const unread = rows?.filter((r) => r.unread !== false).length ?? 0;

  return (
    <div>
      <PageHeader
        title="Od klientów"
        subtitle={
          rows
            ? unread > 0
              ? `${unread} do obejrzenia`
              : "Nic nowego — wróć po kolejnych treningach."
            : "Odpowiedzi, notatki i check-iny w jednym miejscu."
        }
      />
      <ErrorBanner message={error} />
      {rows == null ? (
        <p className="text-sm text-muted">Ładuję skrzynkę…</p>
      ) : rows.length === 0 ? (
        <EmptyState title="Pusto" action={null}>
          Gdy klient odpisze na komentarz albo wrzuci notatkę z treningu, pojawi się tutaj.
        </EmptyState>
      ) : (
        <div>
          {rows.map((item) => (
            <ListRow
              key={`${item.kind}-${item.clientId}-${item.sessionId ?? item.checkInId ?? item.at}`}
              title={item.clientName}
              sub={`${kindLabel(item.kind)} · ${item.preview}`}
              right={
                item.unread === false ? null : (
                  <span className="font-mono text-[11px] uppercase tracking-caps text-muted">Nowe</span>
                )
              }
              onClick={() => router.push(hrefFor(item))}
            />
          ))}
        </div>
      )}
      <p className="mt-6">
        <Link href="/">
          <Button variant="ghost">Wróć do panelu</Button>
        </Link>
      </p>
    </div>
  );
}
