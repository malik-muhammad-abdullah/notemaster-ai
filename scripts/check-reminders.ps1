# Get the CRON_SECRET from environment variable
$cronSecret = $env:CRON_SECRET

# Check if CRON_SECRET is set
if (-not $cronSecret) {
    Write-Error "CRON_SECRET environment variable is not set"
    exit 1
}

# Make the HTTP request
try {
    $headers = @{
        'Authorization' = "Bearer $cronSecret"
    }
    
    # Log start time
    Write-Host "Starting cron job at $(Get-Date)"
    
    # Make the request to your local development server
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/cron/check-reminders" -Headers $headers -Method GET
    
    # Log response
    Write-Host "Response status: $($response.StatusCode)"
    Write-Host "Response body: $($response.Content)"
    Write-Host "Cron job completed at $(Get-Date)"
} catch {
    Write-Error "Error making request: $_"
    exit 1
} 