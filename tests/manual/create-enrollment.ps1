[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateRange(1, 2147483647)]
    [int]$StudentId,

    [Parameter(Mandatory = $true)]
    [ValidateRange(1, 2147483647)]
    [int]$CourseId,

    [ValidatePattern("^\d{4}-\d{2}-\d{2}$")]
    [string]$DateEntry = (Get-Date -Format "yyyy-MM-dd"),

    [switch]$ConfirmRemote
)

. "$PSScriptRoot/../_common.ps1"

$body = @{
    studentId = $StudentId
    courseId  = $CourseId
    dateEntry = $DateEntry
}

Invoke-AdminWrite -ConfirmRemote:$ConfirmRemote -Action {
    param($Token)
    Invoke-ApiRequest -Method POST -Path "admin/enrollments" -Token $Token -Body $body
}
