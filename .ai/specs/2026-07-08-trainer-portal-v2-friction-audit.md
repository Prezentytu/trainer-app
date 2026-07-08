# Portal trenera v2 — audyt kosztu interakcji (Friction Audit)

## TLDR

Redesign istniejących ekranów portalu trenera (Panel, Klienci, Ćwiczenia, Plany, kreator) wg audytu z `htmls from design/Trainer Portal - widoki v2.html` — te same trasy i prymitywy co dziś, ale każdy ekran przechodzi przez psychologiczne drivery CRO (recognition over recall, smart defaults, 1 dominanta/widok, loss aversion przez Undo, goal gradient). Czysto frontendowa zmiana wizualna/interakcyjna — bez nowych endpointów.

Zależy od: `2026-07-08-rir-support.md` (etykiety RIR w podglądzie planu), `2026-07-08-quick-entry-composer.md` (ekran 09 — kreator — używa composera jako głównego sposobu dodawania ćwiczeń, ten spec dodaje wokół niego tryb skupienia/autosave). Nie zmienia kontraktu API — wyłącznie `apps/web/`.

## Problem

Dzisiejsze ekrany (v1) działają, ale audyt kosztu interakcji (skill `senior-ux-cro`) wykrywa powtarzające się wzorce tarcia:

