. "$PSScriptRoot/../_common.ps1"

Invoke-AttendanceTest -Name "auth/logout" -Account Admin -AutoLogout $false -Action {
    param($Token)

    $closed = Close-AuthSession -Token $Token
    Assert-ApiSuccess -Response $closed -Operation "POST auth/logout"

    $unauthorized = Invoke-ApiRequest -Method GET -Path "auth/me" `
        -Token $Token -ExpectedStatusCode 401

    if ($unauthorized.statusCode -ne 401)
    {
        throw "El token todavía puede utilizarse después del logout."
    }

    "Token revocado (HTTP 401 al reutilizarlo)"
}
