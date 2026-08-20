"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { Icon } from "@/components/Icon";
import { api, NavCounts, TrainerMe, clerkEnabled } from "@/lib/api";
import { importClientBundleFile } from "@/lib/clientBundle";
import { PalettePicker } from "@/components/PalettePicker";
import { useTheme } from "@/lib/theme";
import { Button, Card, ErrorBanner, PageHeader, Skeleton, Switch } from "@/components/ui";

export default function SettingsPage() {
  const router = useRouter();
  const bundleInputRef = useRef<HTMLInputElement>(null);
  const [counts, setCounts] = useState<NavCounts | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingJson, setDownloadingJson] = useState(false);
  const [importingBundle, setImportingBundle] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");
  const { theme, setTheme } = useTheme();
  const [me, setMe] = useState<TrainerMe | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [notify, setNotify] = useState({ daily: true, reply: true, digest: true });
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
          daily: m.notifyDailySummary !== false,
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
    key: "notifyDailySummary" | "notifyClientReply" | "notifyWeeklyDigest",
    value: boolean,
  ) => {
    const prev = notify;
    const next = {
      daily: key === "notifyDailySummary" ? value : notify.daily,
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

  const claimGuarantee = async () => {
    setBillingBusy("gwarancja");
    setError(null);
    setNote(null);
    try {
      const res = await api.billing.wdrozenieGwarancja();
      setMe((prev) =>
        prev
          ? {
              ...prev,
              wdrozenieCreditGrosze: 0,
              wdrozenieGuaranteeEligible: false,
            }
          : prev,
      );
      setNote(res.message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
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

  const importBundle = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImportingBundle(true);
    setError(null);
    setNote(null);
    try {
      const result = await importClientBundleFile(file);
      const extra = result.warnings[0] ? ` ${result.warnings[0]}` : "";
      setNote(`${result.name} jest na tym koncie.${extra}`);
      router.push(`/clients/${result.clientId}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setImportingBundle(false);
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
      {note ? <p className="text-sm text-foreground-secondary">{note}</p> : null}

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
        meta="Motyw i kolory zapisują się w tej przeglądarce."
      >
        <Switch
          label="Jasny motyw"
          checked={theme === "light"}
          onChange={(light) => setTheme(light ? "light" : "dark")}
        />
        <p className="mt-3 text-xs text-muted">
          Wyłączony = ciemny interfejs (domyślny).
        </p>
        <div className="mt-5 border-t border-border pt-4">
          <p id="settings-palette" className="text-[15px] font-medium text-foreground">
            Kolorystyka
          </p>
          <p className="mt-0.5 text-xs text-muted">
            Każda paleta ma swój kolor. Rekordy zostają złote.
          </p>
          <div className="mt-3">
            <PalettePicker labelledBy="settings-palette" />
          </div>
        </div>
      </Card>

      <Card
        icon={<Icon name="chat" size={16} decorative />}
        title="Powiadomienia e-mail"
        meta="Maile tylko przy odpowiedzi i w podsumowaniach — nie po każdym treningu."
      >
        {meLoading ? (
          <p className="text-sm text-muted">Ładuję ustawienia…</p>
        ) : (
          <div className="space-y-3">
            <Switch
              label="Odpowiedzi klientów — od razu"
              checked={notify.reply}
              onChange={(v) => void savePref("notifyClientReply", v)}
            />
            <Switch
              label="Codzienne podsumowanie nieprzeczytanych"
              checked={notify.daily}
              onChange={(v) => void savePref("notifyDailySummary", v)}
            />
            <Switch
              label="Poniedziałkowy przegląd tygodnia"
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
            {me.wdrozenieCreditGrosze && me.wdrozenieCreditGrosze > 0 ? (
              <p className="mt-4 text-sm text-foreground-secondary">
                Kredyt z wdrożenia: {Math.round(me.wdrozenieCreditGrosze / 100)} zł. Przy przejściu
                na rok schodzi jako {Math.round(me.wdrozenieCreditGrosze / 100 / 12)} zł mniej przez
                12 miesięcy.
              </p>
            ) : null}
            {me.wdrozenieGuaranteeEligible ? (
              <div className="mt-4">
                <Button
                  variant="secondary"
                  onClick={() => void claimGuarantee()}
                  loading={billingBusy === "gwarancja"}
                >
                  Zwrot wdrożenia — nikt nie dokończył treningu
                </Button>
              </div>
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
              disabled={downloadingCsv || downloadingJson || importingBundle || deleting}
            >
              Pobierz arkusz
            </Button>
            <Button
              variant="secondary"
              onClick={() => void downloadJson()}
              loading={downloadingJson}
              disabled={downloadingCsv || downloadingJson || importingBundle || deleting}
            >
              Pobierz pełną kopię
            </Button>
          </div>
          <p className="text-xs text-muted">
            Arkusz ma też każdą serię. Pełna kopia to archiwum całego konta — nie wgrywa się na
            drugim koncie. Bez linków do portalu.
          </p>
        </div>
        <div className="mt-5 border-t border-border pt-4">
          <p className="text-[15px] font-medium text-foreground">Wgraj plany i historię</p>
          <p className="mt-0.5 text-xs text-muted">
            Na drugim koncie, na dole karty klienta: Pobierz plany i historię. Tu wgrywasz ten plik.
            Potem wyślij nowy link do portalu.
          </p>
          <input
            ref={bundleInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => void importBundle(e)}
          />
          <div className="mt-3">
            <Button
              variant="secondary"
              loading={importingBundle}
              disabled={downloadingCsv || downloadingJson || importingBundle || deleting}
              onClick={() => bundleInputRef.current?.click()}
            >
              Wybierz plik
            </Button>
          </div>
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
