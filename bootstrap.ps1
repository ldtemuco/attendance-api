# attendance-api/ps/bootstrap.ps1
# Punto de entrada común para pruebas y operaciones manuales.

. "$PSScriptRoot/constants.ps1"

$ENVIRONMENT = if ($USE_REMOTE) { "remote" } else { "local" }
$SECRETS_PATH = Join-Path $PSScriptRoot "$ENVIRONMENT/secrets.ps1"

if (-not (Test-Path -LiteralPath $SECRETS_PATH -PathType Leaf))
{
    throw "No se encontró $SECRETS_PATH. Copia secrets.ps1.example y completa los datos privados."
}

. $SECRETS_PATH
. "$PSScriptRoot/lib/api.ps1"
. "$PSScriptRoot/lib/auth.ps1"
