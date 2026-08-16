# Lekcje

Powtarzające się wzorce i błędy, których należy unikać. Przejrzyj na starcie sesji.

Po każdej korekcie od użytkownika dopisz tu wpis w formacie:

```
## {Krótki tytuł zasady}

**Kontekst**: {co się działo}
**Problem**: {co poszło nie tak}
**Zasada**: {reguła zapobiegająca powtórce}
**Dotyczy**: {pliki/obszary}
```

---

## Sticky scena: tor = długość animacji, dziecko wypełnia kadr

**Kontekst**: `md:min-h-[180svh]` + sticky `min-h-[100svh]` zostawiało ~560 px pustki **pod** dzieckiem po odpięciu. W telefonie drugi blok (Przysiad × 3) wypychał wyciskanie poza `overflow-hidden` — na niskim oknie widać było 4/4 i ghost serie, bez odhaczenia 105 × 3.
**Problem**: Użytkownik scrollował przez biały kadr po climaxie; ostatniej serii nie było w kadrze.
**Zasada**: Wysokość sekcji sticky = `100svh + tor animacji` (nie bufor po finale). Dziecko ma stałe `h-[calc(100svh-nav)]`, żeby przykrywać tor. W mockupie tylko to, co się animuje — zapowiedź kolejnego ćwiczenia to jedna linia, nie druga tabela.
**Dotyczy**: `PhoneMock.tsx`, każda scena scrollytelling na landingu

## Przestrzeń na landingu musi być ograniczona elementem

**Kontekst**: Hero flush-left + LiveFeed wypychał treść poza fold; między tabelą a sceną telefonu zostawał cały pusty kadr. Animacja odhaczania ruszała dopiero przy przypięciu sticky i kończyła się w momencie odpięcia.
**Problem**: Pusta przestrzeń wyglądała na niedokończoną, a nie artystyczną. Podpunkty wewnątrz sekcji były ściśnięte, a między blokami — martwe strefy. Scrollytelling „nic nie robił” przez pół ekranu.
**Zasada**: Jedna myśl na viewport. Hero = wyśrodkowana deklaracja, krawędź kadru domknięta meta-rzędem. Usuń element, który nie mieści się w kadrze, zamiast dokładać padding. Scroll-driven scena startuje, gdy podmiot jest już widoczny (lead-in ~35% vh) i kończy się przed odpięciem (~80% dystansu). Wewnątrz sekcji odstępy większe niż między nimi.
**Dotyczy**: `Hero.tsx`, `PhoneMock.tsx`, `components/landing/`

## Nie rezerwuj gutera na treść, której nie ma

**Kontekst**: Nazwy ćwiczeń na liście Dziś były wcięte o 56 px (miniatura 44 px + gap), choć żadne ćwiczenie w planie nie miało filmu — `DemoThumbButton` zwracał `null`, ale kontener `h-11 w-11` zostawał.
**Problem**: Nazwy nie trzymały lewej krawędzi kolumny (nagłówek, `SUPERSERIA`, CTA) i wisiały na pustym wcięciu. Próba doklejenia rozpisu do nazwy (`flex-wrap`) tylko pogorszyła sprawę: krótka nazwa dawała schemat w tej samej linii, długa — pod spodem.
**Zasada**: Wyrównanie to własność listy, nie wiersza — gutter (miniatura, ikona, checkbox) rezerwuj tylko wtedy, gdy **którykolwiek** wiersz ma czym go wypełnić; inaczej flush left. Liczby zostawiaj w jednej prawej kolumnie (`justify-between`), żeby dały się skanować w pionie.
**Dotyczy**: `ExercisePreviewList.tsx`, każda lista z opcjonalnym leading slotem

## Lista Dziś: rozpis, nie ułamek; superseria bez numeru i bez unikalnego meta

**Kontekst**: W treningu w toku wiersze pokazywały `1/3`. Nagłówek grupy to „Superseria 2” z `3 serie · 1 min 30 s`, których solo ćwiczenia nie mają.
**Problem**: `1/3` nie mówi ćwiczącemu co robić (ciężar, powtórzenia, czas). Numer grupy dubluje 2a/2b. Czas tylko przy superserii łamie rytm listy.
**Zasada**: Na liście dnia zawsze schemat jak w Styrka/Strong/Hevy (`3 × 10 @ 70 kg`, `3 × 45 s`). Postęp sesji = nagłówek (`3/12 serii`) + wyciszenie skończonej nazwy. Etykieta grupy = „Superseria”. Serie i przerwa nie wiszą tylko na nagłówku grupy — przerwa żyje w loggerze.
**Dotyczy**: `portal/[token]/page.tsx` (`heroItems`), `ExercisePreviewList.tsx`

## Sheet: portal do body; superseria to wiersz, nie box

**Kontekst**: Karta dnia z paska tygodnia nie dawała zobaczyć całego treningu; pod treścią była martwa strefa. Superseria na liście Dziś była w ramce.
**Problem**: `Sheet` renderował się w drzewie strony — tab bar (`z-40`) zasłaniał dół karty, a scroll tła przejmował gest. Obramowany box superserii łamał rytm hairline rows.
**Zasada**: Overlay (`Sheet`) idzie przez `createPortal` na `document.body`, z `overflow: hidden` na `html` i `overscroll-contain` na treści. Listy ćwiczeń = hairline rows; grupa superserii to caps label + te same wiersze, bez ramki.
**Dotyczy**: `ui.tsx` (`Sheet`), `ExercisePreviewList.tsx`, portal Dziś / DaySheet

## Szczegóły klienta: setup-once na dół, hero dla statusu

**Kontekst**: Profil klienta otwierał się kartą „Link i WhatsApp” (PIN, ważność, szablony wiadomości) nad aktywnym planem i zakładkami.
**Problem**: Trener wchodzi, żeby sprawdzić trening albo otworzyć plan — a pierwsze, co widzi, to konfigurację ustawianą raz. Za dużo konkurujących bloków, nic nie da się znaleźć intuicyjnie.
**Zasada**: Na górze strony szczegółów tylko status i praca dnia (plan, postęp, zakładki z danymi). Ustawienia setup-once (PIN, ważność linku, wysyłka, WhatsApp) zwijaj na dole; jedną częstą akcję („Skopiuj link”) zostaw w nagłówku. Nie ładuj tokenu dostępu, dopóki sekcja nie zostanie rozwinięta.
**Dotyczy**: `clients/[id]/page.tsx`, `PortalAccessSection.tsx`, strony szczegółów z mieszanką daily-work + admin

## Kalendarz: jeden box model; ✓ = data wykonania

**Kontekst**: Pasek P–N na Dziś renderował klikalny dzień jako `<button py-1>`, a pusty jako `<div>` bez paddingu. `✓` brał się z postępu cyklu planu, nie z daty sesji.
**Problem**: Litery i kółka się rozjeżdżały (flex stretch + różny padding). Poniedziałkowy trening zrobiony w piątek zapalał ✓ pod „P”. Klik pokazywał rozpis z planu, nie wykonane serie.
**Zasada**: Slot listy/paska renderuj zawsze tym samym elementem — wariant `<button>` z paddingiem obok gołego `<div>` rozjeżdża rząd we flexie. Znacznik „zrobione” w kalendarzu musi wynikać z daty wykonania (`performedOn`), nie z postępu cyklu.
**Dotyczy**: `portalWeekStrip.ts`, `WeekStrip.tsx`, `DaySheet.tsx`, portal Dziś

## Panel: jedna szerokość contentu

**Kontekst**: Import historii dostał własną kolumnę `max-w-2xl` / `max-w-xl`, podczas gdy Klienci i profil klienta biorą szerokość z AppShell (`max-w-[1080px]`).
**Problem**: Ta sama aplikacja, inna szerokość — wygląda jak inny produkt.
**Zasada**: Strony panelu trenera nie wprowadzają drugiej max-width. Dropzone i karty rozciągają się do kolumny AppShell. Węższa kolumna tylko tam, gdzie już jest konwencja (portal `max-w-lg`, landing).
**Dotyczy**: import historii, import planu, nowy plan, ustawienia, AppShell, nowe strony w `(app)`

## Etykieta akcji musi mówić sama za siebie

**Kontekst**: Przycisk importu historii na profilu klienta brzmiał „Przyjmij z historii”.
**Problem**: Trener widzi ekran pierwszy raz i nie zna kontekstu sesji projektowej. „Przyjąć” nie mówi, co przybędzie ani skąd — myślenie o zdjęciach albo o zatwierdzaniu historii.
**Zasada**: Etykieta akcji = czasownik + obiekt, zrozumiała bez briefu. Test: czy trener powie to koledze? „Przyjmij z historii” → „Wgraj stare treningi”.
**Dotyczy**: profil klienta, import historii, skill `ux-writing`

## Bez nazw innych aplikacji w produkcie

**Kontekst**: Import historii ze screenów opisywał konkretne dzienniki w UI, promptach AI, komentarzach i nazwach funkcji.
**Problem**: Wymienianie marek obcych apek w produkcie nie jest wskazane, dozwolone ani bezpieczne.
**Zasada**: W UI, kodzie (identyfikatory, komentarze, prompty) i specu funkcji pisz „poprzednia apka”, „dziennik”, „screeny”, „CSV”. Nie nazywaj konkurencji. Wykrywanie formatu CSV po nagłówkach kolumn, nie po nazwie źródła.
**Dotyczy**: import historii, kreator (wklejka serii), portal, `HistoryImport.cs`, `setList.ts`

## H1: wynik + mechanizm, nie zagadka o churnie

**Kontekst**: Hero było „Wiesz, kto nie trenował. / Zanim zrezygnuje.”
**Problem**: Wynik bez mechanizmu. Test 5 sekund: nie wiadomo, *co* to jest. „Zrezygnuje” jest niejasne. CoachGuru/TrueCoach piszą kategorię — my nie kopiujemy ich, ale H1 musi dać się ukraść tylko nam (plan jako link).
**Zasada**: H1 to dwa krótkie takty tej samej wagi słów (Wysyłasz / Widzisz). Typografia jest kompozycją — bez `text-balance`, bez owijania w 18ch. Wyjaśnienie i churn w podtytule. Zakaz: zrezygnuje, milczy, all-in-one, „aplikacja dla trenerów”.
**Dotyczy**: `Hero.tsx`, `app/page.tsx` metadata, skill `ux-writing`

## 0 zł i rok z góry to nie ten sam wybór

**Kontekst**: Cennik i `/wdrozenie` sklejały freemium, kolejkę 90 dni i prepaid w jednym zdaniu. „Ta stawka zostaje” nie mówiła, jaka.
**Problem**: Równe karty 0 vs prepaid — Hick, każdy bierze 0. 490 zł > 39×12 (468) = irracjonalna przedpłata.
**Zasada**: Homepage cennik = 0 / 39 / 99. Rok z góry tylko na `/wdrozenie`, **pod** formularzem, nie jako równa karta. 390 zł = 12 miesięcy / 15 osób (dwa miesiące w cenie). Zakaz: 490 zł, „ta stawka zostaje”.
**Dotyczy**: `PricingSection.tsx`, `Faq.tsx`, `wdrozenie/`, `FoundingService.cs`, skill `ux-writing`

## Feed: równe kolumny, ćwiczenie do lewej

**Kontekst**: LiveFeed na hero miał środkową kolumnę o zmiennej szerokości; krótkie „OHP” vs długie „MARTWY RUMUŃSKI” nie tworzyły jednej krawędzi.
**Problem**: Wiersze wyglądają na rozjechane, nie na tabelę.
**Zasada**: `sm:grid-cols-3` — trzy równe tory, `text-left` na nazwie ćwiczenia, stały slot markera (`w-16`), `tabular-nums` na wyniku. Nie `text-center` na tekście o zmiennej długości.
**Dotyczy**: `LiveFeed.tsx`

## Kalkulator straty: suwaki w jednej osi, animowana kwota

**Kontekst**: Dwa `Field` w `grid-cols-2` — prawa etykieta dłuższa, pola i CTA na różnych krawędziach.
**Problem**: Niesymetryczne; pola liczbowe słabsze niż gest suwaka.
**Zasada**: Dwa suwaki pełnej szerokości, stacked. Kwota interpolowana (RAF, ease-out, interruptible; `prefers-reduced-motion` = snap). Jedna lewa krawędź: etykiety, wynik, CTA na pełną kolumnę. Track/thumb = invert, bez hue.
**Dotyczy**: `IleTraciszCalculator.tsx`, `.landing-range` w `globals.css`

## Nigdy „odpad” w copy

