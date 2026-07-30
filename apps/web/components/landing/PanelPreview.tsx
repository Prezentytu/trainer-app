import { Avatar, Badge, Card, StatBlock } from "@/components/ui";

const CLIENTS = [
  { name: "Anna K.", status: "2 aktywne", tone: "positive" as const },
  { name: "Marek W.", status: "wymaga uwagi", tone: "danger" as const },
  { name: "Ola S.", status: "1 aktywny", tone: "positive" as const },
];

export function PanelPreview() {
  return (
    <section className="px-4 pb-16 sm:px-6 sm:pb-20" aria-label="Przykładowy widok panelu">
      <div className="mx-auto max-w-4xl">
        <p className="mb-3 text-center text-xs font-semibold tracking-[0.08em] text-muted uppercase">
          Przykładowy widok panelu
        </p>
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-raised">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-danger" />
            <span className="h-2.5 w-2.5 rounded-full bg-pr" />
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            <span className="ml-2 text-xs text-muted">Panel · Workout Alchemist</span>
          </div>

          <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-[1fr_1.2fr]">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-surface-sunken p-3 shadow-card">
                <StatBlock label="Klienci" value={12} size="md" />
              </div>
              <div className="rounded-xl border border-border bg-surface-sunken p-3 shadow-card">
                <StatBlock label="Sesje / 7 dni" value={28} size="md" />
              </div>
              <Card className="col-span-2" eyebrow="Priorytet" title="Wymaga uwagi">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar name="Marek W." size="sm" />
                    <span className="min-w-0 break-words text-sm">Marek W. · 9 dni ciszy</span>
                  </div>
                  <span className="shrink-0 rounded-[10px] bg-accent-dim px-2 py-1 text-xs font-semibold text-accent-strong">
                    Skopiuj link
                  </span>
                </div>
              </Card>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-surface-sunken shadow-card">
              <div className="border-b border-border px-4 py-3">
                <h3 className="font-display text-sm font-semibold">Klienci</h3>
              </div>
              <ul className="divide-y divide-border">
                {CLIENTS.map((c) => (
                  <li key={c.name} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={c.name} size="sm" />
                      <span className="break-words text-sm font-medium">{c.name}</span>
                    </div>
                    <Badge tone={c.tone}>{c.status}</Badge>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <span className="text-xs text-muted">Ostatni PR</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-pr">142.5 kg</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
