#attendance-api/ps/create-inspector-local.ps1

# Importar constantes desde el archivo constants.ps1
. "$PSScriptRoot\constants.ps1"

$body = @{    
    username = "admin"
    password = "UnaClaveSegura123!"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "$URL_LOGIN" `
    -Method POST `
    -ContentType "$CONTENT_TYPE_JSON" `
    -Body $body

$token = $response.token

$inspector = @{
    firstNames = "Inspector"
    paternalLastName = "Prueba"
    maternalLastName = ""
    username = "inspector1"
    password = "Inspector123!"
    role = "INSPECTOR"
} | ConvertTo-Json

$newUser = Invoke-RestMethod `
    -Uri "$URL_ADMIN_USERS" `
    -Method POST `
    -Headers @{
        Authorization = "Bearer $token"
    } `
    -ContentType "$CONTENT_TYPE_JSON" `
    -Body $inspector

$newUser
