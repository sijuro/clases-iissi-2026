#!/usr/bin/env bash
#
# iniciar.sh - Prepara y arranca DeliverUS de un tiron.
#
# Uso: ./iniciar.sh [opciones]
#   (sin opciones)   Prepara el entorno y arranca backend + app Customer
#   --all            Arranca tambien la app Owner
#   --backend-only   Solo prepara el entorno y arranca el backend
#   --setup-only     Prepara el entorno (deps, .env, BD, migraciones) y sale
#   --no-install     No instala dependencias; falla si faltan
#   --stop           Para el contenedor de base de datos y sale
#   -h, --help       Muestra esta ayuda
#
# Idempotente: no reinstala dependencias ni recrea .env / la BD si ya existen.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BACKEND_DIR="$ROOT_DIR/DeliverUS-Backend"
OWNER_DIR="$ROOT_DIR/DeliverUS-Frontend-Owner"
CUSTOMER_DIR="$ROOT_DIR/DeliverUS-Frontend-Customer"

CONTAINER_NAME="deliverus-mariadb"
DB_IMAGE="mariadb:11"
DB_ROOT_PASSWORD="root"

START_OWNER=0
START_CUSTOMER=1
SETUP_ONLY=0
NO_INSTALL=0
STOP=0

if [[ -t 1 ]]; then
  C_RESET=$'\033[0m'; C_BLUE=$'\033[1;34m'; C_GREEN=$'\033[1;32m'
  C_YELLOW=$'\033[1;33m'; C_RED=$'\033[1;31m'
else
  C_RESET=; C_BLUE=; C_GREEN=; C_YELLOW=; C_RED=
fi

info() { printf '%s>>%s %s\n' "$C_BLUE" "$C_RESET" "$*"; }
ok()   { printf '%sOK%s %s\n' "$C_GREEN" "$C_RESET" "$*"; }
warn() { printf '%s!!%s %s\n' "$C_YELLOW" "$C_RESET" "$*" >&2; }
die()  { printf '%sXX%s %s\n' "$C_RED" "$C_RESET" "$*" >&2; exit 1; }

usage() {
  sed -n '2,14p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

have() { command -v "$1" >/dev/null 2>&1; }

port_open() {
  timeout 2 bash -c "exec 3<>/dev/tcp/127.0.0.1/$1" >/dev/null 2>&1
}

# Lee una clave de un .env SIN expandir $ ni comillas (imprescindible para
# contrasenas como iissi$user).
get_env() {
  local key="$1" file="$2"
  [[ -f "$file" ]] || return 0
  grep -E "^[[:space:]]*${key}=" "$file" | tail -n1 | cut -d= -f2- | tr -d '\r' || true
}

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
  for pid in ${FRONTEND_PIDS:-}; do
    kill "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT INT TERM

while [[ $# -gt 0 ]]; do
  case "$1" in
    --all)          START_OWNER=1 ;;
    --backend-only) START_CUSTOMER=0; START_OWNER=0 ;;
    --setup-only)   SETUP_ONLY=1 ;;
    --no-install)   NO_INSTALL=1 ;;
    --stop)         STOP=1 ;;
    -h|--help)      usage; exit 0 ;;
    *)              die "Opcion desconocida: $1 (usa --help)" ;;
  esac
  shift
done

if [[ "$STOP" == "1" ]]; then
  if have docker && docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
    docker stop "$CONTAINER_NAME" >/dev/null
    ok "Contenedor $CONTAINER_NAME parado"
  else
    warn "No existe el contenedor $CONTAINER_NAME"
  fi
  exit 0
fi

ensure_env() {
  local dir="$1" label="$2"
  if [[ -f "$dir/.env" ]]; then
    ok ".env de $label ya existe (se conserva)"
  else
    [[ -f "$dir/.env.example" ]] || die "No hay .env ni .env.example en $label"
    cp "$dir/.env.example" "$dir/.env"
    ok ".env de $label creado desde .env.example"
  fi
}

ensure_deps() {
  local dir="$1" label="$2"
  if [[ -d "$dir/node_modules" ]]; then
    ok "Dependencias de $label ya instaladas (se omiten)"
    return 0
  fi
  if [[ "$NO_INSTALL" == "1" ]]; then
    die "Faltan dependencias en $label y se paso --no-install"
  fi
  info "Instalando dependencias de $label..."
  ( cd "$dir" && npm install )
  ok "Dependencias de $label instaladas"
}