- **Martwe dane bez akcji** — dashboard pokazuje liczby, ale klient „bez planu" wymaga wielu kliknięć, żeby coś z tym zrobić (brak kolejki „wymaga uwagi").
- **Recall zamiast recognition** — nawigacja bez liczników, listy klientów bez awatarów, trener musi pamiętać/czytać nazwy zamiast rozpoznawać wzorce wizualnie.
- **Fałszywe dominanty** — v1 karta statystyk ma żółtą ramkę konkurującą z prawdziwym CTA („+ Nowy plan"), więcej niż jedna wizualna dominanta na widok.
- **Formularze bez smart defaults** — data startu przypisania wymaga ręcznego wpisania „dziś"; plan do przypisania wybierany z `<select>` bez kontekstu; nowy plan startuje z pustego formularza.
- **Destrukcyjne akcje bez siatki bezpieczeństwa** — usunięcie (klienta, planu) to modal blokujący, zamiast degradowanej akcji tekstowej + toast z Undo (loss aversion działa w obie strony: strach przed nieodwracalną akcją zwiększa opór, ale świadomość odwracalności go usuwa).
- **Kreator bez trybu skupienia** — pełna nawigacja boczna zostaje widoczna podczas budowania planu, konkurując o uwagę z właściwą pracą.

## Proponowane rozwiązanie

Zastosować dziewięć wzorców z makiety v2 do istniejących stron, bez zmiany routingu ani kontraktu API — tylko interakcja i wizualna hierarchia. Każdy punkt niżej cytuje driver z adnotacji makiety (`DEFAULTS`, `RECOGNITION`, `CONTRAST`, `SWATCHES`, `SAFETY`, `MICROCOPY`, `VALUE>LABEL`, `SEGMENTED`, `IKEA`, `LOSS AVERSION`, `GOAL GRADIENT`, `RECIPROCITY`, `F-PATTERN`) i mapuje go na konkretny plik.

### 1. Nawigacja (wszystkie ekrany) — `RECOGNITION`

- `apps/web/components/AppShell.tsx`: liczniki przy pozycjach `NAV` (liczba klientów, liczba planów) — pobrane raz w `AppShell` przez `api.clients.list()`/`api.plans.list()` (albo przekazane z layoutu, do ustalenia przy implementacji: minimalny fetch, bez nowego endpointu).
- Awatary z inicjałami (dwuliterowy skrót imienia+nazwiska, tło `bg-surface-hover`, tekst `text-foreground-secondary` — tokeny istniejące) we wszystkich miejscach listujących klientów (dashboard, `/clients`, selektor przypisania planu).

### 2. Panel trenera (`app/page.tsx`) — ekran 01 — `DEFAULTS`, `RECOGNITION`, `CONTRAST`

- Nowa sekcja **„Wymaga uwagi"** nad StatCards: lista klientów bez aktywnego planu (`activePlans === 0` z `ClientSummary`) jako klikalny wiersz z CTA „Przypisz plan" prowadzącym do `/clients/[id]`. Zamienia martwą daną w akcję 1-klik.
- StatCards (liczba klientów/szablonów/planów klientów/aktywnych przypisań) tracą fałszywą żółtą ramkę — jedna dominanta na widok to przycisk „+ Nowy plan"; karty stają się w pełni klikalne (`<a>` całą powierzchnią, nie tylko `›`).
- Listy „Klienci" i „Ostatnie plany" z linkiem „Wszyscy ›" / „Wszystkie ›" w nagłówku sekcji (zamiast paginacji/przycisku na dole).

### 3. Klienci — lista (`app/clients/page.tsx`) — ekran 02 — `SWATCHES`, `SAFETY`, `MICROCOPY`

- Formularz „Nowy klient": pole „Cel treningowy" jako chipy 1-tap (Redukcja / Hipertrofia / Kondycja / …) zamiast wolnego pola notatki — mniej decyzji, spójne dane do filtrowania/dopasowania planu później.
- Przycisk zapisu: „Zapisz klienta" → **„Dodaj klienta"** (czasownik akcji, nie techniczny).
- Wiersz klienta bez planu: badge „bez planu — przypisz" (prowadzi dalej, nie kończy ślepo) zamiast neutralnego „0 planów".
- **Usuwanie znika z listy** — ryzyko przypadkowego kliknięcia obok linku profilu; destrukcja żyje tylko w profilu klienta (punkt 4).

### 4. Profil klienta (`app/clients/[id]/page.tsx`) — ekran 03 — `SWATCHES`, `DEFAULTS`, `LOSS AVERSION`

- Formularz przypisania planu: plany renderowane jako **karty z metadanymi** (nazwa, liczba ćwiczeń, liczba tygodni, dopasowanie do celu klienta) zamiast `<select>` — decyzja z pełnym kontekstem, zaznaczenie kartą (border akcentowy + checkmark), nie z listy tekstowej.
- **Smart default**: data startu prefill „dziś" (jak dziś w kodzie? — zweryfikować przy implementacji, makieta zakłada, że to już jest wypełnione); plan najlepiej dopasowany do celu klienta (z chipów z punktu 3) wstępnie zaznaczony — happy path = 1 klik „Przypisz plan".
- **Usuwanie przypisania**: „Usuń" jako tekst (nie przycisk z tłem), kolor czerwony **dopiero na hover** (nie stały). Klik → natychmiastowe wykonanie + toast w prawym dolnym rogu: „Usunięto „{nazwa}"" + akcja **„Cofnij"** w akcencie żółtym. Zastępuje dzisiejszy modal blokujący (jeśli istnieje) lub `window.confirm`.
- Status „zakończony" plan → przycisk „Wznów" (zmiana statusu z powrotem na `active` przez istniejące `api.assignments.setStatus`), nie tylko usuń.

### 5. Biblioteka ćwiczeń (`app/exercises/page.tsx`) — ekran 04 — `VALUE>LABEL`, `SEGMENTED`

- Filtr typu ćwiczenia (`reps`/`time`/`distance`) jako **segmented control z licznikami** („Wszystkie · 4", „Powtórzenia · 3", …) zamiast dropdowna — zero ukrytych opcji, 1 klik do podzbioru.
- Parametry ćwiczenia (serie×powt., przerwa, ciężar) w **stałych kolumnach label-value**: mono-etykieta uppercase mała + wartość dużą (15px/600, jednostka domyślnego ciężaru w akcencie żółtym) zamiast zdania opisowego — skan pionowy, porównywalność między wierszami.

### 6. Plany — lista (`app/plans/page.tsx`) — ekran 05 — `MICROCOPY`, `IKEA`

- Obie sekcje („Szablony", „Plany klientów") widoczne równocześnie (nie zakładki) z licznikami w nagłówku sekcji.
- Mikrocopy akcji na szablonie: „Użyj → plan klienta" → **„Utwórz plan klienta"** (nazwany benefit, nie mechanizm).
- Badge na planie klienta: „aktywny u: {imię}" (konkretna wartość) zamiast anonimowego licznika przypisań.
- Ścieżka szablon → duplikat → personalizacja wyeksponowana akcentową obwódką na kroku duplikacji — współtworzenie planu (efekt IKEA) buduje przywiązanie do wyniku.

### 7. Podgląd planu (`app/plans/[id]/page.tsx`) — ekran 06 — `GOAL GRADIENT`, `VALUE>LABEL`

- Zakładki tygodni (`WeekTabs` już istnieje w kreatorze — tu odpowiednik w trybie podglądu) z checkmarkiem na tygodniach za sobą + pasek postępu „Tydzień 3 z 6" — trener od razu widzi, gdzie w cyklu jest plan, postęp nie startuje od zera.
- Tabela serii: powtórzenia i ciężar 15px/600 (ciężar w akcencie żółtym), rola serii jako `Badge` (już istnieje), procent jako kontekst wyciszony (`text-foreground-secondary`) — koniec z „range trap" (zakres liczb bez hierarchii, gdzie nic nie wybija się jako najważniejsze).
- **Zależność**: etykiety RIR z `2026-07-08-rir-support.md` renderowane tym samym wzorcem value>label.

### 8. Mobile ≤ md — wszystkie strony — ekran 07

- `AppShell.tsx`: dolna nawigacja (bottom nav) zamiast/obok górnego drawera dla głównych czterech sekcji, w strefie kciuka; cele dotykowe ≥ 44px (przyciski, wiersze list, `IconButton`).
- Weryfikacja zgodna ze skillem `responsive-ui`: nic nie wychodzi poza kontener, nazwy planów/ćwiczeń/klientów się nie ucinają.

### 9. Start nowego planu (`app/plans/new/page.tsx`) — ekran 08 — `DEFAULTS`, `GOAL GRADIENT`, `RECIPROCITY`

- Wybór „Rodzaj: Szablon / Plan klienta" jako segmented control (istnieje w makiecie jako pierwszy krok) z **presetem struktury wstępnie zaznaczonym** i nazwą auto-uzupełnioną (np. „Nowy plan — {data}") — happy path do kreatora to 1 klik, nie pusty formularz.
- Pasek postępu „Krok 1 z 3 · struktura wybrana" — kreator nie zaczyna się od 0%.
- Podgląd struktury (np. „T1–T6, 4 dni/tydz.") widoczny **przed** wejściem w kreator — trener widzi wartość zanim włoży wysiłek (efekt wzajemności).

### 10. Kreator planu — tablica tygodnia (`components/plan-builder/`) — ekran 09 — `DEFAULTS`, `F-PATTERN`, `IKEA`, `CONTRAST`

- **Tryb skupienia**: nawigacja boczna (`AppShell` sidebar) zwinięta do wąskiego railu (tylko ikony) podczas edycji planu — mniej wizualnego szumu wokół pracy głównej. Dotyczy stron `/plans/new` i `/plans/[id]` w trybie edycji (`isPlanEditor` już wykryty w `AppShell.tsx` przez regex ścieżki).
- Jedna dominanta: „Zapisz plan" jako jedyny wizualnie mocny CTA (dziś może konkurować z innymi przyciskami akcji w nagłówku kreatora).
- **Autosave** (debounced zapis do `api.plans.update` po edycji, np. 2s bez aktywności) + toast „Zapisano" / „Cofnij" po większych zmianach (np. usunięcie dnia) — gasi lęk przed utratą zmian, komplementarne z manualnym „Zapisz plan".
- Mikrocopy klonowania: „+ Tydzień · kopiuje T3" (nazwane źródło kopiowania, nie generyczne „+ Tydzień"), „Powiel układ D1" dla dni — trener współtworzy przez klonowanie, nie od zera (efekt IKEA, konsekwentny z punktem 6).
- **Uwaga o zakresie**: ten punkt dotyczy layoutu/trybu skupienia i autosave wokół kreatora; sam sposób dodawania ćwiczenia (composer, biblioteka z lewej / `F-PATTERN`) jest przedmiotem `2026-07-08-quick-entry-composer.md` — nie duplikować.

