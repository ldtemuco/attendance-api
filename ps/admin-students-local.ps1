# attendance-api/ps/admin-courses.ps1

# Importar configuración
. "$PSScriptRoot/constants.ps1"


# =============================================================================
# LOGIN
# =============================================================================

$loginbody =
@{
    username = "admin"
    password = "UnaClaveSegura123!"
} | ConvertTo-Json


$login_response = Invoke-RestMethod `
    -Uri $URL_LOGIN `
    -Method POST `
    -ContentType $CONTENT_TYPE_JSON `
    -Body $loginbody


$token = $login_response.token


# =============================================================================
# GET ADMIN COURSES
# =============================================================================
$body =
@{
    firstNames = "Juan Carlos"
    paternalLastName = "Pérez"
    maternalLastName = "Soto"
} | ConvertTo-Json


$result = Invoke-RestMethod `
    -Uri $URL_ADMIN_STUDENTS `
    -Method POST `
    -Headers @{
        Authorization = "Bearer $token"
    } `
    -ContentType $CONTENT_TYPE_JSON `
    -Body $body


$result