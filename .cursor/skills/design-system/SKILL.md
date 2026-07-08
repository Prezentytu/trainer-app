---
name: design-system
description: Nasza paleta i system projektowy Trainer App — kolory (apps/web/app/globals.css), typografia, spacing, hierarchia wizualna. Użyj ZAWSZE przy tworzeniu nowego UI, dodawaniu kolorów, review/audycie istniejących komponentów pod kątem zgodności z paletą, albo gdy trzeba wygenerować/poprawić komponent dla światowej klasy UI.
---

# Nasza paleta (design tokens)

Trainer App ma jeden, ciemny motyw — bez wariantu light. Kolory żyją w dwóch warstwach:

- **Tier 1 — prymitywy**: wbudowana skala Tailwind 4 (`zinc`, `yellow`, `red`, `emerald`). Nigdy nie odwołuj się do nich bezpośrednio w komponentach (`bg-zinc-900`, `text-yellow-400` itd.) — to jest surowy materiał, nie słownik projektu.
- **Tier 2 — tokeny semantyczne**: zdefiniowane w [apps/web/app/globals.css](apps/web/app/globals.css) blokiem `@theme`, nazwane po **roli**, nie po wyglądzie. To jest jedyny słownik, z którego komponenty mogą korzystać. Tailwind generuje z nich klasy `bg-*`/`text-*`/`border-*` automatycznie (włącznie z modyfikatorem opacity, np. `bg-accent/15`).

## Tabela tokenów

| Token | Prymityw | Klasy Tailwind | Rola |
|---|---|---|---|
| `background` | `zinc-950` | `bg-background` | tło strony |
| `surface` | `zinc-900` | `bg-surface`, `bg-surface/60` | karty (`Card`), popovery, wiersze na jaśniejszym tle |
| `surface-sunken` | `zinc-950` | `bg-surface-sunken` | zagnieżdżone, ciemniejsze panele (np. dzień w podglądzie planu, ExercisePicker `/80`) |
| `surface-hover` | `zinc-800` | `bg-surface-hover` | tło inputów, ghost button, badge neutralny, hover |
| `surface-active` | `zinc-700` | `bg-surface-active` | mocniejsze tło/obramowanie inputów, hover-na-hover |
| `border` | `zinc-800` | `border-border` | domyślne obramowanie |
| `border-strong` | `zinc-700` | `border-border-strong` | obramowanie inputów, mocniejsze separatory |
| `foreground` | `zinc-100` | `text-foreground` | główny tekst (dziedziczony z `body`, rzadko trzeba go wypisywać explicite) |
| `foreground-secondary` | `zinc-300` | `text-foreground-secondary` | tekst na `surface-hover` — linki nawigacji, tekst ghost button, badge neutralny |
| `muted-strong` | `zinc-400` | `text-muted-strong` | etykiety pól, podtytuły, tekst opisowy drugiego planu |
| `muted` | `zinc-500` | `text-muted` | tekst trzeciego planu — meta, podpisy, nagłówki sekcji UPPERCASE, stany „Ładowanie…” |
| `muted-faint` | `zinc-600` | `text-muted-faint` | najsłabszy kontrast (ikony pomocnicze, np. uchwyt drag&drop) |
| `accent` | `yellow-400` | `bg-accent`, `text-accent`, `border-accent` | marka / akcja główna / stan aktywny |
| `accent-strong` | `yellow-300` | `bg-accent-strong`, `text-accent-strong` | hover akcentu, tekst na `accent/15` (badge) |
| `accent-foreground` | `zinc-950` | `text-accent-foreground`, `bg-accent-foreground` | tekst na żółtym tle |
| `danger` | `red-300` | `text-danger`, `bg-danger/15` | tekst błędu, ikony usuwania |
| `danger-bg` | `red-950` | `bg-danger-bg`, `bg-danger-bg/60` | tło banera błędu, tło przycisku danger |
| `danger-border` | `red-900` | `border-danger-border` | obramowanie banera błędu, hover przycisku danger |
| `success` | `emerald-300` | `text-success` | tekst sukcesu (badge zielony) |
| `success-bg` | `emerald-400` | `bg-success-bg/15` | tło badge sukcesu (zawsze z `/15`) |

