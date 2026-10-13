# attendance-api/ps/tests/_common.ps1
# Utilidades compartidas: cada prueba devuelve un único resultado estructurado.

. "$PSScriptRoot/../bootstrap.ps1"

function Assert-ApiSuccess
{
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [AllowNull()]
        [object]$Response,

        [string]$Operation = "Operación"
    )

    if ($null -eq $Response -or
        $null -eq $Response.PSObject.Properties["success"] -or
        $Response.success -ne $true)
    {
        throw "$Operation no devolvió success=true."
    }
}

function Assert-ApiCollection
{
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [AllowNull()]
        [object]$Response,

        [Parameter(Mandatory = $true)]
        [string]$Property
    )

    Assert-ApiSuccess -Response $Response -Operation "GET $Property"

    if ($null -eq $Response.PSObject.Properties[$Property])
    {
        throw "La respuesta no contiene '$Property'."
    }

    $collection = $Response.$Property

    if ($null -eq $collection -or $collection -isnot [array])
    {
        throw "La propiedad '$Property' no es un arreglo JSON."
    }

    return [int]$collection.Count
}

function Invoke-AttendanceTest
{
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,

        [ValidateSet("None", "Admin", "Inspector", "Coordinator")]
        [string]$Account = "Admin",

        [Parameter(Mandatory = $true)]
        [scriptblock]$Action,

        [bool]$AutoLogout = $true
    )

    $token = $null
    $details = ""
    $status = "OK"

    try
    {
        if ($Account -ne "None")
        {
            $token = Get-AuthToken -Account $Account
        }

        $details = [string](& $Action $token)
    }
    catch
    {
        $status = "FAIL"
        $details = $_.Exception.Message
    }
    finally
    {
        if ($AutoLogout -and -not [string]::IsNullOrWhiteSpace($token))
        {
            try
            {
                Close-AuthSession -Token $token | Out-Null
            }
            catch
            {
                # Si falla la limpieza, la prueba no puede considerarse correcta.
                $status = "FAIL"
                $details = "${details}; Error cerrando sesión: $($_.Exception.Message)"
            }
        }
    }

    return [pscustomobject]@{
        Test        = $Name
        Status      = $status
        Environment = $ENVIRONMENT
        Details     = $details
    }
}

function Invoke-AdminWrite
{
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [scriptblock]$Action,

        [switch]$ConfirmRemote
    )

    if ($USE_REMOTE -and -not $ConfirmRemote)
    {
        throw "Escritura remota bloqueada. Repite con -ConfirmRemote si deseas modificar D1 remoto."
    }

    $token = $null

    try
    {
        $token = Get-AuthToken -Account Admin
        & $Action $token
    }
    finally
    {
        if (-not [string]::IsNullOrWhiteSpace($token))
        {
            try
            {
                Close-AuthSession -Token $token | Out-Null
            }
            catch
            {
                Write-Warning "No se pudo cerrar la sesión de administrador: $($_.Exception.Message)"
            }
        }
    }
}
