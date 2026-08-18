# Pipeline CI/CD — release train dev → prod

## TLDR

Jeden artefakt API (obraz Dockera pinowany digestem) idzie najpierw na dev (`trainer-app-api` + `dev.repmaxer.pl`) przy merge na `main`. Produkcja (`repmaxer-prod` + `repmaxer.pl`) jedzie dopiero po ręcznym **Promote to prod** — ten sam tag `sha-XXXX`, bez przebudowy. CI jest reusable, migracje EF pierwszy raz odpalają się na Postgresie w CI, a nie na żywym Neonie. `main` jest trunkiem: krótkie gałęzie, bez długowiecznego `dev`.

## Problem

- Deploy API jest ręczny (`workflow_dispatch`) z ternary `prod && SECRET_PROD || SECRET`.
- Front na `main` wjeżdża z Vercela nawet przy czerwonym CI i przed API.
- CI jest węższe niż `scripts/check.sh`; brak cache NuGet, brak bramki na dryf migracji.
- `COPY . .` bez `.dockerignore` wciąga `trainer.db` do obrazu.
- Health check (`grep ok`) przechodzi na starej wersji; brak rollbacku.
- `reminders.yml` maskuje brak sekretów przez `exit 0`.
- Długowieczne sekrety: JSON `AZURE_CREDENTIALS*` i classic PAT do pusha GHCR.

## Proponowane rozwiązanie

Cztery zasady:

1. **Jeden artefakt** — obraz budowany raz, promowany digestem dev → prod.
2. **Rozdział środowisk to miejsce** — GitHub Environments `dev` / `prod` z tymi samymi nazwami sekretów.
3. **Nic na prod bez dowodu** — zielone CI, dev, smoke z SHA, potem ręczny Promote to prod.
4. **Każde wdrożenie ma odwrotność** — redeploy poprzedniego digestu; front = `vercel rollback`.

Front: Vercel przestaje sam wdrażać `main`. Actions wdraża `dev.repmaxer.pl` (dev) i `repmaxer.pl` (prod) **po** API.

Git: trunk na `main`. Nie zakładamy gałęzi `dev` — „niech poleży” = merge (Release = tylko dev) + ręczny Promote kiedy chcesz; „niegotowe” = PR + Preview; praca > 1 dzień = kawałki albo flaga.

## Model danych

Bez zmian encji. `/api/health/live` i `/api/health` dostają pole `version` (SHA commita z `SOURCE_REVISION` / `SourceRevisionId`).

## Kontrakt API

| Metoda | Ścieżka | Zmiana |
|---|---|---|
| GET | `/api/health/live` | + `version` (string, SHA albo `dev`) |
| GET | `/api/health` | + `version` |

Typy w `api.ts` nie są używane do health — smoke czyta JSON bezpośrednio.

## UI

Brak zmian w panelu. Dev (`dev.repmaxer.pl`) dostaje `X-Robots-Tag: noindex` i `robots` disallow `/`.

## Fazy implementacji

- [x] Faza 0 — spec, `.dockerignore`, `global.json`, SHA w obrazie i health, sprzątanie `ci.yml`
- [x] Faza 1 — CI równoległe + `workflow_call`, cache, bramka migracji, Dependabot, audit
- [x] Faza 2 — Environments + OIDC w workflowach (kroki ręczne w `docs/ci-cd.md`)
- [x] Faza 3 — `smoke.sh`, `release.yml`, rollback, break-glass, twardy cron
- [x] Faza 4 — `vercel.json`, noindex dev, deploy frontu z trainu
- [x] Faza 5 — Playwright na dev (devDependency)
- [x] Faza 6 — dokumentacja

## Ryzyka i wpływ

| Ryzyko | Mitigacja |
|---|---|
| Environments/OIDC nieustawione = czerwony release | Checklist w `docs/deploy.md`; `deploy-api.yml` zostaje jako break-glass |
| Migracja destrukcyjna na prod | Guard DDL w CI + bookmark Neon (soft-skip bez `NEON_API_KEY`) |
| Smoke zielony na starej wersji | Asercja `version == SHA` |
| Front i API rozjechane | API przed frontem; kompatybilność wstecz API |
| Flaky Playwright blokuje hotfix | E2E tylko na dev; brak sekretów E2E = skip ścieżki auth, nie fail prod |
| Drugi B1 (dev) | Świadomy koszt; nie gasimy `trainer-app-api` |
| Concurrency na workflow + approval blokuje dev | Grupy `deploy-dev` / `deploy-prod` na jobach; `cancel-in-progress: false` |

## Changelog

- 2026-08-16 — utworzono spec; decyzje: staging+prod, auto CD z bramką approvala, Vercel pod kontrolą Actions, bash smoke od razu + Playwright na staging.
- 2026-08-16 — wdrożono pipeline w repo (workflowy, skrypty, health `version`). Kroki ręczne Environments/OIDC/Vercel staging: `docs/ci-cd.md`.
- 2026-08-17 — korekta nazw `staging`/`production` → `dev`/`prod`; trunk zamiast gałęzi `dev`; concurrency per środowisko (approve prod nie blokuje deployu na dev).
- 2026-08-17 — strażnik DDL skanuje tylko delta względem `main`, nie pełny skrypt idempotentny (historyczne DROP w `Up()` blokowały każdy PR).
- 2026-08-18 — bramka prod to `promote.yml` (`workflow_dispatch`), nie Required reviewers na Environment `prod` (ten sam env czyta cron). `release.yml` kończy się na E2E.
