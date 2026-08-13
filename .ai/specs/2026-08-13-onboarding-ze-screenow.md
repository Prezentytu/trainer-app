# Onboarding klienta ze screenów

## TLDR

Trener wrzuca screeny / wklejkę / CSV historii klienta → przegląd sesji → zapis jako ukończone treningi, maxy i draft kolejnego planu. Wejście: profil klienta, nie lista planów. Nic nie zapisuje się bez zatwierdzenia.

## Problem

Screeny z dziennika treningowego to **logi**, nie plan. RepMaxer umie budować przyszłość (kreator, import tekstu planu) i wpisywać historię tylko sesja po sesji przy obowiązkowym dniu planu. Trener musi wyklikać plan, żeby w ogóle mieć gdzie wkleić przeszłość. Wiele dzienników nie eksportuje CSV; jedyny artefakt to screenshot. Format PL `8 x 30kg, 8 x 35kg` koliduje z composerem `3x8` (serie × powt.).

## Proponowane rozwiązanie

1. **Faza 0** — wklej serie `8 x 30kg`, nowa seria kopiuje poprzednią, sesja freeform bez dnia planu, 0 kg → BW.
2. **Faza 1** — `POST /api/ai/history-import` (tekst + obrazy przez istniejący OpenRouter/Gemini) + wizard `/clients/[id]/import` → bulk `POST /api/sessions`.
3. **Faza 2** — klasteryzacja dni, detekcja tygodnia testu, maxy z top setów, draft planu + progresja + auto-assign.
4. **Faza 3** — portal: klient wrzuca screeny (kolejka na Panelu); parser CSV dziennika; widok progresji w kreatorze.

Reuse: matching z `PlanImport`, `planImportHandoff`, `CopyWeekPopover`, `sessions.create`, OpenRouter. Zdjęcia nie są trzymane po parsowaniu — tylko JSON draftu (portal: encja `ClientHistoryImport`).

## Model danych

Nowa encja (migracja EF + reset lokalnego `trainer.db`):

```csharp
public class ClientHistoryImport
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public Client? Client { get; set; }
    public string Status { get; set; } = "pending"; // pending | applied | dismissed
    public string DraftJson { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

Sesje importowane: `status=completed`, `planDayId` opcjonalny. Bez zmian `WorkoutSession`.

DTO importu (odpowiedź AI, nie zapis):

- `HistoryImportRequest` — `text?`, `images[]` (`mimeType`, `base64`)
- `HistoryImportDraft` — `sessions[]`, `warnings[]`
- `HistoryImportSession` — data, etykieta dnia, ćwiczenia, serie `{ reps, weightKg, isBodyweight }`

## Kontrakt API

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| POST | `/api/ai/history-import` | `{ text?, images? }` | `HistoryImportDraft` |
| POST | `/api/clients/{id}/history-imports` | `{ draft }` | `{ id }` (pending z JSON) |
| GET | `/api/clients/{id}/history-imports/pending` | — | `{ id, draft, createdAt } \| 204` |
| POST | `/api/clients/{id}/history-imports/{importId}/apply` | `{ saveHistory, saveMaxes, sessions, maxes }` | `{ sessionIds, maxIds }` |
| POST | `/api/clients/{id}/history-imports/{importId}/dismiss` | — | 204 |
| POST | `/api/portal/{token}/history-import` | jak AI + zapis pending | `{ id }` |

Typy i metody w `apps/web/lib/api.ts`: `api.ai.importHistory`, `api.clients.historyImport*`, `api.portal.importHistory`.

Zapis sesji może iść też istniejącym `POST /api/sessions`. Apply w jednym requeście unika częściowego zapisu.

## UI

- `/clients/[id]/import` — wizard: wrzuć → przegląd → co zapisać → (opcjonalnie) kreator planu.
- Profil: empty Historia + CTA „Wgraj stare treningi”; dialog „Wpisz trening” z opcjonalnym dniem.
- Dodaj klienta: checkbox „Mam screeny z poprzedniej apki” → redirect na import.
- Panel: `fromClients.kind = history_import`.
- Portal `/portal/[token]/import` — link z Historii / wywiadu.
- Kreator: widok „Progresja” (te same dni z tygodni obok siebie).
- Copy: „Wgraj stare treningi”, „Wrzuć screeny”, „Złóż kolejny plan”.

## Fazy implementacji

- [x] Faza 0 — wklej serie, kopia serii, freeform, BW
- [x] Faza 1 — vision + wizard + zapis historii
- [x] Faza 2 — klaster, test, maxy, draft planu
- [x] Faza 3 — portal, CSV, Progression View

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Halucynacje OCR | Podgląd + checksum liczby serii z karty dziennika |
| Baza planu = tydzień testu | Detekcja + jawny wybór źródła |
| Koszt vision | Kompresja ~1600 px, max 15 zdjęć, jeden request |
| Matching PL | Aliasy + „utwórz brakujące” |
| PII na screenach | Brak persistencji obrazów; tylko JSON |
| Rozmycie z `/plans/import` | Stary flow zostaje dla arkusza planu |

## Changelog

- 2026-08-13 — utworzono spec (decyzje z planu: historia+plan, wejście profil klienta, OpenRouter vision, przegląd przed zapisem).
- 2026-08-13 — wdrożono fazy 0–3.
- 2026-08-13 — copy i kod bez nazw innych aplikacji.
- 2026-08-13 — CTA „Wgraj stare treningi”; krok 1: dropzone, miniatury, wklejka za progressive disclosure.
