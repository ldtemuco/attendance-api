# attendance-api/ps/admin-courses.ps1

# Importar configuración
. "$PSScriptRoot/constants.ps1"


# =============================================================================
# LOGIN
# =============================================================================

$body =
@{
    username = "admin"
    password = "UnaClaveSegura123!"
} | ConvertTo-Json


$response = Invoke-RestMethod `
    -Uri $URL_LOGIN `
    -Method POST `
    -ContentType $CONTENT_TYPE_JSON `
    -Body $body


$token = $response.token


# =============================================================================
# GET ADMIN COURSES
# =============================================================================

$cs = Invoke-RestMethod `
    -Uri $URL_ADMIN_COURSES `
    -Method GET `
    -Headers @{
        Authorization = "Bearer $token"
    }

# =============================================================================
# CREATE COURSE
# =============================================================================

$body =
@{
    level = 4
    letter = "E"
} | ConvertTo-Json


$result = Invoke-RestMethod `
    -Uri $URL_ADMIN_COURSES `
    -Method POST `
    -Headers @{
        Authorization = "Bearer $token"
    } `
    -ContentType $CONTENT_TYPE_JSON `
    -Body $body


$result


# =============================================================================
# SHOW COURSES
# =============================================================================

$cs.courses | Format-Table `
    id,
    academicYearId,
    year,
    level,
    letter,
    name,
    active