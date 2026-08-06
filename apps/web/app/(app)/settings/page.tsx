"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { api, NavCounts } from "@/lib/api";
import { Button, Card, ErrorBanner, PageHeader } from "@/components/ui";

export default function SettingsPage() {
  const [counts, setCounts] = useState<NavCounts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingJson, setDownloadingJson] = useState(false);

  useEffect(() => {
    api
      .counts()
      .then(setCounts)
      .catch(() => {
        // Liczniki są pomocnicze — brak nie blokuje pobierania.
      });
  }, []);

  const downloadCsv = async () => {
    setDownloadingCsv(true);
    setError(null);
    try {
      const csv = await api.exportCsv();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `repmaxer-export-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDownloadingCsv(false);
    }
  };

  const downloadJson = async () => {
    setDownloadingJson(true);
    setError(null);
    try {
      const data = await api.export();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `repmaxer-export-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDownloadingJson(false);
    }
  };

  const summary =
    counts != null
      ? `Kopia obejmuje ${counts.clients} ${pluralClients(counts.clients)} i ${counts.plans} ${pluralPlans(counts.plans)} wraz z historią treningów.`
      : "Kopia obejmuje klientów, plany i historię treningów.";

  return (
    <div>
      <PageHeader title="Ustawienia" subtitle="Twoje konto i kopia danych" />
      <ErrorBanner message={error} />

      <Card
        className="max-w-2xl"
        icon={<Icon name="download" size={16} decorative />}
        title="Pobierz swoje dane"
        meta="Wszystko, co zapisałeś w aplikacji, możesz w każdej chwili pobrać na swój komputer."
      >
        <p className="mb-5 text-sm text-foreground-secondary">{summary}</p>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              onClick={() => void downloadCsv()}
              loading={downloadingCsv}
              disabled={downloadingCsv || downloadingJson}
            >
              Pobierz plik dla Excela (.csv)
            </Button>
            <Button
              variant="secondary"
              onClick={() => void downloadJson()}
              loading={downloadingJson}
              disabled={downloadingCsv || downloadingJson}
            >
              Pobierz pełną kopię (.json)
            </Button>
          </div>
          <p className="text-xs text-muted">
            Pełna kopia zawiera każdą serię i powtórzenie — przydatne przy przenoszeniu danych do innego programu.
          </p>
        </div>
      </Card>
    </div>
  );
}

function pluralClients(n: number): string {
  if (n === 1) return "klienta";
  return "klientów";
}

function pluralPlans(n: number): string {
  if (n === 1) return "plan";
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "plany";
  return "planów";
}