**Kontekst**: Hak kalkulatora i checklista używały „odpad”, „odpadający”, „odpadnie”.
**Problem**: Brzmi jak śmieć i wstyd, nie jak rozmowa trenera. Trener mówi, że klient odchodzi albo kończy współpracę.
**Zasada**: W UI i outreachu: „odchodzi”, „skończył współpracę”, „ile tracisz”. Zakaz: odpad, odpadający, odpadnie, odpadasz. Strona: `/ile-tracisz` (redirect z `/odpad`).
**Dotyczy**: `ile-tracisz/`, `checklista/`, `LandingFooter.tsx`, skill `ux-writing`, `.ai/gtm/`.

## Cennik w UI: kwota, osoby, czas — bez żargonu briefu

**Kontekst**: Landing i `/wdrozenie` używały founding, Solo locked, white-glove, unlimited, Solo/Pro, „callu”.
**Problem**: Trener nie wie, co to znaczy. To skróty z planu GTM, nie język oferty.
**Zasada**: W UI (landing, formularze, Stripe, e-maile do użytkownika, OG, regulamin) mów kwotę, ile osób i na ile czasu. 390 zł = rok / 15 osób (dwa miesiące w cenie), potem 39 zł zamknięte — nigdy „ta stawka zostaje”. Zakaz: founding, Solo locked, white-glove, unlimited, Solo/Pro jako nazwy planów, call/callu, 490 zł. CTA: „Umów 30 minut wdrożenia”, „Zapłać 390 zł”. Nazwy w kodzie (`/api/founding`, `track: "founding"`) mogą zostać.
**Dotyczy**: `wdrozenie/`, `Faq.tsx`, `PricingSection.tsx`, `FoundingService.cs`, `opengraph-image.tsx`, skill `ux-writing`.

## Portal: jeden CTA, tab bar nie jak Styrka

**Kontekst**: Dziś miało invert nad listą i drugi sticky nad floating pill; aktywny tab = biała pigułka.
**Problem**: Dwie dominanty naraz; chrome 1:1 jak Styrka (pływająca kapsuła + invert fill).
**Zasada**: Jedna dominanta invert. Sticky dokuje tylko gdy in-flow CTA wyjedzie z kadru (`IntersectionObserver`). Portal = tab bar na krawędzi, hairline, ikona+label 12px, active = kreska + waga + foreground — bez floating pill i bez invert na tabie. Panel trenera (mobile pill) zostaje.
**Dotyczy**: `PortalBottomNav.tsx`, `portal/[token]/page.tsx`, `portal/layout.tsx`, skill `design-system`.

## Superseria: nigdy „runda” w UI

**Kontekst**: Copy wykonania superserii używało „runda” / „po rundzie” / „Runda 2 z 3”.
**Problem**: Na siłowni mówi się superseria i seria. „Runda” to obwód / sport, nie język trenera.
**Zasada**: W tekstach PL (kreator, logger, Dziś, preview, review): „po superserii”, „3 serie”, „Seria 2 z 3”. Nigdy „runda”. Nazwy w kodzie (`roundCount`, `sessionRounds`) mogą zostać.
**Dotyczy**: `supersetPreview.ts`, `ListEntryEditor`, `ListView`, `PlanDayColumn`, `SessionLogger`, `SessionReview`, `RestTimer`.

## Profil ≠ status treningu

**Kontekst**: Redesign Profilu dodał kartę „Aktualny plan” (nazwa, tydzień, pasek, %). User: kafel nie daje wartości.
**Problem**: Te same dane żyją na „Dziś” z CTA — na Profilu to martwa duplikacja, zabiera pierwszy viewport i łamie test odejmowania (Styrka).
**Zasada**: Zakładka Profil = preferencje + narzędzia + legal. Status planu/sesji tylko na Dziś (ew. Progres). Nie powielaj treningowych KPI na Profilu.
**Dotyczy**: `apps/web/app/portal/[token]/profile/page.tsx`, spec `2026-08-12-portal-profil-redesign.md`.

## `opacity-0` nie zwalnia miejsca w flexie

**Kontekst**: Kafelki w Tablicy kreatora planu były nieczytelne mimo tej samej szerokości kolumny (300px) co w podglądzie — nazwy łamały się na 3–4 linie, linia mono sypała się na „kg · 5 serii ·" / „2min".
**Problem**: Checkbox, uchwyt DnD i `↑↓✕` miały `opacity-0` do hovera, ale nadal zajmowały ~120px w wierszu flex — na treść zostawało ~155px zamiast ~276px. Dodatkowo inline `ExerciseEditor` w kolumnie 300px rozpychał board.
**Zasada**: Kontrolki hover w wąskich kolumnach kanbanu pozycjonuj `absolute` (albo renderuj tylko gdy potrzebne). Kafelek = nazwa + jedna linia celu; pełna edycja w `SidePanel` (split 380px), nie inline w kolumnie. Cały kafelek jako uchwyt DnD + `activationConstraint.distance`.
**Dotyczy**: `apps/web/components/plan-builder/ExerciseCard.tsx`, `ItemPanel.tsx`, `SidePanel.tsx`, `DayColumn.tsx`.

## e1RM: limit powtórzeń, surowe porównanie, tylko odhaczone serie

**Kontekst**: PR liczony samym Epleyem bez limitu powtórzeń; zaokrąglenie do 0,5 kg przed porównaniem; rekordy klienta / dashboard / stats brały prefill bez `Completed`.
**Problem**: Serie wykończeniowe (np. 20×40) nadmuchują e1RM i blokują prawdziwe PR. Marginalne przebicia giną w remisie po `RoundToHalf`. Prefill z planu udaje rekord, którego klient nie zrobił.
**Zasada**: `Stats.Epley1Rm` — surowa wartość, `reps ≤ MaxRepsFor1Rm` (12, jak Strong). Do JSON tylko `Epley1RmDisplay` / `RoundToHalf`. PR wyłącznie przez `IsEpleyPr`. We wszystkich agregacjach rekordów: `Completed && !IsWarmup`. Nie duplikuj wzoru inline (patrz `Stagnation`).
**Dotyczy**: `apps/api/Stats.cs`, `ProgressReports.cs`, `Stagnation.cs`, `Sessions.cs`, feed PR w `Program.cs`, testy `EpleyPrTests`.

## Gęsta tabela nie mieszka w wąskiej kolumnie boardu

**Kontekst**: Widok `/plans/[id]` pokazywał 6-kolumnową tabelę serii wewnątrz karty dnia (~300px). Tabela rozpychała kolumnę; `min-w-0` tylko ukryło objaw.
**Problem**: Progressive disclosure odwrócone — szczegóły (serie) zajmowały większość pikseli, a skanowanie „co jest w którym dniu” było niemożliwe.
**Zasada**: W boardzie/kanbanie karta pokazuje jedną linię schematu (`schemeLine`). Pełne serie, tempo, %1RM, RIR i notatki idą do panelu (Sheet / prawy panel) po kliknięciu. `min-w-0` to plaster na overflow, nie diagnoza.
**Dotyczy**: `apps/web/app/(app)/plans/[id]/page.tsx`, `apps/web/components/plan-view/*`, przyszłe widoki boardowe.

## Karta ćwiczenia: role + powtórzenia, nie nazwa metody

**Kontekst**: Po boardzie na kafelku było `4 serii · Rampa 6-4-2-5-3-1 · 60 kg` — trener nie skanuje nazwy presetu.
**Problem**: `setScheme` to etykieta metodyki; na karcie liczą się zmienne treningowe (jak Hevy/FitPros: sets × reps @ load).
**Zasada**: `schemeLine` buduj z `prescribedSets` (`rampa 2 · bo 5–10 · bo 10–15 · 50 kg`). Nazwę schematu trzymaj w panelu (badge), nie na karcie.
**Dotyczy**: `apps/web/components/plan-view/summary.ts`.

## Board edycji: scroll tylko na kolumnach; chrome mono (bez emoji)

