# Prueba sin autenticación. El endpoint real es /health (no /api/health).
. "$PSScriptRoot/../_common.ps1"

Invoke-AttendanceTest -Name "auth/health" -Account None -Action {
    param($Token)

    $response = Invoke-RestMethod -Uri "$URL_API_BASE/health" -Method GET -ErrorAction Stop
    Assert-ApiSuccess -Response $response -Operation "GET /health"

    if ($response.service -ne "attendance-api")
    {
        throw "Nombre de servicio inesperado: $($response.service)"
    }

    "Servicio disponible"
}
