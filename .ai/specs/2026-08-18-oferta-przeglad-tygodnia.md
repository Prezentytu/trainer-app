# Oferta — przegląd tygodnia

Supersedes część oferty w [`2026-08-18-money-model-oferta.md`](2026-08-18-money-model-oferta.md) (wejście 390 zł + H1 mechanizm). Craft: [`2026-08-18-landing-d-editorial.md`](2026-08-18-landing-d-editorial.md) — rytm pasów i tokeny zostają; H1, belka, CTA i cennik zmieniają się tutaj. Research: [`2026-08-18-czego-chca-trenerzy.md`](../research/2026-08-18-czego-chca-trenerzy.md).

## TLDR

Wejście to **pierwszy przegląd za 0 zł w 24 godziny**: trener przysyła arkusz, PDF albo zrzuty, dostaje listę podopiecznych i trzy wiadomości. Bez konta, bez rozmowy, bez karty. Pięć miejsc, bo składa go jedna osoba. Cena za przeniesienie planów (żeby przegląd szedł co tydzień) startuje od zera i rośnie po opiniach: 390 → 590 → 790. Landing sprzedaje wynik w niedzielę, nie link.

## Problem

Landing sprzedawał cennik i mechanizm. H1 „Wysyłasz link. Widzisz trening.” odpowiada na „jak”, nie na „dlaczego mnie to obchodzi”. Dwa CTA w hero zabijały płatne wejście. 390 zł od nieznajomego bez opinii brzmiało: zapłać, przeniesiemy Cię do naszej apki. Link bez instalowania i „kto nie trenował” mają wszyscy. Język produktu (przeglądarka, sklep, JSON, pakiet retencji) nie jest językiem trenera.

## Proponowane rozwiązanie

### Oferta (Stage I — teraz)

| Etap | Co | Cena | Warunek |
|---|---|---|---|
| Hak | Pierwszy przegląd | **0 zł** | Arkusz / PDF / zrzuty. Odpowiedź w 24 h. 5 miejsc. |
| Wymiana | Opinia i prawda | — | Przez 30 dni pisze, co nie działa. Opinia, jeśli zasłuży. |
| Przeniesienie | Plany w środku, przegląd co tydzień | **0 zł** dla pierwszej piątki | Po 3 opiniach: 390, potem +200 co 5 osób (590, 790). Stała `WDROZENIE_PRICE_ZL`. |
| Kotwica | Cała baza + 90 dni opieki | **2 900 zł** | Ta sama gwarancja pracy. |
| Continuity | Po 90 dniach | **39 zł** / 15 albo **99 zł** / 30 | Karta nie teraz. |
| Ciche wyjście | Konto bez rozmowy | **0 zł** / 5 osób | Nie w hero, nie w tabeli cennika. Jeden odsyłacz pod tabelą. |

**Gwarancja pracy (etap 0 zł):** jeśli przegląd nic nie powie — jedno zdanie od trenera i kończymy. Nie ma czego zwracać. Druga gwarancja: plany i wyniki zawsze do wyjęcia do pliku.

**Gwarancja zwrotu (etap płatny):** bez zmian w kodzie — 14 dni, ukończony trening. Wraca przy `WDROZENIE_PRICE_ZL > 0`.

**Dlaczego 0 zł, powiedziane wprost:** nie ma jeszcze opinii od trenerów. Ryzyko bierzemy my i pokazujemy efekt przed jakąkolwiek płatnością.

### Równanie wartości

| Zmienna | Jak ją ciągnie ta oferta |
|---|---|
| Wymarzony rezultat | W niedzielę wiesz, do kogo napisać w poniedziałek. |
| Prawdopodobieństwo | Artefakt przeglądu + osoba, która go składa. Opinie włączamy po trzech prawdziwych. |
| Opóźnienie | 24 godziny, nie „po rozmowie w przyszłym tygodniu”. |
| Wysiłek | Bez konta, bez instalowania, bez przepisywania, bez karty. |

### Landing `/` — 6 sekcji, H1 = wynik

Rytm pasów bez zmian: ciemne 01 / 03 / 05, jasne 02 / 04 / 06 + stopka.

1. Hero — H1 wynik, lead, 1 CTA, zdanie pod przyciskiem, belka 24 h / 5 miejsc, podgląd przeglądu zamiast typewritera
2. 01 Produkt — trzy kroki + telefon pod imieniem trenera
3. 02 Panel — artefakt przeglądu
4. 03 Ile tracisz — rezygnacja nie zaczyna się w dniu wiadomości
5. 04 Cennik — koszt po 90 dniach (39 / 99), ciche wyjście do konta
6. 05 Pytania — 5 sztuk
7. 06 Start — odbierz pierwszy przegląd