## Twarda zasada

**Nigdy nie pisz `bg-zinc-*`, `text-zinc-*`, `border-zinc-*`, `bg-yellow-*`, `text-yellow-*`, `bg-red-*`, `text-red-*`, `bg-emerald-*`, `text-emerald-*` w komponentach.** Zawsze użyj tokenu z tabeli wyżej. Jeśli potrzebna rola nie istnieje jeszcze w tabeli — **dodaj nowy token do `@theme` w `globals.css`**, nie omijaj systemu jednorazowym surowym kolorem. Jeden nowy token > jedna zahardkodowana klasa.

Wyjątek: sam plik `globals.css` (definicja tokenów) i pliki spoza `apps/web` (np. `.cursor/skills/*`, dokumentacja) — tam surowe nazwy kolorów Tailwind są opisem, nie kodem produkcyjnym.

## Status migracji

- Zmigrowane na tokeny: `components/ui.tsx` (wszystkie prymitywy), `components/AppShell.tsx`.
- Pozostałe strony (`app/**/page.tsx`, `components/plan-builder/**`) wciąż mają surowe klasy `zinc-*`/`yellow-*` w wielu miejscach — **migruj je opportunistycznie**: gdy dotykasz pliku z innego powodu (feature, bugfix, responsywność), zamień przy tej okazji surowe klasy na tokeny z tabeli wyżej. Nie rób osobnej masowej migracji bez pytania — to złamałoby zasadę „zmiany minimalne i skupione".

## Typografia

Trainer App to gęsty produkt roboczy (kreator planów, tabele, listy), nie strona marketingowa — hierarchię buduj głównie **wagą i kolorem tekstu (tokeny `foreground*`/`muted*`)**, a nie skokami rozmiaru. Skala jest już w praktyce zawężona (dobrze) do kroków ~1.14–1.2×, trzymaj się jej:

| Rola | Klasa Tailwind | Rozmiar | Waga |
|---|---|---|---|
| Micro / meta (uppercase sekcje, timestampy, liczniki serii) | `text-xs` | 12px | `font-medium` |
| Body / etykiety pól / przyciski (domyślny rozmiar UI) | `text-sm` | 14px | `font-normal` / `font-medium` |
| Nagłówek karty / pozycji (nazwa ćwiczenia, dnia) | `text-base` lub `text-sm font-medium` | 14–16px | `font-medium` |
| Nagłówek sekcji (Tydzień N, nagłówek karty) | `text-lg` | 18px | `font-semibold` |
| Tytuł strony (`PageHeader` h1) | `text-xl sm:text-2xl` | 20–24px | `font-bold` |

Zasady:
- **Maks. 3 wagi fontu w tekście UI**: `font-normal` (400), `font-medium` (500), `font-semibold` (600). `font-bold`/`font-black` zarezerwowane wyłącznie dla `PageHeader` h1 i logo marki (`AppShell`) — nie używaj ich do lokalnego „pogrubienia dla ważności” gdzie indziej; sięgnij po `text-foreground` vs `text-muted*` (kontrast koloru) albo `font-medium` → `font-semibold`.
- **Zero arbitralnych rozmiarów** (`text-[11px]`, `text-[13px]` itd.) — użyj najbliższego kroku skali Tailwind (`text-xs`=12px). *Znany dług: `text-[11px]` występuje dziś w kilku miejscach (`ExerciseRow`, `SetSchemeEditor`, `plans/[id]`) — migruj na `text-xs` opportunistycznie, tak jak surowe kolory.*
- Nagłówki: `line-height` ciasny (Tailwind default dla `text-lg`/`xl`/`2xl` już to zapewnia, nie nadpisuj). Tekst body/etykiety: domyślny `leading` wystarcza, nie dodawaj `leading-loose`.
- Etykiety UPPERCASE (`uppercase tracking-wide`, np. nagłówki sekcji w `ExerciseRow`) tylko dla krótkich metek (1-3 słowa) w `text-xs`, nigdy dla zdań.

