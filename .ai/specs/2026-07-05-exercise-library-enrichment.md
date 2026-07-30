# Wzbogacenie biblioteki ćwiczeń (metadane w stylu Gravitus)

> **Zastąpiony** przez [2026-07-30-exercise-library-youtube.md](2026-07-30-exercise-library-youtube.md) (2026-07-30).
> Ten plik zostaje jako historia decyzji; implementuj wyłącznie nowszy spec.

## TLDR

Opcjonalne metadane ćwiczenia: kategoria, mięśnie główne/pomocnicze, sprzęt, mechanika, poziom trudności, instrukcja krok po kroku, media (listy URL-i zdjęć i wideo) + filtrowanie biblioteki. Wszystko opcjonalne — ćwiczenie z samą nazwą działa jak dotychczas. Najniższy priorytet z czterech speców (czysto opisowe, niczego nie blokuje).

Zależności: brak (niezależny). `muscleEngagement` ze specu logowania zaczyna działać dopiero po tym specu.

## Problem

Ćwiczenie ma dziś tylko nazwę, opis, typ i domyślne parametry. Brak taksonomii (jak filtrować „ćwiczenia na barki ze sztangą"?), instrukcji i mediów — rzeczy, które w Gravitusie stanowią zakładkę Guide i filtry biblioteki.

## Proponowane rozwiązanie

Bez tabel słownikowych (zgodnie z ziarnem projektu — string-konwencje jak `Type`, `Status`):

- pola jednowartościowe jako stringi: `Category`, `Mechanics`, `Force`, `Difficulty`;
- wielowartościowe jako `List<string>` → kolumna JSON przez EF value converter: `PrimaryMuscles`, `SecondaryMuscles`, `Equipment`, `ImageUrls`, `VideoUrls`;
- słowniki dozwolonych wartości + polskie etykiety po stronie frontu (`apps/web/lib/api.ts`), backend nie waliduje sztywno (spójnie z `Type`);
- media jako **listy** (nie pojedynczy URL) — pozycja startowa/końcowa, kilka ujęć; UI pokazuje pierwszy element jako miniaturę.

## Model danych

`Exercise` — nowe pola (wszystkie opcjonalne):

```csharp
public string? Category { get; set; }      // legs|back|chest|shoulders|arms|core|fullbody
public string? Mechanics { get; set; }     // compound|isolation
public string? Force { get; set; }         // push|pull|static
public string? Difficulty { get; set; }    // beginner|intermediate|advanced
public List<string> PrimaryMuscles { get; set; } = [];
public List<string> SecondaryMuscles { get; set; } = [];
public List<string> Equipment { get; set; } = [];
public string? Instructions { get; set; }  // kroki, jeden na linię
public List<string> ImageUrls { get; set; } = [];
public List<string> VideoUrls { get; set; } = [];
```

`AppDb.cs`: value converter `List<string>` ↔ JSON (jeden helper dla pięciu kolekcji).

> Zmiana schematu → reset `trainer.db`; wdrożyć przy okazji resetu z innego specu.

## Kontrakt API

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| GET | `/api/exercises?q=&category=&equipment=&muscle=` | — | przefiltrowana lista (filtr w pamięci — mały dataset) |
| POST/PUT | `/api/exercises[/{id}]` | `ExerciseInput` + nowe pola (defaulty: null / puste listy) | jak dotąd |

Minimalny payload `{ "name": "..." }` nadal tworzy poprawne ćwiczenie (pozostałe parametry rekordu mają wartości domyślne).

## UI

- `exercises/page.tsx`: sekcja „Klasyfikacja (opcjonalna)" w formularzu (selecty + multi-select chipy w palecie zinc/yellow), pasek filtrów nad listą, badge kategorii/sprzętu na kartach.
- Podgląd ćwiczenia (rozwijany na karcie): instrukcja jako lista numerowana, miniatury mediów.
- Słowniki `CATEGORY_LABELS`, `MUSCLE_OPTIONS`, `EQUIPMENT_OPTIONS`, `MECHANICS_LABELS`, `FORCE_LABELS`, `DIFFICULTY_LABELS` w `api.ts`.

## Fazy implementacji

- [ ] Faza 1 — backend: pola + converter + filtry + mapowanie + seed (kilka ćwiczeń z pełnymi metadanymi, reszta „goła") + testy
- [ ] Faza 2 — frontend: formularz, filtry, badge, podgląd Guide

## Ryzyka i wpływ

- **Rozjazd wartości string-enumów** między frontem a danymi — mitygacja: jedyne źródło opcji to stałe w `api.ts`; backend przyjmuje dowolny string (świadomy trade-off jak przy `Type`).
- **Kolumny JSON nie są queryowalne w SQL** — akceptowalne: filtrowanie w pamięci; dataset biblioteki to setki rekordów maks.

## Changelog

- 2026-07-05 — utworzono spec.
