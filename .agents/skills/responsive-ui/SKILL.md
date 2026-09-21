---
name: responsive-ui
description: Wytyczne responsywnego, mobile-first UI dla Trainer App (Next.js + Tailwind). Użyj ZAWSZE przy tworzeniu lub zmianie jakiegokolwiek ekranu/komponentu — layoutu, kart, formularzy, tabel, kreatora planów. Chroni przed elementami wychodzącymi poza kontener i ucinaniem kluczowych nazw (plan, ćwiczenie, klient).
---

# Responsywny UI (mobile-first)

Trainer App jest używany na laptopie trenera, ale musi też działać na telefonie/tablecie (podgląd planu na siłowni, szybka edycja z telefonu). Każdy nowy lub zmieniany ekran projektuj **mobile-first**: bazowe klasy Tailwind (bez prefiksu) opisują telefon (~360–400px), a `sm:`/`md:`/`lg:` dodają gęstość na większych ekranach. Nigdy odwrotnie.

## Twarda zasada nr 1: kluczowe nazwy nigdy nie są ucinane

Nazwa **planu**, **ćwiczenia**, **klienta** i **dnia** to informacja, po którą użytkownik wchodzi na ekran — nie może zniknąć.

- Nie używaj `truncate` na nazwach tych encji. Użyj `break-words` (lub `whitespace-normal`), żeby tekst zawijał się do kolejnej linii, a kontener rósł w wysokość.
- `truncate` jest dopuszczalny wyłącznie dla **drugorzędnych metadanych** w wąskim kontenerze (np. podsumowanie serii, notatka, etykieta typu ćwiczenia) — nigdy dla głównej etykiety wiersza/karty.
- Gdy nazwa i akcje (przyciski/ikony) są w tym samym `flex` wierszu: nazwa dostaje `min-w-0 flex-1 break-words`, a akcje `shrink-0`. Jeśli mimo to jest zbyt ciasno (wąska kolumna kreatora, sidebar), przenieś akcje do **drugiego wiersza** pod nazwą, zamiast ucinać tekst.

## Twarda zasada nr 2: nic nie wychodzi poza kontener

- Gęste siatki (np. tabela serii z wieloma kolumnami, `grid-cols-[...]` z wieloma `1fr`) w wąskiej karcie/kolumnie: owiń w `overflow-x-auto` i ustaw `min-w-[Npx]` na wewnętrznej siatce, żeby scrollowała poziomo **wewnątrz swojej karty**, a nie rozpychała stronę.
- Każda `<table>` z realistyczną liczbą kolumn (4+) idzie w wrapper `overflow-x-auto` — bez wyjątków.
- Poziomy scroll na poziomie całej strony (`body`/`main`) to bug, nie feature. Poziomy scroll wewnątrz jednego, wyraźnie ograniczonego widżetu (kanban dni, tabela) jest akceptowalny na desktopie, ale na mobile (patrz zasada nr 3) preferuj układ jednokolumnowy.
- Długie słowa/identyfikatory w wąskich komórkach: `break-words`, nie `nowrap` + `overflow-hidden`.

## Twarda zasada nr 3: kanban/kolumny stackują się na mobile

Wzorce typu „kolumny dnia w kreatorze planów" (stałe `w-80`, poziomy scroll) są nieczytelne na telefonie:

- Kontener: `flex flex-col gap-4 md:flex-row md:overflow-x-auto md:pb-2`.
- Kolumna: `w-full md:w-80 md:shrink-0` (na mobile pełna szerokość, pionowo jedna pod drugą; od `md:` wraca kanban z poziomym scrollem).
- Ta sama reguła dla każdej przyszłej tablicy wielokolumnowej (np. „Progression View" z tygodniami obok siebie).

## Sidebar → drawer

Stały sidebar (`w-56`) zajmuje zbyt dużo miejsca na telefonie:

- Desktop (`md:` i wyżej): sidebar widoczny jak dotychczas (`hidden md:flex`).
- Mobile: górny pasek z logo + przycisk hamburger, otwierający wysuwany drawer (`fixed inset-0` overlay + panel `fixed inset-y-0 left-0`), zamykany kliknięciem tła lub wyborem linku.
- Stan otwarcia drawera to lokalny `useState` w klientowym komponencie shellu — nie w każdej stronie.

## Formularze i siatki pól

- `grid gap-4 sm:grid-cols-2` / `sm:grid-cols-3` / `sm:grid-cols-4` — na mobile zawsze 1 kolumna (bazowe `grid`), dopiero `sm:` dodaje kolumny. Nie zaczynaj od `grid-cols-4` bez mobile fallbacku.
- Pola pełnej szerokości (`textarea`, notatki) dostają `sm:col-span-N` żeby rozciągały się na cały wiersz siatki.
- Nagłówek strony (`PageHeader`) stackuje akcję pod tytułem na mobile: `flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between`.

## Cele dotykowe i dostępność

- Interaktywne elementy (przyciski, `IconButton`, pigułki) ≥ 40×40px na mobile, docelowo 44×44px.
- Kontrast tekstu ≥ 4,5:1 — trzymaj się istniejącej palety `zinc`/`yellow`, nie wprowadzaj przygaszonych odcieni tekstu na ciemnym tle.
- Gdy zamieniasz przycisk tekstowy na ikonę (żeby zaoszczędzić miejsce w wąskiej kolumnie), zawsze dodaj `title`/`aria-label` z pełnym opisem akcji (patrz `IconButton` w `components/ui.tsx`).

## Checklist przed uznaniem UI za gotowe

1. Nazwa planu/ćwiczenia/klienta widoczna w całości przy szerokości ~360px (telefon) — brak `truncate`, brak ucięcia przez `overflow-hidden` bez zawijania.
2. Żaden element nie wychodzi poza swój kontener przy 360px, 768px i 1280px szerokości.
3. Formularze i kanban-y stackują się w jedną kolumnę poniżej `md:`/`sm:`, wracają do wielokolumnowego układu od breakpointu.
4. Tabele/gęste siatki mają `overflow-x-auto` wrapper.
5. Cele dotykowe i kontrast zgodne z sekcją wyżej.
6. Kolory tylko z palety `zinc`/`yellow` + tony `Badge`, prymitywy z `apps/web/components/ui.tsx` (nie duplikuj stylów).

## Powiązane

- Domenowe wytyczne UI/UX kreatora planów i logowania sesji: skill `fitness-ui-ux`.
- Interakcje, materiały, craft (Apple): skill `apple-design`.
- Prymitywy: `apps/web/components/ui.tsx` (`PageHeader`, `Card`, `Button`, `IconButton`, `Field`, `inputClass`, `Badge`, `Pill`).
