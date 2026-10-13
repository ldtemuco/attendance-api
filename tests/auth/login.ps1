[CmdletBinding()]
param(
    [ValidateSet("Admin", "Inspector", "Coordinator")]
    [string]$Account = "Admin"
)

. "$PSScriptRoot/../_common.ps1"

Invoke-AttendanceTest -Name "auth/login/$Account" -Account $Account -Action {
    param($Token)

    $user = Get-AuthUser -Token $Token
    $expectedRole = $Account.ToUpperInvariant()

    if ($user.role -ne $expectedRole)
    {
        throw "Rol inesperado: se esperaba $expectedRole, llegó $($user.role)."
    }

    if ([string]::IsNullOrWhiteSpace($user.username))
    {
        throw "La API no devolvió username."
    }

    "Login y /auth/me correctos ($($user.username))"
}
