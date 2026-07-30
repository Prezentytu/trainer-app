# MVP monetyzacja: auth + Neon/deploy + retencja

## TLDR

Warunek sprzedaży: publiczny produkt z auth trenera (Clerk), multi-tenant light (`Trainer` + `TrainerId`), Postgres (Neon) + migracje EF, deploy jak fizjo (Docker/GHCR/Azure + Vercel). Pakiet wartości: auto-raport postępów klienta, radar churnu, eksport danych, onboarding TTV &lt;15 min. Portal klienta zostaje na magic-linku bez konta.

Decyzje z planu MVP (Open Questions zamknięte): Clerk (nie własne cookie), Neon (nie SQLite/VPS), multi-tenant light od razu, billing ręczny poza kodem.

## Problem

Lokalne demo bez auth/deploy nie da się sprzedać. Brakuje też widocznego progresu dla klienta i sygnałów churnu dla trenera — to P0 z dokumentu pain pointów.

## Proponowane rozwiązanie

### Auth i multi-tenant

- Encja `Trainer` (`Id`, `ClerkUserId`, `Email`, `Name`, `CreatedAt`).
- `TrainerId` na `Client`, `Plan`, `Exercise` (zasoby „własne" trenera). Assignment/Session dziedziczą izolację przez Client.
- Clerk JWT walidowany w API przez `JwtBearer` + JWKS (`Clerk:Authority`). **Bez** token-exchange jak w fizjo — prostszy MVP.
- Middleware: `/api/*` wymaga auth **oprócz** `/api/portal/{token}/*` i `/api/health`.
- Gdy `Clerk:Authority` puste (dev/test) — auth wyłączony, domyślny `TrainerId = 1` (seed).
- Upsert `Trainer` przy pierwszym requestcie z ważnym JWT (`sub` → `ClerkUserId`).
- Web: `@clerk/nextjs`, strona `/sign-in`, `AppShell` za `ClerkProvider` + `SignedIn`; `api.ts` dokłada `Authorization: Bearer`.

### Baza i deploy

- `Npgsql` + connection string z env; lokalnie opcjonalnie SQLite przez `Database:Provider=Sqlite`.
- Migracje EF zamiast samego `EnsureCreated()`; w CI bundle jak fizjo.
- `apps/api/Dockerfile`, workflows `.github/workflows/ci.yml` + `deploy-api.yml` (GHCR → Azure), web na Vercel (dokumentacja env).
- Neon: osobny projekt `trainer-app` (manual w dashboardzie — connection string w secrets).

### Retencja (P0/P2)

- `GET /api/portal/{token}/progress-report` — 3–5 faktów (Δ e1RM, PR, compliance).
- Dashboard `attention`: dni bez treningu, aktywny plan bez sesji.
- `GET /api/export` — JSON (klienci, plany, sesje, maxy) scoped do trenera.
- Onboarding: szablony startowe przy pierwszym Trainerze + prowadzące empty states.

## Model danych

```csharp
public class Trainer {
  public int Id { get; set; }
  public string ClerkUserId { get; set; } = "";
  public string Email { get; set; } = "";
  public string Name { get; set; } = "";
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
// Client, Plan, Exercise += int TrainerId (+ nawigacja)
```

Indeksy: `Trainer.ClerkUserId` unique; `(TrainerId)` na Client/Plan/Exercise.

## Kontrakt API

| Metoda | Ścieżka | Opis |
|---|---|---|
| GET | `/api/health` | Publiczny healthcheck |
| GET | `/api/me` | Aktualny trener (po JWT) |
| GET | `/api/portal/{token}/progress-report` | Raport postępów klienta |
| GET | `/api/export` | Eksport JSON (auth) |
| GET | `/api/dashboard` | + `attention[]` (churn signals) |

Wszystkie istniejące `/api/*` (poza portalem) filtrują po `TrainerId` bieżącego trenera.

Typy TS w `apps/web/lib/api.ts` lustrzane.

## UI

- `/sign-in` — Clerk.
- Portal: karta „Twój postęp" (progress-report).
- Dashboard: rozszerzone „Wymaga uwagi".
- Ustawienia / profil: przycisk „Eksportuj dane".
- Empty states: dodaj klienta → przypisz plan → skopiuj link.

## Fazy implementacji

- [x] Faza A — Npgsql + dual provider + migracje + health
- [x] Faza B — Trainer + TrainerId + seed + scope zapytań
- [x] Faza C — Clerk JWT API + @clerk/nextjs + Bearer w api.ts
- [x] Faza D — Dockerfile + CI/CD workflows + docs deploy
- [x] Faza E — progress-report + radar churnu
- [x] Faza F — eksport + onboarding TTV
- [x] Faza G — testy + `./scripts/check.sh`

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Reset schematu kasuje lokalne SQLite | Migracje / delete trainer.db; seed odtwarza demo |
| Clerk w testach | Auth wyłączony gdy brak Authority; factory bez Clerk |
| Isolation bug (cross-tenant leak) | Filtr TrainerId w każdym query; test z 2 trenerami |
| Neon nie utworzony w dashboardzie | Docs `docs/deploy.md` — krok ręczny; kod gotowy na connection string |
| Azure App Service nie utworzony | Workflow + docs; sekrety jak w fizjo |

## Changelog

- 2026-07-30 — utworzono spec (plan MVP monetyzacji).
- 2026-07-30 — wdrożono: Trainer/TrainerId, dual Sqlite|Postgres + migracje, Clerk (opcjonalny lokalnie), progress-report, radar attention, eksport JSON, onboarding empty state, Dockerfile + CI/deploy workflows, docs/deploy.md. Ręczne: Neon projekt, Azure Web App, Vercel, sekrety Clerk.
