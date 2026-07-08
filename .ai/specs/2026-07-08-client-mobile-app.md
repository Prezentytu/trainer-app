# Aplikacja mobilna klienta

## TLDR

Osobna aplikacja mobilna (Expo/React Native, jak `../fizjo-app`) dla klientów trenera: podgląd przypisanego planu, podgląd dnia treningowego i logowanie serii na żywo podczas treningu (kroki 3–6 z `htmls from design/Proces - od planu do treningu.html`), plus „na żywo" widoczne u trenera (część kroku 7). To **osobny projekt/repo**, dystrybuowany przez EAS na App Store i Google Play, konsumujący REST API portalu trenera (`apps/api` w tym repo). W tym repo zostaje tylko ten spec (wizja + kontrakt do ustalenia) — implementacja startuje po Etapie 3 roadmapu (`2026-07-08-roadmap-plan-to-training.md`), gdy istnieje `workout-logging-stats.md` (fundament danych wykonania).

## Open Questions (bramka — usuń po rozwiązaniu)

> Krytyczne niewiadome blokujące architekturę i zakres. Zatrzymuję się tu — nie rozpisuję dalej (Model danych / Kontrakt API / UI / Fazy), dopóki nie ma odpowiedzi.

- **Q1 — Auth klienta**: Portal trenera (`apps/api`) dziś **nie ma żadnego auth** — wszystkie endpointy są otwarte, bo używa ich tylko trener lokalnie. Apka klienta wymaga, żeby klient logował się i widział **tylko swoje** dane. Czy:
  (a) użyć **Clerk** (jak `fizjo-app`) i dodać w `apps/api` middleware weryfikujący JWT Clerk + zmapować `ClerkUserId` na `Client.Id`,
  (b) zbudować własny, prostszy mechanizm (magic link / kod dostępu wysyłany przez trenera, bez zewnętrznego dostawcy),
  (c) coś innego?
  To determinuje, czy `apps/api` dostaje ogólny system auth (wpływa też na portal trenera — dziś też otwarty) czy tylko wąski „token dostępu klienta" osobny od auth trenera.

- **Q2 — Zakres kontraktu API dla klienta**: apka klienta potrzebuje odczytu planu (już istnieje `GET /api/plans/{id}`, ale zwraca wszystko, nie tylko to, co dotyczy klienta) i zapisu logów treningowych (zależne od `workout-logging-stats.md` — `POST /api/sessions`). Czy klient:
  (a) używa tych samych endpointów co trener, tylko z auth ograniczającym do własnych `Assignment`/`Client.Id` (mniej kodu, ale trzeba dopilnować scope na każdym endpoincie),
  (b) dostaje dedykowany, wąski zestaw endpointów `/api/me/...` (jasny kontrakt, więcej kodu, łatwiejszy audyt bezpieczeństwa)?

- **Q3 — Real-time („na żywo" u trenera, krok 7)**: trener ma widzieć postęp sesji klienta w czasie rzeczywistym. Czy:
  (a) polling (np. odpytywanie `GET /api/clients/{id}/sessions/active` co N sekund z portalu trenera — prosto, zero nowej infrastruktury),
  (b) push/WebSocket/SignalR (bardziej „na żywo", ale nowa zależność produkcyjna — wymaga zgody wg `AGENTS.md` „Ask First")?

- **Q4 — Offline i optymistyczny zapis logowania**: klient loguje serie na siłowni, gdzie zasięg bywa słaby. Czy apka musi działać offline z synchronizacją później (wzorem `AsyncStorage`/kolejki w `fizjo-app`), czy na start wystarczy „wymaga połączenia" (prostszy MVP, ryzyko utraty danych treningu przy braku sieci)?

- **Q5 — Backend deployment**: `fizjo-app` łączy się z backendem na Azure App Service (`fiziyo-prod.azurewebsites.net`). `apps/api` tego repo dziś działa lokalnie (SQLite, `EnsureCreated()`). Apka mobilna w store wymaga **publicznie dostępnego** backendu z prawdziwą bazą (SQLite lokalna nie wystarczy dla wielu urządzeń/produkcji). Czy hosting/baza produkcyjna są w zakresie tego spec'u, czy to osobna decyzja infrastrukturalna do rozstrzygnięcia bliżej implementacji?

## Changelog

- 2026-07-08 — utworzono szkielet (TLDR + Open Questions), zgodnie z bramką skeleton-first. Aplikacja odłożona jako osobny projekt Expo/React Native wzorem `../fizjo-app`; nie rozpisywać dalej przed odpowiedziami.
