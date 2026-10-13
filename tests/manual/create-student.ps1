[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$FirstNames,

    [Parameter(Mandatory = $true)]
    [string]$PaternalLastName,

    [string]$MaternalLastName = "",

    [switch]$ConfirmRemote
)

. "$PSScriptRoot/../_common.ps1"

$body = @{
    firstNames       = $FirstNames
    paternalLastName = $PaternalLastName
    maternalLastName = $MaternalLastName
}

Invoke-AdminWrite -ConfirmRemote:$ConfirmRemote -Action {
    param($Token)
    Invoke-ApiRequest -Method POST -Path "admin/students" -Token $Token -Body $body
}
