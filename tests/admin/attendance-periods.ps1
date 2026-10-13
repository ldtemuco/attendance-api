[CmdletBinding()]
param(
    [ValidateRange(1, 2147483647)]
    [int]$CourseId = 0,
    [ValidateRange(1900, 9999)]
    [int]$Year = 0
)

. "$PSScriptRoot/../_common.ps1"

Invoke-AttendanceTest -Name "admin/attendance-periods" -Action {
    param($Token)

    $parts = @()

    if ($CourseId -gt 0)
    {
        $parts += "courseId=$CourseId"
    }

    if ($Year -gt 0)
    {
        $parts += "year=$Year"
    }

    $path = "admin/attendance-periods"

    if ($parts.Count -gt 0)
    {
        $path += "?" + ($parts -join "&")
    }

    $response = Invoke-ApiRequest -Method GET -Path $path -Token $Token
    $count = Assert-ApiCollection -Response $response -Property "periods"

    $response.periods | Format-Table id, courseName, year, month, dateStart, dateEnd, state, attendanceCount -AutoSize | Out-Host
    $label = if ($count -eq 1) { "período" } else { "períodos" }
    "$count $label"
}
