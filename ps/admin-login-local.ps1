#attendance-api/ps/admin-login-local.ps1

$body = @{    
    username = "admin"
    password = "UnaClaveSegura123!"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "http://localhost:8787/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$token = $response.token

Invoke-RestMethod `
    -Uri "http://localhost:8787/api/auth/me" `
    -Method GET `
    -Headers @{
        Authorization = "Bearer $token"
    }

$result = Invoke-RestMethod `
    -Uri "http://localhost:8787/api/courses" `
    -Headers @{
        Authorization = "Bearer $token"
    }

$rs = $result.courses

$rs | Format-Table id, level, letter, name

Write-Host $rs