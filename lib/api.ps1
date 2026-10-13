# attendance-api/ps/lib/api.ps1
# Solicitudes JSON a /api/* y comprobación de códigos HTTP esperados.

function Get-ApiHttpStatusCode
{
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [System.Management.Automation.ErrorRecord]$ErrorRecord
    )

    $response = $ErrorRecord.Exception.Response

    if ($null -eq $response)
    {
        return 0
    }

    try
    {
        return [int]$response.StatusCode
    }
    catch
    {
        return 0
    }
}

function Invoke-ApiRequest
{
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet("GET", "POST", "PUT", "PATCH", "DELETE")]
        [string]$Method,

        [Parameter(Mandatory = $true)]
        [string]$Path,

        [string]$Token = "",

        [AllowNull()]
        [object]$Body = $null,

        [ValidateRange(0, 599)]
        [int]$ExpectedStatusCode = 0
    )

    if ([string]::IsNullOrWhiteSpace($URL_API))
    {
        throw "No está configurada la variable URL_API."
    }

    $baseUrl = $URL_API.TrimEnd("/")
    $endpoint = $Path.TrimStart("/")
    $url = "$baseUrl/$endpoint"

    $headers = @{
        Accept = "application/json"
    }

    if (-not [string]::IsNullOrWhiteSpace($Token))
    {
        $headers.Authorization = "Bearer $Token"
    }

    $request = @{
        Uri         = $url
        Method      = $Method
        Headers     = $headers
        ErrorAction = "Stop"
    }

    if ($null -ne $Body)
    {
        $json = ConvertTo-Json -InputObject $Body -Depth 12 -Compress
        $request.ContentType = "application/json; charset=utf-8"
        $request.Body = [System.Text.Encoding]::UTF8.GetBytes($json)
    }

    try
    {
        $response = Invoke-RestMethod @request

        if ($ExpectedStatusCode -ge 400)
        {
            throw "Se esperaba HTTP $ExpectedStatusCode, pero la API respondió correctamente."
        }

        if ($null -ne $response -and
            $null -ne $response.PSObject.Properties["success"] -and
            $response.success -eq $false)
        {
            throw "La API indicó success=false: $($response.message)"
        }

        return $response
    }
    catch
    {
        $statusCode = Get-ApiHttpStatusCode -ErrorRecord $_

        if ($ExpectedStatusCode -ge 400 -and $statusCode -eq $ExpectedStatusCode)
        {
            return [pscustomobject]@{
                success    = $true
                statusCode = $statusCode
                expected   = $true
            }
        }

        $reason = $_.ErrorDetails.Message

        if ([string]::IsNullOrWhiteSpace($reason))
        {
            $reason = $_.Exception.Message
        }

        $statusText = if ($statusCode -gt 0) { "HTTP $statusCode" } else { "sin respuesta HTTP" }
        throw "Error ($statusText) en $Method $url : $reason"
    }
}
