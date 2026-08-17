#!/usr/bin/env bash
# azure/webapps-deploy nadpisuje obraz i gubi Private/hasło GHCR — bez tego 401 przy pullu.
# Wymaga: zalogowanego az, APP_NAME, GHCR_TOKEN, opcjonalnie REGISTRY_USERNAME.
set -euo pipefail

if [[ -z "${APP_NAME:-}" || -z "${GHCR_TOKEN:-}" ]]; then
  echo "::error::Brak APP_NAME albo GHCR_TOKEN."
  exit 1
fi

RG="${RESOURCE_GROUP:-}"
if [[ -z "$RG" ]]; then
  RG=$(az webapp list --query "[?name=='$APP_NAME'].resourceGroup" -o tsv | head -n 1)
fi
if [[ -z "$RG" ]]; then
  echo "::error::Nie znaleziono Web App ${APP_NAME}."
  exit 1
fi

USER="${REGISTRY_USERNAME:-${GITHUB_REPOSITORY_OWNER:-Prezentytu}}"

az webapp config appsettings set \
  --name "$APP_NAME" \
  --resource-group "$RG" \
  --settings \
    DOCKER_REGISTRY_SERVER_URL=https://ghcr.io \
    DOCKER_REGISTRY_SERVER_USERNAME="$USER" \
    DOCKER_REGISTRY_SERVER_PASSWORD="$GHCR_TOKEN" \
  --output none

az webapp restart --name "$APP_NAME" --resource-group "$RG"
echo "GHCR pull credentials ustawione na ${APP_NAME} (${RG})."
