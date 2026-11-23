# Day 10: Read-only check for previously completed Mission and uav-01 state.
# Does not create Orders/Missions, does not POST or modify PostgreSQL.
$ErrorActionPreference = 'Stop'
$base = 'http://127.0.0.1:3000'

Write-Host 'Checking local API, UAV and Mission status (READ-ONLY)...' -ForegroundColor Cyan
$health = Invoke-RestMethod -Uri "$base/health"
if (-not $health.ok -or -not $health.database) { throw 'API or database not ready.' }

# Materialize the returned JSON array before filtering; prevents PowerShell
# treating the complete array as one pipeline object on some versions.
$allDrones = Invoke-RestMethod -Uri "$base/api/drones"
$drone = @($allDrones) | Where-Object { $_.id -eq 'uav-01' } | Select-Object -First 1
if ($null -eq $drone) { throw 'uav-01 not found in API.' }
Write-Host "Drone $($drone.id): $($drone.status) (battery $($drone.battery_pct)%)"

$allMissions = Invoke-RestMethod -Uri "$base/api/missions"
$droneMissions = @($allMissions) | Where-Object { $_.drone_id -eq 'uav-01' -or $_.droneId -eq 'uav-01' }
Write-Host "Mission records for uav-01: $(@($droneMissions).Count)"
$droneMissions | Select-Object -First 5 | Format-Table id,status,version -AutoSize

if ($drone.status -eq 'AVAILABLE') {
  Write-Host 'CHECK OK: uav-01 is AVAILABLE.' -ForegroundColor Green
} else {
  Write-Host "CHECK: uav-01 is $($drone.status). Inspect any active Mission before rerunning tests." -ForegroundColor Yellow
}
Write-Host 'NOTE: Read-only status check is not an end-to-end Mission Flow PASS by itself.'
