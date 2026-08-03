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

- Przy tworzeniu/zmianie jakiegokolwiek UI zawsze stosuj skille `design-system` (nasza paleta tokenów — jedyny dozwolony słownik kolorów) i `responsive-ui` (mobile-first; nazwy planów, ćwiczeń i klientów nigdy nie są ucinane; nic nie wychodzi poza kontener).
- Strony z danymi to komponenty klienckie: pierwsza linia `"use client"`, dane przez `api.*` w `useEffect` (wzorzec `useCallback` + `load()`).
- Nowe typy i metody API dodawaj do `lib/api.ts` — typy muszą być lustrzane do backendowych encji/DTO (camelCase).
- Używaj prymitywów z `components/ui.tsx`: `PageHeader`, `Card`, `Button`, `Field` + `inputClass`, `ErrorBanner`, `EmptyState`, `Badge`, `formatRest`.
- Błędy łap i pokazuj przez `<ErrorBanner message={error} />` (stan `error: string | null`).
- Nowy dział dopisz do tablicy `NAV` w `components/AppShell.tsx`.
- Import ścieżkowy przez alias `@/` (np. `@/lib/api`, `@/components/ui`).
- Po zmianach uruchom `npm run lint`, `npm run typecheck` i `npm run build` (z katalogu `apps/web/`).

## Never

- Nigdy nie używaj surowego `fetch` w stronach/komponentach — tylko `api` z `lib/api.ts`. Jedyny wrapper `fetch` żyje w `request<T>()` w tym pliku.
- Nigdy nie używaj surowych klas `zinc-*`/`yellow-*`/`red-*`/`emerald-*` w komponentach — wyłącznie tokeny semantyczne (`bg-surface`, `text-accent`, `border-border-strong`…) zdefiniowane w `app/globals.css` (`@theme`). Pełna tabela i zasady: skill `design-system`. Nie duplikuj stylów przycisków/pól — użyj `Button`/`inputClass`.
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

- Motyw Workout Alchemist Acid: tło `bg-background`, tekst `text-foreground`, akcent lime `bg-accent`/`text-accent`, gold (`pr`) tylko dla rekordów. Pełna paleta: skill `design-system` (źródło: `app/globals.css`, warstwy prymitywy → semantyka → `@theme inline`).
- Statusy przez `Badge` z tonami `neutral | accent | positive | danger | pr` (aliasy `yellow`/`green`/`red` nadal działają).
- Fonty Acid w `layout.tsx`: Archivo (`font-display` / `.display-caps`), Space Grotesk (`font-sans`), IBM Plex Mono (`font-mono` dla liczb).
