# attendance-api/ps/users-permissions-test-local.ps1

. "$PSScriptRoot/constants.ps1"


# =============================================================================
# LOGIN ADMIN
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
# GET USERS
# =============================================================================

$result = Invoke-RestMethod `
    -Uri $URL_ADMIN_USERS `
    -Method GET `
    -Headers @{
        Authorization = "Bearer $token"
    }


$result.users | Format-Table `
    id,
    username,
    role,
    active,
    firstNames,
    paternalLastName


# =============================================================================
# GET PERMISSIONS FOR EACH USER
# =============================================================================

foreach ($user in $result.users)
{
    Write-Host ""
    Write-Host "Usuario: $($user.username)"
    Write-Host "Rol: $($user.role)"


    if ($user.role -eq "ADMIN")
    {
        Write-Host "Permisos globales de administrador."
        continue
    }


    $permissionsUrl =
        "$URL_ADMIN_USERS/$($user.id)/permissions"


    $permissionsResult = Invoke-RestMethod `
        -Uri $permissionsUrl `
        -Method GET `
        -Headers @{
            Authorization = "Bearer $token"
        }


    if ($permissionsResult.permissions.Count -eq 0)
    {
        Write-Host "Sin cursos asignados."
        continue
    }


    $permissionsResult.permissions | Format-Table `
        courseId,
        level,
        letter,
        name,
        canRead,
        canWrite,
        canEdit,
        canDelete
}