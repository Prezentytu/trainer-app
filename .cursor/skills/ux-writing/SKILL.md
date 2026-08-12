---
name: ux-writing
description: >-
  Głos, ton i microcopy RepMaxer po polsku — jasność przed zwięzłością, język trenera
  zamiast kalek i sloganów. Użyj ZAWSZE przy każdym nowym lub zmienianym tekście UI
  (landing, panel, portal, empty states, błędy, CTA, FAQ, metadata). EN triggers —
  UX writing, microcopy, voice and tone, copy, headline, CTA, calque, telegram style,
  marketese. Czytaj razem z `design-system`, `fitness-ui-ux`, `senior-ux-cro`.
---

# UX writing — RepMaxer

Tekst jest interfejsem. Pisz tak, jak trener mówi do kolegi z branży: konkretnie, spokojnie, po polsku. Nie jak broszura, nie jak tłumaczenie z angielskiego.

Stosuj ŁĄCZNIE z `design-system`, `fitness-ui-ux`, `senior-ux-cro`. Ten skill wygrywa przy konflikcie o słowa.

Priorytet (NN/g 3 C’s): **jasność > zwięzłość > charakter.** Dodatkowe słowa są OK, jeśli zwiększają zrozumiałość. Użytkownicy odrzucają *marketese*.

## Głos (stały)

Jesteśmy:

- **konkretni**, nie sprytni
- **spokojni**, nie motywacyjnym coachem
- **po polsku trenera**, nie po korporacyjnemu
- **krótcy**, nie telegraficzni
- **na *ty***, nigdy *my* o produkcie („pomagamy Ci…”)

## Dwa rejestry (ton zmienny)

| Rejestr | Gdzie | Jak |
|---|---|---|
| Landing | `components/landing/`, metadata, OG | Rytm OK (dwie linie H1). Pełne zdania. Pewny, bez sloganów. |
| Panel / portal | reszta UI | Dosłownie: etykieta nazywa rzecz. Zero metafor, zero wstydu. |

Błąd = spokojny + co się stało + co zrobić. Sukces = krótki fakt. Destrukcja = czasownik czynności, bez żartu.

## Zasady PL

1. **Strona czynna, *ty*.** „Widzisz serie”, nie „serie są widoczne”.
2. **Pełne zdanie albo pełna etykieta.** Zakaz urywanych haseł bez czasownika („Link bez konta. Fakty po treningu.”).
3. **Zakaz kalek.** Nie tłumacz struktury angielskiej 1:1. *Requires you* ≠ „Wymaga Ciebie”. *See who is silent* ≠ „Widzisz, kto milczy”.
4. **Język użytkownika, nie briefu.** Trener: „kto nie trenował”, „do zrobienia”, „przypisz plan”. Klient: „otwiera link w przeglądarce”, „odhacza serie”. Zakaz skrótów z researchu: „siłowy 1:1”, „ICP”, „studio z recepcją”, „coaching dietetyczny”. Mów kim jest człowiek i co robi.
5. **CTA = czasownik + obiekt.** „Przypisz plan”, „Skopiuj link”, „Załóż darmowe konto”. Nie „OK”, nie slogan („Odblokuj progres”).
6. **Jedna myśl na element.** Nagłówek = co to jest. Podtytuł = po co / co dalej.
7. **Bez wstydu.** Nigdy „zalegasz”, „kto milczy”, confirmshaming.
8. **Bez wykrzykników i emoji.** Myślnik `—`, nie hype.

`senior-ux-cro` „benefit-driven”: nazywaj **skutek akcji** („Przypisz plan”), nie pisz sloganu. „Zapisz plan” jest OK.

## Test na głos (twarda bramka)

Przeczytaj tekst na głos. Przepisz, jeśli brzmi jak:

