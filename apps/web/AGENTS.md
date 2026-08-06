<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Frontend — zasady dla agentów

Next.js 16 (App Router) + React 19 + Tailwind 4. Port 3000. Ciemny motyw, UI po polsku. Zobacz też root `AGENTS.md`.

## Struktura

| Ścieżka | Rola |
|---|---|
| `app/layout.tsx` | Root: fonty, metadata, `ClerkAppProvider` (bez sidebara) |
| `app/(app)/layout.tsx` | Panel trenera: owija `AppShell` (klienci, ćwiczenia, plany) |
| `app/page.tsx` | `/` — landing (gość) albo Panel w `AppShell` (zalogowany / lokal) |
| `components/AppShell.tsx` | Sidebar (desktop) + mobilny drawer + tablica `NAV` (tu dopisujesz nowe działy) |
| `components/landing/` | Sekcje strony powitalnej |
| `components/auth/AuthScreen.tsx` | Split-screen dla `/sign-in` i `/sign-up` |
| `app/{zasób}/page.tsx` | Strona listy zasobu (client component) — w grupie `(app)` |
| `app/{zasób}/[id]/page.tsx` | Strona szczegółów |
| `lib/api.ts` | Typowany klient API — typy TS + obiekt `api` z metodami per zasób |
| `components/ui.tsx` | Wspólne prymitywy UI |
| `components/PlanBuilder.tsx` | Złożony komponent buildera planów (przykład formularza) |

## Always

- Przy tworzeniu/zmianie jakiegokolwiek UI zawsze stosuj skille `design-system` (mono v2 — jedyny dozwolony słownik kolorów), `responsive-ui`, `fitness-ui-ux`, `senior-ux-cro`, `apple-design`.
- Strony z danymi to komponenty klienckie: pierwsza linia `"use client"`, dane przez `api.*` w `useEffect` (wzorzec `useCallback` + `load()`).
- Nowe typy i metody API dodawaj do `lib/api.ts` — typy muszą być lustrzane do backendowych encji/DTO (camelCase).
- Używaj prymitywów z `components/ui.tsx`: `PageHeader`, `Card`, `ListRow`, `Button`, `Field` + `inputClass`, `ErrorBanner`, `EmptyState`, `Badge`/`Marker`, `formatRest`. Ikony wyłącznie przez `components/Icon.tsx` (Phosphor).
- Błędy łap i pokazuj przez `<ErrorBanner message={error} />` (stan `error: string | null`).
- Nowy dział dopisz do tablicy `NAV` w `components/AppShell.tsx` (lewy sidebar desktop + floating pill mobile).
- Import ścieżkowy przez alias `@/` (np. `@/lib/api`, `@/components/ui`).
- Po zmianach uruchom `npm run lint`, `npm run typecheck` i `npm run build` (z katalogu `apps/web/`).

## Never

- Nigdy nie używaj surowego `fetch` w stronach/komponentach — tylko `api` z `lib/api.ts`. Jedyny wrapper `fetch` żyje w `request<T>()` w tym pliku.
- Nigdy nie używaj surowych klas `zinc-*`/`lime-*`/`yellow-*`/`red-*`/`emerald-*` ani Lucide — wyłącznie tokeny z `app/globals.css` i `Icon`. Chrome bez hue (primary = invert). Skill `design-system`.
- Nigdy nie zakładaj wiedzy o API Next.js z pamięci — sprawdź lokalne docsy (ostrzeżenie na górze).

## Wzorzec strony listy (na bazie `app/clients/page.tsx`)

```tsx
"use client";
import { useCallback, useEffect, useState } from "react";
import { api, ClientSummary } from "@/lib/api";
import { Button, Card, EmptyState, ErrorBanner, PageHeader } from "@/components/ui";

export default function ClientsPage() {
  const [rows, setRows] = useState<ClientSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.clients.list().then(setRows).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  return (
    <div>
      <PageHeader title="Klienci" subtitle="…" />
      <ErrorBanner message={error} />
      {rows.length === 0 ? <EmptyState>Brak danych.</EmptyState> : /* lista Card */ null}
    </div>
  );
}
```

## Kontrakt `lib/api.ts`

- Base URL: `process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5210"`.
- `request<T>()` ustawia `Content-Type: application/json`, przy `!res.ok` wyciąga `body.message` i rzuca `Error`, przy `204` zwraca `undefined`.
- Metody grupowane per zasób: `api.clients`, `api.exercises`, `api.plans`, `api.assignments`. Nowy zasób dokładaj analogicznie.

## Styl / Tailwind

- Motyw **mono v2**: tło `bg-background`, tekst `text-foreground`, primary = invert (`bg-invert-bg` / legacy `bg-accent` → biały fill). Data accents: `pr` / `gain` / `loss`. Skill `design-system`. Landing marketingowy też na mono (`components/landing/`).
- Statusy: `Badge` / `Marker` z tonami `neutral | accent | positive/gain | danger/loss | pr`.
- Fonty w `layout.tsx`: Instrument Sans (`font-sans` / display), Geist Mono (`font-mono`). Role: `.t-title`, `.t-label`, `.t-num`.
