# REST API CONTRACT – UAV DELIVERY SIMULATION

**Phiên bản:** 1.0 – Bước 26, Giai đoạn 1  
**Backend thực nghiệm:** Node.js + Express + PostgreSQL  
**Base URL cục bộ:** `http://127.0.0.1:3000`  
**Nguồn đối chiếu:** `experiments/database-api/src/server.js` (bộ thực hành Ngày 6)

> **Phạm vi:** Phần 1–5 ghi đúng những endpoint **đã có trong code thử nghiệm**. Phần 6 là đặc tả **dự kiến để hoàn thiện MVP**, không được mô tả là đã chạy. Server hiện **chưa có đăng nhập hoặc kiểm tra phân quyền**, chỉ lắng nghe localhost; không công khai lên Internet.

## 1. Quy ước

- Client gửi/nhận JSON; các endpoint `POST` có `Content-Type: application/json`.
- URL `:id` là biến đại diện cho ID thực, ví dụ `/api/missions/mis-1234abcd/start`.
- Các phản hồi từ DB dùng tên trường `snake_case`: `weight_kg`, `battery_pct`, `created_at`, `delivery_point_id`. Request từ Client sử dụng `camelCase`: `weightKg`, `deliveryPointId`, `expectedVersion`.
- Các cột PostgreSQL kiểu `NUMERIC` qua `pg` thường được biểu diễn thành **chuỗi JSON**, ví dụ `"90.00"`. Client không nên mặc định `battery_pct` luôn là JSON number.
- ID Mission/Order mới do server sinh, không nên đoán hoặc hardcode ID khi kiểm thử.
- `expectedVersion`: phiên bản Mission mà Client đang dựa vào; backend trả 409 nếu khác `missions.version` hiện tại.
- Bản demo chưa có `requestId` chống lệnh lặp lại ở mức API. Thiết kế này dành cho bước triển khai MVP.

## 2. Bảng endpoint đã triển khai

| Method | Đường dẫn | Request | Thành công | Ghi chú |
|---|---|---|---|---|
| GET | `/health` | — | 200 | Kiểm tra Node/PostgreSQL |
| GET | `/api/drones` | — | 200 | Danh sách UAV + model; không có GET chi tiết |
| GET | `/api/orders` | — | 200 | Tối đa 100 Order mới nhất |
| POST | `/api/orders` | `deliveryPointId`, `weightKg` | 201 | Tạo Order PENDING |
| GET | `/api/missions` | — | 200 | Tối đa 100 Mission mới nhất |
| GET | `/api/missions/:id` | — | 200 | Xem Mission |
| POST | `/api/missions` | `orderId`, `droneId` | 201 | Tạo Mission READY, giữ UAV |
| POST | `/api/missions/:id/start` | `expectedVersion` | 200 | READY → IN_PROGRESS |
| POST | `/api/missions/:id/pause` | `expectedVersion` | 200 | IN_PROGRESS → PAUSED |
| POST | `/api/missions/:id/resume` | `expectedVersion` | 200 | PAUSED → IN_PROGRESS |
| POST | `/api/missions/:id/return-home` | `expectedVersion` | 200 | IN_PROGRESS/PAUSED → RETURNING |
| POST | `/api/missions/:id/complete` | `expectedVersion` | 200 | RETURNING → COMPLETED (thử nghiệm) |
| POST | `/api/demo/telemetry` | mẫu đo giả lập | 201 | Lưu và phát `drone:telemetry` |

## 3. Đặc tả và ví dụ request/response

### 3.1. Kiểm tra server – GET /health

**Request:** không body. **Response 200:**

```json
{"ok":true,"database":true}
```

Nếu kết nối DB không hoạt động, code thực hành có thể trả `500` cho truy vấn health (hoặc không khởi động được nếu DB lỗi ngay lúc mở server).

### 3.2. Danh sách UAV – GET /api/drones

**Response 200:** Mảng JSON với các trường `id`, `status`, `battery_pct`, `max_payload_kg`, `cruise_speed_mps`.

```json
[
  {"id":"uav-01","status":"AVAILABLE","battery_pct":"90.00","max_payload_kg":"1.50","cruise_speed_mps":"6.00"},
  {"id":"uav-02","status":"AVAILABLE","battery_pct":"35.00","max_payload_kg":"1.50","cruise_speed_mps":"6.00"}
]
```

