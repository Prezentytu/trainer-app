# PWA klienta na iPhone — standalone, ikona, offline shell

## TLDR

Doprowadzenie portalu klienta `/portal/{token}` do poziomu instalowalnej aplikacji na iPhone: poprawny manifest per token (start_url na plan klienta), ikony i splash w Acid, instrukcja instalacji dla Safari (bez `beforeinstallprompt`), app shell w service workerze z fallbackiem offline. Rozszerza `2026-07-30-client-portal-pwa.md`.

## Problem

Portal ma już `display: standalone`, dynamiczny manifest i kolejkę zapisów, ale na iOS instalacja nie działa jak u konkurencji (FitPros, Trainerize):

1. Root layout wstawia `<link rel="manifest">` ze `start_url: "/"` — wygrywa nad manifestem per token doklejanym w `useEffect`. Zainstalowana ikona otwiera landing.
2. Jedyna ikona to SVG w starym kolorze teal — Safari nie używa SVG jako `apple-touch-icon`.
3. `PwaInstallPrompt` czeka na `beforeinstallprompt` (Safari go nie ma).
4. `statusBarStyle: black-translucent` + brak `safe-area-inset-top` → treść pod zegarem.
5. `sw.js` nie cache'uje — offline w standalone = błąd Safari.
6. Push na iOS wymaga zainstalowanej PWA — brak gatowania w UI.

## Proponowane rozwiązanie

- Zero nowych zależności (`next/og` ImageResponse na ikony i splash).
- Metadane PWA wyłącznie w layoutcie `/portal/[token]` (`generateMetadata`: manifest per token, `appleWebApp`, ikony).
- Usunięcie `manifest` / `appleWebApp` z root layoutu.
- `PwaInstallPrompt`: detekcja standalone; iOS = instrukcja Share → Dodaj do ekranu; Android = `beforeinstallprompt`.
- `sw.js`: wersjonowany cache, CacheFirst dla `/_next/static`, StaleWhileRevalidate dla nawigacji `/portal/*`, NetworkFirst dla GET `/api/portal/*`; POST/PATCH bez cache (kolejka `sessionQueue`).
- Strona `/portal/offline` jako fallback nawigacji.

## Model danych

Brak zmian.

## Kontrakt API

Brak zmian. Service worker cache'uje istniejące GET-y portalu.

## UI

| Ścieżka / plik | Rola |
|---|---|
| `app/icons/[size]/route.tsx` | PNG 180 / 192 / 512 / 512-maskable |
| `app/splash/[size]/route.tsx` | `apple-touch-startup-image` |
| `app/portal/[token]/layout.tsx` | Server layout + `generateMetadata` |
| `app/portal/offline/page.tsx` | Fallback offline |
| `components/portal/PwaInstallPrompt.tsx` | iOS + Android install UX |
| `public/sw.js` | App shell + push |
| `public/icon.svg` / `app/icon.svg` | mono `#0B0C0D` + znak R (Instrument Sans) |

## Fazy implementacji

- [x] Faza 1 — ikony PNG + manifest per token + usunięcie PWA z root layoutu
- [x] Faza 2 — server layout portalu, safe-area-top, splash
- [x] Faza 3 — PwaInstallPrompt iOS + gating push
- [x] Faza 4 — service worker app shell + `/portal/offline` + rejestracja w layoucie
- [x] Faza 5 — walidacja (`check.sh` zielona; checklist iPhone wymaga HTTPS / tunelu na urządzeniu)

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Root scope SW (`/sw.js`) cache'uje panel trenera | Filtr ścieżek w `fetch` — tylko `/portal/*`, `/_next/static/*`, `/icons/*`, GET API portalu |
| Cache API vs kolejka offline | POST/PATCH pomijane; GET NetworkFirst |
| Splash × wiele rozmiarów iPhone | Start od obecnych modeli portrait |
| Server layout vs `PortalChromeProvider` | Provider i nav jako dzieci klienckie z tokenem w propsie |

## Changelog

- 2026-08-05 — utworzono spec (plan iOS PWA standalone).
- 2026-08-05 — wdrożono: ikony/splash Acid, manifest per token w `generateMetadata`, iOS install UX, SW app shell, `/portal/offline`. `check.sh` OK.
- 2026-08-14 — favicon i PWA: znak R (Instrument Sans) na `#0B0C0D` zamiast trójkąta Vercela / starego „WA” lime.
