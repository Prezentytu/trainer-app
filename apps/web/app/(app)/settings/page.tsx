"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { Icon } from "@/components/Icon";
import { api, NavCounts, clerkEnabled } from "@/lib/api";
import { useTheme } from "@/lib/theme";
import { Button, Card, ErrorBanner, PageHeader, Skeleton, Switch } from "@/components/ui";

export default function SettingsPage() {
  const [counts, setCounts] = useState<NavCounts | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingJson, setDownloadingJson] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    api
      .counts()
      .then((c) => {
        if (!cancelled) setCounts(c);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingCounts(false);
      });
    return () => {
      cancelled = true;
    };
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
      ? `Kopia obejmuje ${counts.clients} ${pluralClients(counts.clients)} i ${counts.plans} ${pluralPlans(counts.plans)} wraz z historią treningów, pomiarami i wywiadem.`
      : "Kopia obejmuje klientów, plany, historie treningów, pomiary i wywiad.";

  return (
    <div className="space-y-4">
      <PageHeader title="Ustawienia" subtitle="Wygląd, konto i kopia danych" />
      <ErrorBanner message={error} />

      {loadingCounts ? (
        <div className="max-w-2xl space-y-3 rounded-[var(--r-card)] border border-border bg-surface p-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-64" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : null}

      <Card
        className="max-w-2xl"
        icon={<Icon name="sliders-horizontal" size={16} decorative />}
        title="Wygląd"
        meta="Motyw zapisuje się w tej przeglądarce."
      >
        <Switch
          label="Jasny motyw"
          checked={theme === "light"}
          onChange={(light) => setTheme(light ? "light" : "dark")}
        />
        <p className="mt-3 text-xs text-muted">
          Wyłączony = ciemny interfejs (domyślny).
        </p>
      </Card>

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
              disabled={downloadingCsv || downloadingJson || deleting}
            >
              Pobierz plik dla Excela (.csv)
            </Button>
            <Button
              variant="secondary"
              onClick={() => void downloadJson()}
              loading={downloadingJson}
              disabled={downloadingCsv || downloadingJson || deleting}
            >
              Pobierz pełną kopię (.json)
            </Button>
          </div>
          <p className="text-xs text-muted">
            CSV zawiera też wiersze serii. Pełna kopia JSON obejmuje pomiary, wywiad i check-iny —
            bez tokenów linków portalu.
          </p>
        </div>
      </Card>

      <Card
        className="max-w-2xl"
        icon={<Icon name="warning-circle" size={16} decorative />}
        title="Usuń konto"
        meta="Nieodwracalne — kasuje klientów, plany i historię treningów."
      >
        <p className="mb-3 text-sm text-foreground-secondary">
          Najpierw pobierz kopię danych. Potem wpisz{" "}
          <span className="font-mono font-semibold text-foreground">USUN</span>, żeby potwierdzić.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            className="h-[var(--h-field)] w-full max-w-xs rounded-[var(--r-field)] border border-border-strong bg-field px-2.5 text-base font-medium uppercase tracking-wide text-foreground outline-none focus:border-foreground focus:shadow-[var(--focus-ring)] sm:text-sm"
            value={confirmDelete}
            onChange={(e) => setConfirmDelete(e.target.value)}
            placeholder="USUN"
            autoComplete="off"
            aria-label="Potwierdzenie usunięcia konta"
          />
          {clerkEnabled ? (
            <ClerkDeleteButton
              enabled={confirmDelete.trim().toUpperCase() === "USUN"}
              deleting={deleting}
              setDeleting={setDeleting}
              setError={setError}
            />
          ) : (
            <Button
              variant="danger"
              disabled={confirmDelete.trim().toUpperCase() !== "USUN" || deleting}
              loading={deleting}
              onClick={() => {
                void (async () => {
                  setDeleting(true);
                  setError(null);
                  try {
                    await api.deleteAccount();
                    window.location.href = "/";
                  } catch (e) {
                    setError((e as Error).message);
                    setDeleting(false);
                  }
                })();
              }}
            >
              Usuń konto na zawsze
            </Button>
          )}
        </div>
        <p className="mt-3 text-xs text-muted">
          Zobacz też{" "}
          <Link href="/prywatnosc" className="text-foreground underline-offset-2 hover:underline">
            politykę prywatności
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}

function ClerkDeleteButton({
  enabled,
  deleting,
  setDeleting,
  setError,
}: {
  enabled: boolean;
  deleting: boolean;
  setDeleting: (v: boolean) => void;
  setError: (v: string | null) => void;
}) {
  const { signOut } = useClerk();
  return (
    <Button
      variant="danger"
      disabled={!enabled || deleting}
      loading={deleting}
      onClick={() => {
        void (async () => {
          setDeleting(true);
          setError(null);
          try {
            await api.deleteAccount();
            await signOut({ redirectUrl: "/" });
          } catch (e) {
            setError((e as Error).message);
            setDeleting(false);
          }
        })();
      }}
    >
      Usuń konto na zawsze
    </Button>
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
