# Prueba manual: primero crea un estudiante y un curso, y anota sus ID.
# Ejecuta con el servidor local activo: npx wrangler dev
. "$PSScriptRoot/constants.ps1"

$username = Read-Host "Usuario administrador"
$securePassword = Read-Host "Contraseña" -AsSecureString
$credentials = [System.Management.Automation.PSCredential]::new($username, $securePassword)
$password = $credentials.GetNetworkCredential().Password

$loginBody = @{
    username = $username
    password = $password
} | ConvertTo-Json

$login = Invoke-RestMethod `
    -Uri $URL_LOGIN `
    -Method POST `
    -ContentType $CONTENT_TYPE_JSON `
    -Body $loginBody

$studentId = [int](Read-Host "ID de estudiante activo")
$courseId = [int](Read-Host "ID de curso activo")
$enrollmentsUrl = "$URL_API/admin/enrollments"

$body = @{
    studentId = $studentId
    courseId = $courseId
    dateEntry = (Get-Date -Format "yyyy-MM-dd")
} | ConvertTo-Json

$headers = @{ Authorization = "Bearer $($login.token)" }

$created = Invoke-RestMethod `
    -Uri $enrollmentsUrl `
    -Method POST `
    -Headers $headers `
    -ContentType $CONTENT_TYPE_JSON `
    -Body $body

Write-Host "Matrícula creada: ID $($created.enrollment.id)"

$list = Invoke-RestMethod `
    -Uri "${enrollmentsUrl}?courseId=$courseId" `
    -Method GET `
    -Headers $headers

$list.enrollments | Format-Table id, studentCode, firstNames, paternalLastName, courseName, active
