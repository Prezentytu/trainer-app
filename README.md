# Trainer App — MVP portalu trenera

Proste MVP aplikacji dla trenerów personalnych: biblioteka ćwiczeń, plany treningowe (szablony + plany klientów), przypisywanie planów klientom.

## Struktura

```
trainer-app/
├── backend/   # .NET 10 Minimal API + EF Core + SQLite (plik trainer.db, zero konfiguracji)
└── web/       # Next.js 15 (App Router) + Tailwind — portal trenera
```

## Uruchomienie lokalne

Dwa terminale:

```bash
# Terminal 1 — backend (http://localhost:5210)
cd backend
dotnet run

# Terminal 2 — portal (http://localhost:3000)
cd web
npm install
npm run dev
```

Baza SQLite (`backend/trainer.db`) tworzy się automatycznie przy pierwszym starcie razem z danymi startowymi (10 ćwiczeń, przykładowy klient i szablon planu FBW). Żeby zresetować dane, usuń plik `trainer.db` i zrestartuj backend.

## Flow MVP

1. **Ćwiczenia** — biblioteka z domyślnymi parametrami (serie, powtórzenia / czas, przerwa między seriami, obciążenie kg).
2. **Plany** — builder: dodajesz ćwiczenia, opcjonalnie nadpisujesz parametry per ćwiczenie (puste pole = domyślne z ćwiczenia), ustawiasz przerwę po ćwiczeniu i kolejność.
   - **Szablon** — wielokrotnego użytku; przyciskiem „Użyj → plan klienta” tworzysz z niego przypisywalny plan.
   - **Plan klienta** — można przypisać klientowi.
3. **Klienci** — dodajesz klienta, na jego profilu przypisujesz plan z datą startu; przypisanie można zakończyć/anulować/wznowić.

## API (REST, JSON)

| Zasób | Endpointy |
|---|---|
| Klienci | `GET/POST /api/clients`, `GET/PUT/DELETE /api/clients/{id}` |
| Ćwiczenia | `GET/POST /api/exercises`, `PUT/DELETE /api/exercises/{id}` |
| Plany | `GET/POST /api/plans`, `GET/PUT/DELETE /api/plans/{id}`, `POST /api/plans/{id}/duplicate` |
| Przypisania | `GET/POST /api/assignments`, `PATCH /api/assignments/{id}/status`, `DELETE /api/assignments/{id}` |

Plany zwracają **efektywne parametry** (nadpisanie z planu albo default z ćwiczenia) + surowe `overrides` — gotowe pod przyszły mobilny player klienta.

## Poza zakresem MVP (świadomie)

Auth/logowanie, aplikacja mobilna klienta, historia wykonań treningów, multi-trener/multi-tenant, media ćwiczeń. Model danych (plan → pozycje z parametrami i przerwami) jest przygotowany pod player mobilny (odznaczanie serii + timery przerw).
