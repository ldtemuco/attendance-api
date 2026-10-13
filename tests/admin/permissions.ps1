. "$PSScriptRoot/../_common.ps1"

Invoke-AttendanceTest -Name "admin/permissions" -Action {
    param($Token)

    $usersResponse = Invoke-ApiRequest -Method GET -Path "admin/users" -Token $Token
    $null = Assert-ApiCollection -Response $usersResponse -Property "users"

    $checked = 0

    foreach ($user in $usersResponse.users)
    {
        if ($user.role -eq "ADMIN")
        {
            continue
        }

        $path = "admin/users/$($user.id)/permissions"
        $result = Invoke-ApiRequest -Method GET -Path $path -Token $Token
        $null = Assert-ApiCollection -Response $result -Property "permissions"

        Write-Host "Usuario: $($user.username) | Permisos: $(@($result.permissions).Count)"
        $result.permissions | Format-Table courseId, name, canRead, canWrite, canEdit, canDelete -AutoSize | Out-Host
        $checked++
    }

    "$checked usuarios no administradores comprobados"
}
