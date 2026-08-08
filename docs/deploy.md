# Deploy RepMaxer — od zera do działającej produkcji (MVP)

**Założenie MVP:** jedno środowisko (produkcja dla design partnerów).  
Nie zakładamy osobnego Azure DEV. Vercel Preview = darmowy front do testów.

Masz już: repo na GitHubie `Prezentytu/trainer-app` + sekret Neona.  
Idź **po kolei** od kroku, na którym jesteś.

---

## Status — odhaczaj

- [x] Kod na GitHubie (`Prezentytu/trainer-app`)
- [x] Sekret Neona w GitHub (`DEV_DB_CONNECTION_STRING`)
- [ ] A. Clerk (aplikacja + klucze)
- [ ] B. Azure Web App
- [ ] C. Reszta sekretów GitHub
- [ ] D. Vercel (web)
- [ ] E. Dopięcie CORS + Clerk URLs
- [ ] F. Pierwszy Deploy API
- [ ] G. Smoke test

---

# A. Clerk — login trenera

### A1. Utwórz aplikację

1. Otwórz [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. U góry przełącznik aplikacji → **Create application**
3. **Name:** `RepMaxer`
4. Zaznacz **Email** (reszta opcjonalnie)
5. Kliknij **Create application**

### A2. Skopiuj klucze (potrzebne zaraz)

1. W menu: **Configure** → **API keys** (albo **Developers → API keys**)
2. Skopiuj do notatnika:
   - **Publishable key** → zaczyna się od `pk_test_…`  
     → to będzie `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret key** → **Show** → `sk_test_…`  
     → to będzie `CLERK_SECRET_KEY`

### A3. Skopiuj Authority (dla Azure API)

1. Nadal w **API keys** / stronie z Frontend API
2. Znajdź URL w stylu: `https://something.clerk.accounts.dev`
3. Skopiuj **bez** `/` na końcu  
   → to będzie `Clerk__Authority` w Azure

> Na razie **nie** ustawiaj redirect URL — wrócisz po Vercel (krok E).

---

# B. Azure — Web App na kontener

Cel: `https://trainer-app-api.azurewebsites.net` (nazwa musi być globalnie unikalna; jeśli zajęta, dodaj sufiks).

### B1. Utwórz Web App

1. Otwórz [https://portal.azure.com](https://portal.azure.com)
2. Wyszukaj u góry: **App Services** → Enter
3. **+ Create** → **Web App**
4. Zakładka **Basics** — ustaw dokładnie:

| Pole | Wartość |
|---|---|
| Subscription | ta sama co fizjo |
| Resource Group | **Create new** → `trainer-app` (albo wybierz istniejącą `fizjo-app` jeśli wolisz) |
| Name | `trainer-app-api` (jeśli zajęta: `trainer-app-api-wa`) |
| Secure unique default hostname | domyślnie OK |
| Publish | **Container** |
| Operating System | **Linux** |
| Region | jak fizjo (np. West Europe / Germany West Central) |
| Linux Plan | **Select / Create** — najlepiej **ten sam App Service Plan co fizjo** (oszczędność). Jeśli nie widać: Create new, SKU **Basic B1** |
| Pricing | B1 wystarczy na MVP |

5. **Next** aż do końca (albo **Review + create**)
6. **Create** → poczekaj → **Go to resource**

Zapisz URL z Overview, np.:

`https://trainer-app-api.azurewebsites.net`

### B1b. Always On + Health check (cold start)

**Mechanizm podstawowy = Azure Always On** (darmowe na planie Basic B1+). Bez tego App Service usypia proces po ~20 min bezczynności — klient na siłowni czeka na pull obrazu + start .NET (dziesiątki sekund).

**Nie używamy crona GitHub Actions jako keep-alive** — schedule jest best-effort (opóźnienia 10–40 min, runy bywają porzucane; w repo publicznym wyłącza się po 60 dniach bez aktywności). Ping do endpointu z bazą trzymałby też Neon aktywny 24/7 i psuł scale-to-zero.

#### General settings (Settings → Configuration → General settings)

| Pole | Wartość |
|---|---|
| **Always On** | **On** |
| ARR affinity | **Off** |
| HTTP version | **2.0** |

Save.

#### App settings (Settings → Environment variables)

| Name | Value | Po co |
|---|---|---|
| `WEBSITES_PORT` | `8080` | port kontenera (już masz) |
| `WEBSITES_CONTAINER_START_TIME_LIMIT` | `600` | domyślne 230 s bywa za krótkie przy pullu obrazu → restart w pętli |
| `WEBSITES_ENABLE_APP_SERVICE_STORAGE` | `false` | bez montowania `/home` → szybszy start |
| `WEBSITE_WARMUP_PATH` | `/api/health/live` | warmup po deployu (bez bazy) |
| `Database__MigrateOnStartup` | `false` | migracje tylko w CI (`Deploy API` → job migrate) |

#### Health check (Monitoring → Health check) — dopiero po deployu z `/api/health/live`

1. Enable
2. Ścieżka: **`/api/health/live`** (bez bazy)

**Nigdy** nie ustawiaj tu `/api/health` — ten endpoint robi `CanConnectAsync()` do Neona. Azure Health check pinguje ~co minutę i **kasuje oszczędności scale-to-zero** (~+14 USD/mies. przy Launch 0.25 CU always-on).

Rozdział endpointów:

| Endpoint | Dotyka DB? | Do czego |
|---|---|---|
| `/` oraz `/api/health/live` | nie | Always On, Azure Health check, warmup |
| `/api/health` | tak | smoke po deployu (`API_HEALTH_URL` w GitHub), diagnostyka |

#### Neon (Console → Branch → Compute)

- Azure App Settings `ConnectionStrings__Default` → connection string **pooled** (host z `-pooler`).
- GitHub secret `DEV_DB_CONNECTION_STRING` (migracje CI) → **direct** (bez `-pooler`).
- **Scale to zero** zostaje włączone (5 min) — wybudzenie bazy to ~kilkaset ms. Wyłączaj dopiero gdy po Always On różnica warm vs cold-DB > 800 ms.
- Sprawdź **region** Neon vs Azure Web App (Overview → Location). Różne regiony = +100 ms na każde SQL.

Sekrety `API_HEALTH_URL` / `API_HEALTH_URL_PROD` zostają — używa ich health check w workflow `Deploy API` (po deployu), nie keep-alive.

### B2. Ustawienia aplikacji (env) — WAŻNE, zrób przed deployem

1. W Web App w lewym menu: **Settings** → **Environment variables**  
   (w starszym UI: **Configuration** → **Application settings**)
2. Zakładka **App settings** → **+ Add** — dodaj **każdą** pozycję osobno:

| Name | Value | Skąd |
|---|---|---|
| `Database__Provider` | `Postgres` | wpisz ręcznie |
| `ConnectionStrings__Default` | `postgresql://…` | **ten sam** string co w sekretcie Neona (pooled); URI jest tłumaczony na format Npgsql przez `DbConnectionString.Normalize` |
| `Clerk__Authority` | `https://….clerk.accounts.dev` | z kroku A3 |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | na razie tylko lokal; **dopiszesz Vercel w kroku E** |
| `ASPNETCORE_ENVIRONMENT` | `Production` | wpisz ręcznie |
| `WEBSITES_PORT` | `8080` | wpisz ręcznie (Docker słucha na 8080) |
| `WEB_ORIGIN` | `https://twoja-app.vercel.app` | origin frontu (linki w e-mailach) |
| `Email__ResendApiKey` | `re_…` | klucz [Resend](https://resend.com) — opcjonalnie; bez niego wysyłka linków zwraca komunikat |
| `Email__From` | `RepMaxer <hello@twojadomena.pl>` | nadawca Resend (zweryfikowana domena) |
| `Push__PublicKey` | klucz VAPID publiczny | para z `web-push generate-vapid-keys`; ten sam publiczny w Vercel jako `NEXT_PUBLIC_VAPID_PUBLIC_KEY` |
| `Push__PrivateKey` | klucz VAPID prywatny | tylko na API — nigdy na froncie |
| `Push__Subject` | `mailto:support@…` | kontakt VAPID |
| `Cron__Key` | losowy sekret | ten sam w GitHub secret `CRON_KEY` (workflow `reminders.yml`) |

3. Kliknij **Apply** → **Confirm** (restart).

> Podwójne podkreślenie `__` w nazwach jest celowe (ASP.NET mapuje `Clerk__Authority` → `Clerk:Authority`).

### B3. Registry credentials (żeby Azure mógł ciągnąć obraz z GHCR)

Workflow wdraża obraz `ghcr.io/prezentytu/trainer-app-api:…`. Azure musi umieć go pobrać.

1. W Web App: **Deployment** → **Deployment Center** (albo **Settings → Deployment Center**)
2. **Source:** Container Registry / **Settings** kontenera
3. Ustaw (nazwy pól mogą się lekko różnić):

| Pole | Wartość |
|---|---|
| Registry source / Image source | Private registry / Other |
| Registry server URL | `https://ghcr.io` |
| Image and tag | na razie `prezentytu/trainer-app-api:dev-latest` (powstanie przy pierwszym deployu) |
| Continuous deployment | Off |
| Authentication | Admin / Username + password |
| Username | Twój login GitHub (np. `Prezentytu` / Twój user) |
| Password | **Personal Access Token** z uprawnieniem `read:packages` |

**Jak zrobić PAT (jeśli nie masz `GHCR_TOKEN`):**

1. GitHub → avatar → **Settings** → **Developer settings** → **Personal access tokens**
2. **Tokens (classic)** → **Generate new token (classic)**
3. Note: `trainer-app-ghcr`
4. Scopes: zaznacz **`write:packages`** (zawiera read) oraz **`repo`** jeśli repo private
5. **Generate** → skopiuj token (pokazuje się raz)
6. Ten token = secret `GHCR_TOKEN` **oraz** hasło do registry w Azure

> Po pierwszym udanym workflow Azure i tak dostanie obraz przez `azure/webapps-deploy` — credentials w Deployment Center są siatką bezpieczeństwa przy restarcie.

### B4. Service principal do GitHub Actions (`AZURE_CREDENTIALS`)

**Opcja najszybsza:** jeśli w repo fizjo masz już secret `AZURE_CREDENTIALS` z dostępem do całej subskrypcji — skopiuj **tę samą wartość JSON** do repo `trainer-app`.

**Opcja od zera (Cloud Shell):**

1. Azure Portal → ikona **Cloud Shell** (`>_`) u góry → Bash
2. Sprawdź subskrypcję i RG:

```bash
az account show --query id -o tsv
az group list -o table
```

3. Utwórz SP (podstaw swoje ID i nazwę RG z kroku B1):

```bash
az ad sp create-for-rbac \
  --name "github-trainer-app" \
  --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/trainer-app \
  --sdk-auth
```

4. Cały JSON ze stdout (z `clientId`, `clientSecret`, `subscriptionId`, `tenantId`) → to jest `AZURE_CREDENTIALS`.  
   Skopiuj do notatnika.

---

# C. GitHub Secrets — reszta (Neon już masz)

1. Otwórz [https://github.com/Prezentytu/trainer-app](https://github.com/Prezentytu/trainer-app)
2. **Settings** → **Secrets and variables** → **Actions**
3. Powinieneś już mieć: `DEV_DB_CONNECTION_STRING`
4. **New repository secret** — dodaj po kolei:

| Name | Value |
|---|---|
| `GHCR_TOKEN` | PAT z kroku B3 |
| `AZURE_CREDENTIALS` | cały JSON z kroku B4 (albo kopia z fizjo) |
| `AZURE_WEBAPP_NAME` | dokładnie nazwa Web App, np. `trainer-app-api` (**bez** `.azurewebsites.net`) |
| `API_HEALTH_URL` | `https://trainer-app-api.azurewebsites.net/api/health` (podstaw swoją nazwę) |

**Nie dodawaj na razie** `PROD_*` — w MVP odpalasz workflow z `environment: dev`, a „dev” w nazwie sekretu = Twoja jedyna produkcja.

Checklist sekretów po tej sekcji:

- [x] `DEV_DB_CONNECTION_STRING`
- [ ] `GHCR_TOKEN`
- [ ] `AZURE_CREDENTIALS`
- [ ] `AZURE_WEBAPP_NAME`
- [ ] `API_HEALTH_URL`

---

# D. Vercel — frontend

### D1. Import projektu

1. [https://vercel.com/new](https://vercel.com/new)
2. **Import** Git Repository → wybierz `Prezentytu/trainer-app`  
   (jeśli nie widać: Connect GitHub → daj Vercelowi dostęp do org `Prezentytu`)
3. Zanim klikniesz Deploy, ustaw:

| Pole | Wartość |
|---|---|
| Project Name | `trainer-app` (lub `repmaxer`) |
| Framework Preset | Next.js |
| Root Directory | **Edit** → wpisz `apps/web` → **Continue** |
| Build Command | zostaw domyślne |
| Output Directory | zostaw domyślne |
| Install Command | zostaw domyślne |

### D2. Environment Variables (PRZED pierwszym Deploy)

W tej samej stronie importu sekcja **Environment Variables** — dodaj 3 zmienne.  
Dla każdej zaznacz **Production**, **Preview**, **Development**:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://trainer-app-api.azurewebsites.net` (**bez** `/` na końcu) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_…` z Clerk (A2) |
| `CLERK_SECRET_KEY` | `sk_test_…` z Clerk (A2) |
| `NEXT_PUBLIC_SITE_URL` | URL Vercel, np. `https://trainer-app.vercel.app` (**bez** `/` na końcu) — używane do `metadataBase` / Open Graph |

4. **Deploy**
5. Poczekaj na Success
6. Skopiuj URL, np. `https://trainer-app.vercel.app` (albo z Project → Domains)

> Front może jeszcze nie działać w 100% (API nie wdrożone / CORS) — to normalne. Najpierw kończymy E i F.

---

# E. Dopięcie CORS i Clerk (po Vercel)

### E1. Azure — ALLOWED_ORIGINS

1. Azure → Twoja Web App → **Environment variables**
2. Edytuj `ALLOWED_ORIGINS`
3. Ustaw (przykład — podstaw swój Vercel URL):

```text
https://trainer-app.vercel.app,http://localhost:3000
```

4. **Apply** → Save

### E2. Clerk — dozwolone URL-e

Aplikacja używa **własnych** stron `/sign-in` i `/sign-up` (nie hostowanego Account Portal). Middleware przekierowuje niezalogowanych na `/sign-in`; `/` jest publiczne (landing dla gości, Panel dla zalogowanych).

1. Clerk Dashboard → Twoja app **RepMaxer**
2. **Configure** → **Domains** / **Paths** / **Redirects** (zależnie od UI)
3. Dodaj / ustaw:
   - Sign-in URL: `https://<twoj-vercel>/sign-in`
   - Sign-up URL: `https://<twoj-vercel>/sign-up`
   - Allowed redirect / after sign-in: `https://<twoj-vercel>` (root = Panel)
   - After sign-up: `https://<twoj-vercel>`
   - To samo dla lokalnego: `http://localhost:3000/sign-in`, `/sign-up`, root `http://localhost:3000`
4. Save
5. (Opcja) w Clerk wyłącz / nie używaj Account Portal jako domyślnego sign-in — żeby użytkownicy nie lądowali na `*.accounts.dev`

### E3. (Opcja) tylko zaproszenia

1. Clerk → **Configure** → **User & authentication** → **Restrictions** (lub Sign-up)
2. Wyłącz publiczny sign-up / włącz **Allowlist** / **Invitations only** — jak wolisz
3. Później: **Users** → **Invite** → email design partnera

---

# F. Pierwszy Deploy API (GitHub Actions)

### F1. Odpal workflow

1. GitHub → `Prezentytu/trainer-app` → zakładka **Actions**
2. Po lewej: **Deploy API**
3. **Run workflow** (przycisk po prawej)
4. Ustaw:
   - **Use workflow from:** `main`
   - **environment:** `dev` ← **zostaw dev** (to Twoja jedyna produkcja w MVP)
   - **skip_migrations:** `false` ← **musi być false** za pierwszym razem
5. **Run workflow**

### F2. Co powinno się stać (3 joby)

1. **Build Docker image** — buduje i pcha do `ghcr.io/prezentytu/trainer-app-api:0.0.N`
2. **Apply EF migrations** — `dotnet restore` + bundle EF + apply na Neon (`DEV_DB_CONNECTION_STRING`)
3. **Deploy to Azure** — ustawia kontener na Web App + health check

Poczekaj aż wszystkie 3 będą zielone (5–15 min).

Jeśli job migracji pada na `NETSDK1004` / brak `project.assets.json` — upewnij się, że na `main` jest workflow z krokiem **Restore NuGet packages** przed `dotnet ef migrations bundle`. Awaryjnie: **Run workflow** z `skip_migrations: true` (tylko gdy schemat Neon jest już założony).

### F3. Sprawdź health

W przeglądarce otwórz:

```text
https://trainer-app-api.azurewebsites.net/api/health
```

Oczekiwane: JSON z `"status":"ok"`.

---

# G. Smoke test — że „działa”

### G1. Panel trenera

1. Otwórz URL Vercel
2. Powinien przekierować na Clerk Sign-in
3. Zaloguj się (konto, które masz w Clerk Users — albo najpierw **Invite** siebie w Clerk → **Users** → **Invite**)
4. Po logowaniu: Panel RepMaxer

Jeśli pusty ekran / CORS: wróć do E1 (`ALLOWED_ORIGINS` musi być **dokładnie** origin z paska adresu, `https://…` bez `/` na końcu).

### G2. Portal klienta (bez logowania)

1. W panelu: **Klienci** → dodaj klienta
2. Przypisz plan (szablon)
3. **Skopiuj link dla klienta**
4. Otwórz w oknie incognito — **bez** Clerk
5. Powinna być karta **Twój postęp**

### G3. Eksport

1. Panel → **Eksportuj dane** → pobiera się plik JSON

---

# Co robić przy kolejnych zmianach kodu

| Zmiana | Co odpalasz |
|---|---|
| Tylko frontend (`apps/web`) | push na `main` → Vercel sam redeployuje Production |
| Backend / migracje (`apps/api`) | **Actions → Deploy API → Run** (`environment: dev`, migracje `false` tylko gdy nie było zmian schematu — inaczej zostaw migracje włączone) |
| PR do testów UI | Vercel Preview URL (automatycznie) |

---

# Troubleshooting (najczęstsze)

| Objaw | Fix |
|---|---|
| Actions: `GHCR_TOKEN` / login failed | Nowy PAT z `write:packages`; secret bez spacji/enterów |
| Actions: migracje fail `Couldn't set …/neondb?sslmode` | Npgsql nie parsuje URI — wymaga formatu `klucz=wartość`, więc URI musi przejść przez `DbConnectionString.Normalize` (`apps/api/DbConnectionString.cs`). Ten błąd oznacza, że string ominął normalizację: sprawdź, czy krok „Apply migrations" nie przekazuje `--connection` (bundle ma czytać `DB_CONNECTION_STRING` przez `DesignTimeDbContextFactory`). Hasło ze znakami specjalnymi: URL-encode. Do migracji lepiej **direct** (bez `-pooler`), do Azure App Settings możesz użyć pooled. |
| Actions: Azure login fail | Zły JSON w `AZURE_CREDENTIALS`; SP musi mieć Contributor na RG |
| Actions: deploy OK, health fail | Poczekaj 1–2 min; sprawdź Log stream w Azure; `WEBSITES_PORT=8080` |
| Web: CORS | `ALLOWED_ORIGINS` = dokładny Vercel origin |
| Web: 401 na API | `Clerk__Authority` bez `/`; te same klucze Clerk w Vercel i Authority w Azure z **tej samej** aplikacji Clerk |
| Azure: kontener nie startuje | Log stream → często brak env lub zły obraz; odpal Deploy API jeszcze raz |
| Clerk: redirect mismatch | Dodaj Vercel URL w Clerk Allowed redirects (krok E2) |

---

# Szybka ściągawka sekretów (MVP = jedno środowisko)

| Gdzie | Nazwa | Uwagi |
|---|---|---|
| GitHub | `DEV_DB_CONNECTION_STRING` | Neon pooled — **już masz** |
| GitHub | `GHCR_TOKEN` | PAT `write:packages` |
| GitHub | `AZURE_CREDENTIALS` | JSON z `az ad sp create-for-rbac --sdk-auth` |
| GitHub | `AZURE_WEBAPP_NAME` | np. `trainer-app-api` |
| GitHub | `API_HEALTH_URL` | `https://….azurewebsites.net/api/health` |
| Azure App Settings | `Database__Provider` | `Postgres` |
| Azure App Settings | `ConnectionStrings__Default` | ten sam Neon |
| Azure App Settings | `Clerk__Authority` | `https://….clerk.accounts.dev` — **wymagane w Production** (API nie wystartuje bez tego) |
| Azure App Settings | `Clerk__Audience` | opcjonalnie — gdy ustawione, walidacja `aud` JWT |
| Azure App Settings | `ALLOWED_ORIGINS` | Vercel + localhost |
| Azure App Settings | `WEBSITES_PORT` | `8080` |
| Vercel | `NEXT_PUBLIC_API_URL` | URL Azure API |
| Vercel | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_…` |
| Vercel | `CLERK_SECRET_KEY` | `sk_test_…` |

---

# H. Backup i odtworzenie (Neon)

Neon trzyma automatyczne PITR w planie — to nie zwalnia z procedury.

### H1. Ręczny snapshot przed ryzykowną migracją

1. Neon Console → projekt → **Branches** / **Backups** (nazwa zależy od UI).
2. Utwórz branch / point-in-time bookmark z opisem `pre-migrate-YYYY-MM-DD`.
3. Alternatywa CLI: `pg_dump` connection string (preferuj **direct**, nie pooler) → plik `.sql.gz` poza repo.

### H2. Test restore (raz przed launch design partners)

1. Utwórz tymczasowy branch Neon z punktu H1.
2. Podstaw `ConnectionStrings__Default` lokalnie / na staging Web App.
3. `GET /api/health` → `"database":"ok"`.
4. Zaloguj trenera, otwórz jednego klienta — dane widoczne.
5. Usuń tymczasowy branch.

### H3. Eksport aplikacyjny (uzupełnienie, nie zamiennik)

Trener: **Ustawienia → Pobierz pełną kopię (.json)** — zawiera klientów, plany, sesje z seriami, pomiary, wywiad, check-iny (bez surowych tokenów portalu).

RPO/RTO (MVP): RPO ≈ okno Neon PITR; RTO = odtworzenie brancha + podmiana connection string (~30–60 min).

---

# I. Observability (MVP)

- Liveness (bez DB): `GET /` oraz `GET /api/health/live` — Always On + Azure Health check.
- Readiness (z DB): `GET /api/health` — smoke po deployu (`API_HEALTH_URL` w Actions).
- Każda odpowiedź API: nagłówek `X-Correlation-Id` (przyjmujemy też z requestu).
- Nieobsłużone wyjątki → JSON `{ "message": "…" }` + log z CorrelationId (bez stack trace w Production).
- Sentry / analytics produktowe: poza zakresem early access (wymaga osobnej decyzji o zależności).

---

**Następny krok dla Ciebie teraz:** sekcja **A (Clerk)**, potem **B (Azure Web App)**. Jak dojdziesz do konkretnego ekranu i coś nie pasuje do opisu — wklej screenshot / nazwę pola, dopasujemy 1:1.

Przykładowe zmienne: [`.env.example`](../.env.example). Deploy runbook: ten plik.
