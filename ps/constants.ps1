#attendance-api/ps/constants.ps1

# Suprimimos la advertencia de que no se usan las variables declaradas, ya que este script solo 
# define constantes y no tiene lógica adicional.

[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseDeclaredVarsMoreThanAssignments', '')]
param()

$API_VERSION = "v1"
$MAX_RETRIES = 5
$CONTENT_TYPE_JSON = "application/json"


#  Definimos si se usará el entorno remoto o local
$USE_REMOTE = $false

# Definimos las URLs para el entorno local y remoto
$URL_API_LOCAL = "http://localhost:8787"
$URL_API_REMOTE = "https://attendance-api.bfarfal.workers.dev"

# Fijamos el valor de las URLs según el entorno seleccionado
$URL_API_BASE = if ($USE_REMOTE) { $URL_API_REMOTE } else { $URL_API_LOCAL }

$URL_API = "$URL_API_BASE/api"

$URL_LOGIN = "$URL_API/auth/login"
$URL_COURSES = "$URL_API/courses"
$URL_ADMIN_USERS = "$URL_API/admin/users"
$URL_ADMIN_COURSES = "$URL_API/admin/courses"
$URL_ADMIN_STUDENTS = "$URL_API/admin/students"
$URL_SETUP_ADMIN = "$URL_API/setup/admin"

function Get-UserPermissionsUrl
{
    param(
        [int]$UserId
    )

    return "$URL_ADMIN_USERS/$UserId/permissions"
}