---
name: check-and-commit
description: Run the full Trainer App validation gate, fix obvious failures, then commit with a clear message. Use when asked to "check and commit", "sprawdź i zacommituj", "verify then commit", "make CI pass and commit".
---

# Check and commit

Uruchom pełną bramkę walidacyjną, napraw oczywiste błędy, a następnie zacommituj — tylko jeśli wszystko jest zielone.

## Kroki

1. **Bramka walidacyjna** — uruchom `./scripts/check.sh` (backend build + `dotnet test`, web `lint` + `typecheck` + `build`).
2. **Napraw oczywiste** — literówki, brakujące importy, rozjazd typów TS↔DTO, drobne błędy lint. Przy niejednoznacznych/architektonicznych błędach zatrzymaj się i zapytaj.
3. **Ponów bramkę** — aż będzie zielona.
4. **Commit** — dopiero po zielonej bramce:
   - `git status` + `git diff` — zweryfikuj zakres,
   - nie dodawaj sekretów/`.env`/`trainer.db`/`bin`/`obj`,
   - komunikat zwięzły, po angielsku, opisujący „dlaczego” (Conventional Commits: `feat:`, `fix:`, `chore:`…),
   - **commituj tylko gdy użytkownik o to poprosił** (ten skill jest tym żądaniem).

## Zasady bezpieczeństwa git

- Nie zmieniaj konfiguracji git.
- Nie używaj `--amend` na cudzych/wypchniętych commitach.
- Nie pushuj, chyba że użytkownik wyraźnie poprosi.
- Jeśli bramka nie przechodzi i nie umiesz bezpiecznie naprawić — nie commituj, zgłoś problem.
