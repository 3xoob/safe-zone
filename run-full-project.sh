#!/usr/bin/env bash
set -euo pipefail

GATEWAY_PORT="${GATEWAY_PORT:-18080}"
FRONTEND_PORT="${FRONTEND_PORT:-4200}"
EUREKA_URL="http://localhost:8761/eureka/apps"
GATEWAY_HEALTH_URL="http://localhost:${GATEWAY_PORT}/actuator/health"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required but was not found."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 is required but was not found."
  exit 1
fi

echo "Starting buy-01 full stack..."
echo "Gateway port: ${GATEWAY_PORT}"
echo "Frontend port: ${FRONTEND_PORT}"

GATEWAY_PORT="${GATEWAY_PORT}" FRONTEND_PORT="${FRONTEND_PORT}" docker compose up --build -d

echo "Waiting for gateway health..."
for _ in $(seq 1 90); do
  if curl -fsS "${GATEWAY_HEALTH_URL}" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

curl -fsS "${GATEWAY_HEALTH_URL}" >/dev/null

echo "Waiting for service registration in Eureka..."
for _ in $(seq 1 90); do
  apps="$(curl -fsS "${EUREKA_URL}" 2>/dev/null || true)"
  if [[ "${apps}" == *"USER-SERVICE"* && "${apps}" == *"PRODUCT-SERVICE"* && "${apps}" == *"MEDIA-SERVICE"* && "${apps}" == *"GATEWAY-SERVICE"* ]]; then
    break
  fi
  sleep 2
done

apps="$(curl -fsS "${EUREKA_URL}")"
for service in USER-SERVICE PRODUCT-SERVICE MEDIA-SERVICE GATEWAY-SERVICE; do
  if [[ "${apps}" != *"${service}"* ]]; then
    echo "${service} did not register in Eureka in time."
    echo "Check logs with: docker compose logs -f"
    exit 1
  fi
done

echo
echo "buy-01 is ready."
echo "Frontend:  http://localhost:${FRONTEND_PORT}"
echo "Gateway:   http://localhost:${GATEWAY_PORT}"
echo "API:       http://localhost:${GATEWAY_PORT}/api"
echo "Eureka:    http://localhost:8761"
echo
echo "Useful commands:"
echo "  View logs:  docker compose logs -f"
echo "  Stop all:   GATEWAY_PORT=${GATEWAY_PORT} FRONTEND_PORT=${FRONTEND_PORT} docker compose down"
