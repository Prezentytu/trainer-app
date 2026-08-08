# Notatki trenera i notatki klienta

## TLDR

Dwie zakładki na stronie klienta (przed Wywiadem): **Moje notatki** — prywatny dziennik trenera (`TrainerNote`, niewidoczny w portalu) oraz **Notatki klienta** — read-only agregacja istniejących notatek z serii, ćwiczeń i wiadomości po sesji.

## Problem

Trener nie ma miejsca na prywatne notatki o kliencie (kontuzje, ustalenia, płatności). Jednocześnie klient już zostawia notatki w loggerze (`LoggedSet.Note`, `LoggedExercise.Note`, `WorkoutSession.Note`), ale trener widzi je tylko wchodząc w konkretną sesję — brak widoku zbiorczego.

`Client.Note` to co innego: jednolinijkowe podsumowanie celu w nagłówku — nie ruszamy go.

## Proponowane rozwiązanie

1. **Moje notatki** — nowa encja `TrainerNote` (dziennik wpisów z datą, przypinaniem). CRUD wyłącznie pod auth trenera; nigdy w `/api/portal/*`.
2. **Notatki klienta** — endpoint agregujący istniejące notatki z treningów (bez migracji), UI read-only pogrupowane po sesji.
3. Zakładki przed Wywiadem; `Tabs` z poziomym scrollem na mobile (6 pozycji).

## Model danych

Nowa encja w `Models.cs`:

```csharp
/// <summary>Prywatna notatka trenera o kliencie. NIGDY nie wystawiana w /api/portal/*.</summary>
public class TrainerNote
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public Client? Client { get; set; }
    public string Body { get; set; } = "";
    public DateTime? PinnedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
```

- `Client.TrainerNotes` + kaskada `DeleteBehavior.Cascade`, indeks `(ClientId, CreatedAt)`.
- Input: `record TrainerNoteInput(string Body, bool Pinned = false)`.
- Zmiana schematu → migracja EF + usunięcie lokalnego `trainer.db`.

## Kontrakt API

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| GET | `/api/clients/{clientId}/notes` | — | `TrainerNote[]` (przypięte pierwsze, potem `createdAt` ↓) |
| POST | `/api/clients/{clientId}/notes` | `TrainerNoteInput` | `201` → `TrainerNote` |
| PUT | `/api/clients/{clientId}/notes/{noteId}` | `TrainerNoteInput` | `200` → `TrainerNote` |
| DELETE | `/api/clients/{clientId}/notes/{noteId}` | — | `204` |
| GET | `/api/clients/{clientId}/client-notes?limit=30` | — | `ClientNoteGroup[]` |

`ClientNoteGroup`: `{ sessionId, performedOn, planName, dayLabel, sessionNote, items: ClientNoteItem[] }`.  
`ClientNoteItem`: `{ exerciseId, exerciseName, setNumber?, weightKg?, reps?, rpe?, note }` — `setNumber == null` = notatka do ćwiczenia.

Typy i metody w `apps/web/lib/api.ts`: `TrainerNote`, `TrainerNoteInput`, `ClientNoteGroup`, `ClientNoteItem`; `api.clients.notes/addNote/updateNote/removeNote/clientNotes`.

## UI

- `components/client/TrainerNotesTab.tsx` — composer, lista, pin/edit/delete, sygnał „Prywatne — klient tego nie widzi”.
- `components/client/ClientNotesTab.tsx` — grupy po sesji, link do sesji, empty state z instrukcją.
- Podpięcie w `clients/[id]/page.tsx`: Plany · Historia · Wyniki · **Moje notatki** · **Notatki klienta** · Wywiad.
- `Tabs` w `ui.tsx`: `overflow-x-auto` + `whitespace-nowrap`.

## Fazy implementacji

- [x] Faza 1 — backend: encja + DTO + CRUD + agregacja + migracja + testy
- [x] Faza 2 — frontend: `api.ts` + Tabs scroll + komponenty zakładek + wiring strony
- [x] Faza 3 — bramka `./scripts/check.sh`

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Wyciek prywatnych notatek do portalu | Encja tylko pod auth trenera; test izolacji; komentarz przy modelu |
| Reset lokalnej bazy | Migracja + usunięcie `trainer.db` (świadome) |
| 6 zakładek uciętych na mobile | Horizontal scroll w `Tabs` |
| Rozrost strony klienta | Osobne komponenty w `components/client/` |

## Changelog

- 2026-08-07 — utworzono spec; decyzje: dziennik wpisów (nie jedno pole), zakres notatek klienta = tylko treningi.
- 2026-08-07 — wdrożono: `TrainerNote`, endpointy `/notes` + `/client-notes`, zakładki UI, migracja `TrainerNotes`.
