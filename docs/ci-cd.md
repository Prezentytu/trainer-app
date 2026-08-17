# CI/CD — release train RepMaxer

Kod czyta **te same** nazwy zmiennych wszędzie. Rozdział dev/prod jest **miejscem** (GitHub Environment, Azure Web App, Vercel environment), nie prefiksem `*_PROD`. Wartości sekretów nigdy nie wchodzą do tego pliku.

Szczegóły bootstrapu Azure / Neon / Clerk: [deploy.md](deploy.md).

## Jak pracujemy na main

`main` jest jedyną długowieczną gałęzią (trunk). Praca idzie na krótkich gałęziach (`feat/*`, `fix/*`): PR, zielone CI, Preview na Vercelu, auto-merge. Gałąź żyje godziny, nie dni.

Nie zakładamy gałęzi `dev`. To GitFlow (`develop`) — podwójne CI, dryf między tym, co przetestowałeś, a tym, co wjeżdża na prod, i hotfix z decyzją „z której gałęzi”. Solo i continuous delivery tego nie potrzebują.

Zamiast niej:

| Chcesz | Robisz |
|---|---|
| Niech poleży na `dev.repmaxer.pl` | Merge do `main` — train wdraża **dev**; produkcja czeka na Twój approve dowolnie długo |
| Niegotowe nawet na dev | Zostaje na gałęzi z PR-em; Vercel Preview ma własny URL |
| Robota na kilka dni | Dziel na kawałki albo schowaj za flagą (`NEXT_PUBLIC_FEATURE_*` / `Features:*` w konfiguracji API) |

## Przepływ

```
PR → CI (api + web + migracje + audit)
  ↓ merge main
Release: build obrazu (digest + sha)
  → migracje dev → trainer-app-api → smoke (SHA)
  → Vercel dev → dev.repmaxer.pl
  → Playwright
  → [Approve prod]
  → bookmark Neon → migracje prod → repmaxer-prod (TEN SAM digest)
  → smoke → Vercel --prod → repmaxer.pl
  → GitHub Release
```

API zawsze przed frontem. Prod nigdy nie buduje nowego obrazu API.

Concurrency jest **per środowisko**, nie na cały workflow: joby `dev` / `web-dev` / `e2e-dev` dzielą grupę `deploy-dev`, joby `prod` / `web-prod` — `deploy-prod`. Oczekujący approve produkcji **nie blokuje** kolejnych merge'y na `dev.repmaxer.pl`. `cancel-in-progress: false` — kolejka, nigdy przerwanie migracji w połowie. Przy kilku approve'ach zatwierdzasz od najstarszego.

| Workflow | Kiedy | Rola |
|---|---|---|
| `ci.yml` | PR + `workflow_call` | Bramka. Wymagany check: **CI** |
| `release.yml` | push `main` | Train dev → prod |
| `deploy-api.yml` | ręcznie | Break-glass (poza trainem) |
| `rollback-api.yml` | ręcznie | Przywróć digest / tag |
| `reminders.yml` | cron 07:00 UTC | Twardy fail bez sekretów |

## Słownik: nasze środowiska vs Vercel

GitHub Environments, joby i tagi obrazu mówią `dev` / `prod`. Vercel ma **własne** wbudowane nazwy — produkcji nie da się przemianować.

| Nasz słownik | GitHub Environment | Azure / domena | Vercel CLI | Vercel UI |
|---|---|---|---|---|
| **dev** | `dev` | `trainer-app-api`, `dev.repmaxer.pl` | `--environment=dev` / `--target=dev` (Custom Environment) | Custom Environment `dev` |
| **prod** | `prod` | `repmaxer-prod`, `repmaxer.pl` | `--environment=production` / `--prod` | wbudowane **Production** |
| (PR) | — | Preview URL | (git integration) | wbudowane **Preview** |
| (lokal) | — | localhost | `vercel pull --environment=development` (rzadko) | wbudowane **Development** |

`scripts/vercel-deploy.sh` przyjmuje `dev` albo `prod` i mapuje `prod` na flagi Vercela. Nie zgaduj przy `vercel pull`.