## Model danych

Brak zmian. Wszystkie punkty są zmianami UI/interakcji nad istniejącymi danymi (`ClientSummary.activePlans`, `Plan.weeksCount`, `Assignment.status`, itd.).

## Kontrakt API

Brak nowych endpointów. Jedyna potencjalna zmiana sposobu użycia (nie kontraktu): autosave w kreatorze (punkt 10) wywołuje istniejący `api.plans.update` częściej (debounced), zamiast tylko na klik „Zapisz plan" — bez zmiany sygnatury.

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| — | — | — | (bez zmian; wykorzystanie istniejących `api.clients`, `api.plans`, `api.assignments`) |

## UI

Pliki dotknięte (bez nowych stron, tylko redesign istniejących + jeden nowy współdzielony prymityw):

- `apps/web/components/AppShell.tsx` — liczniki w `NAV`, tryb skupienia (rail) dla `/plans/*`, bottom nav mobile.
- `apps/web/app/page.tsx` — kolejka „wymaga uwagi", StatCards bez fałszywej dominanty.
- `apps/web/app/clients/page.tsx` — chipy celu, mikrocopy, usunięcie akcji delete z listy.
- `apps/web/app/clients/[id]/page.tsx` — karty planów do przypisania, smart defaults, Undo toast.
- `apps/web/app/exercises/page.tsx` — segmented filtr typów, kolumny label-value.
- `apps/web/app/plans/page.tsx` — obie sekcje, mikrocopy benefit-driven, badge z imieniem klienta.
- `apps/web/app/plans/[id]/page.tsx` — zakładki tygodni z progresem, value>label w tabeli serii.
- `apps/web/app/plans/new/page.tsx` — segmented rodzaj planu, preset wstępnie zaznaczony, pasek kroków.
- `apps/web/components/plan-builder/*` — autosave, jedna dominanta, mikrocopy klonowania.
- Nowy prymityw w `apps/web/components/ui.tsx`: `Toast`/`UndoToast` (komponent + hook `useUndoToast`) — współdzielony przez punkty 4 i 10, jedyne miejsce implementujące wzorzec „akcja + Cofnij + auto-dismiss".
- Nowy prymityw: `Avatar` (inicjały z imienia+nazwiska, rozmiar `sm`/`md`/`lg`) w `ui.tsx` — współdzielony przez punkty 1, 2, 3.

