param(
  [switch]$SkipInstall
)

$ErrorActionPreference = 'Stop'

function Test-Command {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

Write-Host "==> Preparation installation locale" -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Fichier .env cree depuis .env.example" -ForegroundColor Yellow
}

if (-not (Test-Command "node")) {
  throw "Node.js n'est pas installe. Installez Node.js 20 LTS puis relancez le script."
}

if (-not (Test-Command "npm")) {
  throw "npm n'est pas disponible. Verifiez l'installation de Node.js."
}

# Detection automatique de MySQL
$dockerAvailable = $false
if (Test-Command "docker") {
  try {
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) { $dockerAvailable = $true }
  } catch {}
}

if ($dockerAvailable) {
  Write-Host "==> Demarrage MySQL via Docker Compose" -ForegroundColor Cyan
  docker compose up -d db
} else {
  # Verifier si MySQL est deja en cours d'execution localement
  $portInUse = netstat -ano 2>$null | Select-String ":3306\s"
  if ($portInUse) {
    Write-Host "==> MySQL local detecte sur le port 3306" -ForegroundColor Cyan
  } else {
    Write-Host "==> ATTENTION: Aucun serveur MySQL detecte." -ForegroundColor Yellow
    Write-Host "    Utilisez le script livraison/installer.ps1 pour une installation complete." -ForegroundColor Yellow
    Write-Host "    Ou installez MySQL / Docker Desktop manuellement." -ForegroundColor Yellow
  }
}

if (-not $SkipInstall) {
  Write-Host "==> Installation des dependances" -ForegroundColor Cyan
  npm install
}

Write-Host "==> Generation Prisma Client" -ForegroundColor Cyan
npx prisma generate

Write-Host "==> Synchronisation schema DB" -ForegroundColor Cyan
npx prisma db push

Write-Host "`nInstallation locale terminee." -ForegroundColor Green
Write-Host "Lancez maintenant: npm run dev" -ForegroundColor Green
