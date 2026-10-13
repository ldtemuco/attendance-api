[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateRange(1, 12)]
    [int]$Level,

    [Parameter(Mandatory = $true)]
    [ValidatePattern("^[A-Za-z]$")]
    [string]$Letter,

    [switch]$ConfirmRemote
)

. "$PSScriptRoot/../_common.ps1"

$body = @{
    level  = $Level
    letter = $Letter.ToUpperInvariant()
}

Invoke-AdminWrite -ConfirmRemote:$ConfirmRemote -Action {
    param($Token)
    Invoke-ApiRequest -Method POST -Path "admin/courses" -Token $Token -Body $body
}
