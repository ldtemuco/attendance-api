# attendance-api/ps/lib/auth.ps1
# La API necesita la contraseña en el cuerpo JSON; no se imprime ni registra.

function Get-AuthToken
{
    [CmdletBinding(DefaultParameterSetName = "Account")]
    param(
        [Parameter(ParameterSetName = "Account")]
        [ValidateSet("Admin", "Inspector", "Coordinator")]
        [string]$Account = "Admin",

        [Parameter(Mandatory = $true, ParameterSetName = "Credentials")]
        [PSCredential]$Credential
    )

    if ($PSCmdlet.ParameterSetName -eq "Account")
    {
        switch ($Account)
        {
            "Admin"
            {
                $username = $ADMIN_USERNAME
                $secret = $ADMIN_PASSWORD
            }
            "Inspector"
            {
                $username = $INSPECTOR_USERNAME
                $secret = $INSPECTOR_PASSWORD
            }
            "Coordinator"
            {
                $username = $COORDINATOR_USERNAME
                $secret = $COORDINATOR_PASSWORD
            }
        }
    }
    else
    {
        $username = $Credential.UserName
        $secret = $Credential.GetNetworkCredential().Password
    }

    if ([string]::IsNullOrWhiteSpace($username) -or
        [string]::IsNullOrWhiteSpace($secret))
    {
        throw "Faltan las credenciales de $Account."
    }

    $response = Invoke-ApiRequest -Method POST -Path "auth/login" -Body @{
        username = $username
        password = $secret
    }

    if ($null -eq $response -or
        $response.success -ne $true -or
        [string]::IsNullOrWhiteSpace($response.token))
    {
        throw "Inicio de sesión fallido."
    }

    return [string]$response.token
}

function Get-AuthUser
{
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Token
    )

    $response = Invoke-ApiRequest -Method GET -Path "auth/me" -Token $Token

    if ($response.success -ne $true -or $null -eq $response.user)
    {
        throw "No fue posible obtener el usuario autenticado."
    }

    return $response.user
}

function Close-AuthSession
{
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Token
    )

    return Invoke-ApiRequest -Method POST -Path "auth/logout" -Token $Token
}
