#!/usr/bin/env bash

set -euo pipefail

SKIP_DOCKER=false
SKIP_INSTALL=false

for arg in "$@"; do
  case "$arg" in
    --skip-docker) SKIP_DOCKER=true ;;
    --skip-install) SKIP_INSTALL=true ;;
    *) echo "Argument inconnu: $arg"; exit 1 ;;
  esac
done

echo "==> Préparation installation locale"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Fichier .env créé depuis .env.example"
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js n'est pas installé. Installez Node.js 20 LTS puis relancez."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm n'est pas disponible. Vérifiez l'installation de Node.js."
  exit 1
fi

if [ "$SKIP_DOCKER" = false ]; then
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker n'est pas installé. Installez Docker ou relancez avec --skip-docker."
    exit 1
  fi

  echo "==> Démarrage MySQL via Docker Compose"
  docker compose up -d db
fi

if [ "$SKIP_INSTALL" = false ]; then
  echo "==> Installation des dépendances"
  npm install
fi

echo "==> Génération Prisma Client"
npx prisma generate

echo "==> Synchronisation schéma DB"
npx prisma db push

echo
echo "Installation locale terminée."
echo "Lancez maintenant: npm run dev"