## Faza 2 — kroki ręczne (zrób raz)

Bez tego pierwszy `Release` będzie czerwony. Environments GitHub **nie da się** zadeklarować w YAML. Twórz od razu `dev` / `prod` — subject OIDC zawiera nazwę środowiska; rename później wymaga przepisania federated credentials.

### 1. GitHub Environments

Repo → **Settings → Environments**.

**`dev`** (bez reviewerów, branch `main`):

| Secret | Wartość |
|---|---|
| `DB_CONNECTION_STRING` | Neon **direct** (stary projekt pod `trainer-app-api`) |
| `AZURE_WEBAPP_NAME` | `trainer-app-api` |
| `API_BASE_URL` | `https://trainer-app-api.azurewebsites.net` |
| `AZURE_CLIENT_ID` | appId SP dev |
| `AZURE_TENANT_ID` | tenant |
| `AZURE_SUBSCRIPTION_ID` | subskrypcja |
| `GHCR_TOKEN` | PAT **`read:packages`** (pull z Azure; push idzie `GITHUB_TOKEN`) |
| `VERCEL_TOKEN` | token Vercel |
| `VERCEL_ORG_ID` | z `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | j.w. |
| `E2E_TRAINER_EMAIL` | konto testowe Clerk (opcjonalnie — bez tego E2E publiczny path i tak przechodzi) |
| `E2E_TRAINER_PASSWORD` | hasło tego konta |
| `CLERK_SECRET_KEY` | `sk_test` — tokeny testowe Playwright |

Variables: `WEB_BASE_URL` = `https://dev.repmaxer.pl`, `VERCEL_DEV_ALIAS` = `dev.repmaxer.pl`.

**`prod`** (required reviewer = Ty, branch `main`):

Te **same nazwy**. Wartości: Neon `repmaxer` direct, `repmaxer-prod`, `https://repmaxer-prod.azurewebsites.net`, SP na RG `repmaxer-prod`, plus `CRON_KEY`, opcjonalnie `NEON_API_KEY` / `NEON_PROJECT_ID` / `NEON_PARENT_BRANCH_ID`.

Stare sekrety repo (`DEV_*`, `*_PROD`, `AZURE_CREDENTIALS*`) **nie są już czytane**. Możesz je usunąć po pierwszym zielonym Release.

### 2. Azure OIDC (zamiast JSON `AZURE_CREDENTIALS`)

Dwa federated credentials — jeden subject na Environment. Możesz użyć dwóch SP (osobny na każdą RG) albo jednego z dwoma creds.

```bash
# OWNER/REPO = to repo (`git remote get-url origin`). Subject musi się zgadzać 1:1.
APP_ID="<client-id>"

az ad app federated-credential create --id "$APP_ID" --parameters '{
  "name": "gh-prod",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:<OWNER>/<REPO>:environment:prod",
  "audiences": ["api://AzureADTokenExchange"]
}'

az ad app federated-credential create --id "$APP_ID" --parameters '{
  "name": "gh-dev",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:<OWNER>/<REPO>:environment:dev",
  "audiences": ["api://AzureADTokenExchange"]
}'
```

`azure/login@v2` dostaje `client-id` / `tenant-id` / `subscription-id` z Environment. Workflow ma `id-token: write`.

### 3. GHCR

- Push: `GITHUB_TOKEN` (`packages: write`).
- Pull na Azure: `GHCR_TOKEN` z `read:packages` (GHCR nie umie managed identity). Workflow i tak wkleja hasło po `webapps-deploy` — ten krok gubi Private.
- Paczka `trainer-app-api`: Settings → Actions → read/write; powiąż z repo.

### 4. Vercel — dwa środowiska frontu

1. Projekt → **Settings → Environments** → Custom Environment **`dev`**.
2. Zmienne (te same nazwy, checkbox środowiska `dev`):
   - `NEXT_PUBLIC_API_URL` = `https://trainer-app-api.azurewebsites.net`
   - `NEXT_PUBLIC_SITE_URL` = `https://dev.repmaxer.pl`
   - Clerk `pk_test` / `sk_test`
