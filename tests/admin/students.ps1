. "$PSScriptRoot/../_common.ps1"

Invoke-AttendanceTest -Name "admin/students" -Action {
    param($Token)

    $response = Invoke-ApiRequest -Method GET -Path "admin/students" -Token $Token
    $count = Assert-ApiCollection -Response $response -Property "students"

    $response.students | Format-Table id, studentCode, firstNames, paternalLastName, maternalLastName, active -AutoSize | Out-Host
    $label = if ($count -eq 1) { "estudiante" } else { "estudiantes" }
    "$count $label"
}
