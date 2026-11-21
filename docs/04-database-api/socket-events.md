# Realtime Event Contract

| Event | Phía gửi | Nội dung |
|---|---|---|
| drone:telemetry | Server -> Client | id, pos, speed, altitude, battery, ts |
| drone:state_changed | Server -> Client | droneId, previous, current, version |
| mission:updated | Server -> Client | missionId, status, version |
| order:updated | Server -> Client | orderId, status |
| incident:created | Server -> Client | missionId, type, severity |
| simulation:snapshot | Server -> Client | trạng thái khi kết nối lại |

## Payload telemetry minh họa
```json
{"droneId":"UAV-01","timestamp":"2026-11-21T00:00:00Z","position":{"lat":21.03,"lon":105.82,"alt":40},"speedMps":7.5,"batteryPct":82}
```
**[TODO]** Chốt room theo mission/drone; cơ chế reconnect; không dựa vào Socket.IO để tự động bảo đảm lệnh được xử lý đúng một lần.
