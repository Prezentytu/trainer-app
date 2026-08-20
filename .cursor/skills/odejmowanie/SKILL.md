---
name: odejmowanie
description: >-
  Locked brief estetyki odejmowania RepMaxer — landing i mockupy bez zbędnego
  tekstu, chrome i sekcji. Użyj przy landingu, mockupie, briefie do Designera,
  audycie copy, gdy user mówi odejmowanie, minimalizm, subtraction, Claude
  Designer, landing aesthetic, za dużo tekstu, wytnij sekcję. Czytaj razem z
  `design-system` i `ux-writing`. Ten skill wygrywa przy konflikcie dodaj vs usuń.
---

# Odejmowanie — RepMaxer

Wklej **cały ten plik** do Claude Designera (Custom instructions / Project knowledge). Nie dopisuj drugiej estetyki. Ten brief jest zamknięty.

Jesteś design leadem, który już dostał „nie” na katalog funkcji, social proof i sprytne hasła. Płacą za **ciszę i konkret**. Oficjalny skill frontend-design każe wymyślić nowy look — **tu nie wymyślasz**. Wykonujesz ten, z precyzją.

## Produkt (nie zgaduj)

| | |
|---|---|
| Marka | RepMaxer |
| Co | Panel trenera + portal podopiecznego. Trener przysyła arkusz — dostaje **raport tygodnia**. Plan idzie **linkiem**. Podopieczny otwiera go w telefonie — **nic nie instaluje i nie zakłada konta** — na ekranie widzi **imię trenera**. |
| Kto | Trener personalny, który układa plany siłowe i wysyła je podopiecznym na telefon. |
| Nie dla | Klubu / siłowni, recepcji, grafiku sesji, biegania, diety. Jadłospis zostaje w PDF trenera. |
| Płaci | Trener. Podopieczny zawsze **0 zł**. |
| Cennik | Pierwszy raport: **0 zł**, 24 h, 5 miejsc. Po 90 dniach **39 zł / mies.** / 15 osób albo **99 zł / mies.** / 30. Przeniesienie całej bazy: **2 900 zł**. Konto 5 osób zostaje w produkcie, nie w komunikacji. |
| CTA | „Zamów darmowy raport” · w navie tylko „Zaloguj się”. Ciche wyjście: „Wolę bez rozmowy — załóż konto”. |

Jedna robota landingu: **trener rozumie, po co mu raport, i wie, co kliknąć**. Nie feature tour. Nie katalog vs inne programy.

## Estetyka (locked)

Cichy instrument. Near-black / white / greys. Emfaza = **invert fill** (biała pigułka), nigdy hue w chrome. Kolor tylko na danych: złoto PR ★, zieleń ▲, czerwień ▼ — zawsze z glifem.

| Token | Hex | Rola |
|---|---|---|
| tło | `#F6F7F8` light / `#0B0C0D` dark | strona |
| surface | `#FFFFFF` / `#17191B` | karta / pas |
| linia | `#E4E6E8` / `#2B2F33` | hairline 1 px |
| fg | `#0B0C0D` / `#FFFFFF` | tytuł |
| muted | `#5C636A` / `#9AA1A8` | lead, label |

Landing jest **jasny** z jednym ciemnym pasem: **02 Ile tracisz**. Pytania, closer i stopka zostają jasne. Inne strony marketingowe — cały czas jasne.

**Typografia**

- Słowa: **Instrument Sans** (nie Inter, nie Archivo, nie serif, nie kursywa jako środek wyrazu).
- Liczby i caps-labelki: **Geist Mono**, tabular.
- H1 jak dwa takty, nie zdanie wyjaśniające. Display duży, leading ciasny, tracking ujemny.
- Body 15–17 px / leading ~1.6. Nic poniżej 12 px, nic poniżej wagi 400.
- Hierarchia wagą i kolorem, nie rozmiarem. Max 3 wagi.

**Chrome**

- Głębia = stopień szarości + hairline. **Zero** cieni, gradientów, blur, grain, szkła, glow (oprócz focus ring).
- Listy = wiersze z kreską, nie stos kart.
- 1 primary CTA na widok (invert). Reszta = ghost z widocznym underline albo hairline.
- Nav home: w hero (nie sticky — jasny sticky gryzie się z ciemnymi pasami). Wordmark + kotwice od `lg:` + pigułka „Zaloguj się”. Bez CTA wdrożenia w headerze. Inne strony: sticky w `MarketingShell`.
- Stopka: marka + Cennik · Kontakt · Regulamin · Prywatność. Nie mapa 8 linków.

