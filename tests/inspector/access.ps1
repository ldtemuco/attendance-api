. "$PSScriptRoot/../_common.ps1"

Invoke-AttendanceTest -Name "inspector/access" -Account Inspector -Action {
    param($Token)

    $courses = Invoke-ApiRequest -Method GET -Path "courses" -Token $Token
    $count = Assert-ApiCollection -Response $courses -Property "courses"

    # Comprobar autorización sin generar usuarios ni cambiar datos.
    $forbidden = Invoke-ApiRequest -Method GET -Path "admin/users" `
        -Token $Token -ExpectedStatusCode 403

    if ($forbidden.statusCode -ne 403)
    {
        throw "El inspector obtuvo acceso administrativo inesperado."
    }

    "Acceso a $count cursos permitidos; administración denegada (403)"
}
