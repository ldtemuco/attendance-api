#attendance-api/ps/create-admin-remote.ps1

# Importar constantes desde el archivo constants.ps1
. "$PSScriptRoot\constants.ps1"

$body = @{
    firstNames = "Bruno"
    paternalLastName = "Farfal"
    maternalLastName = "Reyes"
    username = "admin"
    password = "asistencialdd"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "$URL_SETUP_ADMIN_REMOTE" `
    -Method POST `
    -Headers @{
        Authorization = "Bearer $BOOTSTRAP_KEY"
    } `
    -ContentType "application/json" `
    -Body $body