ensure_db() {
  local env_file="$BACKEND_DIR/.env"
  DB_HOST="$(get_env DATABASE_HOST "$env_file")"; DB_HOST="${DB_HOST:-localhost}"
  DB_PORT="$(get_env DATABASE_PORT "$env_file")"; DB_PORT="${DB_PORT:-3306}"
  DB_USER="$(get_env DATABASE_USERNAME "$env_file")"; DB_USER="${DB_USER:-iissi_user}"
  DB_PASS="$(get_env DATABASE_PASSWORD "$env_file")"
  DB_NAME="$(get_env DATABASE_NAME "$env_file")"; DB_NAME="${DB_NAME:-deliverus}"

  if port_open "$DB_PORT"; then
    ok "Base de datos ya accesible en ${DB_HOST}:${DB_PORT} (se omite Docker)"
    return 0
  fi

  have docker || die "No hay BD en el puerto $DB_PORT y Docker no esta instalado."

  local state="missing"
  if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
    state="$(docker inspect -f '{{.State.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo unknown)"
  fi

  if [[ "$state" == "missing" ]]; then
    info "Creando contenedor MariaDB $CONTAINER_NAME..."
    timeout 180 docker run -d --name "$CONTAINER_NAME" \
      -e MARIADB_ROOT_PASSWORD="$DB_ROOT_PASSWORD" \
      -e MARIADB_DATABASE="$DB_NAME" \
      -e MARIADB_USER="$DB_USER" \
      -e MARIADB_PASSWORD="$DB_PASS" \
      -p "${DB_PORT}:3306" \
      "$DB_IMAGE" >/dev/null
  elif [[ "$state" != "running" ]]; then
    info "Arrancando contenedor existente $CONTAINER_NAME (estado: $state)..."
    timeout 60 docker start "$CONTAINER_NAME" >/dev/null
  else
    info "Contenedor $CONTAINER_NAME ya en ejecucion"
  fi

  info "Esperando a que MariaDB acepte conexiones (la primera vez tarda ~1 min)..."
  local i
  for i in $(seq 1 120); do
    if timeout 10 docker exec "$CONTAINER_NAME" \
        mariadb -uroot -p"$DB_ROOT_PASSWORD" -e 'SELECT 1' >/dev/null 2>&1; then
      ok "MariaDB lista en ${DB_HOST}:${DB_PORT}"
      return 0
    fi
    if (( i % 5 == 0 )); then
      printf '   ...esperando %ss\n' "$i"
    fi
    sleep 1
  done
  docker logs --tail 20 "$CONTAINER_NAME" >&2 || true
  die "MariaDB no respondio a tiempo. Revisa: docker logs $CONTAINER_NAME"
}

run_migrations() {
  info "Ejecutando migraciones y seeders..."
  ( cd "$ROOT_DIR" && npm run migrate:backend )
  ok "Base de datos preparada"
}

start_backend() {
  info "Arrancando backend..."
  ( cd "$BACKEND_DIR" && npm start ) &
  BACKEND_PID=$!

  local port; port="$(get_env APP_PORT "$BACKEND_DIR/.env")"; port="${port:-3000}"
  local i
  for i in $(seq 1 60); do
    if port_open "$port"; then
      ok "Backend escuchando en http://localhost:$port"
      return 0
    fi
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
      die "El backend termino inesperadamente"
    fi
    sleep 1
  done
  warn "El backend no respondio en el puerto $port (puede tardar algo mas)"
}

# --- Comprobaciones y preparacion -----------------------------------------

have node || die "Node.js no esta instalado."
have npm  || die "npm no esta instalado."

ensure_env  "$BACKEND_DIR" "backend"
ensure_deps "$BACKEND_DIR" "backend"

if [[ "$START_OWNER" == "1" ]]; then
  ensure_env  "$OWNER_DIR" "Owner"
  ensure_deps "$OWNER_DIR" "Owner"
fi

if [[ "$START_CUSTOMER" == "1" ]]; then
  ensure_env  "$CUSTOMER_DIR" "Customer"
  ensure_deps "$CUSTOMER_DIR" "Customer"
fi

ensure_db
run_migrations

if [[ "$SETUP_ONLY" == "1" ]]; then
  ok "Entorno preparado. Usa ./iniciar.sh para arrancar los servicios."
  exit 0
fi

start_backend

if [[ "$START_OWNER" == "1" ]]; then
  info "Arrancando app Owner (Expo) en segundo plano..."
  ( cd "$OWNER_DIR" && npm start ) &
  FRONTEND_PIDS="${FRONTEND_PIDS:-} $!"
fi

if [[ "$START_CUSTOMER" == "1" ]]; then
  info "Arrancando app Customer (Expo)..."
  printf '\nUsuario de pruebas: customer1@customer.com / secret\n\n'
  ( cd "$CUSTOMER_DIR" && npm start )
fi
