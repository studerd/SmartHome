Param(
    [switch]$VerboseInstall
)

Write-Host "Installation des dépendances minimums pour le projet sous NestJS" -ForegroundColor Cyan
Write-Host "----------------------------------------------------------------"

# 1) Vérifier npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm n'est pas disponible dans le PATH. Installe Node.js (inclut npm) puis relance ce script."
    exit 1
}

# 2) Se placer dans le dossier du projet si besoin (par défaut, le dossier courant est conservé)
#   -> Décommenter si tu veux forcer le dossier du script comme dossier de travail :
# Set-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Path)

# 3) Définir les groupes de paquets (fidèle au script .sh)
$packageGroups = @(
    @('lodash','@types/lodash'),
    @('date-fns','@types/date-fns'),
    @('bcrypt','@types/bcrypt'),
    @('@nestjs/jwt'),
    @('@nestjs/swagger','swagger-ui-express'),
    @('dotenv'),
    @('ulid'),
    @('@nestjs/typeorm','typeorm','pg'),
    @('builder-pattern'),
    @('class-validator','class-transformer')
)

# 4) Fonction d'installation d'un groupe
function Install-PackageGroup {
    param(
        [Parameter(Mandatory=$true)][string[]]$Packages
    )
    $pkgList = $Packages -join ' '
    Write-Host ">> npm install $pkgList" -ForegroundColor Yellow
    if ($VerboseInstall) {
        npm install @Packages --verbose
    } else {
        npm install @Packages
    }
    if ($LASTEXITCODE -ne 0) {
        throw "L'installation a échoué pour: $pkgList (code: $LASTEXITCODE)"
    }
}

# 5) Installer chaque groupe
foreach ($group in $packageGroups) {
    Install-PackageGroup -Packages $group
}

Write-Host "✅ Installation terminée." -ForegroundColor Green