- broszura / slogan / telegraf
- robot albo urzędnik
- tłumaczenie z angielskiego
- coś, czego trener nie powie klientowi ani koledze
- skrót z briefu, którego nie rozwiniesz bez slajdu („siłowy 1:1”, „ICP”)

Pytania: czy da się zrozumieć bez zgadywania? czy to słowa trenera/klienta? czy da się skrócić **bez** utraty czasownika i sensu?

## Pary (źle → dobrze)

| Źle | Dobrze | Dlaczego |
|---|---|---|
| Wymaga Ciebie | Do zrobienia | Kalka *Requires you*. Kolejka to lista spraw, nie osoba. |
| Link bez konta. Fakty po treningu. Widzisz, kto milczy. | Klient otwiera link w przeglądarce — bez konta. Po treningu widzisz serie i rekordy. Od razu wiesz, kto nie trenował. | Telegraf + metafora. Pełne zdania, język trenera. |
| Zanim zapytasz. | Najczęstsze pytania | Spryt zamiast etykiety. |
| …kto milczy — piszesz pierwszy. | …kto nie trenował. Możesz napisać pierwszy. | „Milczy” wstydzi. |
| Gotowy na trening? | Zacznij z pierwszym klientem. | Zły adresat — trener nie idzie na siłownię. |
| Progres widać bez pytania o samopoczucie. | Widzisz progres w liczbach, nie w samopoczuciu. | Strona bierna, zagięcie. |
| Jeden zatrzymany podopieczny spłaca to wielokrotnie. | Płacisz od 39 zł / 15 osób — nie za klienta. | Marketese. Zostaw konkret. |
| Warto ruszyć | Bez progresu | Motywacyjny coach. Portal nazywa stan. |
| Fakty (aria) | Ostatnio | Dziennikarski żargon; etykieta na ekranie już jest „Ostatnio”. |
| Odblokuj progres / Zadbaj o wyniki | Przypisz plan / Zapisz plan | Slogan ≠ CTA. |
| Dla siłowego 1:1… Nie dla studia z recepcją… | Dla trenera personalnego, który układa plany i wysyła je klientom na telefon. Nie do zarządzania klubem i nie do diet. | Żargon ICP. „Siłowy 1:1” nic nie mówi bez briefu. |
| …nie kasujemy mu tożsamości w sklepie z aplikacjami. | …po współpracy nie zostaje mu aplikacja w sklepie. | Sprytna metafora zamiast faktu. |
| Wychwytujemy je automatycznie. | Widzisz je od razu, bez pytania klienta. | *My* o produkcie. Skill: nigdy *my*. |
| Wysyłasz link. Widzisz każdy trening. | *(zostaje)* | Pełne, naturalne zdania. |

## Słownik

| Mówimy | Nie mówimy |
|---|---|
| do zrobienia | wymaga ciebie, wymaga Cię |
| kto nie trenował | kto milczy, cisza (w copy użytkownika) |
| bez konta | magic-link, token (w UI) |
| odhacza serie | loguje sety, trackuje |
| bez progresu | warto ruszyć, zalegasz |
| najczęstsze pytania | zanim zapytasz, FAQ jako nagłówek |
| trener personalny | siłowy 1:1, ICP, solo PT |
| klub / siłownia | studio z recepcją |
| dieta | coaching dietetyczny |
| podopieczny / klient | user, lead |

W kodzie nazwy angielskie (`portalToken`, `fromClients`) mogą zostać. W UI — polski trenera.

## Checklist przed merge copy

- [ ] Test na głos — brzmi jak rozmowa, nie jak hasło
- [ ] Jasność przed zwięzłością; nic nie trzeba zgadywać
- [ ] Landing: pełne zdania. Panel: dosłowna etykieta
- [ ] CTA = czasownik + obiekt, nie slogan i nie samo „OK”
- [ ] Zero kalek, telegrafu, żargonu ICP, wstydu, wykrzykników, emoji
- [ ] Spójne słowo na tę samą rzecz w całym produkcie