Kết quả có thể gồm UAV khác như `uav-03`, tùy dữ liệu hiện tại.

### 3.3. Danh sách đơn – GET /api/orders

**Response 200:** Mảng bản ghi `orders` ở dạng `snake_case`, xếp `created_at DESC`, giới hạn 100 bản ghi. Chưa hỗ trợ `page`, `limit` hay filter từ Client.

### 3.4. Tạo đơn – POST /api/orders

**Request:**

```json
{"deliveryPointId":"point-a","weightKg":0.8}
```

**Điều kiện hiện có:** `deliveryPointId` phải là string tồn tại trong `delivery_points`; `weightKg` phải là JSON number hữu hạn, lớn hơn 0 và không vượt 9999. Khi insert, DB còn ràng buộc `NUMERIC(7,2)` và `weight_kg > 0`.

**Response 201 (ví dụ minh họa):**

```json
{
  "id":"ord-a1b2c3d4",
  "delivery_point_id":"point-a",
  "created_by":null,
  "weight_kg":"0.80",
  "status":"PENDING",
  "created_at":"2026-11-23T07:00:00.000Z"
}
```

**Lỗi:** `400 INVALID_INPUT`, `404 POINT_NOT_FOUND`, có thể `422 CHECK_FAILED`, `500 SERVER_ERROR`.

### 3.5. Danh sách Mission – GET /api/missions

**Response 200:** Mảng bản ghi `missions`, mới nhất trước, tối đa 100 bản ghi.

### 3.6. Xem Mission – GET /api/missions/:id

**Response 200:** Bản ghi Mission với `id`, `order_id`, `drone_id`, `station_id`, `status`, `version`, `created_at`, `started_at`, `finished_at`.

**Lỗi:** `404 MISSION_NOT_FOUND`.

### 3.7. Tạo Mission – POST /api/missions

**Request:**

```json
{"orderId":"ord-001","droneId":"uav-01"}
```

**Quy trình đang triển khai:**

1. Kiểm tra `orderId` và `droneId` là string.
2. Mở transaction; `SELECT` Order với `FOR UPDATE`. Chỉ chấp nhận Order `PENDING`.
3. `SELECT` UAV và Model với `FOR UPDATE OF d`. Chỉ chấp nhận UAV `AVAILABLE`.
4. Kiểm tra `order.weight_kg <= model.max_payload_kg`.
5. **Giả định bài lab**: pin UAV ít nhất `55%` (chưa tính năng lượng dựa trên tuyến).
6. Tạo Mission `READY`, `version = 0`, `station_id` lấy từ UAV; cập nhật UAV `RESERVED` và Order `ASSIGNED`.
7. COMMIT, phát `mission:updated`, trả 201.

**Response 201 (minh họa):**

```json
{
  "id":"mis-1234abcd",
  "order_id":"ord-001",
  "drone_id":"uav-01",
  "station_id":"station-01",
  "status":"READY",
  "version":0,
  "created_at":"2026-11-23T07:00:00.000Z",
  "started_at":null,
  "finished_at":null
}
```

**Lỗi:** `400 INVALID_INPUT`; `404 ORDER_NOT_FOUND / DRONE_NOT_FOUND`; `409 ORDER_BUSY / DRONE_BUSY / ACTIVE_MISSION_EXISTS`; `422 OVERWEIGHT / INSUFFICIENT_BATTERY`.

### 3.8. Các lệnh điều khiển Mission (bản lab)

Tất cả dùng `POST /api/missions/:id/:action` với body:

```json
{"expectedVersion":0}
```

**Yêu cầu:** `expectedVersion` là số nguyên >= 0, đúng với version hiện hành; mỗi lệnh thành công tăng `version` thêm 1. Chỉ hành động trong bảng dưới đây được hỗ trợ.

