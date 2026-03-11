# Installation locale — Contrôle Qualité

Ce dossier contient les scripts et étapes pour installer le projet en local.

## Prérequis

- Node.js 20 LTS
- npm
- MySQL via : Docker Desktop, MySQL local, ou téléchargement automatique (portable)

## Option 1 — Installation rapide (recommandée)

Depuis la racine du projet :

### Windows (PowerShell)

```powershell
./installation/install-local.ps1
```

### Linux / macOS

```bash
chmod +x ./installation/install-local.sh
./installation/install-local.sh
```

Le script fait automatiquement :

1. Création de `.env` depuis `.env.example` (si absent)
2. Détection de MySQL (Docker, local, ou portable)
3. Démarrage de MySQL si Docker est disponible
4. Installation des dépendances (`npm install`)
5. Génération Prisma (`npx prisma generate`)
6. Synchronisation du schéma (`npx prisma db push`)

Ensuite, lancez l'application :

```bash
npm run dev
```

Application : `http://localhost:3000`

## Options utiles des scripts

- PowerShell : `./installation/install-local.ps1 -SkipInstall`
- Bash : `./installation/install-local.sh --skip-install`

> **Note** : L'option `-SkipDocker` n'est plus nécessaire. Le script détecte automatiquement si Docker est disponible.

## Option 2 — Installation manuelle

```bash
cp .env.example .env
docker compose up -d db
npm install
npx prisma generate
npx prisma db push
npm run dev
```

## Vérification rapide

- API santé DB: consulter les logs avec `docker compose logs -f db`
- Prisma Studio (optionnel): `npm run db:studio`
