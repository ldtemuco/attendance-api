#attendance-api/ps/inspector-test-local.ps1

# Importar configuración
. "$PSScriptRoot/constants.ps1"


# ============================================================
# LOGIN COMO INSPECTOR
# ============================================================

$loginBody = @{
    username = "inspector1"
    password = "Inspector123!"
} | ConvertTo-Json


try {
    $loginResponse = Invoke-RestMethod `
        -Uri $URL_LOGIN `
        -Method POST `
        -ContentType $CONTENT_TYPE_JSON `
        -Body $loginBody

    $token = $loginResponse.token

    Write-Host "Login correcto como inspector."
}
catch {
    Write-Host "No fue posible iniciar sesión como inspector."

    $_.Exception.Message
    $_.ErrorDetails.Message

    exit 1
}


# ============================================================
# INTENTAR CREAR UN USUARIO
# ============================================================

$newUserBody = @{
    firstNames = "Usuario"
    paternalLastName = "Prueba"
    maternalLastName = ""
    username = "usuario_prueba"
    password = "UsuarioPrueba123!"
    role = "INSPECTOR"
} | ConvertTo-Json


try {
    $response = Invoke-RestMethod `
        -Uri $URL_ADMIN_USERS `
        -Method POST `
        -Headers @{
            Authorization = "Bearer $token"
        } `
        -ContentType $CONTENT_TYPE_JSON `
        -Body $newUserBody


    Write-Host ""
    Write-Host "ERROR: El inspector pudo crear un usuario."
    Write-Host "La prueba de seguridad ha fallado."

    $response
}
catch {

    $statusCode = $_.Exception.Response.StatusCode.value__


    if ($statusCode -eq 403) {

        Write-Host ""
        Write-Host "PRUEBA CORRECTA"
        Write-Host "El inspector no tiene permisos para crear usuarios."
        Write-Host "HTTP Status: 403 Forbidden"
    }
    else {

        Write-Host ""
        Write-Host "La solicitud fue rechazada, pero con un código inesperado."
        Write-Host "HTTP Status: $statusCode"

        $_.Exception.Message
        $_.ErrorDetails.Message
    }
}