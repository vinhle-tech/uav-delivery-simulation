# REST API CONTRACT - BẢN THỰC NGHIỆM

Base URL (localhost): `http://127.0.0.1:3000`

## Các API chạy được trong bài lab
| Method | URL | Request body | Kết quả |
|---|---|---|---|
| GET | /health | — | Kiểm tra DB và server |
| GET | /api/drones | — | Danh sách Drone |
| GET | /api/orders | — | Danh sách Order |
| POST | /api/orders | `{ "deliveryPointId": "point-a", "weightKg": 0.8 }` | 201 + Order PENDING |
| GET | /api/missions | — | Danh sách Mission |
| GET | /api/missions/:id | — | Một Mission |
| POST | /api/missions | `{ "orderId": "ord-001", "droneId": "uav-01" }` | 201 + Mission READY |
| POST | /api/missions/:id/start | `{ "expectedVersion": 0 }` | Mission IN_PROGRESS, version tăng |
| POST | /api/missions/:id/pause | `{ "expectedVersion": 1 }` | Mission PAUSED |
| POST | /api/missions/:id/resume | `{ "expectedVersion": 2 }` | Mission IN_PROGRESS |
| POST | /api/missions/:id/return-home | `{ "expectedVersion": 3 }` | Mission RETURNING |
| POST | /api/missions/:id/complete | `{ "expectedVersion": 4 }` | Mission COMPLETED |
| POST | /api/demo/telemetry | `{ "droneId":"uav-01", "batteryPct":85, "x":25, "y":0, "z":30, "simTimeSec":5 }` | 201 + emit telemetry |

**Chú ý:** `/api/missions/:id/...` trong demo là một **trình điều khiển trạng thái nghiệp vụ**; `start` chưa gọi Virtual Flight Controller và không tạo chuyến bay vật lý/3D. `complete` được gọi thủ công cho mục tiêu học transaction/version, không xác minh UAV thực sự đã quay về. Sau này chính Simulation Engine phải quyết định các chuyển trạng thái phù hợp, backend không tự cho hoàn thành chuyến bay.

## Mã lỗi
- `400` INVALID_INPUT/INVALID_VERSION: gửi thiếu hoặc sai dữ liệu.
- `404` *_NOT_FOUND: ID không tồn tại.
- `409` DRONE_BUSY, ORDER_BUSY, VERSION_CONFLICT, INVALID_STATE: xung đột trạng thái.
- `422` OVERWEIGHT, INSUFFICIENT_BATTERY, FOREIGN_KEY_ERROR: không đáp ứng quy tắc.
- `500`: lỗi không mong đợi, cần xem log backend.

## Kỹ thuật đang sử dụng
- Express `app.get()` và `app.post()` nhận GET/POST.
- `express.json()` chuyển JSON request thành `req.body`.
- `Pool.query(sql, [values])` sử dụng **parameterized query**, tránh nối chuỗi SQL từ input người dùng.
- `SELECT FOR UPDATE` và index unique giúp tránh tạo hai mission cho cùng UAV.
- `expectedVersion` ngăn ghi đè từ Client có snapshot cũ; phản hồi `409` khi xung đột.

## API phải bổ sung để đủ MVP (chưa có trong demo)
- Đăng nhập/JWT hoặc session, phân quyền và kiểm tra trên mọi endpoint.
- CRUD Drone/Station/Delivery Point, waypoint validation, geofence, route-distance & real energy checks.
- Lệnh điều khiển được xử lý bởi Simulation Engine với command ACK, `requestId` chống gửi trùng và event log bền vững.
- Confirm Delivery với OTP hoặc xác nhận giả lập, Return Home theo đánh giá Safety Manager.
- Pagination, rate limiting, schema validator, observability, security hardening.
