# Ngày 9 — test thử luồng Mission DEMO (THAY ĐỔI DB).
# CHỈ chạy trên DB thực hành riêng, khi uav-01 AVAILABLE.
# API đổi trạng thái DB, KHÔNG điều khiển Virtual Flight Controller hay Cesium.
$ErrorActionPreference = 'Stop'
$base = 'http://127.0.0.1:3000'

function SendJson($path, $body) {
  return Invoke-RestMethod -Method Post -Uri "$base$path" -ContentType 'application/json' -Body ($body | ConvertTo-Json -Compress)
}

Write-Host 'Preflight: checking local demo API and UAV availability...' -ForegroundColor Cyan
$health = Invoke-RestMethod -Uri "$base/health"
if (-not $health.ok -or -not $health.database) { throw 'API or DB is not ready.' }
$drones = Invoke-RestMethod -Uri "$base/api/drones"
$drone = $drones | Where-Object { $_.id -eq 'uav-01' } | Select-Object -First 1
if ($null -eq $drone) { throw 'uav-01 not found. Check seed.sql.' }
if ($drone.status -ne 'AVAILABLE') { throw "uav-01 is $($drone.status), not AVAILABLE. Test aborted safely." }

$order = SendJson '/api/orders' @{ deliveryPointId='point-a'; weightKg=0.8 }
Write-Host "Created Order: $($order.id), $($order.status)"
$mission = SendJson '/api/missions' @{ orderId=$order.id; droneId='uav-01' }
Write-Host "Created Mission: $($mission.id), $($mission.status), version=$($mission.version)"
if ($mission.status -ne 'READY' -or $mission.version -ne 0) { throw 'Unexpected initial state.' }

$transitions = @(
  @{ action='start'; expected='IN_PROGRESS' },
  @{ action='pause'; expected='PAUSED' },
  @{ action='resume'; expected='IN_PROGRESS' },
  @{ action='return-home'; expected='RETURNING' },
  @{ action='complete'; expected='COMPLETED' }
)
foreach ($step in $transitions) {
  $mission = SendJson "/api/missions/$($mission.id)/$($step.action)" @{ expectedVersion=[int]$mission.version }
  Write-Host "$($step.action) => $($mission.status) (version=$($mission.version))"
  if ($mission.status -ne $step.expected) { throw "Expected $($step.expected), got $($mission.status)" }
}
$check = (Invoke-RestMethod -Uri "$base/api/drones" | Where-Object { $_.id -eq 'uav-01' } | Select-Object -First 1)
if ($check.status -ne 'AVAILABLE') { throw "Expected drone AVAILABLE, got $($check.status)" }
Write-Host "PASS: Mission $($mission.id) completed. Drone AVAILABLE." -ForegroundColor Green
Write-Host "NOTE: Demo Order remains ASSIGNED; real delivery confirmation is NOT implemented."