| Action | Trạng thái đầu | Trạng thái sau | Tác động thêm |
|---|---|---|---|
| `start` | READY | IN_PROGRESS | UAV BUSY, set `started_at` nếu chưa có |
| `pause` | IN_PROGRESS | PAUSED | Chỉ đổi Mission |
| `resume` | PAUSED | IN_PROGRESS | Chỉ đổi Mission |
| `return-home` | IN_PROGRESS, PAUSED | RETURNING | Chỉ đổi Mission |
| `complete` | RETURNING | COMPLETED | UAV AVAILABLE, set `finished_at` |

**Response 200:** bản ghi Mission mới nhất, `version` đã tăng. Nếu lỗi:

- `400 INVALID_VERSION` nếu thiếu/sai version.
- `404 UNKNOWN_ACTION` nếu action không có trong bảng, hoặc `MISSION_NOT_FOUND` nếu ID không tồn tại.
- `409 VERSION_CONFLICT` nếu version cũ; `409 INVALID_STATE` nếu lệnh không đúng trạng thái.

**Giới hạn rất quan trọng:** Đây chỉ là **chuyển trạng thái nghiệp vụ trên DB**, không gửi lệnh đến `flight-controller.js`. `/complete` hiện có thể được gọi thủ công nên **không chứng minh UAV đã hạ cánh về trạm**. Trong bản demo, `start` chưa cập nhật Order thành `IN_DELIVERY`, `complete` chưa tự cập nhật Order thành `DELIVERED` và chưa có xác nhận bàn giao. Không dùng những endpoint này làm cơ sở đánh giá an toàn bay.

### 3.9. Dữ liệu đo thử – POST /api/demo/telemetry

**Request:**

```json
{
  "droneId":"uav-01",
  "missionId":null,
  "simTimeSec":5,
  "x":25,
  "y":0,
  "z":30,
  "batteryPct":85
}
```

`missionId`, `simTimeSec`, `x/y/z` có thể bỏ qua (code có giá trị mặc định). `droneId` bắt buộc dạng string; các số phải hữu hạn; `simTimeSec >= 0`; `batteryPct` trong 0–100. Cột FK và CHECK trong PostgreSQL vẫn phải thỏa.

**Response 201 (ví dụ):**

```json
{
  "id":"1",
  "drone_id":"uav-01",
  "mission_id":null,
  "sim_time_s":5,
  "x_m":25,
  "y_m":0,
  "z_m":30,
  "battery_pct":"85.00",
  "recorded_at":"2026-11-23T07:01:00.000Z",
  "demoOnly":true
}
```

`BIGINT` từ `pg` có thể được serialize thành chuỗi JSON. Sau khi ghi thành công, Backend phát `drone:telemetry` với cùng payload.

**Lỗi:** `400 INVALID_TELEMETRY`, `422 FOREIGN_KEY_ERROR / CHECK_FAILED`, `500 SERVER_ERROR`.

## 4. Cấu trúc lỗi thực tế

Code tạo lỗi theo mẫu:

```json
{"error":{"code":"VERSION_CONFLICT","message":"Version hiện tại: 2"}}
```

| HTTP | Mã thường gặp trong code | Cách Client xử lý |
|---|---|---|
| 400 | `INVALID_INPUT`, `INVALID_VERSION`, `INVALID_TELEMETRY` | Báo dữ liệu đầu vào sai |
| 404 | `POINT_NOT_FOUND`, `ORDER_NOT_FOUND`, `DRONE_NOT_FOUND`, `MISSION_NOT_FOUND`, `UNKNOWN_ACTION` | Thông báo không tìm thấy |
| 409 | `ORDER_BUSY`, `DRONE_BUSY`, `ACTIVE_MISSION_EXISTS`, `VERSION_CONFLICT`, `INVALID_STATE`, `DUPLICATE` | Tải lại trạng thái, xử lý xung đột |
| 422 | `OVERWEIGHT`, `INSUFFICIENT_BATTERY`, `FOREIGN_KEY_ERROR`, `CHECK_FAILED` | Báo vi phạm điều kiện nghiệp vụ/ràng buộc |
| 500 | `SERVER_ERROR` | Ghi log và báo lỗi hệ thống |

Các mã `401`, `403` là **thiết kế dự kiến**, chưa có code xác thực/phân quyền nên bản thử chưa trả chúng theo cơ chế auth.

## 5. Kiểm tra nhanh bằng PowerShell

