$baseUrl = "https://attendance-api.bfarfal.workers.dev"

$body = @{    
    username = "admin"
    password = "asistencialdd"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "$baseUrl/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$response

$token = $response.token

Write-Host $token

Invoke-RestMethod `
    -Uri "$baseUrl/api/auth/me" `
    -Method GET `
    -Headers @{
        Authorization = "Bearer $token"
    }

    

Invoke-RestMethod `
    -Uri "$baseUrl/api/auth/logout" `
    -Method POST `
    -Headers @{
        Authorization = "Bearer $token"
    }