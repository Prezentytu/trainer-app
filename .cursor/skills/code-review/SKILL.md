---
name: code-review
description: Review Trainer App code changes for compliance with project conventions (architecture, naming, API/DTO mirroring, no raw fetch, error handling, Polish UI). Use when asked to "review", "sprawdź kod", "review PR", "przejrzyj zmiany", or before committing a feature.
---

# Code review (zgodność z konwencjami Trainer App)

Recenzuj zmiany pod kątem reguł z `AGENTS.md` (root + `apps/api/` + `apps/web/`). Zgłaszaj konkretne pliki i linie. Kategoryzuj: Krytyczne / Ważne / Drobne.

## Checklist

### Architektura i nazewnictwo
- [ ] Endpointy z prefiksem `/api/{zasób}`, pogrupowane, z nagłówkiem sekcji.
- [ ] Encje w `Models.cs`, input DTO (rekordy) w `Dtos.cs`, `DbSet` w `AppDb.cs`.
- [ ] PascalCase w C#, camelCase w JSON/TS.

### Kontrakt backend ↔ frontend
- [ ] Typy w `apps/web/lib/api.ts` są lustrzane do encji/DTO (kształt i nazwy pól).
- [ ] GET listy rzutuje na anonimowy/DTO kształt (bez cyklicznych nawigacji).
- [ ] POST → `Created`, DELETE → `NoContent`, brak rekordu → `NotFound`, konflikt → `Conflict(new { message })`.

### Frontend
- [ ] Brak surowego `fetch` w stronach — tylko `api.*` z `lib/api.ts`.
- [ ] Błędy obsłużone przez `ErrorBanner`; pusty stan przez `EmptyState`.
- [ ] Użyte prymitywy z `components/ui.tsx`; brak hardkodowanych kolorów spoza palety `zinc`/`yellow`.
- [ ] Nowy dział dopisany do `NAV` w `layout.tsx`.
- [ ] Teksty UI po polsku.

### Jakość i bezpieczeństwo
- [ ] Zmiana schematu encji → odnotowana konieczność resetu `trainer.db` (uwaga `EnsureCreated`).
- [ ] Brak nowych zależności bez zgody (reguła „Ask First”).
- [ ] Bramka walidacyjna przechodzi (`./scripts/check.sh`).
- [ ] Zmiana minimalna i skupiona; brak martwego kodu i zbędnych komentarzy.

## Format wyniku

Krótkie podsumowanie + lista uwag pogrupowana wg wagi, każda z odwołaniem `plik:linia` i propozycją poprawki.