Wszystkie zmiany wyłącznie tokenami z `apps/web/app/globals.css` i prymitywami `ui.tsx` — przed implementacją każdego ekranu przejść skille `design-system`, `fitness-ui-ux`, `senior-ux-cro`, `responsive-ui` (wymagane przy każdej zmianie UI wg `AGENTS.md`).

## Fazy implementacji

- [ ] Faza 1 — prymitywy współdzielone: `Avatar`, `Toast`/`useUndoToast` w `components/ui.tsx`
- [ ] Faza 2 — Panel (`app/page.tsx`) + nawigacja z licznikami (`AppShell.tsx`, bez trybu skupienia jeszcze)
- [ ] Faza 3 — Klienci: lista + profil (chipy celu, karty przypisania, smart defaults, Undo)
- [ ] Faza 4 — Ćwiczenia (segmented filtr, kolumny label-value) + Plany lista (mikrocopy, badge)
- [ ] Faza 5 — Podgląd planu (zakładki tygodni z progresem, value>label serii) + Nowy plan (preset, kroki)
- [ ] Faza 6 — Kreator: tryb skupienia (rail), autosave, jedna dominanta, mikrocopy klonowania
- [ ] Faza 7 — Mobile: bottom nav, cele dotykowe ≥44px, przegląd wszystkich ekranów na 390px

## Ryzyka i wpływ

- **Autosave nadpisuje pracę bez potwierdzenia** — mitygacja: debounce + toast „Zapisano"/„Cofnij" po istotnych zmianach (usunięcie dnia/pozycji), manualny „Zapisz plan" zostaje jako explicit checkpoint.
- **Kolejka „wymaga uwagi" rośnie niekontrolowanie przy wielu klientach** — poza zakresem MVP (limit np. 5 najstarszych + link „Wszyscy"); przy większej skali wymaga paginacji, dziś dataset trenera jest mały.
- **Segmentacja/chipy celu wprowadzają nowy string-enum bez walidacji backendu** — konsekwentnie z resztą projektu (`Type` na `Exercise` nie jest walidowane sztywno); ryzyko rozjazdu wartości — mitygacja: jedyne źródło opcji to stała w `apps/web/lib/api.ts` (analogicznie do `EXERCISE_TYPE_LABELS`).
- **Tryb skupienia (rail) w kreatorze może zdezorientować** przy pierwszym użyciu — mitygacja: rail zawsze rozwijalny (klik/hover pokazuje pełną nawigację), nie jest to blokujący fullscreen.
- **Duży zakres (9 ekranów) grozi rozjazdem między fazami** — mitygacja: fazy 2–7 są niezależne per sekcja aplikacji, każda kończy się działającą, zgodną z bramką walidacyjną aplikacją; można wdrażać częściowo bez czekania na całość.

## Changelog

- 2026-07-08 — utworzono spec.