**Kontekst**: Tablica w edycji planu — 7 dni rozpychało całą stronę (header jechał w bok); lupa była emoji 🔍 (kolorowa).
**Problem**: Scroll poziomy musi być lokalny w boardzie (`min-w-0` + `overflow-x-auto` + `shrink-0` na kolumnach). Emoji/hue w chrome łamie mono/Styrka.
**Zasada**: Nagłówek planu i taby tygodni nie scrollują w poziomie. Kolumny dni: stała szerokość + snap. Ikony tylko Phosphor `Icon` (`currentColor`). Jedna ścieżka dodawania: QuickComposer + lupa → drawer (bez drugiego „+ Dodaj ćwiczenie").
**Dotyczy**: `DayBoard`, `DayColumn`, `QuickComposer`, `PlanBoard`.

## Board = model Trello (nie scroll strony w dwie osie)

**Kontekst**: Równe kolumny + page scroll + horizontal board = nested scroll confusion; composer i wyniki wyszukiwania uciekały za fold.
**Problem**: FitPros/Trello/Jira nie scrollują całej strony w pionie przy boardzie.
**Zasada**: Chrome (header/taby) `shrink-0`; board `flex-1 min-h-0` wypełnia viewport (`md:h-dvh` w AppShell dla `/plans/[id]` i `/plans/new`); w kolumnie lista kart `overflow-y-auto`, composer `shrink-0` na dole. Poziomo tylko tor kolumn. **Nie** włączaj tego trybu dla `/plans/import` (i innych długich formularzy pod `/plans/*`) — `overflow-hidden` bez lokalnego scrolla odcina treść.
**Dotyczy**: `AppShell`, `PlanBuilder`, `DayBoard`/`DayColumn`, `PlanBoard`/`PlanDayColumn`, `/plans/[id]`.

## Motyw: `data-theme` + `useServerInsertedHTML`, nie `<script>` w JSX

**Kontekst**: Tokeny light były w `globals.css`, ale bez przełącznika.
**Problem**: React 19 / Next 16 rzuca „Encountered a script tag…” gdy `<script>` jest w drzewie komponentu; FOUC przy ustawieniu motywu po hydracji.
**Zasada**: Preferencja w `localStorage` (`repmaxer-theme`); boot przez `ThemeBoot` + `useServerInsertedHTML` (poza drzewem klienta); UI w `/settings` przez `useTheme()` / `Switch`. Landing zawsze light: `data-theme="light"` na root + `LandingThemeLock` (tylko `lockLightTheme` w efekcie — **bez** drugiego `useServerInsertedHTML`, bo koliduje z ThemeBoot i psuje hydrację).
**Dotyczy**: `lib/theme.ts`, `components/ThemeBoot.tsx`, `components/landing/LandingThemeLock.tsx`, `app/layout.tsx`, `/settings`.

## `.t-num` bez `color` — nie blokuj `text-pr` / `text-gain`

**Problem**: `.t-num { color: var(--fg) }` wygrywało z utility `text-pr`, więc rekord 142,5 kg na landingu wyglądał na czarny mimo `tone="pr"`.
**Zasada**: `.t-num` tylko font/waga/tabular; kolor wyłącznie z `text-*` (foreground / pr / gain / loss) albo inherit.
**Dotyczy**: `globals.css` `.t-num`, `StatTile`, `StatBlock`, markery PR.

## Onboarding: link portalu — wszystkie ścieżki kopiowania/wysyłki

**Problem**: Krok „Skopiuj link portalu…” czytał tylko `localStorage` ustawiany przy kopiowaniu z Panelu; karta klienta (`/clients/[id]`) i e-mail nie oznaczały kroku — checklista wisiała na 2/3 mimo realnego wysłania.
**Zasada**: Wspólne `markPortalLinkSent()` (`lib/portalLinkSent.ts`) po każdym copy/send; przy istniejącej aktywności (sesje/PR) zsynchronizuj flagę na dashboardzie.
**Dotyczy**: `TrainerDashboard`, `clients/[id]/page.tsx`, `lib/portalLinkSent.ts`.

## Dialog: bez zamykania kliknięciem w tło

**Problem**: Przypadkowe kliknięcie w scrim zamykało formularz (np. Dodaj klienta) i kasowało wpis.
**Zasada**: `Dialog` zamyka tylko Anuluj / Escape / akcja w stopce — scrim jest dekoracyjny (`div`, bez `onClick`).
**Dotyczy**: `components/ui.tsx` `Dialog`.

## Chrome planu = 2 pasy, zero powtórzeń

**Kontekst**: Edycja/podgląd planu miały 4 pasy (~200 px): PageHeader „Edycja: X”, eyebrow, badge, „tydzień 1 z 1”, osobny wiersz Lista/Tablica/Arkusz, label „TYDZIEŃ”.
**Problem**: Ta sama informacja 2–3×; board tracił viewport.
**Zasada**: Pas 1 = `Toolbar` (tytuł + badge tylko gdy szablon + status · prawa: `OverflowMenu` + CTA). Pas 2 = pigułki tygodni (same cyfry) + segmented/meta. Rzadkie akcje (ustawienia, przypisz, anuluj, opis) tylko w `···`. Nie dubluj `PageHeader` nad `PlanToolbar`.
**Dotyczy**: `ui.tsx` (`Toolbar`, `OverflowMenu`), `PlanToolbar`, `WeekTabs`, `/plans/[id]`.

## Karta boardu: jedna mocna informacja + wyciszona meta; superseria = klamra

**Kontekst**: Druga korekta boardu planu — wyliczanka `rampa 2 · bo 5-10 · bo 10-15 · 100 kg` jednym tonem była nieczytelna, a A1/A2 na osobnych kartach nie wyglądało na połączenie.
**Problem**: Brak hierarchii (Value > Label) i brak wizualnego grupowania — skróty typu „bo" wymagały dekodowania.
**Zasada**: Karta = cel ćwiczenia jednym zwrotem (`rampa do 2 @ 100 kg`, `top 5 @ 70 kg`, `4 × 8–10 @ 70 kg`) w mocnym tonie + meta (`3 serie · 2min`) wyciszona. Rozpis serii tylko w panelu. Superserie renderuj jako jedną klamrę (wspólna ramka + nagłówek „Superseria A", karty wewnątrz przez `divide-y`), nie osobne karty z kreską.
**Dotyczy**: `apps/web/components/plan-view/{summary.ts,PlanItemCard.tsx,PlanDayColumn.tsx}`.

## Masowa podmiana klas nie może zgniatać wcięć całego pliku

**Kontekst**: Migracja Acid → mono — skrypt Python robił `re.sub(r'  +', ' ', text)` na całych plikach TS/TSX.
**Problem**: Zniszczył indentation w `api.ts`, `ui.tsx` i setkach innych plików; trzeba było `git checkout -- apps/web/` i odtwarzać zmiany.
**Zasada**: Podmiany klas tylko przez `StrReplace` / celowany regex na tokenach (`shadow-card`, `glow-accent`…). Nigdy globalne collapse whitespace na źródłach. Po blędzie odtwórz z gita i aplikuj punktowo.
**Dotyczy**: wszelkie migracje design tokenów, skrypty bulk-edit.

## Mono v2: hue tylko na danych, chrome = invert

**Kontekst**: Redesign epic minimalism (2026-08-06).
**Problem**: Stary Acid wkładał lime w nav/CTA/focus; Lucide + 3 fonty + cienie/blur.
**Zasada**: Primary = `bg-invert-bg`; data accents `pr`/`gain`/`loss` z glifem; Instrument Sans + Geist Mono; Phosphor przez `Icon`; landing też mono v2 (bez `.theme-acid`). Skill `design-system` jest źródłem prawdy.
**Dotyczy**: `globals.css`, `ui.tsx`, `AppShell`, portal nav, SessionLogger, wykresy, `components/landing/`.

## Nazwa produktu: RepMaxer (nie Workout Alchemist)

**Kontekst**: Stara nazwa WA pojawiała się w mailach, eksporcie, docs i folderze design systemu.
**Zasada**: Produkt = **RepMaxer**, compact = **RM**. Nigdzie nie wprowadzaj „Workout Alchemist” w UI, mailach ani nowych docs. Folder DS: `RepMaxer Design System/`.
**Dotyczy**: Wordmark, brandMark, manifests, Email:From, settings export, AGENTS, deploy.

## Panel trenera: lewy sidebar, nie top nav

**Kontekst**: DS specimen mówił o hairline top nav; użytkownik skorygował — dashboard jak Linear/Stripe ma nawigację z lewej.
**Zasada**: Desktop = sticky left sidebar (pełny / rail w kreatorze planu). Mobile = floating pill + drawer. Portal klienta może zostać przy floating pill.
**Dotyczy**: `AppShell.tsx`.

## Hydration mismatch w dev = najpierw sprawdź service workera

**Kontekst**: Uporczywy „Hydration failed" na `/`. Klient renderował skeleton sprzed kilku commitów (`h-64`), którego nie było już w repo.
**Problem**: `/sw.js` (rejestrowany w portalu, ale scope `/`) łapie `/_next/static/` strategią **cache-first**. W dev chunki mają stałe nazwy, więc przeglądarka trwale serwowała stary JS przy nowym HTML z serwera. Zmiany w komponentach nic nie dawały — kolejne „naprawy" (`useDelayedFlag` → CSS, `useIsClient`, `next/dynamic`) leczyły objaw, a `dynamic` na named export dodatkowo wywalił stronę („Lazy element… undefined").
**Zasada**: Gdy SSR/klient różnią się markupem, którego nie ma w kodzie — to stale cache, nie logika Reacta. SW rejestruj wyłącznie w produkcji; w dev wyrejestruj go i wyczyść `caches` (`DevServiceWorkerCleanup` w root layout). Diagnoza: porównaj markup z błędu z `git log -S`.
**Dotyczy**: `public/sw.js`, `PortalShell`, `app/layout.tsx`, `DevServiceWorkerCleanup`.

## Skeleton: opóźnienie przez CSS, nie przez rozgałęzianie DOM

**Kontekst**: `useDelayedFlag` pokazywał pusty `aria-busy` przez 200 ms, potem pełny skeleton.
**Problem**: SSR zawsze renderował pusty div (`elapsed=false`), a klient po delay / re-SSR Clerka — `DashboardSkeleton` → hydration mismatch.
**Zasada**: Przy ładowaniu zawsze ten sam markup skeletonu. Opóźnienie widoczności = klasa `skeleton-defer` (CSS `animation-delay: 200ms`). Zero `typeof window` / `localStorage` w renderze.
**Dotyczy**: `skeletons.tsx`, `globals.css`, panele z loading skeletonem, `TrainerDashboard`.

## Logger klienta: czytelność > display-caps

**Kontekst**: Portal/sesja używały `.display-caps` (Archivo 900 UPPERCASE) na nazwach ćwiczeń; pola kg/powt były płaskie i drobne.
**Problem**: Na siłowni typografia była nieczytelna; gęsty chrome (ikony RIR/timer/thumb, karty z cieniem) konkurował z wartościami.
**Zasada**: W SessionLoggerze nazwy ćwiczeń = sentence case `text-[15px] font-semibold` (Space Grotesk). Inputy kg/powt = pigułki `bg-surface-active` + `text-lg font-mono`. Meta (przerwa/RIR) jedną linią pod tytułem albo w menu ⋯. Kolumna poprzedniego wyniku zostaje (nie wracaj do ghost-placeholderów). Lepiej niż Styrka = wyższy kontrast, nie monochrom 10px.
**Dotyczy**: `SessionLogger.tsx`, `SetValueInput.tsx`, portal home/progres.

## DateTime z SQLite bez Kind=Utc psuje zegary w przeglądarce

**Kontekst**: Po starcie sesji zegar pokazywał `2:00:18` zamiast `0:00`.
**Problem**: EF/SQLite zwraca `DateTime` z `Kind=Unspecified`; JSON bez `Z`; ES traktuje string jako czas lokalny → offset strefy (CEST +2 h).
**Zasada**: W `AppDb.ConfigureConventions` konwertuj wszystkie `DateTime`/`DateTime?` na UTC przy odczycie (`SpecifyKind(Utc)`). Test: `createdAt` kończy się na `Z`. Czas trwania sesji przy `finish` wysyłaj z zegara klienta (`durationSeconds`), nie licz wyłącznie z `UtcNow − CreatedAt` na serwerze.
**Dotyczy**: `AppDb.cs`, `SessionLogger`, każdy licznik oparty o timestamp z API.

## Pasek narzędzi w przepływie dokumentu rozpycha listę serii

**Kontekst**: Fokus na kg/powt. wstawiał toolbar pod wierszem — elementy „rozjeżdżały się”, a „Talerze” pojawiały się też przy powtórzeniach.
**Zasada**: Narzędzia kontekstowe (steppery, Talerze, Prev/Next) idą do przyklejonego doku nad klawiaturą (`visualViewport`), zależnego od **pola** (nie wiersza). Talerze tylko przy `kg`.
**Dotyczy**: `SessionLogger`, `SessionDock`, `useKeyboardInset`.

## Trener nie wykonuje sesji klienta — tylko podgląd + jawne „wpisz za”

**Kontekst**: „Dodaj trening” otwierało pełny logger trenerowi; brak read-only, ryzyko nadpisania serii klienta.
**Zasada**: `/sessions/[id]` = `SessionReview` (podgląd). Logger tylko na `/edit` z banerem „Wpisujesz wynik za klienta”. CTA profilu: primary = plan, secondary = wpisz za klienta (Dialog z dniem i datą).
**Dotyczy**: panel trenera, `SessionReview`, role trener/klient.

## Enumeracja = lista; liczebniki przez wspólny helper

**Kontekst**: `/plans` pokazywał dwie sekcje kafelków (`sm:grid-cols-2 xl:grid-cols-3`) ze sztywnymi etykietami „1 DNI” / „1 ĆWICZEŃ” i limonkową ikoną biblioteki na każdej karcie.
**Problem**: Przeglądanie planów to enumeracja — ściana kafelków zostawia dziury w siatce, puchnie przy skali i łamie budżet lime; sztywne labelki ignorują polską odmianę.
**Zasada**:
1. Zadanie „przeleć listę i znajdź X” → gęsta lista/tabela z wyszukiwaniem i filtrem (`SegmentedControl`), nie karty w siatce. Skeleton 1:1 z docelowym układem.
2. Liczebniki tylko przez `lib/plural.ts` (`polishWeekCount` / `polishDayCount` / `polishExerciseCount`) — nigdy sztywne „tyg./dni/ćwiczeń”.
3. Ikony wiersza: `bg-surface-active text-muted-strong`; jedna limonka na ekranie = primary CTA w `PageHeader`.
**Dotyczy**: `apps/web/app/(app)/plans/page.tsx`, `lib/plural.ts`, listy enumeracyjne.

## Formularz w Dialogu: błąd i busy wewnątrz, nie na stronie

**Kontekst**: Dodawanie ćwiczenia w bibliotece ustawiało `setError` na stronie, a dialog to `z-50` ze scrimem — komunikat 409 był niewidoczny; przycisk „Dodaj” nie był `disabled` podczas zapisu.
**Problem**: Trener nie widzi powodu nieudanego zapisu; podwójny klik = podwójny POST. `textarea` z `inputClass` (`h-10`) jest zmiażdżony. Sprzęt wpisany po polsku tworzy osobne fasety obok slugów.
**Zasada**:
1. Błąd walidacji/API renderuj **w** Dialogu (`ErrorBanner` nad formularzem). `Dialog` dostaje `busy` → confirm `loading`+`disabled`, Anuluj aktywny.
2. Textarea → `textareaClass` (bez sztywnego `h-10`).
3. Enumy (sprzęt, partia, wzorzec) wybieraj pigułkami ze slugami, nie wolnym tekstem „po przecinku”.
4. Jeden formularz zasobu w dwóch trybach (`quick`/`full`), nie dwa niezależne komponenty.
**Dotyczy**: `ExerciseFormDialog.tsx`, `ui.tsx` Dialog, biblioteka ćwiczeń, kreator.

## Biblioteka: nie maluj play/CTA na każdej pozycji listy

**Kontekst**: Zakładka Ćwiczenia po imporcie YT pokazywała ~35 pigułek filtrów naraz i limonkowy play na ~124 miniaturach.
**Problem**: Hick's Law (ściana opcji) + budżet lime ≤3% złamany — główne CTA ginęło; sticky filtry chowały się pod mobilnym headerem; unicode `▶` zamiast SVG.
**Zasada**:
1. Fasety: jeden rząd (partie) zawsze widoczny; reszta za progressive disclosure („Filtry · N”) + chipy aktywnych. Liczniki fasetowe liczone kontekstowo.
2. Play/akcent limonkowy nie na każdej pozycji siatki — na liście `play="hover"` (cichy), limonka zostaje dla 1 CTA strony. Ikony = lucide/SVG, nie `▶`.
3. Sticky paski filtrów tylko od `md:` (mobile header ma `z-40` i `top-0`).
4. Destrukcja na karcie: `IconButton` ujawniany na hover, nie pełny czerwony „Usuń”.
**Dotyczy**: `apps/web/app/(app)/exercises/page.tsx`, `ExerciseThumb.tsx`, `lib/exerciseSearch.ts`.

## Poprzedni wynik w kolumnie, nie w placeholderze inputu

**Kontekst**: SessionLogger pokazywał poprzednią sesję jako ghost-placeholder w polach kg/powt. („Dziś").
**Problem**: Nagłówki `Seria`/`Dziś` się rozjeżdżały, użytkownik mylił placeholder z wpisaną wartością, a inputy z długim placeholderem psuły siatkę.
**Zasada**: Poprzedni wynik ma własną kolumnę (`Poprz.`), inputy mają krótkie placeholdery jednostek (`kg` / `powt.`). Cele z planu dołączaj additive do DTO (bez migracji), a „poniżej celu" pokazuj jako osobny znacznik przy kolumnie poprzedniej.
**Dotyczy**: `SessionLogger.tsx`, `Sessions.LoadTargetsAsync`, portal klient.

## Ikony to inline SVG, nigdy emoji ani znaki unicode

**Kontekst**: Karty planów dostały akcje `IconButton` z glifami `⎘` i `🗑` (wzorem `TableDay`/`ListView`), a statystyki były luźnymi liczbami na tle karty.
**Problem**: Emoji renderuje się w kolorze systemowym i innym rozmiarze niż tekst — wygląda tanio i niespójnie; wyśrodkowane liczby bez ramki „pływają” i karta sprawia wrażenie pustej.
**Zasada**:
1. Ikony rysuj jako inline `<svg>` 16×16, `stroke="currentColor"`, `strokeWidth 1.4` — dziedziczą kolor tokenu i skalę tekstu. Zero emoji/dingbatów w UI (dotyczy też starych miejsc przy okazji ich edycji).
2. Grupy liczb (tyg./dni/ćwiczeń) zamykaj w wydzielony pasek: `rounded-md border border-border bg-surface-sunken` + `divide-x divide-border`. Liczba `font-mono font-semibold`, etykieta `text-xs uppercase tracking-caps text-muted`.
3. Karta w siatce ma stały szkielet: kafelek ikony 36px + tytuł, opis z `line-clamp-2` i `min-h`, pasek statystyk, stopka `mt-auto` — dzięki temu karty w rzędzie są równe i nic nie „lata”.
**Dotyczy**: `apps/web/app/(app)/plans/page.tsx`, `apps/web/components/skeletons.tsx`, docelowo `plan-builder/*`.

## Prosty język + forma wizualna zamiast żargonu i pustych heatmap

**Kontekst**: Profil klienta miał CTA „Loguj trening” i sekcję „Zgodność klienta” (heatmapa GitHub 7×8).
**Problem**: „Loguj” kojarzy się z logowaniem do konta; trener nie „rozpoczyna” treningu klienta. Heatmapa przy 1–3 sesjach/tydz. jest w ~95% pusta i wygląda jak zepsuty ekran; „zgodność” to żargon compliance.
**Zasada**:
1. CTA trenera = „Dodaj trening” (spójne z „Dodaj klienta / max / pomiar”) — opisuje skutek, nie metaforę.
2. Unikaj „loguj/zaloguj/zgodność” w copy domenowym; mów „dodaj/zapisz/aktywność”.
3. Heatmapa tylko przy gęstych danych. Przy rzadkich sesjach — tygodniowe mini-słupki (`WeeklyActivityBar`) + zdanie ludzkim językiem („2 treningi w tym tygodniu”).
4. Metryki zawsze z formą wizualną: ikona w chipie, pierścień postępu (`ProgressRing`), słupek — nie sama ściana napisów.
**Dotyczy**: `apps/web/app/(app)/clients/**`, `WeeklyActivityBar.tsx`, `TrainerDashboard.tsx`.

## Notatka dnia nie może konkurować z composerem

**Kontekst**: W widoku Lista puste pole „Notatka / rozgrzewka dnia” było pełnym `inputClass` tuż nad composerem.
**Problem**: W F-pattern wyglądało jak główne miejsce na treść — trenerzy wpisywali nazwę ćwiczenia w notatkę zamiast w composer.
**Zasada**: Notatka dnia jest drugorzędna. Pusta = cichy link „+ Notatka…”, nie pełne pole. Otwarte pole ma label + dashed/muted border (nie hero `inputClass`). Wzorzec jak w `DayColumn` (progressive disclosure).
**Dotyczy**: `ListView.tsx`, `TableDay.tsx`, `DayColumn.tsx`.

## Podpowiedzi composera domyślnie zwinięte

**Kontekst**: Widok Lista kreatora pokazywał zawsze 6 chipów skrótów + 3-liniową legendę tempo/RIR/rampa pod polem wpisywania.
**Problem**: Ściana tekstu utrudniała fokus na dodawaniu ćwiczeń; power-userzy i tak znają skróty, a nowi potrzebują ściągawki na żądanie.
**Zasada**: Hinty i legenda w composerze żyją w `ComposerHelp` (trigger `?`, localStorage `trainer-app:composer-help:v1`). Pod polem zostaje jedna kontekstowa linia (`↵ dodaj jako N`). Nie wracaj do zawsze widocznego bloku legendy.
**Dotyczy**: `apps/web/components/plan-builder/ListComposer.tsx`, `ComposerHelp.tsx`, `QuickComposer.tsx`.

## Dev web na Webpacku, nie Turbopacku, dopóki Next < 16.3

**Kontekst**: Next 16.2 na Apple Silicon (arm64) używa Turbopacka jako domyślnego bundlera `next dev`. Binarka `@next/swc-darwin-arm64` alokuje pamięć `IOAccelerator`/`MAP_JIT` (Cranelift JIT), która rośnie monotonicznie i nie jest zwalniana — `ps` zaniża footprint, a systemowy kompresor + swap zamrażają cały macOS. Dodatkowo antywirus skanujący `.next` (często >1 GB) podbija CPU.
**Problem**: Długa sesja `npm run dev` (Turbopack) + Kaspersky bez wykluczeń → zamrożenie komputera „po pewnym czasie”, bez czytelnego błędu w terminalu.
**Zasada**:
1. `apps/web`: `npm run dev` = `next dev --webpack` z `NODE_OPTIONS=--max-old-space-size=4096` (twardy sufit V8 — pada proces, nie system). `next build` zostaje na Turbopacku.
2. Orkiestracja: `./scripts/dev.sh` (trap `kill 0`, `MSBUILDDISABLENODEREUSE=1`), diagnostyka `./scripts/dev-doctor.sh`, czyszczenie `./scripts/clean.sh`.
3. Wykluczenia AV dla `node_modules`, `.next`, `bin`/`obj`, cache NuGet/npm — opis w `README.md`.
4. **Warunek cofnięcia**: gdy Next **16.3+** wyjdzie jako stabilny `latest` (z `turbopackMemoryEviction`), wrócić `dev` na `next dev` (Turbopack), usunąć skrypt `dev:turbo` i zaktualizować ten wpis. Do tego czasu nie „naprawiać” limitu przez Turbopack — `--max-old-space-size` i `turbopackMemoryLimit` w 16.2 **nie limitują** IOAccelerator.
**Źródła**: [vercel/next.js#91585](https://github.com/vercel/next.js/issues/91585), [vercel/next.js#92055](https://github.com/vercel/next.js/issues/92055), [Next 16.3 Turbopack](https://nextjs.org/blog/next-16-3-turbopack).
**Dotyczy**: `apps/web/package.json`, `apps/web/next.config.ts`, `scripts/dev.sh`, `scripts/dev-doctor.sh`, `scripts/clean.sh`, `README.md`.

## Trzymaj typy `apps/web/lib/api.ts` zsynchronizowane z backendem

**Kontekst**: Backend serializuje JSON w camelCase; frontend czyta te pola przez typy w `apps/web/lib/api.ts`.
**Problem**: Rozjazd nazw/kształtu między encją C# a typem TS powoduje ciche `undefined` w UI.
**Zasada**: Każda zmiana encji/DTO w `apps/api/` musi mieć lustrzaną aktualizację typu i metody w `apps/web/lib/api.ts` w tej samej zmianie.
**Dotyczy**: `apps/api/Models.cs`, `apps/api/Dtos.cs`, `apps/web/lib/api.ts`.

## `EnsureCreated()` nie migruje istniejącej bazy

**Kontekst**: `apps/api/Program.cs` ma dwa tory: SQLite (dev) → `EnsureCreated()`, Postgres (prod) → `Database.Migrate()`.
**Problem**: Zmiana pól/relacji istniejącej encji nie zaktualizuje `trainer.db` — nowe kolumny nie powstaną, aplikacja rzuci błędem SQLite. Odwrotnie na produkcji: bez wygenerowanej migracji Postgres zostanie ze starym schematem.
**Zasada**: Po zmianie schematu zrób **oba**: wygeneruj migrację (`dotnet ef migrations add …`) i usuń `apps/api/trainer.db`, żeby lokalna baza się odtworzyła. Utratę danych zgłoś użytkownikowi z góry. Pamiętaj, że migracje nie wykonują się lokalnie — pierwszy realny przebieg jest na produkcji, więc przejrzyj wygenerowany SQL.
**Dotyczy**: `apps/api/Models.cs`, `apps/api/AppDb.cs`, `apps/api/Program.cs`, `apps/api/Migrations/`.

## `--no-launch-profile` wymaga jawnego `ASPNETCORE_ENVIRONMENT`

**Kontekst**: `scripts/dev.sh` startuje API przez `dotnet run --no-launch-profile`, co świadomie pomija `launchSettings.json` — a to tam ustawione było `ASPNETCORE_ENVIRONMENT=Development`.
**Problem**: Po dodaniu `appsettings.Production.json` (provider `Postgres`) domyślne środowisko Production sprawiło, że dev-owy SQLite-owy connection string trafiał do Npgsql i API padało na starcie: `Couldn't set data source`. Objaw był niewidoczny, bo gołe `wait` w skrypcie nie kończyło go po śmierci jednego procesu — web żył dalej i wyglądało to na „działa”.
**Zasada**: Każde uruchomienie z `--no-launch-profile` ustawia środowisko jawnie (`export ASPNETCORE_ENVIRONMENT=Development`). Dodając plik `appsettings.{Environment}.json`, sprawdź, czy któryś skrypt nie ominie profilu. W orkiestratorze dev padnięcie jednego procesu musi kończyć cały skrypt — inaczej awaria backendu jest niewidoczna.
**Dotyczy**: `scripts/dev.sh`, `apps/api/Properties/launchSettings.json`, `apps/api/appsettings.Production.json`.

## Każdy endpoint trenera musi przejść przez `TrainerAccess`

**Kontekst**: Clients/Plans/Dashboard były scoped po `TrainerId`, ale sessions, maxes, assignments, exercises GET/PUT/DELETE i access-token były otwarte po samym ID.
**Problem**: W produkcji z Clerkiem to IDOR — trener A mógł czytać/edytować zasoby trenera B.
**Zasada**: Nowy endpoint pod `/api/*` (poza portalem tokenowym) zawsze: `TrainerIdAsync` + filtr własności (`OwnsClientAsync` / `TrainerId ==`). Wspólna biblioteka ćwiczeń (`TrainerId == null`) jest tylko do odczytu. Isolację pokrywaj testem w `TenantIsolationTests`.
**Dotyczy**: `apps/api/Program.cs`, `apps/api/TrainerAccess.cs`, `tests/api/TenantIsolationTests.cs`.

## Logger sesji: nie parsuj liczb w trakcie pisania i nie nadpisuj draftu odpowiedzią API

**Kontekst**: Hardening `SessionLogger` — zoom iOS, miganie przy ✓, utrata `10,5` kg, utrata danych po minimalizacji.
**Problem**:
1. Kontrolowany `value={number}` + `Number("10.")` w `onChange` natychmiast kasuje kropkę/przecinek.
2. `setDraft(serverResponse)` po każdym PUT nadpisuje lokalne edycje i zmienia `key` (remount) gdy serwer nadaje ID.
3. Debounce 400 ms nie odpala się, gdy karta jest zamrożona — dane giną.
**Zasada**:
1. Input liczbowy trzyma bufor tekstowy; commit liczby na blur / gdy draft nie kończy się separatorem.
2. Po PUT rób `reconcile(local, server)` — z serwera tylko `id` / `isPr` / agregaty; wartości użytkownika zostają lokalne. Stabilny `uid` jako React `key`.
3. Każdy debounce zapisu wymaga flusha na `visibilitychange`/`pagehide` (`keepalive`) + lokalnego draftu w `localStorage`.
**Dotyczy**: `apps/web/components/SessionLogger.tsx`, `components/session/*`, `lib/sessionDraft.ts`, `lib/sessionQueue.ts`.

## Minimal API: DELETE z body psuje cały routing (500 na każdym requeście)

**Kontekst**: Endpoint `MapDelete("/api/portal/.../push-subscription", (token, PushSubscriptionInput input, …))` — body JSON przy unsubscribe.
**Problem**: .NET Minimal API nie inferuje body dla DELETE. Host pada przy budowaniu endpointów z `Body was inferred but the method does not allow inferred body parameters` — **każdy** request (nawet GET /portal) zwraca 500.
**Zasada**: Do anulowania subskrypcji używaj `MapPost(…/unsubscribe)` albo query string. Parametry body muszą być nie-nullable (`SendPortalLinkInput`, nie `SendPortalLinkInput?`). Po dodaniu endpointu z body odpal `dotnet test` — jeden zły handler zabija całą aplikację.
**Dotyczy**: `apps/api/Program.cs`, kontrakty portal/push/e-mail.

## Npgsql nie parsuje URI PostgreSQL — normalizuj przez `DbConnectionString`

**Kontekst**: Neon podaje connection string jako URI (`postgresql://user:pass@host/db?sslmode=require`). Trafiał on wprost do `UseNpgsql` i do `efbundle --connection` w `deploy-api.yml`.
**Problem**: Npgsql przyjmuje **wyłącznie** format ADO.NET `klucz=wartość` — URI rozbija na pierwszym `=` (tym z `sslmode=require`), całą resztę traktuje jako nazwę parametru i pada na `Couldn't set …/neondb?sslmode`. Wcześniejsza diagnoza w `docs/deploy.md` i guard w workflow twierdziły odwrotnie (że URI jest wymagany), co utrwaliło błąd. Wsparcia URI nie będzie: [npgsql#6576](https://github.com/npgsql/npgsql/pull/6576) zamknięty przez maintainera w 2026-05.
**Zasada**: Każdy connection string do Postgresa przechodzi przez `DbConnectionString.Normalize` (`apps/api/DbConnectionString.cs`) — jedno źródło prawdy dla runtime'u (`Program.cs`) i bundle'a migracji (`DesignTimeDbContextFactory`, czyta `DB_CONNECTION_STRING`). Nie duplikuj parsowania w bashu i nie dodawaj `--connection` do `efbundle`, bo omija normalizację.
**Dotyczy**: `apps/api/DbConnectionString.cs`, `apps/api/Program.cs`, `apps/api/DesignTimeDbContextFactory.cs`, `.github/workflows/deploy-api.yml`, `docs/deploy.md`.

## Prefiks „///” w JSX musi być w wyrażeniu stringowym

**Kontekst**: Acid Design System używa eyebrowów z prefiksem `///` (np. `/// Start`).
**Problem**: ESLint `react/jsx-no-comment-textnodes` traktuje surowy tekst `/// …` w children JSX jako komentarz — lint pada.
**Zasada**: Zawsze `{"/// Start"}` albo template w JS (`eyebrowMark ? \`/// ${eyebrow}\` : eyebrow`). Nigdy gołego `///` jako text node.
**Dotyczy**: landing, dashboard, portal, plan-builder, `ui.tsx` Card.

## Hierarchia Acid: struktura > jasność; lime ≤3%

**Kontekst**: Po pierwszym re-theme Acid cały ekran „świecił” — powierzchnie prawie identyczne, lime na eyebrowach/ikonach/statystykach + CTA glow + scanline.
**Problem**: Brak głębi i konkurujące akcenty; nic nie dało się odczytać jako primary.
**Zasada**:
1. Elevation: 6 rozróżnialnych stopni near-neutral (bez zielonego castu).
2. Lime tylko: CTA fill, focus ring, nav tint+2px bar, progress fill, `text-accent-text` na linkach.
3. Eyebrowy / meta / numery list = `muted` / `muted-faint`. Active nav = `text-foreground`, nie lime.
4. `--glow-cta`, `--texture-scan`, `--glow-pr` = `none`. PR = tint + `border-pr-border`.
5. Test kontrolny: usuń akcent — ekran nadal czytelny.
**Dotyczy**: `globals.css`, skill `design-system`, wszystkie ekrany produktu.

## Landing: jasność w 5 s, spójna cena, zero zmyślonych metryk

**Kontekst**: Hero „Plany, które. / Klienci robią." rozcinał zdanie kropką; metryka „6 min / Pierwszy plan" i copy „w kilka minut" nie miały dowodu; hero/CTA mówiły „za darmo", a cennik/FAQ „149 zł".
**Problem**: Test 5 sekund padał (nie wiadomo, co produkt robi); sprzeczny przekaz cenowy niszczył zaufanie; zmyślony czas to fake proof.
**Zasada**:
1. Hasło hero musi mówić *co robi produkt* w ≤12 słowach — nie rozcinaj zdania kropką dla efektu typograficznego.
2. Przekaz cenowy identyczny w hero, cenniku, FAQ, CTA i AuthScreen (dziś: wczesny dostęp za darmo; 149 zł = kotwica po premierze).
3. Zero wymyślonych metryk (czas „X min", liczby użytkowników). Szybkość = fakty produktowe: 1 link, 0 aplikacji, widok serii na żywo.
4. Metadata (`layout.tsx`) i OG image muszą mieć to samo hasło co landing.
**Dotyczy**: `apps/web/components/landing/*`, `AuthScreen.tsx`, `app/layout.tsx`, `opengraph-image.tsx`.

## Sidebar: kafelek konta na pełną szerokość, nie osobny UserButton

**Kontekst**: Stopka sidebara miała mały `UserButton` (avatar Clerka) obok tekstu „Trener" — klikalny był tylko okrąg, nie cały rząd; padding `px-2` vs nawigacja `px-3` rozjeżdżał kolumnę.
**Problem**: Wylogowanie niewidoczne / nieosiągalne jak w Linear/Notion; ikony i etykiety NAV nie leżały w jednej osi z awatarem.
**Zasada**: Pełnoszerokościowy kafelek konta (`w-full`, ten sam `px-3` co pozycje NAV) otwiera menu z „Wyloguj się" (`useClerk().signOut`). Ikony NAV w jednym rzędzie z `flex-1` na etykiecie — bez zagnieżdżonego `justify-between` rozjeżdżającego kolumnę.
**Dotyczy**: `AppShell.tsx` (AccountTile / TrainerFooter / NavLinks).

## Nagłówek karty i język UI: jedno źródło prawdy, zero żargonu IT

**Kontekst**: Panel miał ręczne nagłówki kart (`mt-1` vs `mt-0.5`, ikona tylko przy PR) — tytuły w siatce 2 kolumn się rozjeżdżały. W nagłówku strony stały „CSV" i ikona eksportu JSON obok „+ Nowy szablon" (mylące: `/plans/new` tworzy plan klienta).
**Problem**: Brak wspólnego prymitywu nagłówka karty; etykiety IT/programistyczne na głównym CTA; słowo „szablon" nie istnieje w języku trenera.
**Zasada**:
1. Nagłówek karty tylko przez propsy `Card` (`eyebrow`/`title`/`icon`/`iconTone`/`headerAction`) — nigdy ręczny `mb-4` + różne marginesy.
2. Narzędzia administracyjne (kopia danych) → Ustawienia, nie obok primary CTA. Copy: „Pobierz plik dla Excela (.csv)", nie „CSV" / „Eksportuj".
3. W UI: „plan" / „biblioteka planów" / „wielokrotnego użytku" — nigdy „szablon". Pole API `isTemplate` zostaje.
4. Eyebrowy i UI wyłącznie po polsku (zakaz `PERSONAL BESTS` itd.).
**Dotyczy**: `ui.tsx` Card, `TrainerDashboard.tsx`, `/settings`, moduł planów, landing.

## Copy marketingowe: język trenera, nie kalki i metafory

**Kontekst**: Landing i AuthScreen dostały teksty typu „Plan jak w notatniku", „Ułóż raz, przypisuj kolejnym", „tapnięciem", „dogrywa", „plateau", „leci do studia".
**Problem**: Metafora porównuje produkt do darmowego narzędzia; slogany-składanki bez orzeczenia brzmią sztucznie; kalki z angielskiego nie są językiem trenera.
**Zasada**:
1. Każde zdanie nazywa korzyść dla trenera/podopiecznego (mniej roboty przy planach, klient zaczyna bez appki, widzisz postępy, zastój wcześnie, rekordy, dane do zabrania) — nigdy mechanikę („jak w notatniku").
2. Zakaz kalek: „tapnięcie/tapnij", „churn", „adherence", „plateau", „digest", „studio" (jako metafora panelu), „loguj" w copy domenowym.
3. Słownictwo z rynku PT: układasz plan, przypisujesz klientom, podopieczny, postępy, koniec z Excelem — wzorce TrueCoach/Hevy Coach/Fitebo.
4. Unikaj sloganów bez orzeczenia („Ułóż raz, przypisuj kolejnym") — mów pełnym, prostym zdaniem.
**Dotyczy**: `apps/web/components/landing/*`, `AuthScreen.tsx`, metadata / OG.

## Landing: grotesk, nie szeryf; krótkie zdania, nie kursywa

**Kontekst**: Landing używał Fraunces (szeryf, cienkie kreski, italic „każdy") i długich zdań w hero — użytkownik uznał to za nieczytelne i „gówniane".
**Problem**: Wysokokontrastowy szeryf na `#0C0D0C` w dużym stopniu traci nogi liter; kursywa jako ozdoba obniża skanowanie w 5 s; długie zdania konkurują z minimalizmem Feji/Apple.
**Zasada**:
1. Display landingu/auth = Archivo 700 sentence case (`.display-landing` / `.display-landing-xl`). Zakaz Fraunces, Instrument Serif i każdej kursywy jako środka wyrazu.
2. Hierarchia z wagi, rozmiaru i powietrza — nie z kroju ani koloru. Lime tylko na 1 CTA w widoku.
3. Copy: H1 maks. 5 słów w 2 liniach; lead maks. 2 krótkie zdania; opis punktu 1 zdanie ≤8 słów. Pełne zdania z orzeczeniem, bez żargonu.
4. Maks. 3 kroje w całej aplikacji: Archivo, Space Grotesk, IBM Plex Mono.
**Dotyczy**: `apps/web/components/landing/*`, `AuthScreen.tsx`, `globals.css`, `layout.tsx`, skill `design-system`.

## Timer przerwy na iOS: keep-alive audio, nie sam WebAudio / wakeLock

**Kontekst**: Portalu klienta miał rest timer + alarm WebAudio + `navigator.wakeLock`. Na iPhonie po zgaszeniu ekranu alarm nie grał punktualnie, a Lock Screen nic nie pokazywał (Styrka ma Live Activity).
**Problem**: Safari zawiesza `AudioContext` w tle; `setInterval` jest throttlowany; `wakeLock` nie istnieje w Safari iOS. Media Session bez aktywnego elementu `<audio>` też nie działa.
**Zasada**: Na iOS PWA utrzymuj sesję dźwiękową cichym zapętlonym `<audio>` (`restKeepAlive` + `/silence.wav`) **tylko gdy klient włączy** „Przerwa na ekranie blokady” — to pauzuje muzykę i system jej nie wznawia. Domyślnie OFF. Beepy końca przerwy: `navigator.audioSession.type = "ambient"` (Safari 16.4+), żeby miksować się z muzyką. `unlockAudio()` tylko w geście `startRest`, nie przy każdym ✓. Koniec przerwy = `setTimeout` na `endsAt`. `wakeLock` zostaje jako bonus na Android/desktop.
**Dotyczy**: `lib/restKeepAlive.ts`, `useRestTimer.ts`, `restAlarm.ts`, `portalPrefs.ts`, profil portalu, `public/silence.wav`.

## Media Session: `playbackRate: 0` + update tylko przy zmianie sekundy

**Kontekst**: Na zminimalizowanym iPhonie odliczanie przerwy skakało (np. `0:01` → właściwy czas) w kółko.
**Problem**: `setPositionState({ playbackRate: 1 })` kazało iOS samemu przesuwać scrubber, a my co sekundę nadpisywaliśmy metadata/position — UI walczyło ze sobą i flashowało.
**Zasada**: Countdown w `title`; `playbackRate: 0`; `setPositionState` + metadata tylko gdy zmieniła się sekunda / kontekst. True Live Activity / home-screen widget wymaga natywnej apki — w PWA zostaje Now Playing.
**Dotyczy**: `lib/restKeepAlive.ts`.

## Dock sesji: nie czyść `activeCell` na pointerdown w doku

**Kontekst**: Przyciski +2,5 / Talerze „zamykały się” zamiast działać.
**Problem**: Globalny `pointerdown` blur+`setActiveCell(null)` odpalał się przed `click` na DockBtn — `platesOpen && activeCell` było już fałszywe.
**Zasada**: Elementy doku / sheetów oznaczaj `data-session-dock` / `data-session-plates` i wyłączaj je z clear. `onPointerDown.preventDefault` na przyciskach doku chroni fokus inputu (lepiej niż samo `mousedown` na iOS).
**Dotyczy**: `SessionLogger.tsx`, `SessionDock.tsx`, `PlateCalculator.tsx`.

## Dock +2,5: sync `SetValueInput` przy zewnętrznej zmianie wartości

**Kontekst**: +2,5 / Talerze często „nie działały” przy otwartej klawiaturze.
**Problem**: `SetValueInput` przy fokusie ignorował nowy `value` z props; dock aktualizował draft, ale `raw` zostawał stary, a `onBlur` nadpisywał commit starą liczbą. Na iOS sam `click` bywał gubiony po blurze.
**Zasada**: Trzymaj `lastCommitted` i przy fokusie synchronizuj `raw` tylko gdy props zmienił się z zewnątrz (≠ lastCommitted). Akcję DockBtn odpalaj na `pointerdown` (click tylko dla klawiatury, `detail === 0`).
**Dotyczy**: `SetValueInput.tsx`, `SessionDock.tsx`.

## Bodyweight = `equipment`, nie `category`

**Kontekst**: Spec odhaczył „BW zamiast 0 kg" jako wdrożone; `formatPrev` sprawdzał `category === "bodyweight"`.
**Problem**: `Exercise.Category` to tylko grupy mięśniowe (`chest`, `back`…); masa ciała żyje w `equipment: ["bodyweight"]`. Warunek był zawsze fałszywy — martwy kod. DTO sesji nie zwracało `equipment`.
**Zasada**: Przed odhaczeniem „mamy" zweryfikuj ścieżkę danych end-to-end. Bodyweight rozpoznawaj przez `equipment.includes("bodyweight")`. Rzutowanie sesji (`Stats.LoadDto`) musi zawierać `equipment`.
**Dotyczy**: `Stats.cs`, `SessionLogger.tsx`, `LoggedExercise` w `api.ts`, seed ćwiczeń.

## Objętość sesji = tylko serie z checkmarkiem

**Kontekst**: Podsumowanie treningu pokazywało 3060 kg przy 0/6 ukończonych serii.
**Problem**: `TotalVolumeKg` / `Stats.VolumeKg` sumowały wszystkie serie z kg×reps, w tym prefill z planu bez `Completed`.
**Zasada**: Tonaż (session summary, listy, max volume) liczy wyłącznie `!IsWarmup && Completed && WeightKg && Reps`. Prefill bez checkmarka = 0 kg. Trendy / muscle volume już tak robiły.
**Dotyczy**: `Stats.VolumeKg`, agregaty `TotalVolumeKg` w `Program.cs`.

## Nullable endpoint: `Results.Json(null)`, nie `Results.Ok(null)`

**Kontekst**: Portal `/progress` wołał `most-improved`; przy braku danych UI pokazywało „Unexpected end of JSON input".
**Problem**: W Minimal API `Results.Ok(null)` zwraca 200 z pustym body. `response.json()` wtedy się wywala.
**Zasada**: Endpointy mogące zwrócić „brak": `Results.Content("null", "application/json")` — zarówno `Ok(null)`, jak i `Json(null)` dają puste body. W `request()` traktuj puste body jako `null`. Testuj ścieżkę bez danych.
**Dotyczy**: `Program.cs` (`most-improved`), `apps/web/lib/api.ts` (`request`).

## Ikony PWA: lokalny font, nie CDN

**Kontekst**: Phosphor był ładowany z `unpkg.com` w `layout.tsx`; service worker cache'uje tylko same-origin.
**Problem**: Offline w hali = brak wszystkich ikon w loggerze — „mamy ikony" w UI, ale ścieżka danych (CDN → SW) była martwa poza siecią. Ten sam wzorzec błędu co fałszywe „BW".
**Zasada**: Assety krytyczne dla offline (ikony, silence.wav, splash) trzymaj pod `public/` i dopisz do precache + `isStaticAsset` w `sw.js`. Przed odhaczeniem „działa offline" zweryfikuj ścieżkę bez sieci, nie obecność stringa w HTML.
**Dotyczy**: `apps/web/public/fonts/phosphor/`, `apps/web/public/sw.js`, `apps/web/app/layout.tsx`.

## Wykres liniowy: nie rozciągaj SVG; wartość poza osią dat

**Kontekst**: Karty „Tonaż / Częstotliwość" wyglądały „rozjechane": kropki owalne, `3060 kg` wciśnięte między daty na dole.
**Problem**: `preserveAspectRatio="none"` rozciąga stroke i circle wraz z kontenerem. Footer `justify-between` z trzema slotami (data · wartość · data) centruje KPI w osi X.
**Zasada**: Wykres: `meet` + stały aspect ratio. KPI (ostatnia wartość) nad SVG; pod spodem tylko pierwsza/ostatnia data. Pod linią dozwolony miękki mono gradient fill (`--fg` → transparent) — to data viz, nie chrome.
**Dotyczy**: `components/charts/LineChart.tsx`, podobne sparklines.

## PWA install: nie binarnie iOS / nie-iOS

**Kontekst**: `PwaInstallPrompt` pokazywał instrukcję Safari albo czekał na `beforeinstallprompt`. Klienci z Messengera / Chrome iOS nie widzieli sensownych kroków.
**Problem**: Na iOS od 16.4 Chrome/Firefox też instalują (Share w pasku adresu). In-app WebView (Messenger) nie ma A2HS ani BIP — prompt znikał (`null`).
**Zasada**: Model `InstallEnv` (platforma + przeglądarka + inApp + capability). In-app → escape + kopiuj link (nie udawaj instalacji). Instrukcje per przeglądarka. In-app pomija peak-end (ostrzeżenie od razu).
**Dotyczy**: `lib/installEnv.ts`, `PwaInstallPrompt.tsx`, `InstallGuideSheet.tsx`.

## PR nigdy nie maluj na czerwono; notatka serii musi być widoczna

**Kontekst**: W `SessionReview` wynik PR (`42,5×8`) świecił na czerwono z ▾, bo był „poniżej celu" z planu (mniej powtórzeń). Notatki klienta do serii (`LoggedSet.Note`) w ogóle nie były renderowane.
**Problem**: Sygnał „poniżej planu" kolidował z sygnałem sukcesu (PR). Trener widział badge PR i jednocześnie czerwony wynik — sprzeczność. Komentarz do serii ginął mimo że był w DTO.
**Zasada**: Hierarchia statusu wyniku: PR > poniżej celu > zwykły. Rekord osobisty zawsze `text-foreground` + badge `pr`, nigdy `text-danger`. Notatki klienta (`set.note`, `exercise.note`) pokazuj w review pod wierszem / pod kartą z etykietą.
**Dotyczy**: `SessionReview.tsx`, przyszłe widoki porównania plan vs wykonanie.

## Cold start: Always On + liveness bez DB; nie cron GitHub

**Kontekst**: Długi cold start na Azure B1; keep-alive z `keepalive.yml` (cron `*/5`) + UI pokazywał „port 5210".
**Problem**: Cron GitHub Actions jest best-effort (opóźnienia, dropy, auto-disable po 60 dniach w public repo). Ping do `/api/health` z `CanConnectAsync` trzymałby Neon aktywny 24/7 i kasował scale-to-zero. `Always On` pinguje `/`, którego nie było. `Migrate()`+`Seed` na starcie blokowały gotowość HTTP. Fallback `localhost:5210` i dopisek w dashboardzie wyciekały do produkcji.
**Zasada**: (1) Azure Always On + ARR Off + HTTP/2. (2) Liveness `/` i `/api/health/live` **bez** bazy — tylko to w Azure Health check / `WEBSITE_WARMUP_PATH`. (3) `/api/health` z DB tylko do smoke po deployu. (4) Migracje Postgres w CI; `Database:MigrateOnStartup=false`. (5) `EnableRetryOnFailure` na Npgsql. (6) UI: centralne `ApiError` w `api.ts`, zero portów/env w komunikatach, brak fallbacku localhost w prod (poza `SKIP_ENV_VALIDATION` w CI).
**Dotyczy**: `docs/deploy.md`, `Program.cs`, `WarmupService.cs`, `apps/web/lib/api.ts`, Azure App Settings, Neon.

## Auth token: brama gotowości, nie sam `useEffect` w rodzicu

**Kontekst**: Po wylogowaniu/zalogowaniu Panel pokazywał „Sesja wygasła. Zaloguj się ponownie." bez przycisku; liczby w sidebarze pojawiały się dopiero po wejściu w Klienci.
**Problem**: `AuthTokenBridge` rejestrował getter tokenu w `useEffect` rodzica, a efekty dzieci (`TrainerDashboard`, `AppShell`) biegną **wcześniej** — pierwsze `api.dashboard()` / `api.counts()` szły bez `Authorization` → 401. Counts były połykane przez `.catch(() => {})`.
**Zasada**: (1) Promise-brama `authReady` + `markAuthReady()` po `isLoaded`; `buildHeaders` czeka (z timeoutem) przed requestami trenera. (2) Jednorazowy retry 401 z `getToken({ skipCache: true })`. (3) Baner 401 zawsze z CTA „Zaloguj się ponownie". (4) Liczniki nawigacji w cache (`navCounts.ts`), nie w lokalnym stanie montażu.
**Dotyczy**: `apps/web/lib/api.ts`, `ClerkAppProvider.tsx`, `ErrorBanner`, `lib/navCounts.ts`, `AppShell.tsx`.

## `useSyncExternalStore`: getSnapshot musi zwracać stabilną referencję

**Kontekst**: Produkcja padała na `app/error.tsx` („Coś poszło nie tak"), w konsoli minified React error #185 (Maximum update depth exceeded).
**Problem**: `getNavShell` (snapshot dla `AppShell`) czytał `sessionStorage` i budował **nowy obiekt** przy każdym wywołaniu. React porównuje snapshoty przez `Object.is`, więc każdy render wyglądał jak zmiana store'a → nieskończona pętla renderów. Pętla startowała dopiero po pierwszym udanym `refreshNavCounts()` (wcześniej storage był pusty i zwracany był stabilny `memory`), więc lokalnie łatwo to przeoczyć. Ten sam błąd był w `readInstallEnv` (`detectInstallEnv` też zwraca świeży obiekt).
**Zasada**: Snapshot zwracający obiekt musi mieć cache: porównaj pola z poprzednią wartością i zwróć **starą referencję**, gdy nic się nie zmieniło. Prymitywy (`boolean`, `string`) są bezpieczne. Przy review nowego `useSyncExternalStore` zawsze sprawdź, czy getSnapshot nie tworzy obiektu/tablicy.
**Dotyczy**: `lib/navCounts.ts`, `lib/pwa.ts`, każdy nowy store oparty o `useSyncExternalStore`.

## Nie chowaj wyniku: zero auto-zwijania w loggerze, licznik to nie wynik

**Kontekst**: Podsumowanie sesji pokazywało per ćwiczenie tylko `0/3`, a logger zwijał ćwiczenie zaraz po odhaczeniu ostatniej serii — do wiersza `nazwa + 3/3`. Klient robił PR i go nie widział.
**Problem**: (1) Licznik to etykieta, nie wynik — koniec sesji (peak-end) bez dowodu pracy. (2) Flaga `isPr` wraca **z serwera** po `persist()`, a zwinięcie leciało natychmiast w `queueMicrotask` — rekord lądował w zwiniętej sekcji i zostawał tylko znikający toast. (3) Auto-zwijanie to wzorzec z aplikacji hobbystycznych: Gravitus, Hevy i Strong trzymają wszystkie serie widoczne przez cały trening (w Hevy zwijanie to od lat niezrealizowana prośba użytkowników).
**Zasada**: Serie zostają widoczne — brak auto-zwijania i brak wygaszania (`opacity`) ukończonego ćwiczenia; stan „zrobione” niosą checki przy seriach. Każdy skrócony widok (podsumowanie, historia) pokazuje wynik (`45×10 · 45×10 · 50×8`), nie sam licznik; `done/total` tylko gdy coś jest nieukończone. Przed wdrożeniem wzorca „z innych apek” sprawdź, czy benchmarki (Gravitus / Hevy / Strong / Styrka) faktycznie go mają.
**Dotyczy**: `SessionSummaryView.tsx`, `SessionLogger.tsx`, każde przyszłe „collapse po ukończeniu”.

## Celebracja PR: mono card + glif, nie złota wylewka; zero żargonu „est.”

**Kontekst**: Baner PR (flash w loggerze i sekcja w podsumowaniu) był złotym boxem (`bg-pr-dim` + `border-pr-border`) z copy `est. 61,5 (poprz. 60)` i angielskim „Personal best”.
**Problem**: (1) Data accent użyty jako fill całej karty łamie mono v2 („kolor tylko na danych”, nie na chrome) i wygląda tanio. (2) Skrót „est.” to żargon — klient nie wie, że to szacowany max. (3) Angielski string w UI. (4) Jeden sklejony string zamiast hierarchii (etykieta / nazwa / liczba / delta).
**Zasada**: Celebracja = spokojna powierzchnia (`bg-surface`/`bg-surface-raised` + hairline), złoto wyłącznie na glifie ★ i etykiecie caps, delta jako `▲ +x` w `text-gain`. Liczby zawsze z polskim kontekstem („Szacowany max 61,5 kg · poprzednio 60 kg”) — nie skróty. Struktura: etykieta → nazwa → duża liczba → subline.
**Dotyczy**: `SessionLogger.tsx` (prCelebrate), `SessionSummaryView.tsx`, karta share, każdy przyszły baner PR/celebracji.

## Końcowe CTA na mobile: sticky bar, nie stos przycisków pod foldem

**Kontekst**: Podsumowanie sesji miało „Gotowe / Udostępnij / Popraw wyniki” na samym dole, pod długą listą ćwiczeń. Użytkownik nie wiedział, że trzeba scrollować, a „Gotowe” nie mówiło, co robi.
**Problem**: (1) Kluczowe akcje poniżej foldu = niewidoczne (brak affordance do scrolla). (2) Etykieta „Gotowe/OK/Zapisz” nie nazywa rezultatu (transactional copy — gotcha z `senior-ux-cro`). (3) Trzy CTA w jednym stosie łamią zasadę jednej dominanty.
**Zasada**: Na ekranach zamykających flow (podsumowanie, finisz) główne CTA żyje w sticky barze (`.session-chrome`, `fixed bottom-0`, safe-area) — zawsze w thumb zone; treść dostaje `pb` i przewija się pod chrome. Etykieta nazywa rezultat/cel („Wróć do ekranu głównego”), nie stan („Gotowe”). Akcje korekcyjne (edytuj/popraw) idą do kontekstu danych, których dotyczą, nie do stosu CTA.
**Dotyczy**: `SessionSummaryView.tsx`, każdy przyszły ekran końcowy / confirm z listą powyżej CTA.

## Copy w UI: język użytkownika, zero nazw technicznych i tłumaczenia się z konfiguracji

**Kontekst**: Profil portalu miał dopisek „Przerwa na blokadzie pojawia się w Now Playing przeglądarki" oraz hint „Push wymaga konfiguracji. Przypomnienia e-mail ustawia trener" przy wyłączonym na stałe switchu.
**Problem**: (1) „Now Playing", „VAPID", „push wymaga konfiguracji" to nazwy komponentów/wewnętrznego stanu systemu — klient ich nie zna i nie musi znać. (2) Permanentnie wyłączona kontrolka z technicznym usprawiedliwieniem to szum: użytkownik nie może nic z nią zrobić (łamie test odejmowania i zasadę autonomii). (3) Objaśnienie działającego poprawnie ficzera („pojawia się w…") to dokumentacja, nie UI.
**Zasada**: Copy pisze się słowami użytkownika: co ma zrobić albo co zyskuje — nigdy jak system działa w środku. Nazwy techniczne (Now Playing, service worker, push/VAPID, cache) nie występują w UI. Ficzer niedostępny przez brak konfiguracji = ukryj kontrolkę, zamiast pokazywać disabled + wymówkę. Hint zostaje tylko, gdy jest akcjonowalny („Najpierw dodaj apkę do ekranu głównego…").
**Dotyczy**: `portal/[token]/profile`, wszystkie hinty/dopiski w portalu i panelu, przyszłe stany „wymaga konfiguracji".

## Wybór encji: picker z wyszukiwaniem, nigdy natywny `<select>`

**Kontekst**: Kalkulator %1RM w portalu miał natywny `<select>` z listą ćwiczeń — na iOS renderuje się jako systemowy dropdown (niebieski highlight, obcy krój), bez możliwości wpisania frazy.
**Problem**: (1) Natywny `<select>` nie przyjmuje tokenów mono v2 — łamie spójność wizualną. (2) Przy kilkunastu pozycjach jedyną nawigacją jest scroll (wysoki koszt interakcji). (3) W repo istniał już wzorzec typeahead (`ExerciseCombobox`) — powielanie „szybkiego selecta” to dryf, nie prostota.
**Zasada**: Każdy wybór z listy encji (ćwiczenie, dzień planu, klient) idzie przez `SearchPicker` (`components/SearchPicker.tsx`) albo `ExerciseCombobox` — trigger jak pole, po otwarciu input z filtrowaniem (`foldDiacritics`), klawiatura ↑ ↓ Enter Esc, wiersze ≥ 44px. Natywny `<select>` dopuszczalny tylko dla krótkich, stałych enumów — a i tam preferuj `SegmentedControl`/`Pill`.
**Dotyczy**: `components/SearchPicker.tsx`, `portal/[token]/calculator`, `clients/[id]` (dialog „Wpisz trening za klienta”), każdy przyszły wybór z listy.

## Toasty/overlaye fixed: nigdy nad dockiem sesji, zawsze pointer-events-none

**Kontekst**: Baner celebracji PR („★ Rekord osobisty") był `fixed bottom-28 z-[55]` — pojawiał się dokładnie w momencie startu auto-przerwy i przez ~3 s zasłaniał timer przerwy oraz przyciski −15/+15/Pomiń w docku (`z-50`), a przy otwartej klawiaturze dock podjeżdżał pod baner jeszcze mocniej.
**Problem**: (1) Dolna krawędź ekranu w sesji jest zajęta przez dock (timer przerwy, count-up „od serii", stepper wartości) — każdy dodatkowy fixed element na dole koliduje z nim czasowo lub przestrzennie. (2) Toast bez `pointer-events-none` blokuje kliknięcia w to, co zasłania.
**Zasada**: Nienaruszalna strefa dolna w sesji należy do `SessionDock` + klawiatury. Pasywne toasty/celebracje (bez przycisków) idą na górę, pod sticky nagłówek (`top-[calc(max(0.5rem,env(safe-area-inset-top))_+_5.25rem)]`), zawsze z `pointer-events-none`. Elementy interaktywne na dole mogą żyć wyłącznie wewnątrz docka.
**Dotyczy**: `SessionLogger.tsx` (prCelebrate), każdy przyszły toast/banner w widoku sesji.

## Copy: jasność przed zwięzłością, zero kalek

**Kontekst**: Landing i panel miały telegraficzne hasła i kalki z angielskiego: „Link bez konta. Fakty po treningu. Widzisz, kto milczy.", „Wymaga Ciebie", „Gotowy na trening?".
**Problem**: Trener nie mówi tak. „Wymaga Ciebie" to *Requires you*. Urywane hasła bez czasownika brzmią jak tłumaczenie, nie jak produkt. Design system kazał „strać słowo" — to psuło naturalny polski.
**Zasada**: Jasność > zwięzłość. Pełne zdania albo dosłowna etykieta. Test na głos. Zakaz kalek, telegrafu i wstydu („kto milczy", „zalegasz"). CTA = czasownik + obiekt, nie slogan. Skill `ux-writing`.
**Dotyczy**: `components/landing/*`, `TrainerDashboard.tsx`, portal Progres, `RepMaxer Design System/readme.md`, każdy nowy tekst UI.

## Copy: zero żargonu z briefu

**Kontekst**: FAQ: „Dla siłowego 1:1, który wysyła plan na telefon. Nie dla studia z recepcją i nie dla coachingu dietetycznego."
**Problem**: To skrót z researchu (ICP), nie zdanie dla trenera. „Siłowy 1:1” nic nie znaczy bez slajdu. To samo: „tożsamość w sklepie z aplikacjami", „Wychwytujemy".
**Zasada**: W UI mów kim jest człowiek i co robi. Zakaz skrótów ICP / 1:1 / studio z recepcją. Nigdy *my* o produkcie. Skill `ux-writing`.
**Dotyczy**: `components/landing/Faq.tsx`, `PanelMock.tsx`, każdy tekst „dla kogo".

## Import historii: język trenera, nie OCR

**Kontekst**: Krok przeglądu importu mówił „odczyt”, „BW”, „zmapowane”, „01/02/03”, „Karta / odczyt”, ISO daty i surowy string serii.
**Problem**: To żargon apki / OCR. Trener nie musi znać odczytu ani BW na tym ekranie — ma sprawdzić, czy trening ze zdjęcia się zgadza.
**Zasada**: Etykieta nazywa rzecz tak, jak trener mówi do kolegi. Hierarchia: trening → ćwiczenie → serie (`t-num`, masa ciała nie BW). Combobox za „Zmień”; nazwa ze zdjęcia tylko gdy inna. Checksum tylko przy rozjechaniu. Jeden CTA. SQLite `EnsureCreated` nie migruje istniejącego `trainer.db` — nowa tabela wymaga usunięcia pliku; dashboard nie może padać na brak tabeli.
**Dotyczy**: `HistoryImportReview.tsx`, `clients/[id]/import`, `HistoryImport.cs`, dashboard

## WebAudio i keep-alive kradną sesję audio (muzyka na słuchawkach)

**Kontekst**: Klient ze Spotify/Apple Music na słuchawkach odhaczał serię — muzyka milkła i nie wracała.
**Problem**: `unlockAudio()` przy każdym ✓ wznawiał `AudioContext` (iOS traktuje to jako playback). Keep-alive `silence.wav` + Media Session (domyślnie ON) przejmował sesję i po `stop()` system nie wznawiał poprzedniego odtwarzacza.
**Zasada**: Beepy = `navigator.audioSession.type = "ambient"` (feature-detect). `unlockAudio()` tylko w geście startu przerwy. Keep-alive Lock Screen = opt-in, z jawnym hintem że pauzuje muzykę; przy starcie `playback`, po stopie z powrotem `ambient`.
**Dotyczy**: `restAlarm.ts`, `restKeepAlive.ts`, `SessionLogger.tsx`, `portalPrefs.ts`, profil portalu.

## PR e1RM: jeden na ćwiczenie w sesji, nie każda rampa

**Kontekst**: Klient w jednym ćwiczeniu robił 10–20–30–40–50 kg. Podsumowanie sesji sypało pięcioma rekordami.
**Problem**: `FindPrSets` oznaczał PR przy każdym skoku e1RM w ramach sesji (best aktualizowany po każdej serii).
**Zasada**: Maks. jeden PR na ćwiczenie w sesji — seria z najwyższym e1RM, o ile bije best **sprzed** sesji. `previousBest1Rm` = historia, nie wcześniejsza seria rampy. Ta sama semantyka w dashboardzie, liście sesji portalu i `CountRecentPrsAsync` (`PeakPerSessionExercise` + `ScanPeakPrs`).
**Dotyczy**: `Stats.cs`, `Program.cs` (dashboard + portal sessions), `ProgressReports.cs`, `EpleyPrTests.cs`.

## Palety: realna chroma, nie 2% hue-shift na near-black

**Kontekst**: Pierwsza wersja palet portalu (Las/Spokój/Morze/Pink Pony) prawie nie różniła się od Grafitu — Pony miał być cukierkowy.
**Problem**: Nadpisanie `--bg` z `#0b0c0d` na `#0e0b0c` jest niewidoczne. Klient nie rozpoznaje motywu w 1 s.
**Zasada**: Paleta musi być od razu czytelna: powierzchnie i krawędzie z wyraźnym hue, swatch = kolor tożsamości (Pony `#ff4d94`, nie dusty rose). Nazwa nazywa kolor (Mech, Piasek, Ocean), nie nastrój („Spokój”). `--pr`/`--gain`/`--loss` zostają. Nie udawaj chromatyczności 2-procentowym shiftem.
**Dotyczy**: `globals.css` `[data-palette]`, `lib/theme.ts` `PALETTES`, profil portalu.

## Mock urządzenia: proporcje urządzenia, treść wypełnia ekran

**Kontekst**: Miniatura sesji na landingu była zaokrągloną kartą o wysokości czterech wierszy serii — wyglądała jak kwadrat, nie jak telefon.
**Problem**: Ramka bez `aspect-ratio` kurczy się do treści. Pusty placeholder na dole nie udaje ekranu.
**Zasada**: Mock telefonu ma stałe proporcje (`aspect-[9/19]`), treść w kolumnie flex, dock i home indicator dociśnięte do dołu. Zapowiedź następnego ćwiczenia wypełnia resztę, jak w prawdziwym loggerze.
**Dotyczy**: `PhoneMock.tsx`, mockupy urządzeń na landingu

## Dane przykładowe muszą być spójne domenowo

**Kontekst**: Wiersz Olí Wiśniewskiej w sekcji panelu miał „Martwy ciąg” i wynikiem „nie trenowała od 5 dni”.
**Problem**: Status (kto nie trenował) dostał kolumnę ćwiczenia i wyniku — bezsensowny rekord.
**Zasada**: Wiersz albo pokazuje trening (ćwiczenie + kg × powt. + PR/przyrost), albo status bez treningu (podtytuł + marker dni) — nigdy obu naraz.
**Dotyczy**: `TrainerPreview.tsx`, feedy i mocki z danymi przykładowymi

## Stopka nie konkuruje z finalnym CTA

**Kontekst**: Gigantyczny wordmark REPMAXER w stopce wizualnie zjadał „Zacznij z pierwszym klientem”, a dwie kolumny linków (Gotowce, Checklista, Załóż konto) dublowały CTA.
**Problem**: Finał strony oceniany jest po ostatnim bloku (peak-end). Stopka nie może być głośniejsza niż CTA.
**Zasada**: Stopka = jeden rząd (mały wordmark, niezbędne linki, copyright). Rejestracja zostaje w hero / cenniku / finale. Wordmark na pełną szerokość nie stoi tuż pod H2 CTA.
**Dotyczy**: `LandingFooter.tsx`, `FinalCta.tsx`

## Landing: rytm, linie i tekstura muszą mieć jedno źródło

**Kontekst**: Audyt landingu: ściana zapisów 7% fg była niewidoczna; `01 Produkt` miał 80 px paddingu, reszta 160 px; `SectionHead` w lewej kolumnie dawał 5 różnych długości hairline; sticky `42svh` + wewnętrzny pt panelu zostawiał pustą klatkę.
**Problem**: Odstępy i linie wyglądały na przypadkowe. Dekoracyjna tekstura nie czytała się jako zamierzona. Hero wchodził jedną paczką.
**Zasada**: Jeden token `SECTION_SPACE` / `SECTION_SHELL` dla każdej sekcji; hairline `SectionHead` zawsze na pełną szerokość kontenera (wizualna kolumna wchodzi *do* children, nie owija head). Sticky: tor = kompensacja 1:1, oddech po odpięciu = ten sam token. Tekstura dekoracyjna ≥ ~13% fg, światło z miękką maską (nie `clip-path`). Skala typu z jednej drabiny (H1 = finał = max cyfry).
**Dotyczy**: `primitives.tsx`, `LogWall.tsx`, `Hero.tsx`, `PhoneMock.tsx`, `TrainerPreview.tsx`, `globals.css` (`.landing-log-*`)

## Landing: próg siatki 2-kolumnowej = szerokość realnej kolumny treści

**Kontekst**: Siatki Produkt / Panel / Cennik / Ile tracisz włączały się na `md:` (768 px). Po gutterze `SectionHead` (152 px) i sztywnej kolumnie (telefon / tabela 380 px) zostawało ~76–197 px na lead i H2.
**Problem**: Na tablecie H2 miał 5 linii, lead jedno słowo na linię. Na 360 px nav z „Cennik” + CTA dawał `scrollWidth > clientWidth`; H1 min 3 rem łamał „Widzisz trening.”. Na 1280–1920 bookend finału w kolumnie 984 px przy 8.5 rem składał się do 3 linii.
**Zasada**: Split 2-kolumnowy i sticky/scrub dopiero od `lg:` (1024 px), gdy kolumna treści ma ≥ ~332 px. Gutter indeksu (`md:grid-cols-[120px_…]`) zostaje na `md:`. Nav < `sm:` = wordmark + logowanie + CTA (sekcje są pod scrollem). H1 min 2.75 rem. Finał może zejść z max H1 (7 rem od `lg:`), żeby zostać na 2 liniach — bookend nie wygrywa z sierotą.
**Dotyczy**: `PhoneMock.tsx`, `TrainerPreview.tsx`, `PricingSection.tsx`, `LossCalculatorSection.tsx`, `LandingNav.tsx`, `primitives.tsx`, `FinalCta.tsx`

## Landing: kreska enumeruje albo zamyka kadr — nie stempluje H2

**Kontekst**: `SectionHead` dawał identyczny `border-t` nad 01–06. Między closerem hero a `01` była kanapka (linia → pustka → linia). `SECTION_SPACE` (`10vw` vs min `6rem`) był płaski do 959 px. FAQ miał trzecią linię.
**Problem**: Sześć stempli czytało się jak faktura. 01→02 (ta sama historia) i 02→03 (nowy rozdział) miały ten sam oddech. Telefon i tablet dostawały 96 px.
**Zasada**: Hairline = dane (wiersze listy/FAQ/kalkulator) albo chrome (nav po scrollu, closer hero, stopka). Indeks + skok H2 zaczynają rozdział — bez `border-t` na `SectionHead`. Dwa tokeny: `SECTION_SPACE` (`clamp(5rem, 4rem+8vw, 12rem)`) na nowy rozdział, `SECTION_SPACE_TIGHT` na parę (01→02, 03→04). Fallback: jedna linia między trzema grupami, nie powrót do 6 stempli. Sticky `32svh` zostaje 1:1.
**Dotyczy**: `primitives.tsx`, `SectionHead`, `Faq.tsx`, `TrainerPreview.tsx`, `LossCalculatorSection.tsx`

## Landing: sticky nie tnie H2; latarka wychodzi poza 1200

**Kontekst**: Ultrawide — H2 „Widzisz każdy zakończony trening” ucięty od góry; dół telefonu nad tytułem. Panel: H2 nad siatką, lista 380 px z `items-center`. LogWall w `max-w-[1200px]`, wiązka 200 px, ghost 13%.
**Problem**: `lg:-mt-[32svh]` wjeżdżał pod nieprzezroczystą płytę sticky (`z-10`, `h-[100svh-72px]`). Treść tonęła w 1200. Waga L/P wyglądała na przypadek. `data-cursor-ref` w hydracji to injekcja przeglądarki Cursora — nie łatać `Button`.
**Zasada**: Miara `1360`. Hero full-bleed, LogWall `inset-0` na sekcji. Bez overlap `32svh` — 02 startuje czysto z `SECTION_SPACE`. Split = H2+lead | artefakt, `items-start`. Ghost ~20% fg, wiązka `clamp(280px, 32vw, 560px)`. H2 `leading-[1.12]`.
**Dotyczy**: `Hero.tsx`, `LogWall.tsx`, `PhoneMock.tsx`, `TrainerPreview.tsx`, `LossCalculatorSection.tsx`, `primitives.tsx`, `globals.css` (`.landing-log-*`)

## Latarka / tekstura nie może konkurować z chrome (closer, H1)

**Kontekst**: LogWall full-bleed pod hero. Closer „Dla trenerów personalnych” / „Przewiń” bez tła. Kolumny `max-content` + `justify-between`; warstwa reveal dopisywała `★ `, więc była szersza niż ghost.
**Problem**: Wiązka odsłaniała druk w tych samych pikselach co etykiety — dwa napisy na sobie. Sąsiednie wpisy nachodziły, bo `★` rozpychał tylko jedną warstwę, a `max-content` nie trzymał toru.
**Zasada**: Tekstura dekoracyjna ustępuje chrome. Closer ma `bg-background`. Fade dołu = overlay `::after` / `.landing-log-fade`, **nie** druga maska. Gutter glifu zarezerwowany na obu warstwach. Gdy dwa napisy się zlewają, najpierw sprawdź czy warstwy mają ten sam layout, nie tylko z-index.
**Dotyczy**: `LogWall.tsx`, `Hero.tsx`, `globals.css` (`.landing-log-mask`)

## Latarka RWD: szyny przy krawędziach, dziura = blok H1, nigdy `1fr` + `overflow-hidden`

**Kontekst**: MacBook 14 (~1512 CSS px) — ściana niewidoczna. Ultrawide — wpisy „ucięte” w połowie słowa.
**Problem**: Siatka 4×`1fr` od `lg:` wkładała wewnętrzne kolumny w dziurę maski (wyglądało jak ucięcie). `overflow-hidden` + `nowrap` ucinał długie frazy w wąskiej `1fr`. Dziura `ellipse 48% 44%` zjadała boki laptopa. `data-hero-copy` na `w-full` mierzyło miarę 1360, nie H1 — dziura była za szeroka. Dwie maski + `-webkit-mask-composite: source-in` na WebKicie potrafią wyzerować całą warstwę (Safari / 14").
**Zasada**: Tekstura = szyny L/P `max-content`, bez `overflow-hidden` na wpisie. 1+1 kolumna do 2199 px; 2+2 dopiero od `min-[2200px]` (H1 ~1000 px + 2×~220 px). Dziura liczona z `w-fit` bloku H1+lead+CTA (`--hole-rx/ry`). Jedna elipsa, fade closeru osobnym overlayem. Ghost ≥ ~46% fg na light, żeby czytać się na 14".
**Dotyczy**: `LogWall.tsx`, `Hero.tsx`, `globals.css` (`.landing-log-*`)

## `overflow-x-hidden` na przodku zabija każdy `position: sticky` w środku

**Kontekst**: Landing — nav „sticky” znikał przy scrollu, a przypięta scena telefonu nigdy nie działała. Po dodaniu toru 190svh objaw eskalował do ~ekranu pustki między 01 a 02, bo ramka nie podążała za scrollem. Wrapper `MarketingShell` miał `overflow-x-hidden`.
**Problem**: `overflow-x: hidden` wymusza computed `overflow-y: auto` (osie nie mogą mieszać hidden+visible) — div staje się scroll containerem i sticky liczy się względem niego, a nie viewportu. Div sam się nie scrolluje, więc sticky nigdy nie odpala. Objawy wyglądały jak „za duży spacing” i były łatane symptomatycznie.
**Zasada**: Poziome clipowanie tylko na `body { overflow-x: hidden }` — z body propaguje się na viewport i nie tworzy scroll containera. Nigdy `overflow-x-hidden` na wrapperach z layoutem, w których żyje sticky. Gdy sticky „nic nie robi”, najpierw przejdź przodków i sprawdź computed `overflow`/`transform`/`contain` (`getComputedStyle`), zamiast łatać spacing.
**Dotyczy**: `MarketingShell.tsx`, `LandingNav.tsx`, `PhoneMock.tsx`, `globals.css`

## `/wdrozenie` to sesja, nie demo — i nie „oddzwonimy”

**Kontekst**: Research 2026-08-14. CTA landingu obiecywał slot; strona prosiła o 0 vs 490 i kończyła się na „Oddzwonimy”. Mail szedł tylko do foundera. 490 zł > 468 zł.
**Problem**: Intent stygnie. Prepaid droższy niż miesięcznie nikt nie weźmie. Cal.com przy 10 miejscach / miesiąc to nowe narzędzie bez zysku.
**Zasada**: Strona = Superhuman 1:1 (agenda, prep, jeden CTA). Mail do trenera w tym samym requeście. Sukces nie kłamie „wysłaliśmy”, gdy Resend no-op. Rok = 390 zł pod formularzem. Cal.com dopiero >15 zgłoszeń / miesiąc, i wtedy link w mailu — nie na stronie. Zakaz: „oddzwonimy” jako jedyny next step.
**Dotyczy**: `wdrozenie/`, `FoundingService.cs`, `EmailService.cs`, `.ai/gtm/wdrozenie-maile.md`, skill `ux-writing`

## Długi import: stan przy CTA, nie tylko zmiana etykiety

**Kontekst**: Wczytanie 10 screenów na produkcji zwracało 503 albo wisiało minutę. Przycisk zmieniał tekst na „Czytam zdjęcia…”, bez spinnera i zegara. ErrorBanner siedział nad siatką zdjęć.
**Problem**: Trener nie wiedział, czy czekać, czy się zacięło. Błąd 503 ginął poza widokiem; POST 503 był mapowany na „Uruchamiamy serwer”.
**Zasada**: Operacja > kilka sekund: spinner + żywy status + czas **przy CTA**. Błąd scrolluj do akcji. `message` z API na 5xx pokazuj as-is; „Uruchamiamy serwer” tylko dla GET (cold start).
**Dotyczy**: import historii (panel + portal), `lib/api.ts` `request()`

---
