"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { Icon } from "@/components/Icon";
import { api, NavCounts, TrainerMe, clerkEnabled } from "@/lib/api";
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
  const [me, setMe] = useState<TrainerMe | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [notify, setNotify] = useState({ session: true, pr: true, reply: true, digest: true });
  const [billingBusy, setBillingBusy] = useState<string | null>(null);

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
    api
      .me()
      .then((m) => {
        if (cancelled) return;
        setMe(m);
        setNotify({
          session: m.notifySessionComplete !== false,
          pr: m.notifyPr !== false,
          reply: m.notifyClientReply !== false,
          digest: m.notifyWeeklyDigest !== false,
        });
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setMeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const savePref = async (
    key: "notifySessionComplete" | "notifyClientReply" | "notifyPr" | "notifyWeeklyDigest",
    value: boolean,
  ) => {
    const prev = notify;
    const next = {
      session: key === "notifySessionComplete" ? value : notify.session,
      pr: key === "notifyPr" ? value : notify.pr,
      reply: key === "notifyClientReply" ? value : notify.reply,
      digest: key === "notifyWeeklyDigest" ? value : notify.digest,
    };
    setNotify(next);
    try {
      await api.updatePreferences({ [key]: value });
    } catch (e) {
      setNotify(prev);
      setError((e as Error).message);
    }
  };

  const startCheckout = async (planKey: string) => {
    setBillingBusy(planKey);
    setError(null);
    try {
      const { checkoutUrl } = await api.billing.checkout(planKey);
      window.location.href = checkoutUrl;
    } catch (e) {
      setError((e as Error).message);
      setBillingBusy(null);
    }
  };

  const openBillingPortal = async () => {
    setBillingBusy("portal");
    setError(null);
    try {
      const { portalUrl } = await api.billing.portal();
      window.location.href = portalUrl;
    } catch (e) {
      setError((e as Error).message);
      setBillingBusy(null);
    }
  };

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
        <div className="space-y-3 rounded-[var(--r-card)] border border-border bg-surface p-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-64" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : null}

      <Card
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
        icon={<Icon name="chat" size={16} decorative />}
        title="Powiadomienia e-mail"
        meta="Dostajesz maila, gdy klient skończy trening, zrobi rekord albo odpisze."
      >
        {meLoading ? (
          <p className="text-sm text-muted">Ładuję ustawienia…</p>
        ) : (
          <div className="space-y-3">
            <Switch
              label="Ukończony trening"
              checked={notify.session}
              onChange={(v) => void savePref("notifySessionComplete", v)}
            />
            <Switch
              label="Nowy rekord"
              checked={notify.pr}
              onChange={(v) => void savePref("notifyPr", v)}
            />
            <Switch
              label="Odpowiedź na komentarz"
              checked={notify.reply}
              onChange={(v) => void savePref("notifyClientReply", v)}
            />
            <Switch
              label="Podsumowanie tygodnia (poniedziałek)"
              checked={notify.digest}
              onChange={(v) => void savePref("notifyWeeklyDigest", v)}
            />
          </div>
        )}
      </Card>

      <Card
        icon={<Icon name="sliders-horizontal" size={16} decorative />}
        title="Plan i limit osób"
        meta={me?.planName ?? "Darmowy — 5 osób"}
      >
        {me ? (
          <>
            <p className="mb-4 text-sm text-foreground-secondary">
              {me.planKey === "dev"
                ? "Konto deweloperskie — bez limitu."
                : me.clientLimit != null
                  ? `${me.clientCount ?? 0} z ${me.clientLimit} osób.`
                  : `${me.clientCount ?? 0} osób.`}
            </p>
            {me.planKey !== "dev" && me.billingConfigured ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {me.planKey === "free" || me.planKey === "founding" ? (
                  <>
                    <Button onClick={() => void startCheckout("starter")} loading={billingBusy === "starter"}>
                      39 zł · 15 osób
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => void startCheckout("pro")}
                      loading={billingBusy === "pro"}
                    >
                      99 zł · 30 osób
                    </Button>
                  </>
                ) : (
                  <Button variant="secondary" onClick={() => void openBillingPortal()} loading={billingBusy === "portal"}>
                    Zarządzaj subskrypcją
                  </Button>
                )}
              </div>
            ) : me.planKey !== "dev" && !me.billingConfigured ? (
              <p className="text-xs text-muted">
                Płatność kartą włączymy przy starcie. Limit 5 osób obowiązuje na koncie produkcyjnym.
              </p>
            ) : null}
          </>
        ) : null}
      </Card>

      <Card
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
