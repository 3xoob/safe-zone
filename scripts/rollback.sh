#!/usr/bin/env bash
set -euo pipefail

GATEWAY_PORT="${GATEWAY_PORT:-18080}"
FRONTEND_PORT="${FRONTEND_PORT:-4200}"

echo "Rolling back Buy-01 Docker Compose deployment..."
if [[ -f .deploy-backup/rollback-tag ]]; then
  DEPLOY_TAG="$(cat .deploy-backup/rollback-tag)"
  export DEPLOY_TAG
  echo "Restoring last known successful deployment tag: ${DEPLOY_TAG}"
else
  echo "No previous successful deployment tag was recorded; restarting the current Compose stack."
fi

docker compose down --remove-orphans || true
GATEWAY_PORT="${GATEWAY_PORT}" FRONTEND_PORT="${FRONTEND_PORT}" DEPLOY_TAG="${DEPLOY_TAG:-local}" docker compose up -d --build
GATEWAY_PORT="${GATEWAY_PORT}" FRONTEND_PORT="${FRONTEND_PORT}" HEALTHCHECK_HOST="${HEALTHCHECK_HOST:-localhost}" ./scripts/health-check.sh

echo "Rollback completed."
