#!/usr/bin/env bash
set -euo pipefail

GATEWAY_PORT="${GATEWAY_PORT:-18080}"
FRONTEND_PORT="${FRONTEND_PORT:-4200}"
HEALTHCHECK_HOST="${HEALTHCHECK_HOST:-localhost}"
GATEWAY_HEALTH_URL="http://${HEALTHCHECK_HOST}:${GATEWAY_PORT}/actuator/health"
FRONTEND_URL="http://${HEALTHCHECK_HOST}:${FRONTEND_PORT}"
EUREKA_URL="http://${HEALTHCHECK_HOST}:8761/eureka/apps"

wait_for_url() {
  local name="$1"
  local url="$2"
  local attempts="${3:-90}"
  local host_header="${4:-}"

  echo "Waiting for ${name}: ${url}"
  for _ in $(seq 1 "${attempts}"); do
    if [[ -n "${host_header}" ]]; then
      curl_args=(-H "Host: ${host_header}")
    else
      curl_args=()
    fi

    if curl -fsS "${curl_args[@]}" "${url}" >/dev/null 2>&1; then
      echo "${name} is reachable."
      return 0
    fi
    sleep 2
  done

  echo "${name} did not become reachable: ${url}"
  return 1
}

wait_for_url "gateway health" "${GATEWAY_HEALTH_URL}"
wait_for_url "frontend" "${FRONTEND_URL}" 45 "localhost"
wait_for_url "Eureka registry" "${EUREKA_URL}"

echo "Checking Eureka service registrations..."
for _ in $(seq 1 90); do
  apps="$(curl -fsS "${EUREKA_URL}" 2>/dev/null || true)"
  if [[ "${apps}" == *"USER-SERVICE"* && "${apps}" == *"PRODUCT-SERVICE"* && "${apps}" == *"MEDIA-SERVICE"* && "${apps}" == *"GATEWAY-SERVICE"* ]]; then
    echo "All required services are registered in Eureka."
    exit 0
  fi
  sleep 2
done

apps="$(curl -fsS "${EUREKA_URL}" 2>/dev/null || true)"
for service in USER-SERVICE PRODUCT-SERVICE MEDIA-SERVICE GATEWAY-SERVICE; do
  if [[ "${apps}" != *"${service}"* ]]; then
    echo "${service} is not registered in Eureka."
  fi
done

exit 1
