# Crea únicamente usuarios INSPECTOR o COORDINATOR definidos en secrets.ps1.
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("Inspector", "Coordinator")]
    [string]$Account,

    [switch]$ConfirmRemote
)

. "$PSScriptRoot/../_common.ps1"

$data = switch ($Account)
{
    "Inspector"
    {
        @{
            firstNames       = $INSPECTOR_FIRSTNAMES
            paternalLastName = $INSPECTOR_PATERNAL_LASTNAME
            maternalLastName = $INSPECTOR_MATERNAL_LASTNAME
            username         = $INSPECTOR_USERNAME
            password         = $INSPECTOR_PASSWORD
            role             = "INSPECTOR"
        }
    }
    "Coordinator"
    {
        @{
            firstNames       = $COORDINATOR_FIRSTNAMES
            paternalLastName = $COORDINATOR_PATERNAL_LASTNAME
            maternalLastName = $COORDINATOR_MATERNAL_LASTNAME
            username         = $COORDINATOR_USERNAME
            password         = $COORDINATOR_PASSWORD
            role             = "COORDINATOR"
        }
    }
}

if ([string]::IsNullOrWhiteSpace($data.firstNames) -or
    [string]::IsNullOrWhiteSpace($data.paternalLastName) -or
    [string]::IsNullOrWhiteSpace($data.username) -or
    [string]::IsNullOrWhiteSpace($data.password))
{
    throw "Faltan datos para la cuenta $Account en secrets.ps1."
}

Invoke-AdminWrite -ConfirmRemote:$ConfirmRemote -Action {
    param($Token)
    Invoke-ApiRequest -Method POST -Path "admin/users" -Token $Token -Body $data
}
