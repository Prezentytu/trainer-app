# Instalacja PWA — instrukcja dla każdej przeglądarki

## TLDR

Portal klienta dostaje pełny model środowiska instalacji (`InstallEnv`: platforma + przeglądarka + in-app webview) zamiast binarnej detekcji iOS/nie-iOS. Banner + Sheet pokazują kroki dopasowane do tego, co klient faktycznie widzi — łącznie z wyjściem z Messengera/Instagrama do prawdziwej przeglądarki. Tylko `/portal/{token}`; panel trenera bez zmian.

## Problem

`PwaInstallPrompt` rozpoznaje dwa światy: iOS (instrukcja Safari) i reszta (`beforeinstallprompt`). Przez to:

1. Chrome / Firefox / Edge na iOS (od 16.4) — instalacja działa, ale copy mówi „Udostępnij na dole Safari”; ikona jest w pasku adresu.
2. Messenger / Instagram / Facebook — na iOS brak „Do ekranu początkowego”; na Androidzie WebView nie odpala `beforeinstallprompt` → prompt renderuje `null`.
3. Firefox / Samsung Internet (Android) oraz Chrome bez eventu — zero instrukcji.

Link z Messengera to najczęstsza droga wejścia klienta.

## Proponowane rozwiązanie

- Czysta funkcja `detectInstallEnv()` w `apps/web/lib/installEnv.ts` + `installSteps()` + `buildEscapeUrl()`.
- Capability: `installed` | `native-prompt` | `manual` | `escape-required`.
- Escape tylko na tap użytkownika (natywny `<a href>`): Instagram/Threads iOS → `instagram://extbrowser/`; pozostałe iOS → `x-safari-https://…`; Android → `intent://…` bez hardcodowanego Chrome; LINE → `?openExternalBrowser=1`. Zawsze fallback: „Kopiuj link” + „••• → Otwórz w Safari”.
- Banner: CTA zależne od capability. In-app wyjątek od peak-end — widoczny od razu z ostrzegawczym copy.
- Sheet `InstallGuideSheet` z krokami per przeglądarka.
- Override `?installEnv=` do ręcznego testu bez farmy telefonów.

## Model danych

Brak zmian.

## Kontrakt API

Brak zmian.

## UI

| Plik | Rola |
|---|---|
| `lib/installEnv.ts` | Detekcja + escape URL + kroki PL |
| `lib/pwa.ts` | `useInstallEnv()` |
| `components/portal/InstallGuideSheet.tsx` | Sheet z instrukcją |
| `components/portal/PwaInstallPrompt.tsx` | Banner + CTA |
| Home / Profil portalu | Bez zmian strukturalnych — ten sam prompt |

### Macierz instrukcji

| Środowisko | Capability | UX |
|---|---|---|
| Standalone | `installed` | Nic |
| In-app (Messenger itd.) | `escape-required` | Banner ostrzegawczy + Sheet escape |
| iOS Safari | `manual` | Share (dół) → Dodaj do ekranu początkowego |
| iOS Chrome/Firefox/Edge ≥16.4 | `manual` | Share (pasek adresu) → Dodaj do ekranu |
| iOS third-party &lt;16.4 | `escape-required` | Otwórz w Safari |
| Android + `beforeinstallprompt` | `native-prompt` | Przycisk „Dodaj do ekranu” |
| Android bez eventu | `manual` | Menu ⋮ → Zainstaluj / Dodaj do ekranu |
| Desktop | `manual` / `native-prompt` | Ikona instalacji w pasku / menu |

## Fazy implementacji

- [x] Faza 1 — `installEnv.ts` + `useInstallEnv` + override `?installEnv=`
- [x] Faza 2 — `InstallGuideSheet` + przepisanie `PwaInstallPrompt`
- [x] Faza 3 — walidacja `check.sh` + lekcja w `.ai/lessons.md`

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Meta blokuje `x-safari-https://` nawet na tap | Zawsze „Kopiuj link” + instrukcja ••• |
| Fałszywy pozytyw in-app | Konserwatywne tokeny UA; override do testów |
| Peak-end vs ostrzeżenie in-app | In-app pomija gating ukończonej sesji |
| Hardcode Chrome na Androidzie | Intent bez `package=` |

## Changelog

- 2026-08-08 — utworzono spec (plan instalacji PWA dla każdej przeglądarki).
- 2026-08-08 — wdrożono: `InstallEnv`, Sheet z krokami per przeglądarka, escape z in-app (Messenger itd.), lekcja w `.ai/lessons.md`. `check.sh` OK.
