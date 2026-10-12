. .\ps\constants.ps1

$body = @{
    username = $LOCAL_ADMIN
    password = $LOCAL_PASSWORD
} | ConvertTo-Json

$login = Invoke-RestMethod `
    -Uri $URL_LOGIN `
    -Method POST `
    -ContentType $CONTENT_TYPE_JSON `
    -Body $body

$result = Invoke-RestMethod `
    -Uri "$URL_API/admin/enrollments" `
    -Method GET `
    -Headers @{
        Authorization = "Bearer $($login.token)"
    }

$result | ConvertTo-Json -Depth 5