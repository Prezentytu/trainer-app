# Styrka — analiza minimalizmu i kurs produktu

## TLDR

Styrka (Feji Studios) to B2C gym tracker zbudowany na odejmowaniu: brak konta, reklam, subskrypcji i zbędnych funkcji; UI true-black + biały tekst; logowanie serii w sekundy. Trainer App bierze ten kurs minimalizmu **w całej aplikacji** (portal klienta i panel trenera), zachowując przewagę: trener w pętli plan → log → reakcja. Ten spec to benchmark + backlog fal A–D (craft, retencja klienta, narzędzia trenera, audyt panelu).

Źródła: [fejistudios.vercel.app](https://fejistudios.vercel.app/), [App Store — Styrka](https://apps.apple.com/pl/app/styrka-gym-tracker/id6761281378?l=pl) (historia 1.2–3.7).

## Problem

Chcemy wyglądu i odczucia „czystości" Styrki, ale:

1. Jesteśmy produktem **trener ↔ klient**, nie solo-lifterem — gęstość danych w kreatorze i analityce jest konieczna.
2. Skille UI (`design-system`, `fitness-ui-ux`, `senior-ux-cro`) nie miały twardego filtra „odejmij zanim dodasz" ani mapowania konkretnych wzorców Styrki.
3. Ryzyko: kopiowanie natywnych ficzerów iOS (Watch, Live Activities, widgety) albo rozdmuchanie panelu trenera „gęstością UI" zamiast gęstości informacji.

## Proponowane rozwiązanie

**Zasada nadrzędna:** minimalizm obowiązuje wszędzie. Różnica między portalem a panelem to **gęstość danych**, nie gęstość chrome'u. Trener dostaje wszystko, czego potrzebuje — w formie odchudzonej, z progressive disclosure i płynnością (< 100 ms feedback, zero jank).

**Pozycjonowanie lustro Styrki:**

| Styrka | Trainer App |
|---|---|
| No account | Portal klienta bez konta (token) |
| No ads / no subs (one-time) | Klient bezpłatnie; płaci trener |
| Offline logging | PWA + offline (spec `ios-pwa-standalone`) |
| Solo lift | Trener reaguje pierwszy (plan → log → progres) |
| Monochrom B&W | Acid: neutrale + lime ≤3% (akcent = wyróżnik) |

Marketing przez odejmowanie (negatywne obietnice: „bez X") zostaje wzorcem copy — już częściowo na landingu; nie wymuszać w tym specu zmiany Pricing.

## Inwentarz ficzerów Styrki → mapowanie

### Szybkość logowania

| Ficzer Styrki | Status u nas | Uwagi |
|---|---|---|
| Prefill z ostatniego treningu | Mamy | Sesja / logger |
| Prefill z dowolnej sesji (nie tylko szablonu) | Częściowo | Doprecyzować przy „Powtórz ostatni" |
| Checkmark ukończenia serii | Mamy | |
| Auto-start rest po odhaczeniu | Częściowo | Rest timer jest; opcja auto-start — Fala A/B |
| Repeat Recent (5 ostatnich) | Brak | Fala B |
| Recent w pickerze ćwiczeń | Brak | Fala B |
| Tap-to-dismiss keyboard | Częściowo | Web/PWA — ograniczenia |
| Undo usuniętej serii (5 s) | Mamy | `useUndoToast` |

### Progresja i smart defaults

| Ficzer Styrki | Status u nas | Uwagi |
|---|---|---|
| Sugestie ciężaru / plateau | Częściowo | Detektor zastoju (Fala 1 konkurencji) — po stronie trenera |
| Custom progression profiles per ćwiczenie | **Nie kopiować** | Progresję ustala trener w planie |
| PR z oznaczeniem | Mamy | Gold `pr` |
| Kalkulator %1RM + strefy | Brak w UI | Mamy `ClientMaxes` — Fala C |
| Ostrzeżenie przy nietypowym ciężarze | Brak | Fala A |
| Warning przy pustych seriach | Brak | Fala A |

### Statystyki i retencja

| Ficzer Styrki | Status u nas | Uwagi |
|---|---|---|
| Wykresy per ćwiczenie | Częściowo | Trendy / muscle volume |
| Volume week-over-week | Częściowo | |
| Most Improved (90 dni) | Brak | Fala B |
| Streak 7 dni kroczący | Częściowo | Portal: streak tygodniowy — inna semantyka; Fala B |
| Masa ciała + cel | Częściowo | Pomiary / check-iny |
| Auto-nazwa treningu po mięśniach | Brak | Fala A |
| Share cards | Brak | Fala C + Fala 2 konkurencji |
| CSV import/export | Częściowo | Eksport CSV jest |

### Craft i zaufanie

| Ficzer Styrki | Status u nas | Uwagi |
|---|---|---|
| „BW" zamiast „0 kg" | Brak | Fala A |
| Przecinek i kropka w dziesiętnych | Częściowo | Sprawdzić / Fala A |
| Haptyka | Ograniczenie platformy | Safari — nie krytyczna ścieżka |
| iCloud / lokalne dane | Inny model | Nasze: API + PWA cache |
| Release co ~5 dni „based on feedback" | Proces | Lekcja: changelog jako retencja |

### Czego NIE kopiować

- Apple Watch, Live Activities, Dynamic Island, home-screen widgets — natywne iOS, poza zasięgiem PWA.
- Własne profile progresji per ćwiczenie u klienta — u nas programuje trener.
- Pełny monochrom (rezygnacja z lime) — Acid zostaje; lime budget ≤3%.

## Model danych

Ten spec **nie wprowadza** zmian schematu w Fali A. Fale B–C mogą wymagać agregacji z istniejących `LoggedSet` / `WorkoutSession` / `Exercise` (jak muscle-volume / stagnation) — szczegóły w osobnych fazach przed kodem. Fala D = audyt UI, bez modelu.

## Kontrakt API

Brak nowych endpointów w tym dokumencie. Przy implementacji fal:

| Fala | Prawdopodobne API |
|---|---|
| A | Walidacja po stronie klienta (+ opcjonalnie 400 przy finish z pustymi seriami) |
| B | GET recent workouts / most-improved (agregacje) — Ask First przy kontrakcie |
| C | UI na istniejących maxes; share — osobny spec |
| D | Brak |

## UI — kurs minimalizmu (obie strony)

- **Test odejmowania** przed każdym nowym elementem (skill `design-system`).
- **Treść = interfejs**: liczby, nazwy ćwiczeń, tabele serii; chrome tylko gdy porządkuje.
- **Gęstość ≠ bałagan**: kreator i dashboard mogą być gęste danymi; bez dekoracji i ściany opcji.
- **Płynność = feature**: te same progi co logger — feedback < 100 ms, skeleton > 300 ms 1:1, zero layout-shift (skill `senior-ux-cro`).
- Skille zaktualizowane równolegle z tym specem.

## Fazy implementacji (backlog)

Dokumentacja (ten PR / commit):

- [x] Faza 0 — ten spec + update skilli + wpis w analizie konkurencji

Implementacja produktu (osobne zadania po akceptacji):

### Fala A — craft, bez zmian schematu

- [ ] Typo-guard: confirm przy ciężarze/powt. mocno odstających od historii ćwiczenia
- [ ] Przecinek i kropka w inputach dziesiętnych (kg, pomiary)
- [ ] „BW" dla ćwiczeń bodyweight zamiast „0 kg" w podpowiedziach / historii
- [ ] Auto-nazwa sesji po grupach mięśniowych gdy brak własnej nazwy
- [ ] Warning przy zapisie z pustymi seriami

### Fala B — retencja klienta

- [ ] „Powtórz ostatni trening" (lista ostatnich unikalnych rutyn)
- [ ] Streak 7-dniowy kroczący (nie reset w poniedziałek) — uzgodnić z obecnym StatBlock „tyg."
- [ ] Sekcja „Ostatnio używane" w pickerze ćwiczeń
- [ ] Insight „Największy progres" (analog Most Improved)

### Fala C — narzędzia trenera (przewaga)

- [ ] Kalkulator %1RM ze strefami (Strength / Hypertrophy / Endurance) w kontekście planu / maxów klienta
- [ ] Share card progresu z brandingiem trenera (wspólne z Falą 2 `.ai/specs/2026-08-03-analiza-konkurencji-i-priorytety.md`)

### Fala D — minimalizm + płynność panelu trenera

- [ ] Audyt testem odejmowania: dashboard, lista/profil klientów, kreator planów, biblioteka ćwiczeń
- [ ] Audyt płynności: skeletony 1:1, layout-shift, feedback < 100 ms, prefetch nawigacji
- [ ] Lista konkretnych poprawek z audytu → wdrożenie po akceptacji (osobne PR / fazy)

## Ryzyka i wpływ

| Ryzyko | Mitigacja |
|---|---|
| Przeładowanie backlogu vs MVP płatne | Fale A→D kolejnością; A najpierw (zero schematu) |
| Kolizja z Falą 2 analizy konkurencji (share card) | Fala C linkuje, nie duplikuje pełnego kontraktu |
| Streak: zmiana semantyki „tyg." w portalu | Ask First przed wdrożeniem Fali B |
| Audyt Fali D rozlewa się na cały redesign | Output = lista małych PR, nie big-bang |
| Kopiowanie „look Styrka" kosztem Acid | Lime ≤3% zostaje; monochrom zabroniony jako cel |

## Lekcja procesowa

Styrka wypuszcza często, z jawnym „based on user feedback" i osobnymi release'ami o scroll / kontrast / inputy. Płynność i czytelność traktują jako feature, nie polish. U nas: changelog / komunikaty do trenerów po istotnych shipach; perceived performance w checkliście CRO jako twarde kryterium.

## Changelog

- 2026-08-05 — utworzono spec (analiza Styrki 1.2–3.7, mapowanie, fale A–D, zasada minimalizmu obu stron).