Mở Terminal 1 ở `experiments/database-api` và chạy `npm start`. Terminal 2:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/health
Invoke-RestMethod http://127.0.0.1:3000/api/drones
Invoke-RestMethod http://127.0.0.1:3000/api/orders

$body = @{ deliveryPointId = 'point-a'; weightKg = 0.8 } | ConvertTo-Json
Invoke-RestMethod -Uri http://127.0.0.1:3000/api/orders -Method Post -ContentType application/json -Body $body
```

**Chú ý:** nếu `ord-001` đã được dùng tạo Mission, việc tạo lại Mission cho `ord-001` sẽ trả 409. Hãy dùng một Order mới để kiểm thử hoặc dùng bộ seed trên DB thử nghiệm sạch.

## 6. API THIẾT KẾ CHO MVP – CHƯA CÓ TRONG `server.js`

| API dự kiến | Request dự kiến | Response dự kiến | Ý nghĩa |
|---|---|---|---|
| `POST /api/auth/login` | `{email,password}` | token/phiên an toàn | Xác thực |
| `POST /api/auth/logout` | phiên hiện tại | 204 | Đăng xuất |
| `GET /api/drones/:id` | path ID | Drone Detail | Chi tiết UAV |
| `POST /api/drones` | modelId, stationId, ... | 201 Drone | Quản lý UAV (theo quyền) |
| `PATCH /api/drones/:id` | dữ liệu được phép sửa | Drone mới | Cập nhật UAV |
| `GET /api/stations` | — | Danh sách trạm | Trạm UAV |
| `GET /api/delivery-points` | — | Điểm giao | Phục vụ tạo đơn |
| `GET /api/missions/:id/waypoints` | mission ID | Danh sách WP | Xem đường bay |
| `PUT /api/missions/:id/waypoints` | mảng WP + version | Tuyến mới | Lưu tuyến, kiểm tra vùng cấm |
| `POST /api/missions/:id/abort` | requestId + version | Command ACK | Hủy nhiệm vụ có kiểm soát |
| `POST /api/missions/:id/confirm-delivery` | successful, failureReason, requestId | Confirmation + Order/Mission | Xác nhận giao |
| `GET /api/missions/:id/telemetry` | phạm vi thời gian | Mẫu đo có phân trang | Lịch sử telemetry |
| `GET /api/incidents` | filter | Danh sách sự cố | Quản lý sự cố |
| `GET /api/simulation/snapshot` | — | snapshot có thẩm quyền | Đồng bộ lại khi reconnect |

**Nguyên tắc API MVP:**

1. Xác thực mọi endpoint nghiệp vụ; quyền `OPERATOR/ADMIN` dựa trên vai trò thực tế được thống nhất trong SRS.
2. Yêu cầu điều khiển dùng `requestId` chống lặp, `expectedVersion` phát hiện trạng thái cũ và Command ACK xác nhận đã nhận/chấp nhận.
3. Virtual Flight Controller có thẩm quyền quyết định chuyển pha bay và Safety Manager đánh giá tính khả thi; REST không tự gán `COMPLETED` tùy ý.
4. `POST /api/missions` phải kiểm tra tuyến/waypoints, vùng cấm, trọng lượng và **năng lượng toàn hành trình + dự phòng**, thay ngưỡng pin cứng của bài lab.
5. Trả mã lỗi có cấu trúc, ghi event log, giới hạn tần suất, kiểm tra input/schema và tránh phát sự kiện trước khi thay đổi DB đã commit.
6. Sau server restart: tải checkpoint, đánh dấu/giải quyết Mission gián đoạn theo thiết kế, không tự tiếp tục bay vô điều kiện.

## 7. Liên kết tài liệu và nghiệm thu

- `database-design.md`: bảng, FK, index, transaction.
- `socket-events.md`: tên sự kiện realtime và payload.
- `../01-requirements/SRS.md`: FR-03, FR-04, FR-05, FR-07, FR-08, FR-09.
- `../02-architecture/architecture.md`: Command Service, Server authoritative, khôi phục.

**Tiêu chí nghiệm thu:** giải thích được ít nhất các endpoint GET Drones, POST Order, POST Mission, Start/Pause/Resume, demo telemetry, chuẩn response/lỗi và ranh giới giữa API lab với API MVP.
