# Diagnóstico: ejecutar .\ps\check-encoding.ps1 desde la raíz del proyecto.
# Comparar un texto leído desde el archivo con otro construido con Unicode.

$utf8 = [System.Text.UTF8Encoding]::new($false)
$global:OutputEncoding = $utf8

try
{
    if ([System.Environment]::OSVersion.Platform -eq [System.PlatformID]::Win32NT)
    {
        & "$env:SystemRoot/System32/chcp.com" 65001 | Out-Null
    }

    [Console]::InputEncoding = $utf8
    [Console]::OutputEncoding = $utf8
}
catch
{
    Write-Warning "No fue posible configurar UTF-8: $($_.Exception.Message)"
}

$literal = "Matrículas | períodos | administración | 3°A"
$unicode = "Matr$([char]0x00ed)culas | per$([char]0x00ed)odos | administraci$([char]0x00f3)n | 3$([char]0x00b0)A"

Write-Host "PowerShell: $($PSVersionTable.PSVersion)"
Write-Host "Salida: $([Console]::OutputEncoding.WebName)"
Write-Host "Texto del archivo: $literal"
Write-Host "Texto generado:  $unicode"

if ($literal -cne $unicode)
{
    Write-Warning "El script se ha leído con una codificación incorrecta."
}
else
{
    Write-Host "Los textos son idénticos internamente." -ForegroundColor Green
    Write-Host "Si ambos se ven mal, revisa el terminal o el visor de salida." -ForegroundColor Yellow
}
