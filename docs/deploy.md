# Deploy Workout Alchemist — instrukcja krok po kroku

Cel: publiczne API (Azure) + web (Vercel) + baza (Neon) + login trenera (Clerk).  
Szacowany czas: **45–90 min** przy pierwszym razie (potem deploy to 1 klik).

Kolejność jest ważna — rób sekcje od 0 do 7.

---

## 0. Push kodu na GitHub

1. Upewnij się, że zmiany z MVP są na remote (np. `main` / Twoja gałąź).
2. Otwórz repo na GitHubie (np. `https://github.com/<org>/trainer-app`).
3. Zapamiętaj nazwę repo — będzie potrzebna przy Vercel i sekretach.

Lokalnie po zmianie schematu (jeśli API się wywala na starej bazie):

```bash
rm -f apps/api/trainer.db apps/api/trainer.db-shm apps/api/trainer.db-wal
# potem zrestartuj API (./scripts/dev.sh albo dotnet run w apps/api)
```

---

## 1. Neon — nowa baza Postgres

### 1.1 Nowy projekt

1. Wejdź na [https://console.neon.tech](https://console.neon.tech) (to samo konto co fizjo).
2. Lewy sidebar → **Projects**.
3. **New Project**.
4. Ustaw:
   - **Project name:** `trainer-app`
   - **Postgres version:** domyślna (OK)
   - **Region:** ten sam co fizjo (mniej latencji / prostszy mental model), np. `Europe (Frankfurt)` jeśli tak masz.
5. **Create project**.

### 1.2 Connection string

1. Na dashboardzie projektu kliknij **Dashboard** / **Connection details**.
2. Włącz przełącznik **Pooled connection** (ważne dla Azure / serverless).
3. Skopiuj connection string w formacie `postgresql://…` (z hasłem).
4. Zapisz go w menedżerze haseł jako `trainer-app Neon DEV` — wkleisz go za chwilę do GitHub Secrets i Azure.

> Nie commituj tego stringa do git.

---

## 2. Clerk — osobna aplikacja dla trenerów

### 2.1 Nowa aplikacja

1. Wejdź na [https://dashboard.clerk.com](https://dashboard.clerk.com) (to samo konto co fizjo).
2. Góra / przełącznik aplikacji → **Create application** (lub **Add application**).
3. Nazwa: `Workout Alchemist` (lub `trainer-app`).
4. Zaznacz metody: **Email** (+ opcjonalnie Google — nie musisz).
5. **Create**.

### 2.2 Klucze

1. W nowej aplikacji: **Configure** → **API Keys** (albo **Developers → API Keys**).
2. Skopiuj i zapisz:
   - **Publishable key** (`pk_test_…` / `pk_live_…`) → to będzie `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret key** (`sk_test_…`) → to będzie `CLERK_SECRET_KEY`

### 2.3 Authority (dla .NET API)

1. W Clerk: **Configure** → **API Keys** / albo **JWT Templates** / strona z **Frontend API**.
2. Szukasz URL w stylu: `https://xxxxx.clerk.accounts.dev`  
   (czasem widać jako **Frontend API URL** / **Issuer**).
3. Zapisz **bez** ukośnika na końcu jako `Clerk__Authority`  
   Przykład: `https://clerk.example.clerk.accounts.dev`

### 2.4 URL-e po deploymencie weba (wrócisz tu po sekcji 5)

1. **Configure** → **Paths** / **Domains** / **Allowed redirect URLs** (nazwa zależy od UI Clerk).
2. Dodaj:
   - `http://localhost:3000/sign-in` (dev)
   - `https://<twoja-domena-vercel>/sign-in`
   - home: `http://localhost:3000` oraz `https://<domena-vercel>`
3. Opcjonalnie wyłącz publiczną rejestrację: **Configure** → **Restrictions** / **Sign-up** → tylko **Invite** (design partnerzy dostają maila z Clerk).

### 2.5 Zaproszenie pierwszego trenera (na końcu)

1. **Users** → **Invite**.
2. Wpisz email design partnera → wyślij.

---

## 3. Azure — Web App na kontener (API)

Zakładasz osobną apkę `trainer-app-api` (nie ruszaj fizjo).

### 3.1 Resource Group / Plan (opcjonalnie ten sam Plan co fizjo)

1. [Azure Portal](https://portal.azure.com) → wyszukaj **App Services**.
2. **+ Create** → **Web App**.
3. Wypełnij:
   - **Subscription:** ta sama co fizjo
   - **Resource Group:** nowa `trainer-app` **albo** istniejąca `fizjo-app` (jeśli chcesz porządek w jednej RG)
   - **Name:** `trainer-app-api` (musi być unikalna globalnie) → URL będzie `https://trainer-app-api.azurewebsites.net`
   - **Publish:** **Container**
   - **Operating System:** **Linux**
   - **Region:** jak fizjo
   - **App Service Plan:** **wybierz istniejący plan fizjo** (jeśli ma zapas) **albo** nowy B1
4. **Review + create** → **Create**. Poczekaj aż status = Running.

### 3.2 Uprawnienia do GHCR (obraz z GitHub Container Registry)

API będzie ściągać obraz `ghcr.io/prezentytu/trainer-app-api:…`.

1. Wejdź w Web App → **Deployment Center** / **Container settings** (albo **Configuration** → ustawienia kontenera).
2. Registry: **Other** / **Private registry**:
   - Server: `ghcr.io`
   - Username: Twój GitHub username
   - Password: **Personal Access Token** z scope `read:packages` (ten sam wzorzec co fizjo — możesz użyć istniejącego `GHCR_TOKEN` jeśli ma prawa do nowego obrazu)
3. Na start możesz zostawić placeholder image — prawdziwy obraz wciągnie workflow.

### 3.3 Application settings (env dla API)

1. Web App → **Settings** → **Environment variables** (dawniej **Configuration** → **Application settings**).
2. **+ Add** po kolei (nazwa / wartość):

| Nazwa | Wartość |
|---|---|
| `Database__Provider` | `Postgres` |
| `ConnectionStrings__Default` | connection string z Neon (sekcja 1.2) |
| `Clerk__Authority` | `https://….clerk.accounts.dev` (sekcja 2.3) |
| `ALLOWED_ORIGINS` | na razie `http://localhost:3000` — **dopiszesz Vercel URL po sekcji 5**, np. `https://trainer-app.vercel.app` (wiele originów: przecinek, bez spacji lub ze spacją — kod trimuje) |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `WEBSITES_PORT` | `8080` (Dockerfile wystawia 8080) |

3. **Apply** / **Save** → potwierdź restart.

### 3.4 Service principal do GitHub Actions (jeśli nie masz już `AZURE_CREDENTIALS`)

Jeśli w fizjo już masz działający secret `AZURE_CREDENTIALS` z dostępem do subskrypcji — **możesz go reuse** w repo trainer-app (ten sam JSON).

Jeśli nie:

1. Azure Cloud Shell / lokalnie (zalogowany `az login`):

```bash
az ad sp create-for-rbac --name "trainer-app-github" \
  --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RG_NAME> \
  --sdk-auth
```

2. Cały JSON ze stdout → to będzie secret `AZURE_CREDENTIALS`.

---

## 4. GitHub Secrets (repo trainer-app)

1. GitHub → Twoje repo **trainer-app** → **Settings**.
2. **Secrets and variables** → **Actions** → **New repository secret**.
3. Dodaj:

| Secret | Skąd wziąć |
|---|---|
| `GHCR_TOKEN` | GitHub → Settings → Developer settings → Personal access tokens → token z `write:packages` + `read:packages` (jak w fizjo) |
| `DEV_DB_CONNECTION_STRING` | Neon pooled string (sekcja 1.2) |
| `AZURE_CREDENTIALS` | JSON z `az ad sp…` albo kopia z fizjo |
| `AZURE_WEBAPP_NAME` | nazwa Web App, np. `trainer-app-api` |
| `API_HEALTH_URL` | `https://trainer-app-api.azurewebsites.net/api/health` |

Opcjonalnie później (prod): `PROD_DB_CONNECTION_STRING`, `AZURE_CREDENTIALS_PROD`, `AZURE_WEBAPP_NAME_PROD`, `API_HEALTH_URL_PROD`.

---

## 5. Vercel — frontend Next.js

### 5.1 Import projektu

1. [https://vercel.com](https://vercel.com) → zaloguj (to samo konto co admin-portal jeśli masz).
2. **Add New…** → **Project**.
3. **Import** repo `trainer-app` z GitHuba.
4. Ustawienia przed deployem:
   - **Framework Preset:** Next.js
   - **Root Directory:** kliknij **Edit** → `apps/web` → **Continue**
   - **Build Command:** domyślne (`next build`) OK
   - **Install Command:** domyślne (`npm install`) OK
5. **Environment Variables** → dodaj (Environment: Production + Preview + Development):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://trainer-app-api.azurewebsites.net` (bez `/` na końcu) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_…` z Clerk |
| `CLERK_SECRET_KEY` | `sk_…` z Clerk |

6. **Deploy**.

### 5.2 Domains

1. Po deployu: Project → **Settings** → **Domains**.
2. Zostaw `*.vercel.app` na start **albo** dodaj `trener.fiziyo.pl` / własną domenę (DNS CNAME wg instrukcji Vercel).
3. Skopiuj finalny URL weba, np. `https://trainer-app.vercel.app`.

### 5.3 Dopnij CORS i Clerk

1. **Azure** → App Settings → edytuj `ALLOWED_ORIGINS` →  
   `https://trainer-app.vercel.app,http://localhost:3000` → Save.
2. **Clerk** → dodaj redirect URLs z sekcji 2.4 na ten Vercel URL.

---

## 6. Pierwszy deploy API (GitHub Actions)

1. GitHub → repo trainer-app → zakładka **Actions**.
2. Lewa lista → workflow **Deploy API**.
3. **Run workflow** →
   - `environment`: **dev**
   - `skip_migrations`: **false** (pierwszy raz musi odpalić migracje na Neon)
4. **Run workflow**.
5. Poczekaj aż joby `Build` → `Migrate` → `Deploy` będą zielone.
6. Otwórz w przeglądarce:  
   `https://trainer-app-api.azurewebsites.net/api/health`  
   Powinno zwrócić coś w stylu: `{"status":"ok",…}`.

Jeśli migracje padną: sprawdź `DEV_DB_CONNECTION_STRING` (pooled Neon, hasło, SSL).  
Jeśli deploy padnie na pull image: sprawdź `GHCR_TOKEN` i uprawnienia Web App do `ghcr.io`.

---

## 7. Smoke test (że „wszystko działa”)

### 7.1 Login trenera

1. Otwórz URL Vercel.
2. Powinieneś wpaść na Clerk **Sign in** (albo redirect).
3. Zaloguj się kontem, które zaprosiłeś (albo założonym w Clerk Users).
4. Panel trenera powinien załadować dane (puste albo po seedzie — na Neon seed odpala się przy starcie API jeśli baza pusta).

### 7.2 Portal klienta (bez konta)

1. W panelu: **Klienci** → dodaj klienta → przypisz plan → **Skopiuj link dla klienta**.
2. Otwórz link w oknie incognito.
3. Powinien działać **bez** logowania Clerk.
4. Na górze portalu: sekcja **„Twój postęp”**.

### 7.3 Eksport / radar

1. Panel → **Eksportuj dane** → pobiera się JSON.
2. Przy klientach bez planu / bez treningów: karta **Wymaga uwagi**.

---

## 8. Lokalny development (opcjonalnie z Clerk)

Plik `apps/web/.env.local` (nie commituj):

```bash
NEXT_PUBLIC_API_URL=http://localhost:5210
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

API lokalnie zostaje na Sqlite, **chyba że** ustawisz Postgres.  
Bez kluczy Clerk panel działa bez logowania (wygodne do UI).

Jeśli chcesz lokalnie bić w Neon:

`apps/api/appsettings.Development.json` (nie commituj sekretów):

```json
{
  "Database": { "Provider": "Postgres" },
  "ConnectionStrings": {
    "Default": "postgresql://…pooled…"
  },
  "Clerk": {
    "Authority": "https://….clerk.accounts.dev"
  },
  "ALLOWED_ORIGINS": "http://localhost:3000"
}
```

---

## Checklist końcowy

- [ ] Neon projekt `trainer-app` + pooled connection string
- [ ] Clerk app + `pk_` / `sk_` / Authority
- [ ] Azure Web App `trainer-app-api` + App Settings
- [ ] GitHub Secrets (`GHCR_TOKEN`, `DEV_DB_CONNECTION_STRING`, `AZURE_*`, `API_HEALTH_URL`)
- [ ] Vercel root `apps/web` + 3 env
- [ ] `ALLOWED_ORIGINS` = URL Vercel
- [ ] Workflow **Deploy API** zielony
- [ ] `/api/health` = ok
- [ ] Login trenera działa; portal klienta bez logowania
- [ ] Invite design partnera w Clerk

---

## Najczęstsze problemy

| Objaw | Co sprawdzić |
|---|---|
| CORS error w przeglądarce | `ALLOWED_ORIGINS` na Azure = dokładny origin Vercel (`https://…`, bez `/` na końcu) |
| 401 na `/api/clients` | `Clerk__Authority` złe / brak Bearer (web bez `NEXT_PUBLIC_CLERK_*`) |
| Portal działa, panel nie | OK — portal jest publiczny; panel wymaga Clerk |
| Migracje fail | zły connection string; użyj **pooled**; hasło URL-encoded jeśli ma znaki specjalne |
| Azure nie startuje kontenera | `WEBSITES_PORT=8080`; obraz istnieje w GHCR; credentials registry |
| Pusta baza po deployu | Seed odpala się przy starcie gdy brak ćwiczeń — zrestartuj Web App raz |
| Lokalnie błędy SQL po pullu | usuń `apps/api/trainer.db` (schemat się zmienił) |