3. Production: bez zmian (`repmaxer.pl` + live / test wg [deploy.md](deploy.md) D2).
4. **Settings → Git**: Production branch `main`. `apps/web/vercel.json` wyłącza auto-deploy z `main` — train wdraża sam.
5. **Domains:** `dev.repmaxer.pl` → environment `dev` (CNAME u rejestratora `.pl` na Vercel). `repmaxer.pl` zostaje Primary Production.
6. Token: Vercel → Account → Tokens → `VERCEL_TOKEN`. Org/project ID: `apps/web/.vercel/project.json` po `vercel link`.

### 5. CORS / Clerk na dev

Na Web App `trainer-app-api`:

```text
ALLOWED_ORIGINS=https://dev.repmaxer.pl,http://localhost:3000
WEB_ORIGIN=https://dev.repmaxer.pl
```

Clerk (aplikacja testowa): Sign-in / Sign-up / After sign-in = `https://dev.repmaxer.pl` (+ localhost). Preview `*.vercel.app` zostaw, jeśli testujesz PR-y.

`dev.repmaxer.pl` ma `noindex` w kodzie (`lib/siteHost.ts`) — nie ruszaj `NEXT_PUBLIC_SITE_URL` produkcji.

### 6. Ruleset na `main`

Settings → Rules → Rulesets:

- Blokada force-push i usunięcia
- Wymagany PR + check **CI**
- Linear history
- Auto-merge włączony (solo)

## Rollback

| Warstwa | Jak |
|---|---|
| API (od razu po złym smoke) | automatycznie — poprzedni digest |
| API (później) | Actions → **Rollback API** → environment + obraz (`ghcr.io/<owner>/trainer-app-api@sha256:…` albo `:sha-abc` / `:0.0.N`) |
| Front | Vercel → Deployment → **Rollback** (bez rebuildu) |
| Schema | branch Neon `pre-migrate-<sha>` (gdy ustawione `NEON_API_KEY`) |

Migracji w dół nie robimy. Rollback obrazu przy addytywnej migracji jest bezpieczny.

## Destrukcyjne DDL

CI pada, gdy `dotnet ef migrations script --idempotent` zawiera `DROP COLUMN` / `DROP TABLE` / `ALTER COLUMN … TYPE`.

Świadoma zgoda: etykieta PR `allow-destructive-ddl` albo `[allow-destructive-ddl]` w commicie.

## Smoke

```bash
./scripts/smoke.sh --base-url https://repmaxer-prod.azurewebsites.net --expect-version <sha>
```

Sprawdza `/api/health/live` (w tym `version`), `/api/health` (baza), `GET /` = 200, `GET /api/clients` = 401.

## E2E

```bash
E2E_BASE_URL=https://dev.repmaxer.pl \
E2E_TRAINER_EMAIL=… E2E_TRAINER_PASSWORD=… \
npm run e2e --prefix apps/web
```

Bez maila/hasła: tylko landing + `/sign-in` (job zielony). Pełna ścieżka: klienci → kreator → link portalu.

## Troubleshooting

| Objaw | Fix |
|---|---|
| Release: brak `AZURE_CLIENT_ID` | Environment secrets, nie repo `AZURE_CREDENTIALS` JSON |
| `ImagePullUnauthorizedFailure` | `GHCR_TOKEN` `read:packages`; krok keep-ghcr po deployu |
| Smoke: zły `version` | stary kontener — Log stream, Always On, 2–3 min |
| Smoke: 200 na `/api/clients` | Clerk wyłączony na Web App — ustaw `Clerk__Authority` |
| Vercel `environment=dev` fail | utwórz Custom Environment `dev` (krok 4) |
| Reminders czerwone | `CRON_KEY` + `API_BASE_URL` w Environment **prod** |
| Migracje `Couldn't set …/neondb?sslmode` | do CI **direct**, nie pooler; `DbConnectionString.Normalize` |
| Dependency review: not supported | Settings → Code security → **Dependency graph** On. Job nie blokuje bramki CI. |
