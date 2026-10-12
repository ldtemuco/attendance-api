# attendance-api/ps/admin-attendance-periods-local.ps1
# Por defecto solo consulta. Con -Create crea el mes, sin cerrar ni modificar registros.

[CmdletBinding()]
param(
    [int]$CourseId = 0,
    [int]$Month = (Get-Date).Month,
    [switch]$Create
)

. "$PSScriptRoot/constants.ps1"

$periodsUrl = "$URL_API/admin/attendance-periods"


$loginBody = @{
    username = $LOCAL_ADMIN
    password = $LOCAL_PASSWORD
} | ConvertTo-Json

$login = Invoke-RestMethod `
    -Uri $URL_LOGIN `
    -Method POST `
    -ContentType $CONTENT_TYPE_JSON `
    -Body $loginBody

$headers = @{
    Authorization = "Bearer $($login.token)"
}

if ($Create)
{
    if ($CourseId -le 0 -or $Month -lt 1 -or $Month -gt 12)
    {
        throw "Utiliza -Create -CourseId N -Month M (M entre 1 y 12)."
    }

    # Por defecto se utilizan el primer y último día calendario del mes.
    $body = @{
        courseId = $CourseId
        month = $Month
    } | ConvertTo-Json

    $created = Invoke-RestMethod `
        -Uri $periodsUrl `
        -Method POST `
        -Headers $headers `
        -ContentType $CONTENT_TYPE_JSON `
        -Body $body

    Write-Host "Periodo creado:" -ForegroundColor Green
    $created | ConvertTo-Json -Depth 6
}

$queryUrl = $periodsUrl

if ($CourseId -gt 0)
{
    $queryUrl += "?courseId=$CourseId"
}

$periods = Invoke-RestMethod `
    -Uri $queryUrl `
    -Method GET `
    -Headers $headers

$periods.periods | Format-Table id, courseName, year, month, dateStart, dateEnd, state, attendanceCount
