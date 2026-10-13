# attendance-api/ps/run-all.ps1
# Pruebas de lectura y autenticación. No crea cursos, alumnos ni matrículas.

[CmdletBinding()]
param(
    [switch]$SkipInspector,
    [switch]$IncludeCoordinator
)

$ErrorActionPreference = "Stop"

# Siempre escribe un log nuevo junto a este script.
$logPath = Join-Path $PSScriptRoot "test.log"
$exitCode = 1
$transcriptStarted = $false

try
{
    Start-Transcript -Path $logPath -Force -ErrorAction Stop | Out-Null
    $transcriptStarted = $true

    Write-Host "ATTENDANCE API - Pruebas" -ForegroundColor Cyan
    Write-Host "Fecha: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "Log: $logPath"

    $testFiles = @(
        "auth/health.ps1",
        "auth/login.ps1",
        "auth/logout.ps1",
        "admin/users.ps1",
        "admin/courses.ps1",
        "admin/students.ps1",
        "admin/permissions.ps1",
        "admin/enrollments.ps1",
        "admin/attendance-periods.ps1"
    )

    if (-not $SkipInspector)
    {
        $testFiles += "inspector/access.ps1"
    }

    $results = [System.Collections.Generic.List[object]]::new()

    foreach ($relativePath in $testFiles)
    {
        $scriptPath = Join-Path $PSScriptRoot "tests/$relativePath"

        Write-Host "`nEjecutando: $relativePath" -ForegroundColor Cyan

        try
        {
            $items = @(& $scriptPath)

            if ($items.Count -ne 1 -or
                $null -eq $items[0].PSObject.Properties["Status"])
            {
                throw "La prueba no devolvió un resultado válido."
            }

            $results.Add($items[0])
        }
        catch
        {
            $results.Add([pscustomobject]@{
                Test        = $relativePath
                Status      = "FAIL"
                Environment = "?"
                Details     = $_.Exception.Message
            })
        }
    }

    if ($IncludeCoordinator)
    {
        $scriptPath = Join-Path $PSScriptRoot "tests/auth/login.ps1"
        Write-Host "`nEjecutando: auth/login/Coordinator" -ForegroundColor Cyan

        try
        {
            $items = @(& $scriptPath -Account Coordinator)

            if ($items.Count -ne 1 -or
                $null -eq $items[0].PSObject.Properties["Status"])
            {
                throw "La prueba no devolvió un resultado válido."
            }

            $results.Add($items[0])
        }
        catch
        {
            $results.Add([pscustomobject]@{
                Test        = "auth/login/Coordinator"
                Status      = "FAIL"
                Environment = "?"
                Details     = $_.Exception.Message
            })
        }
    }

    $passed = @($results | Where-Object { $_.Status -eq "OK" }).Count
    $failed = @($results | Where-Object { $_.Status -ne "OK" }).Count

    Write-Host "`n================== RESULTADOS ==================" -ForegroundColor Cyan
    $results | Format-Table Test, Status, Environment, Details -AutoSize | Out-Host
    Write-Host "Correctas: $passed | Fallidas: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })

    if ($failed -eq 0)
    {
        $exitCode = 0
    }
}
catch
{
    Write-Host "ERROR GENERAL: $($_.Exception.Message)" -ForegroundColor Red
}
finally
{
    if ($transcriptStarted)
    {
        Stop-Transcript | Out-Null
    }
}

exit $exitCode