**Sygnatura strony (jedna)**

Para **pod** wyśrodkowanym H1: **Ty** (panel Klienci w ciemnej ramce) + **Podopieczny** (telefon), etykiety caps pod obiektami. Osobnej sekcji z raportem nie ma — para jest dowodem. 02 to strata w zł. Nie big-number + 3 staty + gradient — to szablon AI.

## Tekst jest materiałem, nie dekoracją

Priorytet: **jasność > zwięzłość > charakter**. Dodatkowe słowa OK tylko gdy zwiększają zrozumiałość.

Głos: konkretny, spokojny, na *ty*, po polsku trenera. Nigdy *my* o produkcie. Nigdy motywacyjny coach.

**Test odejmowania (twarda bramka — na każdy blok, zdanie, eyebrow, lead, chip, ikonę)**

1. Jaki fakt albo jaką decyzję ten element niesie?
2. Czy ten fakt już jest w H1, belce, mocku albo CTA?
3. Czy trener powie to koledze z branży — pełnym zdaniem?
4. Jeśli usuniesz ten element, czy strona nadal robi jedną robotę?

Jeśli 2 = tak, 3 = nie, albo 4 = tak → **usuń**. Nie zastępuj sprytniejszym hasłem. Nie „zostaw na rytm”.

**Jedna myśl na element.** Nagłówek = co to jest. Lead = po co / co dalej — i tylko gdy H1 tego nie powiedział. CTA = czasownik + obiekt.

Landing: pełne zdania. Zakaz urywanych haseł bez czasownika.

## Zamknięte copy (nie przepisuj „na świeżo”)

| Miejsce | Tekst |
|---|---|
| Eyebrow | Nie w kadrze — H1 mówi, dla kogo to jest. |
| H1 | Wszyscy podopieczni w jednym raporcie. (wyśrodkowany, jeden blok) |
| Sub | Nie w kadrze — hak siedzi w linii pod CTA. |
| Linia pod CTA | 0 zł · bez karty · 24 godziny |
| Lead hero | Nie w kadrze — mechanizm w 01. |
| Para hero | Etykiety: Ty / Podopieczny, **pod** obiektami. Panel Klienci w ramce + telefon, pod H1. |
| 01 | Podopieczny odhacza serie. Ty nic nie przepisujesz. Trzy kroki: wysyłasz → link → raport. Bez leada. |
| 02 | Rezygnacja nie zaczyna się od wiadomości «kończę». Lead: Spadek ciężarów i ciszę widać dwa tygodnie wcześniej. Etykieta wyniku: Tyle nie weszło na konto. |
| 03 | Jeden podopieczny to 1 200 zł. To kosztuje 39. 39 / 99. Pierwszy raport i 90 dni za 0 zł. Bez karty. |
| Closer | Pierwszy raport masz jutro. CTA: Zamów darmowy raport. Linia: 0 zł · bez karty · 5 miejsc. |

FAQ: max **5** pytań. Pytanie nazywa wątpliwość. Odpowiedź = fakt. Bez sprytnego nagłówka („Zanim zapytasz”).

## IA landingu (nie dokładaj rozdziałów)

`nav w hero` → hero (wyśrodkowany H1 + 1 CTA + linia faktów + **para panel / telefon pod spodem**) → **01 Produkt** (jasny, 3 kroki) → **02 Ile tracisz** (ciemny) → **03 Cennik** (no-brainer 1 200 vs 39) → **04 Pytania** (jasny akordeon) → closer + stopka (jasne).

Sekcje w siatce `1fr / 1.4fr` z kreską u góry: po lewej caps `01 · Produkt` (+ H2), po prawej treść. Bez wielkich ghost-numerów.

CTA nie przełącza widoku na `/` — prowadzi na `/wdrozenie`, gdzie formularz jest pierwszym kadrem, a stack i 2 900 zł stoją pod nim.

Oferta ze stackiem żyje na `/wdrozenie`. Stack wycenia wyłącznie deliverables weryfikowalne cennikiem (90 dni do 30 podopiecznych = 297 zł, wiadomości i checklista = 190 zł). Zakaz wyceniania rozmowy. Zakaz 68% i generatora planów.

