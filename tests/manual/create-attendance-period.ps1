[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateRange(1, 2147483647)]
    [int]$CourseId,

    [Parameter(Mandatory = $true)]
    [ValidateRange(1, 12)]
    [int]$Month,

    [switch]$ConfirmRemote
)

. "$PSScriptRoot/../_common.ps1"

$body = @{
    courseId = $CourseId
    month    = $Month
}

Invoke-AdminWrite -ConfirmRemote:$ConfirmRemote -Action {
    param($Token)
    Invoke-ApiRequest -Method POST -Path "admin/attendance-periods" -Token $Token -Body $body
}
