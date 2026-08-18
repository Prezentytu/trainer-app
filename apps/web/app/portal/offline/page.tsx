import { OfflineRetryButton } from "@/components/portal/OfflineRetryButton";

export const metadata = {
  title: "Brak połączenia",
};

/** Fallback nawigacji gdy SW nie ma w cache strony portalu. */
export default function PortalOfflinePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-2 text-center">
      <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">Sieć</p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">
        Brak połączenia
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
        Apka nie może wczytać tej strony. Sprawdź internet — ostatnio otwarte treningi mogą być nadal
        w pamięci. Zapisane serie polecą, gdy sieć wróci.
      </p>
      <OfflineRetryButton />
    </div>
  );
}
