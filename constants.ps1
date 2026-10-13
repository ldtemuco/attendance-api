# attendance-api/ps/constants.ps1
# Configuración general. Nunca guardar contraseñas en este archivo.

[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseDeclaredVarsMoreThanAssignments', '')]
param()

$API_VERSION = "v1"
$MAX_RETRIES = 5
$CONTENT_TYPE_JSON = "application/json; charset=utf-8"

# Cambiar a $true para usar Cloudflare remoto.
$USE_REMOTE = $false

$URL_API_LOCAL = "http://localhost:8787"
$URL_API_REMOTE = "https://attendance-api.bfarfal.workers.dev"

$URL_API_BASE = if ($USE_REMOTE) { $URL_API_REMOTE } else { $URL_API_LOCAL }
$URL_API = "$URL_API_BASE/api"

$URL_LOGIN = "$URL_API/auth/login"
$URL_COURSES = "$URL_API/courses"
$URL_ADMIN_USERS = "$URL_API/admin/users"
$URL_ADMIN_COURSES = "$URL_API/admin/courses"
$URL_ADMIN_STUDENTS = "$URL_API/admin/students"
$URL_ADMIN_ENROLLMENTS = "$URL_API/admin/enrollments"
$URL_ATTENDANCE_PERIODS = "$URL_API/admin/attendance-periods"
$URL_SETUP_ADMIN = "$URL_API/setup/admin"

function Get-UserPermissionsUrl
{
    param(
        [Parameter(Mandatory = $true)]
        [int]$UserId
    )

    return "$URL_ADMIN_USERS/$UserId/permissions"
}
