#attendance-api/ps/create-admin-local.ps1


# Importar constantes desde el archivo constants.ps1
. "$PSScriptRoot\constants.ps1"

$body = @{
    firstNames = "Bruno"
    paternalLastName = "Quintana"
    maternalLastName = ""
    username = "admin"
    password = "UnaClaveSegura123!"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://localhost:8787/api/setup/admin" `
    -Method POST `
    -Headers @{
        Authorization = "Bearer $BOOTSTRAP_KEY"
    } `
    -ContentType "application/json" `
    -Body $body