## Spacing — rytm 8px

Odstępy trzymają się już w praktyce siatki 4/8px — formalizujemy to jako zasadę, nie wolną rękę:

| Krok | Klasy Tailwind | Użycie |
|---|---|---|
| 4px | `gap-1`, `p-1` | mikro-odstępy (ikona + label w jednym słowie), `mt-0.5`/`py-0.5` tylko do optycznego wyrównania |
| 8px | `gap-2`, `p-2`, `mb-2` | odstęp wewnątrz komponentu (np. między wierszami akcji) |
| 12px | `gap-3`, `p-3`, `mb-3` | domyślny padding karty/wiersza, odstęp między polami formularza |
| 16px | `gap-4`, `p-4`, `mb-4` | standardowy odstęp komponentu, padding `Card`/kolumny dnia |
| 24px | `mb-6`, `gap-6` | odstęp między pod-sekcjami |
| 32px | `mb-8`, `p-8` | odstęp między sekcjami / padding głównego layoutu (`main`) |

**Nigdy nie wprowadzaj wartości poza tą siatką** (`p-[13px]`, `gap-5`, `mb-7` itd.) — jeśli potrzebujesz odstępu „między" dwoma krokami, to sygnał, że hierarchia jest w niewłaściwym miejscu (popraw grupowanie, nie dodawaj piksela).

## Border radius — hierarchia, nie przypadek

- `rounded-lg` (8px) — elementy interaktywne: `Button`, `IconButton`, inputy, wiersze listy.
- `rounded-xl` (12px) — kontenery: `Card`, kolumna dnia, panele.
- `rounded-full` — wyłącznie okrągłe elementy: `Badge`, `Pill`, avatary, kropki-znaczniki.

Nie dodawaj nowych wartości radius bez potrzeby — te trzy kroki wystarczają na wszystko w aplikacji.

## Hierarchia wizualna (3 poziomy)

Każdy ekran/karta ma maksymalnie te trzy poziomy uwagi — nie twórz czwartego:

1. **Primary** — tytuł strony (`PageHeader` h1), główny CTA (`Button variant="primary"`). Max 1–2 na ekran.
2. **Secondary** — nagłówki kart/sekcji (nazwa dnia, „Tydzień N”, nazwa ćwiczenia), kluczowe liczby (serie × powtórzenia, ciężar).
3. **Tertiary** — etykiety pól, meta (przerwa, tempo, notatki), captions, stany „Ładowanie…”.

Jeśli coś nie pasuje jednoznacznie do jednego z trzech poziomów — to zwykle znak, że trzeba je pogrupować inaczej (np. pod rozwijany szczegół), nie wymyślać poziom 2.5.

## Prompt do generowania / audytu UI

Użyj tego szablonu (podstaw wartości w `{{ }}`), gdy generujesz nowy komponent albo audytujesz istniejący pod kątem zgodności z paletą. Trzymaj strukturę z tagami XML — to zwiększa trafność odpowiedzi (potwierdzone w praktykach pracy z Claude: XML-owane sekcje `<design_tokens>`/`<component_spec>` + rola „Senior UI Engineer / Design Systems” w system prompcie).

