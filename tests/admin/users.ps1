. "$PSScriptRoot/../_common.ps1"

Invoke-AttendanceTest -Name "admin/users" -Action {
    param($Token)

    $response = Invoke-ApiRequest -Method GET -Path "admin/users" -Token $Token
    $count = Assert-ApiCollection -Response $response -Property "users"

    $response.users | Format-Table id, username, role, active, firstNames, paternalLastName -AutoSize | Out-Host
    $label = if ($count -eq 1) { "usuario" } else { "usuarios" }
    "$count $label"
}
