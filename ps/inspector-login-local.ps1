#attendance-api/ps/inspector-login-local.ps1

# Importar configuración
. "$PSScriptRoot/constants.ps1"

$body = @{
    username = "inspector1"
    password = "Inspector123!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod `
        -Uri "$URL_LOGIN" `
        -Method POST `
        -ContentType "$CONTENT_TYPE_JSON" `
        -Body $body

    $response
}
catch {
    $_.Exception.Message
    $_.ErrorDetails.Message
}