Świadomie nie na `/`: generator planów, katalog vs konkurencja, fałszywe opinie, liczba 68%, „kto nie trenował” jako slogan, 0 zł / 5 osób jako tytuł oferty.

### `/wdrozenie` — pierwszy przegląd

H1 o przeglądzie w 24 h. Trzy kroki. Blok „dlaczego bez opłat”. Gwarancja pracy i danych. Kotwica 2 900 zł **nad** formularzem. Formularz: imię, e-mail, telefon, czym dziś prowadzisz. Track `whiteglove` (bez Stripe). Materiał idzie w odpowiedzi na maila — bez wgrywania plików.

### Marka trenera w portalu

Imię trenera w tytule strony, w `apple-mobile-web-app-title` i w `name` / `short_name` manifestu. W nagłówku portalu: „Plan od {imię}”. Ikona i splash zostają nasze. Bez własnego logo, kolorów i domeny — wraca, gdy pierwsza piątka o to poprosi.

### Funkcje z AI (kolejka)

1. Przegląd tygodnia — teraz ręcznie, potem w produkcie
2. Trzy wiadomości pod osobę
3. Zrzut / zdjęcie → serie (`HistoryImport`)
4. Raport dla podopiecznego co 4 tygodnie
5. Odłożone: WhatsApp Business API
6. **Nie robimy:** generatora planów jako obietnicy

### Język

Mówimy: podopieczny, telefon, nic nie instaluje, do N podopiecznych, wiadomości i checklista, wyjmiesz do pliku.

Nie mówimy: przeglądarka, sklep, retencja, plan 30 osób, JSON, CSV, tap, nazwy innych programów, „klient” gdy chodzi o podopiecznego, „widzisz, kto nie trenował”.

## Model danych

Bez zmian encji. `Founding` w `BillingPlans.cs` zostaje 0 zł/mies. przez 90 dni. `WdrozenieAmountGrosze = 39000` zostaje — płatny track wraca, gdy podniesiemy `WDROZENIE_PRICE_ZL`.

Opcjonalne pole w DTO (tylko mail, nie baza): `HowYouWork` na `FoundingApplyInput`.

## Kontrakt API

| Metoda | Ścieżka | Zmiana |
|---|---|---|
| POST | `/api/founding/apply` | Opcjonalne `howYouWork`. Primary z frontu = `whiteglove`. |
| GET | `/api/portal/{token}/pin-status` | + `trainerName` |
| GET | `/api/portal/{token}` | + `trainerName` |

Typy w `apps/web/lib/api.ts` lustrzane. Rozliczeń i migracji nie ruszamy.

## UI

- `apps/web/components/landing/*` — locked copy w skillu `odejmowanie`
- `apps/web/app/wdrozenie/` — formularz bez „Zapłać 0 zł”
- `apps/web/components/landing/ReviewProof.tsx` — pusta lista opinii; do 3 sztuk widać osobę składającą przegląd
- Portal: `layout.tsx`, `manifest.webmanifest/route.ts`, home header

## Fazy implementacji

- [x] Faza 1 — research + ten spec + nota w money model
- [x] Faza 2 — landing + `/wdrozenie` + stałe + język
- [x] Faza 3 — imię trenera w portalu
- [ ] Faza 4 — skills, lekcje, GTM, bramka

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Nikt nie przysyła arkusza | 0 zł, 24 h, bez rozmowy; mierzymy przesłane materiały, nie kliknięcia |
| 5 ręcznych przeglądów zjada tydzień | Import już czyta arkusz i zdjęcia; limit 5 miejsc |
| Obietnica marki > produkt | W portalu naprawdę widać imię; logo/kolory poza zakresem |
| Hick: darmowe konto vs przegląd | Konto schodzi z hero i z tabeli |
| Test A/B przy zerowym ruchu | Przebudowa w całości; test H1 dopiero przy setkach wejść / tydz. |

## Changelog

- 2026-08-18 — utworzono spec: hak = przegląd, drabina ceny, H1 wynik, marka w portalu.
- 2026-08-19 — copy supersede: [`2026-08-19-copy-sprzedazowe-landing.md`](2026-08-19-copy-sprzedazowe-landing.md) — deliverable = raport, nowy H1 i CTA.