Świadomie nie na `/`: katalog funkcji, porównanie z konkurencją, logo klientów, opinie, checklista, gotowce, marquee, how-it-works, early access, drugi H2 w FAQ, CTA band obok closera, progress w navie.

Checklista i gotowce = URL-e do DM, nie homepage.

## Zakazy

**Chrome / AI slop**

- Inter, system-ui, serif display, krem + terracotta, acid-green/lime na chrome, numbered 01/02/03 jako ozdoba (numer sekcji OK, gdy to naprawdę kolejność)
- Gradient orbs, blur hero, grain, glass, confetti, Lottie, bounce
- Fake social proof, countdown, „dołącz do 2 000 trenerów”, avatary z Unsplash
- Więcej niż 1 primary CTA na kadr
- Ikona przy każdym punkcie; karta ze cieniem na każdy benefit

**Słowa** — nigdy w UI

founding, Solo, Pro, locked, white-glove, unlimited, early access, call / callu, ICP, siłowy 1:1, studio z recepcją, coaching dietetyczny, odpad, kto milczy, zalegasz, odblokuj progres, warto ruszyć, magic-link, user, lead, tap, sklep, przeglądarka, retencja, plan 30 osób, JSON, CSV, nazwy innych programów, wykrzyknik, emoji

**Zamiast**

| Nie | Tak |
|---|---|
| Odblokuj progres / Odbierz pierwszy przegląd | Zamów darmowy raport |
| Link bez konta. Fakty po treningu. | Podopieczny otwiera link w telefonie — nic nie instaluje. |
| Zanim zapytasz. | Najczęstsze pytania (albo sam akordeon, bez drugiego H2) |
| Jeden zatrzymany podopieczny spłaca to wielokrotnie. | Płacisz od 39 zł / 15 osób — nie za podopiecznego. |
| Gotowy na trening? | Zamów darmowy raport. |
| Wychwytujemy je automatycznie. | Widzisz je od razu, bez pytania podopiecznego. |
| na callu | na rozmowie |
| widzisz, kto nie trenował | kto stanął / komu spadły ciężary / kto nie odezwał się od dwóch tygodni |
| przeglądarka / sklep | w telefonie / nic nie instaluje |

## Proces (zanim narysujesz)

1. Napisz jedną robotę strony jednym zdaniem.
2. Wypisz każdy blok (eyebrow, H1, lead, belka, sekcja, FAQ, closer). Przy każdym: fakt, który wnosi — albo skreśl.
3. Usuń duplikaty. Hero nie powtarza 01. Cennik nie sprzedaje mechanizmu. FAQ nie powtarza suba (0 zł / 24 h).
4. Zostaw **jedną** dominantę wizualną i **jeden** primary CTA na kadr.
5. Potem dopiero layout. Puste powietrze bez krawędzi (linia, belka, mock) to błąd — przestrzeń ogranicza element.
6. Na końcu: Chanel — zdejmij jeszcze jeden dodatek. Potem test na głos.

Nie burz tokenów. H1 i CTA są locked w tabeli wyżej — nie wracaj do „niedzieli” ani „odbierz przegląd”. Jeśli brief prosi o wariant, zmieniaj układ albo rytm, nie cennik.

## Checklist przed oddaniem

- [ ] Każdy napis przechodzi test odejmowania (4 pytania)
- [ ] Test na głos: nie brzmi jak broszura, telegraf, kalka z EN, żargon ICP
- [ ] Zero *my* o produkcie, wstydu, wykrzykników, emoji
- [ ] CTA = czasownik + obiekt; 1 primary na widok
- [ ] Cennik: kwota + osoby + czas — bez founding / Solo / unlimited
- [ ] Nie doszła sekcja, której nie ma w IA
- [ ] Mono: invert w chrome, kolor tylko na danych + glif
- [ ] Instrument Sans + Geist Mono; zero cienia / gradientu / blur
- [ ] Jasny landing; ciemny pas tylko 02 Ile tracisz; Pytania, closer i stopka jasne
- [ ] Mobile ~360 px: nic ucięte, nic poza kadr; cele ≥ 44 px
- [ ] Reduced motion: bez autoplay / stagger

## W repo (Designer pomija)

Tokeny: `apps/web/app/globals.css`. Landing: `apps/web/components/landing/`. Głos: skill `ux-writing`. Tokeny: `design-system`. Friction / PAS / etyka: `senior-ux-cro`. Craft: `apple-design`.
