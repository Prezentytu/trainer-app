# apps/web — portal trenera (Next.js 16)

Frontend Trainer App: Next.js 16 (App Router) + React 19 + Tailwind 4, ciemny motyw, UI po polsku.

## Uruchomienie

```bash
npm install
npm run dev      # http://localhost:3000 (wymaga API na :5210)
```

API base URL: `NEXT_PUBLIC_API_URL` (domyślnie `http://localhost:5210`).

## Skrypty

| Skrypt | Opis |
|---|---|
| `npm run dev` | serwer deweloperski |
| `npm run build` | produkcyjny build |
| `npm run start` | uruchomienie builda |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Konwencje

Zasady i wzorce (klient API `lib/api.ts`, prymitywy `components/ui.tsx`, strony App Router) opisuje [`AGENTS.md`](AGENTS.md). Zacznij od głównego [`../../AGENTS.md`](../../AGENTS.md).
