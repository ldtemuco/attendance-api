. "$PSScriptRoot/../_common.ps1"

Invoke-AttendanceTest -Name "admin/courses" -Action {
    param($Token)

    $response = Invoke-ApiRequest -Method GET -Path "admin/courses" -Token $Token
    $count = Assert-ApiCollection -Response $response -Property "courses"

    $response.courses | Format-Table id, year, level, letter, name, active -AutoSize | Out-Host
    "$count cursos"
}