```
Jesteś senior frontend architektem współpracującym z projektantem światowej klasy.
Pracujesz w Trainer App (Next.js 16 + Tailwind 4, ciemny motyw, UI po polsku).

<design_tokens>
Źródło prawdy: apps/web/app/globals.css (blok @theme).
Warstwa 1 (prymitywy Tailwind, NIE używać w komponentach): zinc, yellow, red, emerald.
Warstwa 2 (tokeny semantyczne, JEDYNE dozwolone w komponentach):
background, surface, surface-sunken, surface-hover, surface-active,
border, border-strong,
foreground, foreground-secondary, muted-strong, muted, muted-faint,
accent, accent-strong, accent-foreground,
danger, danger-bg, danger-border, success, success-bg.
Pełny opis ról: .cursor/skills/design-system/SKILL.md.
</design_tokens>

<design_scale>
Typografia (maks. 3 wagi: normal/medium/semibold; bold/black tylko h1 i logo):
text-xs 12px (meta/uppercase) → text-sm 14px (body/etykiety) → text-lg 18px (nagłówek karty) → text-xl/2xl 20-24px (tytuł strony).
Zero arbitralnych rozmiarów (text-[11px] itd.) — zawsze najbliższy krok skali Tailwind.
Spacing — siatka 4/8/12/16/24/32px, zero wartości poza siatką (brak gap-5, p-[13px]).
Radius: rounded-lg (interaktywne), rounded-xl (kontenery), rounded-full (okrągłe) — tylko te trzy.
Hierarchia: 3 poziomy (primary = tytuł/CTA, secondary = nagłówki/kluczowe liczby, tertiary = etykiety/meta) — nie twórz czwartego.
</design_scale>

<component_spec>
Zadanie: {{opisz co budujesz albo które pliki audytujesz}}.
Wymagania:
- Zero surowych klas zinc-*/yellow-*/red-*/emerald-* — wyłącznie tokeny z <design_tokens>.
- Trzymaj się <design_scale> — typografia, spacing, radius, hierarchia.
- Mobile-first, zgodnie ze skillem `responsive-ui`: żadna nazwa (planu/ćwiczenia/klienta) nie może być ucięta (`truncate`), nic nie wychodzi poza kontener.
- Reużyj prymitywy z apps/web/components/ui.tsx (Button, Card, Field, Badge, IconButton, inputClass) — nie duplikuj stylów przycisków/pól.
- Stany hover/focus/disabled zdefiniowane tam, gdzie dotyczy.
- Cele dotykowe ≥ 40px na mobile.
</component_spec>

<audit_checklist>
Dla każdego wskazanego pliku sprawdź i zgłoś:
1. Wystąpienia surowych klas zinc-*/yellow-*/red-*/emerald-* — zamień na odpowiadający token semantyczny z tabeli.
2. Arbitralne rozmiary tekstu/spacingu (text-[Npx], p-[Npx], gap-5, mb-7...) — zamień na krok skali z <design_scale>.
3. Więcej niż 3 wagi fontu na ekranie, albo font-bold/font-black użyte poza h1/logo — zredukuj do normal/medium/semibold + kontrast koloru.
4. Nazwy kluczowych bytów (plan, ćwiczenie, klient, dzień) ucinane przez truncate/overflow-hidden bez zawijania.
5. Elementy, które mogą wyjść poza kontener (gęste grid/table bez overflow-x-auto).
6. Duplikowane style przycisków/pól, które powinny użyć Button/inputClass.
7. Kontrast i cele dotykowe poniżej normy z sekcji "Dostępność" w skillu fitness-ui-ux.
8. Więcej niż 3 poziomy hierarchii wizualnej na jednym ekranie/karcie.
</audit_checklist>

Zwróć: listę konkretnych zmian (plik + linia + przed/po), bez zmiany zachowania aplikacji.
```

## Powiązane

- Responsywność: skill `responsive-ui`.
- Domenowe UX kreatora planów i logowania: skill `fitness-ui-ux`.
- Psychologia konwersji i redukcja kosztu interakcji (poziom "10/10"): skill `senior-ux-cro` — czytaj przy każdej implementacji UI.
- Kopia tego prompta do wklejenia w innej sesji/narzędziu (audyt zgodności z tokenami/responsywnością): `.ai/design-review-prompt.md`.
- Prompt do realnej poprawy jakości wizualnej (typografia/spacing/hierarchia, nie tylko zgodność): `.ai/design-quality-prompt.md`.
