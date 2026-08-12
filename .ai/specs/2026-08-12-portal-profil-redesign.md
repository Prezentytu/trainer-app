# Portal Profil — redesign hierarchii

## TLDR

Redesign zakładki Profil w portalu klienta: grouped settings (Hevy/Strong/iOS), cięcie microcopy, bez karty planu (dom: zakładka Dziś) i spójny język z redesignem Progresu. Bez zmian API.

## Problem

Ekran `/portal/[token]/profile` ma płaską hierarchię (wszystkie sekcje ten sam mono-caps), ścianę objaśnień pod przełącznikami oraz mieszaną 6-wierszową listę ustawień. Plan i linki narzędziowe nie wyróżniają się od kontrolek.

## Proponowane rozwiązanie

Wzorce iOS Settings / Hevy / Strong / Styrka + skille `design-system`, `fitness-ui-ux`, `senior-ux-cro`, `apple-design`, `responsive-ui`:

1. **Header** — Avatar + imię (bez eyebrow „Profil”).
2. **Bez karty planu** — duplikowała „Dziś”; test odejmowania (Styrka) — plan żyje wyłącznie na zakładce startowej.
3. **Ustawienia** — dwie grupy po 3 wiersze (Trening / Aplikacja), jedna linia na wiersz; kontekst w footerze grupy.
4. **SectionHeader** — współdzielony komponent portalu (jak na Progresie).
5. **Więcej** — wiersze z kaflem ikony + chevronem; legal na końcu.
6. **PWA** — `PwaInstallPrompt` pod nagłówkiem „Zainstaluj aplikację”.

## Model danych

Bez zmian.

## Kontrakt API

Bez zmian — istniejące `portal.home`, push subscribe/unsubscribe, lokalne `portalPrefs` / theme.

## UI

- Strona: `apps/web/app/portal/[token]/profile/page.tsx`
- Współdzielony: `apps/web/components/portal/SectionHeader.tsx` (używany też przez Progres)
- Prymitywy: `Avatar`, `Switch`, `Icon`, `ErrorBanner`
- Ikony: `clipboard-text`, `ruler`, `calculator`, `lock-simple`, `caret-right`

Kolejność: Header → Trening → Aplikacja → Zainstaluj (opcjonalnie) → Więcej.

## Fazy implementacji

- [x] Faza 1 — spec + restrukturyzacja UI (bez API)

## Ryzyka i wpływ

- Usunięcie per-row microcopy może utrudnić zrozumienie „Przerwy na blokadzie” — kompensacja: footer sekcji Trening.
- Push nadal pokazuje powód wyłączenia przy braku VAPID / iOS bez instalacji.

## Changelog

- 2026-08-12 — utworzono spec; wdrożono redesign UI.
- 2026-08-12 — usunięto kartę „Aktualny plan” (duplikat Dziś; test odejmowania).
