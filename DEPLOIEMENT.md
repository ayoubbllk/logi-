# ============================================================================
# GUIDE DE DÉPLOIEMENT — Application Contrôle Qualité
# Stack : Next.js 14 + MySQL 8 + Docker
# ============================================================================

## Table des matières

1. [Prérequis](#1-prérequis)
2. [Déploiement Docker (recommandé)](#2-déploiement-docker-recommandé)
3. [Déploiement VPS manuel](#3-déploiement-vps-manuel)
4. [Configuration Nginx (reverse proxy)](#4-configuration-nginx-reverse-proxy)
5. [SSL / HTTPS](#5-ssl--https)
6. [Monitoring & Logs](#6-monitoring--logs)
7. [Sauvegarde & Restauration](#7-sauvegarde--restauration)
8. [Checklist de production](#8-checklist-de-production)

---

## 1. Prérequis

### Infrastructure minimale (VPS)
| Ressource | Minimum | Recommandé |
|-----------|---------|------------|
| CPU       | 1 vCPU  | 2 vCPU     |
| RAM       | 1 GB    | 2 GB       |
| Disque    | 20 GB   | 50 GB SSD  |
| OS        | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |

### Logiciels requis
- **Docker** >= 24.x + **Docker Compose** >= 2.20
- **Node.js** >= 20 LTS (si déploiement sans Docker)
- **MySQL** >= 8.0 (si DB séparée)
- **Nginx** >= 1.24 (reverse proxy)
- **Certbot** (SSL Let's Encrypt)

---

## 2. Déploiement Docker (recommandé)

### 2.1 Préparation serveur

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Installer Docker Compose (si pas inclus)
sudo apt install docker-compose-plugin -y

# Vérifier
docker --version
docker compose version
```

### 2.2 Cloner et configurer

```bash
# Cloner le projet
git clone <URL_REPO> /opt/controle-qualite
cd /opt/controle-qualite

# Créer le fichier d'environnement
cp .env.example .env

# Éditer les variables de production
nano .env
```

### 2.3 Variables d'environnement production

```env
# .env (PRODUCTION)
DATABASE_URL="mysql://qcuser:MOT_DE_PASSE_FORT@db:3306/controle_qualite"
DATABASE_POOL_SIZE=10
JWT_SECRET="<openssl rand -hex 64>"
NEXT_PUBLIC_APP_URL="https://qc.votre-domaine.com"
NODE_ENV="production"
LOG_LEVEL="INFO"
SLOW_QUERY_THRESHOLD=500

# Docker
MYSQL_ROOT_PASSWORD="<openssl rand -hex 32>"
MYSQL_DATABASE="controle_qualite"
MYSQL_PASSWORD="<openssl rand -hex 32>"
APP_PORT=3000
DB_PORT=3306
```

### 2.4 Lancer la stack

```bash
# Build et démarrage
docker compose up -d --build

# Vérifier l'état
docker compose ps

# Exécuter les migrations Prisma
docker compose exec app npx prisma migrate deploy

# Seed initial (optionnel)
docker compose exec app npx prisma db seed

# Voir les logs
docker compose logs -f app
```

### 2.5 Mise à jour

```bash
cd /opt/controle-qualite
git pull origin main
docker compose build app
docker compose up -d app
docker compose exec app npx prisma migrate deploy
```

---

## 3. Déploiement VPS manuel

### 3.1 Installer Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3.2 Installer MySQL

```bash
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Créer la base et l'utilisateur
sudo mysql -e "
  CREATE DATABASE controle_qualite CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'qcuser'@'localhost' IDENTIFIED BY 'MOT_DE_PASSE_FORT';
  GRANT ALL PRIVILEGES ON controle_qualite.* TO 'qcuser'@'localhost';
  FLUSH PRIVILEGES;
"
```

### 3.3 Build et démarrer l'application

```bash
cd /opt/controle-qualite

# Installer les dépendances
npm ci --production=false

# Générer le client Prisma
npx prisma generate

# Exécuter les migrations
npx prisma migrate deploy

# Build Next.js
npm run build

# Démarrer avec PM2 (process manager)
npm install -g pm2
pm2 start npm --name "qc-app" -- start
pm2 save
pm2 startup
```

### 3.4 Configuration PM2

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'qc-app',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/opt/controle-qualite',
    instances: 'max',        // Mode cluster
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    max_memory_restart: '500M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: '/var/log/qc-app/error.log',
    out_file: '/var/log/qc-app/output.log',
  }]
};
```

---

## 4. Configuration Nginx (reverse proxy)

```nginx
# /etc/nginx/sites-available/controle-qualite

upstream qc_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name qc.votre-domaine.com;

    # Redirection HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name qc.votre-domaine.com;

    # ── SSL (géré par Certbot) ──
    ssl_certificate /etc/letsencrypt/live/qc.votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/qc.votre-domaine.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # ── Headers de sécurité ──
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    # ── Taille max upload ──
    client_max_body_size 10M;

    # ── Compression Gzip ──
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;
    gzip_comp_level 6;

    # ── Cache des assets statiques ──
    location /_next/static/ {
        proxy_pass http://qc_backend;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location /favicon.ico {
        proxy_pass http://qc_backend;
        expires 30d;
    }

    # ── Proxy vers Next.js ──
    location / {
        proxy_pass http://qc_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
    }
}
```

### Activer la configuration

```bash
sudo ln -s /etc/nginx/sites-available/controle-qualite /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. SSL / HTTPS

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtenir le certificat
sudo certbot --nginx -d qc.votre-domaine.com

# Renouvellement automatique (cron via certbot)
sudo certbot renew --dry-run
```

---

## 6. Monitoring & Logs

### Logs de l'application

```bash
# Docker
docker compose logs -f app --tail=100

# PM2
pm2 logs qc-app --lines 100

# Rechercher les erreurs
docker compose logs app 2>&1 | grep '"level":"ERROR"'
```

### Monitoring MySQL

```sql
-- Connexions actives
SHOW PROCESSLIST;

-- Requêtes lentes
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 20;

-- Taille des tables
SELECT table_name, 
       ROUND(data_length/1024/1024, 2) AS 'Data (MB)',
       ROUND(index_length/1024/1024, 2) AS 'Index (MB)'
FROM information_schema.tables 
WHERE table_schema = 'controle_qualite'
ORDER BY data_length DESC;
```

### Monitoring Docker

```bash
# Ressources en temps réel
docker stats

# État de santé
docker inspect --format='{{.State.Health.Status}}' qc-app

# Espace disque
docker system df
```

---

## 7. Sauvegarde & Restauration

### Sauvegarde automatisée

```bash
#!/bin/bash
# /opt/scripts/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/mysql"
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

# Dump MySQL (Docker)
docker compose -f /opt/controle-qualite/docker-compose.yml exec -T db \
  mysqldump -u qcuser -p"$MYSQL_PASSWORD" controle_qualite \
  --single-transaction --routines --triggers \
  | gzip > "$BACKUP_DIR/qc_backup_$DATE.sql.gz"

# Supprimer les anciens backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "[$(date)] Backup terminé : qc_backup_$DATE.sql.gz"
```

```bash
# Crontab : backup quotidien à 2h du matin
crontab -e
# 0 2 * * * /opt/scripts/backup-db.sh >> /var/log/qc-backup.log 2>&1
```

### Restauration

```bash
# Décompresser et restaurer
gunzip < /opt/backups/mysql/qc_backup_XXXXXXXX.sql.gz | \
  docker compose exec -T db mysql -u qcuser -p"$MYSQL_PASSWORD" controle_qualite
```

---

## 8. Checklist de production

### Sécurité
- [ ] JWT_SECRET généré avec `openssl rand -hex 64` (≥ 64 caractères)
- [ ] Mots de passe MySQL forts et uniques
- [ ] HTTPS activé avec certificat SSL valide
- [ ] Firewall configuré (UFW : ports 22, 80, 443 uniquement)
- [ ] Utilisateur non-root pour l'application
- [ ] Accès SSH par clé uniquement (désactiver password auth)
- [ ] Port MySQL (3306) non exposé publiquement

### Performance
- [ ] `NODE_ENV=production`
- [ ] `output: 'standalone'` dans next.config.js
- [ ] Nginx comme reverse proxy avec Gzip et cache statique
- [ ] `DATABASE_POOL_SIZE` ajusté selon le nombre d'instances
- [ ] Indexes DB appliqués (`npx prisma migrate deploy`)
- [ ] Slow query log activé
- [ ] MySQL `innodb_buffer_pool_size` ajusté

### Monitoring
- [ ] Logs en JSON (`LOG_LEVEL=INFO`)
- [ ] Healthcheck Docker configuré
- [ ] Monitoring des ressources (CPU, RAM, disque)
- [ ] Alertes sur les erreurs critiques

### Sauvegarde
- [ ] Backup automatique quotidien
- [ ] Rétention de 30 jours
- [ ] Test de restauration effectué
- [ ] Backup hors-site (S3, Backblaze, etc.)

### Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## Architecture de déploiement

```
Internet
   │
   ▼
┌──────────┐
│  Nginx   │  ← SSL termination, gzip, cache statique
│  :443    │
└────┬─────┘
     │ proxy_pass
     ▼
┌──────────┐     ┌──────────┐
│ Next.js  │────▶│  MySQL   │
│  :3000   │     │  :3306   │
└──────────┘     └──────────┘
     │
     ▼
  Logs JSON → stdout → Docker logs / PM2 logs
```
