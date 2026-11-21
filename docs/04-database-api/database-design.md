# Thiết kế dữ liệu (conceptual)

| Entity | Trường ban đầu | Quan hệ |
|---|---|---|
| users | id, name, email, password_hash, role | 1-N orders |
| stations | id, name, lat, lon | 1-N drones |
| drone_models | id, name, max_payload_kg, cruise_speed_mps | 1-N drones |
| drones | id, model_id, station_id, battery_pct, status | 1-N missions |
| delivery_points | id, lat, lon, label | 1-N orders |
| orders | id, created_by, delivery_point_id, weight_kg, status | 1-N missions (attempts) |
| missions | id, drone_id, order_id, flight_status, started_at | 1-N waypoints |
| waypoints | id, mission_id, seq, lat, lon, altitude_m | N-1 mission |
| telemetry | id, mission_id, timestamp, lat, lon, battery_pct | N-1 mission |
| drone_events | id, drone_id, mission_id, type, timestamp | N-1 mission |
| incidents | id, mission_id, severity, type, resolved_at | N-1 mission |
| delivery_confirmations | id, order_id, mission_id, status | N-1 order/mission |

## Các ràng buộc quan trọng
- Không cho 2 active missions cùng gắn với một drone (cần DB/index hoặc transaction hỗ trợ).
- Đơn hàng và nhiệm vụ có trạng thái độc lập.
- Waypoints trong cùng mission có thứ tự seq duy nhất.
- [TODO] Chọn kiểu dữ liệu PostgreSQL (UUID, numeric, timestamp with time zone...).
- [TODO] Chọn index và ràng buộc trạng thái rõ ràng.
