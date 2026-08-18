# Deploy RepMaxer — produkcja

**Cel:** izolowany stack **prod**: nowa Web App, **nowy** projekt Neon, **nowa** aplikacja Clerk, Vercel.

Osobna resource group, osobny App Service Plan, osobny Neon, osobny Clerk. Nie współdziel bazy ani planu z innymi produktami na tej samej subskrypcji.

**W git idą nazwy zmiennych i zasobów, nigdy wartości.** Connection stringi, PAT, klucze `sk_*` / `re_*`, JSON service principala, hasła Neon — tylko GitHub Environment / Azure / Vercel. Ten plik jest runbookiem, nie notatnikiem sekretów.

**Release train** (dev `trainer-app-api` + `dev.repmaxer.pl`, potem ręcznie **Promote to prod** → `repmaxer-prod` + `repmaxer.pl`): [ci-cd.md](ci-cd.md). GitHub Environments `dev` / `prod` — **te same nazwy sekretów**, nie `DEV_*` / `*_PROD`. `deploy-api.yml` to break-glass.

Vercel Preview (PR) zostaje. Production wdraża **Promote to prod**, nie gitowa integracja Vercela (`apps/web/vercel.json`) i nie sam merge na `main`.

**Domeny (stan sierpień 2026):** kanoniczna produkcja frontu to [https://repmaxer.pl](https://repmaxer.pl). `repmaxer.com` jest kupione, **DNS jeszcze nieustawione** — nie wpinaj `.com` do CORS/Clerk jako działającego originu, dopóki nie zrobisz sekcji J (301 na `.pl`).

Idź **po kolei**. Opcjonalnie później (nie blokuje pierwszego deploju API): Resend, VAPID, `Cron__Key`, klucze Clerk `pk_live` / `sk_live`, DNS `.com` (sekcja J).

---



## Zasada nazewnictwa — nic nie przemianowujesz

Kod czyta **te same** nazwy zmiennych wszędzie (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `Clerk__Authority`, `ConnectionStrings__Default`). Rozdział dev/prod jest **miejscem**, nie prefiksem w kodzie.


| Warstwa            | Co robisz                                                                                                                                                                                                                           | Czego nie robisz                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **GitHub Actions** | Environments `dev` i `prod` z **tymi samymi** nazwami (`DB_CONNECTION_STRING`, `AZURE_WEBAPP_NAME`, `API_BASE_URL`, `AZURE_CLIENT_ID`…). Zobacz [ci-cd.md](ci-cd.md). | Nie tworzysz `DB_CONNECTION_STRING_PROD`. Nie wracaj do ternary `DEV_*` / `*_PROD`. |
| **Azure**          | Nowa Web App `repmaxer-prod` ma **te same** nazwy App Settings co stara (`Clerk__Authority`, `ConnectionStrings__Default`, …), ale **inne wartości** i inna maszyna. `trainer-app-api` nie ruszasz.                                 | Nie dodajesz `Clerk__Authority_PROD` na Azure — takiej zmiennej kod nie czyta.             |
| **Vercel**         | Te same nazwy (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_API_URL`). Rozdział = checkbox **Production** / **Preview** / **Development** przy każdej zmiennej.                                            | Nie tworzysz `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_PROD`. Next.js tego nie widzi.             |
| **Lokalnie**       | `apps/web/.env.local` (nie w gicie): localhost + ewentualnie `pk_test` do testów loginu.                                                                                                                                            | Nie wklejasz `pk_live` / connection stringa prod do laptopa „na stałe”.                    |


Workflow `Release` (dev), `Promote to prod` i break-glass `Deploy API` biorą sekrety z GitHub Environment (`dev` albo `prod`). `GHCR_TOKEN` jest **jeden** (wspólny, `read:packages`) — nie duplikujesz. Push do GHCR idzie `GITHUB_TOKEN`.

### Gdzie wklejasz klucze Clerk (test i live)

Nazwy po stronie Vercel/Azure **się nie zmieniają**. Zmienia się tylko wartość i (na Vercel) środowisko.


| Klucz z dashboardu Clerk                                          | Gdzie wklejasz                                        | Nazwa pola                          |
| ----------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------- |
| Publishable `pk_test_…` albo później `pk_live_…`                  | Vercel → Environment Variables                        | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| Secret `sk_test_…` albo później `sk_live_…`                       | Vercel → Environment Variables                        | `CLERK_SECRET_KEY`                  |
| Frontend API / Authority `https://….clerk.accounts.dev` (bez `/`) | Azure Web App `repmaxer-prod` → Environment variables | `Clerk__Authority`                  |


**Pierwszy deploy:** zaznacz na Vercel przy tych zmiennych **Production + Preview + Development** i wklej `pk_test` **/** `sk_test` z nowej aplikacji Clerk `RepMaxer`. Preview (PR) i prod wtedy gadają z tym samym Clerk test — prościej na start.

**Gdy masz już produkcyjne** `pk_live` **/** `sk_live`**:** nie dodajesz nowych nazw. W Vercel **edytujesz** te same zmienne:

1. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — wartość `pk_live_…`, checkbox **tylko Production** (odznacz Preview i Development, albo zrób drugą instancję zmiennej: Production = live, Preview+Development = `pk_test`).
2. `CLERK_SECRET_KEY` — analogicznie `sk_live_…` tylko na Production.
3. Azure `repmaxer-prod` → `Clerk__Authority` zostaje ten sam host Clerk **tej samej aplikacji** (zwykle nadal `https://xxx.clerk.accounts.dev` aż podłączysz custom domain w Clerk). Nie ruszaj `Clerk__Authority` na `trainer-app-api`.
4. Vercel → **Redeploy** Production (zmienne `NEXT_PUBLIC_`* wchodzą dopiero po rebuild).

Lokalnie (`.env.local`) zostaw `pk_test` albo puste (API `local-dev` bez Clerk).

### Notatnik — co skopiować i gdzie wkleić (kolejność)

Wypełniaj w miarę kroków A–E. **GitHub: tylko dodajesz wiersze. Vercel/Azure: te same nazwy, nowe albo edytowane wartości.**


| #   | Skąd bierzesz                      | Wklejasz                                                               | Nazwa                               | Uwaga                                                             |
| --- | ---------------------------------- | ---------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------- |
| 1   | Clerk RepMaxer → Publishable       | Vercel                                                                 | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | start: `pk_test_`; potem live: ta sama nazwa, checkbox Production |
| 2   | Clerk → Secret (Show)              | Vercel                                                                 | `CLERK_SECRET_KEY`                  | j.w. `sk_test_` / `sk_live_`                                      |
| 3   | Clerk → Frontend API URL           | Azure `repmaxer-prod`                                                  | `Clerk__Authority`                  | bez `/`; nie na `trainer-app-api`                                 |
| 4   | Neon `repmaxer` pooled (`-pooler`) | Azure `repmaxer-prod`                                                  | `ConnectionStrings__Default`        | nie do GitHub `DEV_*`                                             |
| 5   | Neon `repmaxer` direct             | GitHub Environment **prod**                                            | `DB_CONNECTION_STRING`              | nie wklejaj do `dev`                                              |
| 6   | OIDC (`az ad app federated-credential`) | GitHub Environment **prod**                                       | `AZURE_CLIENT_ID` / `TENANT_ID` / `SUBSCRIPTION_ID` | nie JSON `AZURE_CREDENTIALS` — [ci-cd.md](ci-cd.md) |
| 7   | nazwa Web App                      | GitHub Environment **prod**                                            | `AZURE_WEBAPP_NAME`                 | wartość: `repmaxer-prod`                                          |
| 8   | URL API                            | GitHub Environment **prod**                                            | `API_BASE_URL`                      | `https://repmaxer-prod.azurewebsites.net`                         |
| 9   | —                                  | Vercel                                                                 | `NEXT_PUBLIC_API_URL`               | `https://repmaxer-prod.azurewebsites.net`                         |
| 10  | kanoniczny front                   | Vercel `NEXT_PUBLIC_SITE_URL` + Azure `ALLOWED_ORIGINS` i `WEB_ORIGIN` | te same nazwy                       | **teraz:** `https://repmaxer.pl` (+ localhost). `.com` dopiero po sekcji J |


---



## Status — odhaczaj

- [ ] Kod na GitHubie
- [ ] A. Clerk — nowa aplikacja `RepMaxer` (nie instancja z innego produktu)
- [ ] A4. Neon — nowy projekt `repmaxer` (dwa connection stringi)
- [ ] B. Azure — RG `repmaxer-prod` + plan B1 + Web App `repmaxer-prod`
- [ ] C. GitHub Environments `dev` / `prod` ([ci-cd.md](ci-cd.md))
- [ ] D. Vercel — weryfikacja projektu/domeny; cutover env **po F** (nie drugi projekt)
- [ ] E. CORS + Clerk URLs
- [ ] F. Promote to prod albo Deploy API, Environment `prod`
- [ ] G. Smoke test na `https://repmaxer.pl`
- [ ] J. DNS `repmaxer.com` → 301 na `.pl` (gdy będziesz gotów; nie blokuje API)

---



## Nazwy zasobów RepMaxer


| Zasób            | Wartość                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| Subskrypcja      | Twoja subskrypcja Azure                                                                          |
| Resource Group   | `repmaxer-prod` (**Create new**)                                                                 |
| App Service Plan | **nowy** Linux **B1**, ten sam region co Neon. Osobny plan — nie współdziel CPU z innymi Web Appami. |
| Web App          | `repmaxer-prod` (Container, Linux)                                                               |
| URL API          | `https://repmaxer-prod.azurewebsites.net`                                                        |
| Neon             | nowy projekt `repmaxer`, region **ten sam** co Web App                                           |
| Clerk            | nowa aplikacja **RepMaxer**                                                                      |
| Vercel           | root `apps/web`, `NEXT_PUBLIC_API_URL` = URL `repmaxer-prod`                                     |
| GitHub Actions   | **Promote to prod** (albo break-glass **Deploy API**)                                            |


Obraz Dockera: `ghcr.io/<owner>/trainer-app-api` (owner = właściciel tego repo). Tag przy prod: `prod-latest` + `0.0.N`.

---



# A. Clerk — nowa aplikacja



### A1. Utwórz aplikację

1. [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Przełącznik aplikacji → **Create application**
3. **Name:** `RepMaxer`
4. Zaznacz **Email**
5. **Create application**

Nie używaj instancji Clerk z innego produktu.

### A2. Klucze

**Configure** → **API keys**:

- **Publishable key** `pk_test_…` → Vercel `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- **Secret key** `sk_test_…` → Vercel `CLERK_SECRET_KEY`

Na start wystarczą klucze test. Live (`pk_live` / `sk_live`) dopiero gdy domena i billing Clerk są gotowe.

### A3. Authority (Azure API)

URL w stylu `https://something.clerk.accounts.dev` — **bez** `/` na końcu → Azure `Clerk__Authority`.

Redirect URL-e ustawiasz w kroku E (po Vercel).

---



# A4. Neon — nowy projekt

Nowy projekt w [https://console.neon.tech](https://console.neon.tech): nazwa `repmaxer`.  
Region = region Web App z kroku B (inny region = +~100 ms na każde SQL).  
Scale to zero (5 min) zostaje włączone na start.

Skopiuj **dwa** connection stringi z tego projektu (nie ze stacku **dev**):


| Gdzie                                           | Który string                  | Po co                                    |
| ----------------------------------------------- | ----------------------------- | ---------------------------------------- |
| Azure App Settings `ConnectionStrings__Default` | **pooled** (host z `-pooler`) | runtime API                              |
| GitHub Environment `prod` → `DB_CONNECTION_STRING` | **direct** (bez `-pooler`) | migracje CI (`Promote to prod` / `Deploy API`) |


URI przechodzi przez `DbConnectionString.Normalize` na format Npgsql. Hasło ze znakami specjalnymi: URL-encode.

Nie wpinaj tego stringa do Web App `trainer-app-api` ani do GitHub Environment `dev`.

---



# B. Azure — Web App `repmaxer-prod`



### B1. Utwórz Web App

1. [https://portal.azure.com](https://portal.azure.com) → **App Services** → **+ Create** → **Web App**
2. Zakładka **Basics**:


| Pole             | Wartość                                                   |
| ---------------- | --------------------------------------------------------- |
| Subscription     | Twoja subskrypcja Azure                                   |
| Resource Group   | **Create new** → `repmaxer-prod`                          |
| Name             | `repmaxer-prod` (jeśli zajęta: `repmaxer-prod-api`)       |
| Publish          | **Container**                                             |
| Operating System | **Linux**                                                 |
| Region           | ten sam co projekt Neon                                   |
| Linux Plan       | **Create new**, SKU **Basic B1** (osobny plan)            |


1. **Review + create** → **Create** → **Go to resource**

Zapisz URL: `https://repmaxer-prod.azurewebsites.net`

### B1b. Always On + Health check

Bez Always On proces usypia po ~20 min — klient na siłowni czeka na pull obrazu + start .NET.

**Nie** używamy crona GitHub jako keep-alive. **Nie** pinguj `/api/health` z Azure Health check — to trzyma Neon 24/7 (~+14 USD/mies. przy Launch 0.25 CU).

#### General settings (Settings → Configuration → General settings)


| Pole          | Wartość |
| ------------- | ------- |
| **Always On** | **On**  |
| ARR affinity  | **Off** |
| HTTP version  | **2.0** |




#### App settings (warmup / start)


| Name                                  | Value              |
| ------------------------------------- | ------------------ |
| `WEBSITES_PORT`                       | `8080`             |
| `WEBSITES_CONTAINER_START_TIME_LIMIT` | `600`              |
| `WEBSITES_ENABLE_APP_SERVICE_STORAGE` | `false`            |
| `WEBSITE_WARMUP_PATH`                 | `/api/health/live` |
| `Database__MigrateOnStartup`          | `false`            |




#### Health check (Monitoring) — dopiero po pierwszym deployu z `/api/health/live`

Ścieżka: `/api/health/live` (bez bazy).


| Endpoint                    | DB? | Do czego                                 |
| --------------------------- | --- | ---------------------------------------- |
| `/` oraz `/api/health/live` | nie | Always On, Azure Health check, warmup    |
| `/api/health`               | tak | smoke po deployu (`API_BASE_URL` + `/api/health`) |




### B2. Environment variables — przed deployem

Settings → **Environment variables** → **+ Add** każdą osobno:


| Name                         | Value                             | Skąd                                                              |
| ---------------------------- | --------------------------------- | ----------------------------------------------------------------- |
| `Database__Provider`         | `Postgres`                        | ręcznie                                                           |
| `ConnectionStrings__Default` | `postgresql://…`                  | Neon **pooled** (krok A4)                                         |
| `Clerk__Authority`           | `https://….clerk.accounts.dev`    | krok A3 — **wymagane**, bez tego API nie wstanie                  |
| `ALLOWED_ORIGINS`            | `https://repmaxer.pl,http://localhost:3000` | front już na `.pl`; `www` / `.com` dopiero gdy DNS (J)     |
| `ASPNETCORE_ENVIRONMENT`     | `Production`                      | ręcznie                                                           |
| `WEBSITES_PORT`              | `8080`                            | Docker słucha na 8080                                             |
| `WEB_ORIGIN`                 | `https://repmaxer.pl`             | linki w e-mailach; kanoniczny origin                              |
| `Email__ResendApiKey`        | `re_…`                            | opcjonalnie                                                       |
| `Email__From`                | `RepMaxer <hello@twojadomena.pl>` | opcjonalnie                                                       |
| `Push__PublicKey`            | VAPID public                      | opcjonalnie; ten sam w Vercel jako `NEXT_PUBLIC_VAPID_PUBLIC_KEY` |
| `Push__PrivateKey`           | VAPID private                     | tylko API                                                         |
| `Push__Subject`              | `mailto:support@…`                | opcjonalnie                                                       |
| `Cron__Key`                  | losowy sekret                     | ten sam w GitHub `CRON_KEY` gdy włączysz cron                     |


`__` jest celowe (`Clerk__Authority` → `Clerk:Authority`). **Apply** → restart.

### B3. GHCR (obraz z GitHub)

Workflow pcha obraz GHCR tego repo. **Nie polegaj na Deployment Center → Private** — `Deploy API` (`azure/webapps-deploy`) nadpisuje obraz i wraca na Public (bez hasła) → `ImagePullUnauthorizedFailure`.

Hasło do pulla trzymaj jako **Environment variables** (przeżyją UI; workflow i tak je wkleja po każdym deployu):


| Name                               | Value                                      |
| ---------------------------------- | ------------------------------------------ |
| `DOCKER_REGISTRY_SERVER_URL`       | `https://ghcr.io`                          |
| `DOCKER_REGISTRY_SERVER_USERNAME`  | właściciel repo (GitHub username / org)    |
| `DOCKER_REGISTRY_SERVER_PASSWORD`  | ten sam PAT co GitHub secret `GHCR_TOKEN`  |


**PAT** (jeśli nie masz `GHCR_TOKEN`): GitHub → Settings → Developer settings → Tokens (classic) → `read:packages` (pull na Azure; push w CI idzie `GITHUB_TOKEN`). Nie commituj tokenu.

### B4. Service principal tylko na RG `repmaxer-prod`

Nie kopiuj service principala z innego produktu — ten musi mieć Contributor **tylko** na RG `repmaxer-prod`.

Cloud Shell (Bash), **po** utworzeniu RG. **Bez** `--sdk-auth`: ta flaga wypisuje client secret, którego przy OIDC nie potrzebujesz i którego nie wolno wklejać do gita.

```bash
SUB=$(az account show --query id -o tsv)
APP_ID=$(az ad app create --display-name "github-repmaxer-prod" --query appId -o tsv)
az ad sp create --id "$APP_ID"
az role assignment create \
  --assignee "$APP_ID" \
  --role contributor \
  --scope "/subscriptions/${SUB}/resourceGroups/repmaxer-prod"

echo "appId=$APP_ID"
az account show --query "{tenant:tenantId, subscription:id}" -o json
```

`appId` / tenant / subscription → GitHub Environment **prod** jako `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`. Federated credential: [ci-cd.md](ci-cd.md) §2. Hasła SP nie tworzysz i nie zapisujesz.

---



# C. GitHub Environments — te same nazwy, różne miejsca

Repo → **Settings → Environments**. Pełna tabela: [ci-cd.md](ci-cd.md).

`dev` = `trainer-app-api` (stary Neon). `prod` = `repmaxer-prod` (Neon `repmaxer`). Nazwy sekretów **identyczne**: `DB_CONNECTION_STRING`, `AZURE_WEBAPP_NAME`, `API_BASE_URL`, `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `GHCR_TOKEN`, `VERCEL_*`, `CRON_KEY` (tylko prod).

Nie wklejaj connection stringa `repmaxer` do Environment `dev`.

Checklist prod:

- [ ] `DB_CONNECTION_STRING` (direct, nowy Neon)
- [ ] `AZURE_CLIENT_ID` / `AZURE_TENANT_ID` / `AZURE_SUBSCRIPTION_ID` (OIDC)
- [ ] `AZURE_WEBAPP_NAME` = `repmaxer-prod`
- [ ] `API_BASE_URL` = `https://repmaxer-prod.azurewebsites.net`
- [ ] `GHCR_TOKEN` (`read:packages`)

---



# D. Vercel — jeden projekt, żywe `repmaxer.pl` (nie drugi front)

Kod frontu czyta wyłącznie: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`, opcjonalnie `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.

**Stan docelowy (sierpień 2026):** projekt Vercel już jest (`trainer-app`), Production = `main`, domena **`repmaxer.pl`** (+ `www`). **Nie zakładaj drugiego projektu.** **Nie ruszaj Domains** w kroku D. **Nie Redeployuj Production**, dopóki `repmaxer-prod` nie odpowie `GET /api/health` = ok (krok F) i CORS/Clerk (E) nie wskażą na `.pl`.

Landing na `.pl` może żyć na starym API (`trainer-app-api`) do momentu cutover. Podmiana `NEXT_PUBLIC_*` + Redeploy Production **od razu** zepsuje login / panel na żywej domenie.

### D1. Projekt i domeny — tylko weryfikacja (już zrobione)

Wejdź w istniejący projekt (Overview). Senior zostawia **jeden** projekt, **jedną** Production, **jeden** kanoniczny host.

| Sprawdź | Oczekiwane | Czego nie robisz |
|---|---|---|
| Git | to samo repo, branch Production = `main` | drugi import / drugi projekt „repmaxer” |
| Root Directory | `apps/web` (Settings → General) | nowy projekt z rootem `/` |
| Domains | `repmaxer.pl` = **Primary** | dodawanie `repmaxer.com` (to sekcja J) |
| `www.repmaxer.pl` | **Redirect to** `repmaxer.pl` (301/308), nie druga żywa kopia | alias bez redirectu (duplikat SEO) |
| `*.vercel.app` | mogą zostać (Preview / alias) | nie ustawiaj ich jako `NEXT_PUBLIC_SITE_URL` |

Checklist Vercel (Preview Deployment, Analytics, Speed Insights) — ignoruj. Nie jest potrzebny do deploju API.

### D2. Environment Variables — najpierw podejrzyj, cutover na końcu

Settings → **Environment Variables**. Nazwy **nie zmieniaj**. Zapisz sobie obecne wartości Production (stare API / stary Clerk) — to rollback: wklejasz z powrotem + Redeploy.

| Name | Wartość **po** cutover | Kiedy zmieniasz Production |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://repmaxer.pl` (bez `/`) | **teraz**, jeśli jest `*.vercel.app` albo puste — to nie psuje API |
| `NEXT_PUBLIC_API_URL` | `https://repmaxer-prod.azurewebsites.net` (bez `/`) | **dopiero po F** (health ok) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_…` z Clerk **RepMaxer**, potem `pk_live_…` (D3) | razem z API, ta sama aplikacja Clerk co Azure `Clerk__Authority` |
| `CLERK_SECRET_KEY` | `sk_test_…` / później `sk_live_…` | j.w. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | puste / później | nie blokuje |

`NEXT_PUBLIC_*` wchodzą w **build**. Save bez Redeploy nic nie zmienia.

#### Kolejność senior (żywa domena)

1. **D1** — potwierdź projekt + Primary `.pl`. Opcjonalnie ustaw 301 www → apex. Stop.
2. Dokończ **A, A4, B, C, E, F**. W przeglądarce: `https://repmaxer-prod.azurewebsites.net/api/health` → `"status":"ok"`.
3. **Preview (opcjonalnie, bezpieczniej):** te same nazwy, checkbox **tylko Preview** (i Development) → nowe API + nowy Clerk. Otwórz URL Preview z PR / Deployments, nie `repmaxer.pl`. Smoke logowania tam.
4. **Cutover Production:** Edit tych samych zmiennych, checkbox **Production**, wartości z tabeli. **Redeploy** najnowszego Deploymentu Production (nie nowy projekt).
5. **G** na `https://repmaxer.pl`. Pusto / CORS → E1. Cofasz: stare wartości + Redeploy.

Nie twórz `NEXT_PUBLIC_API_URL_PROD`. Nie dodawaj `.com` do env.

### D3. Gdy masz już `pk_live` / `sk_live` (ta sama aplikacja Clerk)

Kolejność — nic nie przemianowujesz:

1. Clerk Dashboard → aplikacja **RepMaxer** → API keys → skopiuj **live** (Show przy secret).
2. Vercel → ta sama zmienna `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`:
  - albo jedna wartość live i checkbox **tylko Production**,
  - albo dwie wartości o **tej samej nazwie**: Production = `pk_live_…`, Preview+Development = `pk_test_…` (Vercel na to pozwala — „Add another” / osobny wiersz z innymi środowiskami).
3. To samo dla `CLERK_SECRET_KEY` (`sk_live` vs `sk_test`).
4. Azure `repmaxer-prod` → `Clerk__Authority` = Authority **tej** aplikacji (zwykle bez zmiany hosta). Nie edytuj App Settings na `trainer-app-api`.
5. Clerk → dodaj domenę produkcyjną (Vercel albo `repmaxer.pl`) w Allowed redirects / Domains — krok E2, URL-e live.
6. Vercel → Redeploy **Production**.
7. Smoke: logowanie na URL Production, nie na Preview.

---



# E. CORS i Clerk (po Vercel)



### E1. Azure

Na Web App `repmaxer-prod`:

```text
ALLOWED_ORIGINS=https://repmaxer.pl,http://localhost:3000
WEB_ORIGIN=https://repmaxer.pl
```

Dokładny origin z paska (https, bez `/` na końcu). Jeśli ludzie wchodzą też przez `www.repmaxer.pl`, dopisz `https://www.repmaxer.pl` do `ALLOWED_ORIGINS` (albo zrób 301 www → apex w Vercel — lepiej pod SEO, sekcja J).

`repmaxer.com` **nie** dopisuj, dopóki DNS nie wskazuje na Vercel i nie ma 301 na `.pl`. Apply.

### E2. Clerk — ta sama aplikacja co A

Własne `/sign-in` i `/sign-up` (nie Account Portal). `/` publiczne (landing / Panel).

- Sign-in: `https://repmaxer.pl/sign-in`
- Sign-up: `https://repmaxer.pl/sign-up`
- After sign-in / sign-up: `https://repmaxer.pl`
- To samo dla `http://localhost:3000`
- Preview Vercel (`*.vercel.app`) tylko jeśli testujesz login na Preview — wtedy dodaj ten origin osobno

Opcja: Restrictions → Allowlist / Invitations only; **Users → Invite** siebie i design partnerów.

### E3. Proxy Clerka na prod (Safari / telefon)

`clerk.repmaxer.pl` bywa blokowany na iOS („Load failed”). Prod serwuje FAPI z tego samego originu: `https://repmaxer.pl/__clerk`.

1. Wdróż kod (`frontendApiProxy` w `apps/web/proxy.ts`).
2. Vercel → `NEXT_PUBLIC_CLERK_PROXY_URL` = `https://repmaxer.pl/__clerk` — **tylko Production**. Redeploy.
3. Clerk Production → **Domains → Frontend API → Set proxy configuration** → `https://repmaxer.pl/__clerk`
4. Google Cloud → Authorized redirect URI zamień na:

   `https://repmaxer.pl/__clerk/v1/oauth_callback`

   (stary `https://clerk.repmaxer.pl/v1/oauth_callback` możesz zostawić obok na czas przejścia.)

Lokal i Preview: bez tej zmiennej.

---



# F. Pierwszy Deploy API (Environment `prod`)

Docelowo: merge do `main` → **Release** (tylko dev) → po sprawdzeniu `dev.repmaxer.pl` → **Promote to prod**. Break-glass:

1. GitHub → **Actions** → **Deploy API** → **Run workflow**
2. Branch: `main`
3. **environment:** `prod` ← nie `dev`
4. **skip_migrations:** `false` za pierwszym razem
5. Run

Joby: build obrazu (`sha-…` + digest) → migracje na `DB_CONNECTION_STRING` z Environment → deploy na `AZURE_WEBAPP_NAME` + `scripts/smoke.sh`.

Czekaj 5–15 min na zieleń.

Migracje `NETSDK1004`: na `main` musi być restore NuGet przed `dotnet ef migrations bundle`. Awaryjnie `skip_migrations: true` tylko gdy schemat na **tym** Neonie już stoi.

Health w przeglądarce:

```text
https://repmaxer-prod.azurewebsites.net/api/health
```

Oczekiwane: `"status":"ok"`.

---



# G. Smoke test

1. [https://repmaxer.pl](https://repmaxer.pl) → **Zaloguj się** → Clerk (konto z Invite) → Panel.
2. CORS / pusty ekran → E1, origin musi być `https://repmaxer.pl`.
3. **Klienci** → dodaj → przypisz plan → skopiuj link → incognito **bez** Clerk → portal (Dziś / postęp).
4. **Ustawienia → Pobierz pełną kopię (.json)**.

---



# Co robić przy kolejnych zmianach


| Zmiana            | Co odpalasz |
| ----------------- | ----------- |
| Cokolwiek na `main` | **Release** wdraża tylko dev. Na `repmaxer.pl`: Actions → **Promote to prod** (ten sam `sha-XXXX`) |
| Awaria API        | **Rollback API** albo auto-rollback po czerwonym smoke |
| Awaria frontu     | Vercel → Rollback |
| PR / UI           | Vercel Preview (nie rusza `repmaxer.pl`) |
| Poza trainem      | **Deploy API** (break-glass) |


---



# Troubleshooting


| Objaw                                    | Fix                                                                                          |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| `GHCR_TOKEN` / login failed              | PAT `read:packages` (pull); push = `GITHUB_TOKEN`. Secret bez spacji                         |
| Migracje `Couldn't set …/neondb?sslmode` | String ominął `DbConnectionString.Normalize`; do CI **direct**, nie pooler; hasło URL-encode |
| Azure login fail                         | Brak OIDC / zły `AZURE_CLIENT_ID` w Environment; SP = Contributor na właściwej RG            |
| Deploy OK, health / smoke fail           | 1–2 min; Log stream; `WEBSITES_PORT=8080`; Clerk__Authority; asercja `version` = SHA         |
| CORS                                     | `ALLOWED_ORIGINS` = dokładny origin z paska, dziś `https://repmaxer.pl`                      |
| 401 na API                               | Authority bez `/`; Vercel i Azure z **tej samej** aplikacji Clerk                            |
| Kontener nie startuje                    | Log stream; zły obraz / brak env; Deploy API jeszcze raz                                     |
| Clerk redirect mismatch                  | krok E2                                                                                      |
| Dane z innego projektu Neon              | Zły connection string — Web App prod musi mieć string z projektu `repmaxer`                  |


---



# Ściągawka — Environments, nie prefiksy

**GitHub** — te same nazwy w `dev` i `prod` (wartości różne): `DB_CONNECTION_STRING`, `AZURE_WEBAPP_NAME`, `API_BASE_URL`, `AZURE_CLIENT_ID` / `TENANT_ID` / `SUBSCRIPTION_ID`, `GHCR_TOKEN`. Szczegóły: [ci-cd.md](ci-cd.md).


**Azure** — te same nazwy settings, **inna** Web App: `repmaxer-prod` (`ConnectionStrings__Default` pooled, `Clerk__Authority`, `ALLOWED_ORIGINS`, `WEBSITES_PORT=8080`).

**Vercel** — te same nazwy: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`. Test vs live = wartość + checkbox Production, nie `*_PROD`.

---



# H. Backup Neon (projekt `repmaxer`)

PITR w planie Neona nie zwalnia z procedury.

1. Przed ryzykowną migracją: bookmark / branch `pre-migrate-YYYY-MM-DD` albo `pg_dump` na **direct**.
2. Test restore: tymczasowy branch → lokalnie / osobna Web App → `GET /api/health` → jeden klient widoczny → usuń branch.
3. Eksport w apce: **Ustawienia → Pobierz pełną kopię (.json)** (bez surowych tokenów portalu).

RPO ≈ okno PITR; RTO ≈ podmiana connection string (30–60 min).

---



# I. Observability

- Liveness: `GET /`, `GET /api/health/live` (pole `version` = SHA commita)
- Readiness: `GET /api/health` (`API_BASE_URL` + `/api/health`)
- Nagłówek `X-Correlation-Id`
- Wyjątki w Production: JSON `{ "message" }` + log z CorrelationId, bez stack trace
- Sentry: poza early access

---



# Dodatek — `trainer-app-api` to dev

Nie używaj tego jako produkcji design partnerów. To Environment **dev**: front `dev.repmaxer.pl`, tag `dev-latest`.

Nowy Neon / Clerk live **nie** idą tutaj. Drugi plan B1 zostaje świadomie — to cena release trainu.

---

# J. DNS `repmaxer.com` + SEO (na końcu, nie blokuje API)

**Stan (sierpień 2026):** front żyje na [https://repmaxer.pl](https://repmaxer.pl). `repmaxer.com` jest kupione, **rekordy DNS puste**. Nie odpalaj `.com` jako drugiej kopii strony — Google zindeksuje duplikat i rozmyje ranking `.pl`.

**Cel:** jeden kanoniczny host `https://repmaxer.pl`. Wszystko inne (`www.repmaxer.pl`, `repmaxer.com`, `www.repmaxer.com`) → **stały redirect** (301 albo 308) na ten sam path na `.pl`.

Kod już to wspiera, o ile `NEXT_PUBLIC_SITE_URL=https://repmaxer.pl`: `metadataBase` + canonical w layoutcie, `robots.ts` (panel / portal / sign-in w `disallow`), `sitemap.ts` z URL-ami na `.pl`, JSON-LD z tym samym hostem.

### J1. Vercel — domeny (najpierw UI, potem DNS)

1. Vercel → projekt frontu → **Settings → Domains**.
2. `repmaxer.pl` ma być **Primary** (bez „Redirect to”).
3. Jeśli jest `www.repmaxer.pl`: **Edit → Redirect to** `repmaxer.pl`, status **301** albo **308** (stały). Nie zostawiaj www jako drugiej żywej kopii.
4. **Add** `repmaxer.com`, potem `www.repmaxer.com`. Dla obu: **Redirect to** `repmaxer.pl`, status **301** albo **308**. Path ma zostać (`/wdrozenie` → `https://repmaxer.pl/wdrozenie`).
5. Nie wybieraj 302/307 — to tymczasowe, Google słabiej skleja sygnał.
6. Z karty każdej nowej domeny **skopiuj rekordy** (A / CNAME / ewentualnie TXT weryfikacyjny). Nie zgaduj IP — bierz je z UI Vercela.

Nie stawiaj drugiej instancji Next / innego hostingu na `.com`.

### J2. DNS u rejestratora `.com` (nie ruszaj działającego `.pl`)

W panelu, w którym kupiłeś `repmaxer.com`. Zostaw nameservery rejestratora, o ile umiesz dodać rekordy — **nie** musisz przenosić NS na Vercel.

| Host | Typ | Wartość | Po co |
|---|---|---|---|
| `@` (apex) | jak na karcie Vercel (`A`; czasem `ALIAS`/`ANAME`) | z UI, nie z pamięci | `.com` → Vercel → 301/308 na `.pl` |
| `www` | `CNAME` | z UI (zwykle `cname.vercel-dns.com`) | `www.com` → ten sam redirect |
| TXT | tylko jeśli Vercel / Search Console o to poprosi | z UI | weryfikacja własności |

TTL 300–3600 s na start. Poczekaj na zielony / Verified w Vercel (minuty–24 h).

**Nie dodawaj na `.com`:** MX, SPF, DKIM, DMARC — mail zostaje na `repmaxer.pl` (`kontakt@repmaxer.pl`). Pusty `.com` bez MX = mniej spamu „w imieniu” domeny.

Konflikt: drugi rekord `A` / stary parking / „coming soon” rejestratora — usuń, zostaw tylko to z Vercel.

### J3. Po statusie Ready w Vercel

W incognito (albo `curl -I`):

```text
https://repmaxer.com          →  Location: https://repmaxer.pl/
https://www.repmaxer.com/wdrozenie → Location: https://repmaxer.pl/wdrozenie
https://www.repmaxer.pl       → Location: https://repmaxer.pl/   (jeśli www jest w Vercel)
```

Szukaj **301** albo **308**, nie 302.

Potem:

1. Azure `ALLOWED_ORIGINS` — **nie dopisuj** `.com`, jeśli redirect leci zanim przeglądarka woła API. Dopisz tylko gdy ktoś otwiera `.com` bez redirectu i widzisz CORS.
2. Clerk — wystarczy `https://repmaxer.pl` (+ localhost). Opcjonalnie dodaj `https://repmaxer.com` i `https://www.repmaxer.com` na czas propagacji DNS (ktoś wejdzie zanim 301 zadziała).
3. `NEXT_PUBLIC_SITE_URL` **zostaje** `https://repmaxer.pl`. Nie ustawiaj `.com` — sitemap, OG i canonical poszłyby na zły host.
4. [Google Search Console](https://search.google.com/search-console): właściwość **`https://repmaxer.pl`** (prefix URL albo cała domena). Wyślij `https://repmaxer.pl/sitemap.xml`. Nie dodawaj `.com` jako drugiej usługi do indeksowania.
5. Opcjonalnie Bing Webmaster Tools — ta sama kanoniczna + ten sam sitemap.
6. Gdy `.com` już odpowiada 301: w GSC możesz dodać `.com` tylko po to, żeby zobaczyć „strona przekierowuje”, nie żeby ją indeksować.

### J4. SEO — co już jest w kodzie vs co robisz w DNS

| Zasada | Jak u nas |
|---|---|
| Jeden host w indeksie | `https://repmaxer.pl` |
| www vs apex | 301/308 www → apex (nie mieszaj w obie strony) |
| `.com` vs `.pl` | 301/308 `.com` → `.pl`, ten sam path |
| Canonical / OG / JSON-LD | `NEXT_PUBLIC_SITE_URL=https://repmaxer.pl` (`apps/web/app/layout.tsx`, `LandingJsonLd`) |
| Sitemap | `https://repmaxer.pl/sitemap.xml` — tylko landing (/, wdrożenie, strony marketingowe, regulamin). Panel nie wchodzi. |
| robots | `apps/web/app/robots.ts`: allow `/`, disallow `/portal/`, `/sign-in`, `/clients`, … |
| HTTPS | Vercel wymusza; Azure API = HTTPS only |
| API | `repmaxer-prod.azurewebsites.net` nie linkuj z landingu jako „strona” |
| hreflang | nie dodawaj — jeden język (pl). `.com` to alias, nie wersja EN |

### J5. Później (nie blokuje J1–J3)

- Resend: `Email__From` z `repmaxer.pl`. SPF / DKIM / DMARC **tylko** w DNS `.pl`.
- Clerk custom domain (np. `accounts.repmaxer.pl`) — osobny CNAME z dokumentacji Clerk; nie mylić z redirectem `.com`.
- Gdybyś kiedyś chciał kanon `.com` (rynek EN): odwróć redirect i zmień `NEXT_PUBLIC_SITE_URL` + GSC Change of address. **Nie rób tego teraz** — masz już ruch i mail na `.pl`.

### J6. Checklista (odhacz gdy robisz `.com`)

- [ ] Vercel: `repmaxer.pl` = Primary
- [ ] Vercel: `www.repmaxer.pl` → redirect 301/308 na `.pl`
- [ ] Vercel: dodane `repmaxer.com` + `www.repmaxer.com` → redirect 301/308 na `.pl`
- [ ] DNS `.com`: A/CNAME jak na karcie Vercel, bez parkingu, bez MX
- [ ] `curl -I` / incognito: `.com` ląduje na `.pl` z 301/308
- [ ] `NEXT_PUBLIC_SITE_URL` nadal `https://repmaxer.pl`
- [ ] GSC: zweryfikowane `.pl` + wysłany sitemap
- [ ] Azure CORS / Clerk: `.com` tylko jeśli naprawdę potrzeba (zwykle nie)

---

**Następny krok (prod API):** A (Clerk) → A4 (Neon) → B (Azure `repmaxer-prod`). Sekcja J (`.com`) dopiero gdy A–G są zielone.

Zmienne-przykład: `[.env.example](../.env.example)`.