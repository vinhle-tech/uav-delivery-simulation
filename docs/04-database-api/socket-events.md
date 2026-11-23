# SOCKET.IO EVENT CONTRACT – UAV DELIVERY SIMULATION

**Phiên bản:** 1.0 – Bước 26, Giai đoạn 1  
**Realtime lab:** Socket.IO trên Express, địa chỉ `http://127.0.0.1:3000`  
**Nguồn đối chiếu:** `experiments/database-api/src/server.js`, `socket-listener.js`  
**Trạng thái:** Ba event đầu tiên đang hoạt động; các event khác là thiết kế MVP.

## 1. Mục đích

Backend gửi cập nhật Mission và telemetry đến những Client đang kết nối, giúp Web, Android và Windows nhìn thấy trạng thái chung. **Server/Simulation Engine là nguồn có thẩm quyền**; Client không tự tính lại trạng thái UAV để quyết định nghiệp vụ.

So sánh:

- **REST API:** gửi yêu cầu điều khiển, xác thực/kiểm tra và nhận kết quả từng yêu cầu.
- **Socket.IO:** cập nhật trạng thái, cảnh báo, telemetry liên tục hoặc theo sự kiện.
- **PostgreSQL:** lưu trạng thái và lịch sử bền vững (Socket.IO tự nó không phải DB).

## 2. Event đã có trong source code bài lab

| Event | Hướng | Lúc phát | Payload chính |
|---|---|---|---|
| `server:hello` | Server → Client vừa kết nối | `io.on('connection')` | `{message, demoOnly}` |
| `mission:updated` | Server → mọi Client hiện nối | Sau commit tạo Mission hoặc đổi trạng thái qua REST | Bản ghi Mission từ DB, gồm `id`, `status`, `version`, ... |
| `drone:telemetry` | Server → mọi Client hiện nối | Sau khi POST `/api/demo/telemetry` ghi DB thành công | Bản ghi Telemetry + `demoOnly:true` |

Trong bản lab, `io.emit(...)` phát đến **tất cả** kết nối Socket.IO, chưa chia room theo quyền; `server:hello` dùng `socket.emit(...)` chỉ cho Client mới nối.

### 2.1. server:hello

Ví dụ payload đúng cấu trúc hiện tại:

```json
{"message":"Connected to UAV API demo","demoOnly":true}
```

### 2.2. mission:updated

Ví dụ **minh họa** dựa trên dữ liệu trả từ PostgreSQL:

```json
{
  "id":"mis-1234abcd",
  "order_id":"ord-001",
  "drone_id":"uav-01",
  "station_id":"station-01",
  "status":"PAUSED",
  "version":2,
  "created_at":"2026-11-23T07:00:00.000Z",
  "started_at":"2026-11-23T07:01:00.000Z",
  "finished_at":null
}
```

`version` tăng sau các action `start/pause/resume/return-home/complete` thành công. Khi mới tạo Mission `version=0`.

### 2.3. drone:telemetry

Ví dụ **minh họa** dựa trên payload phát từ code bài lab:

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
  "recorded_at":"2026-11-23T07:02:00.000Z",
  "demoOnly":true
}
```

Đây là dữ liệu do bạn **POST thủ công** lên `/api/demo/telemetry`, chưa lấy từ cảm biến ảo và Flight Controller. Các trường `NUMERIC`/`BIGINT` có thể được trả dưới dạng chuỗi JSON.

## 3. Cách Client đăng ký event (đã có trong lab)

`experiments/database-api/src/socket-listener.js` dùng `socket.io-client`:

```javascript
const { io } = require('socket.io-client');
const socket = io('http://127.0.0.1:3000', { reconnectionAttempts: 5 });

socket.on('connect', () => console.log('Connected:', socket.id));
socket.on('server:hello', data => console.log('server:hello', data));
socket.on('mission:updated', data => console.log('mission:updated', data.id, data.status, 'version', data.version));
socket.on('drone:telemetry', data => console.log('drone:telemetry', data.drone_id, data.battery_pct));
socket.on('connect_error', err => console.error(err.message));
```

**Thao tác chạy:**

1. Terminal thứ nhất: `cd experiments/database-api` → `npm start`.
2. Terminal thứ hai, cùng thư mục: `npm run listen`.
3. Terminal thứ ba: dùng REST tạo/đổi Mission hoặc POST telemetry mẫu.
4. Kiểm tra Terminal listener nhận `mission:updated` hoặc `drone:telemetry`.

## 4. Event THIẾT KẾ CHO MVP – chưa triển khai

| Event | Chiều | Payload đề xuất | Khi nào phát |
|---|---|---|---|
| `drone:state_changed` | Server → Client có quyền | `droneId, previousState, currentState, missionId, version, timestamp` | State Machine chuyển trạng thái |
| `order:updated` | Server → Client có quyền | `orderId, status, version, timestamp` | Đơn được phân công/giao/thất bại |
| `incident:created` | Server → Client có quyền | `incidentId, droneId, missionId, incidentType, severity, timestamp` | Safety Manager phát hiện sự cố |
| `simulation:snapshot` | Server → Client vừa đồng bộ lại | `drones[], missions[], serverTime, sequence` | Khi Client yêu cầu snapshot |
| `command:ack` (tùy chọn) | Server → Client điều khiển | `requestId, command, accepted, version, reason` | Thông báo kết quả tiếp nhận lệnh |

**Lưu ý:** Các trường `version`, `sequence`, `timestamp` trong event mới là **đề xuất** cho sản phẩm, không phải trường đã có trong payload telemetry bài lab. Đừng giả định chúng được server hiện tại phát ra.

## 5. Rooms và quyền xem dữ liệu – thiết kế MVP

Gợi ý phân nhóm Socket.IO theo đối tượng:

- `drone:<id>`: client được quyền xem UAV cụ thể.
- `mission:<id>`: client theo dõi một Mission.
- `station:<id>`: client của trạm phù hợp.

Luồng dự kiến:

1. Client kết nối, cung cấp phiên/token xác thực.
2. Server kiểm tra token, vai trò và quyền truy cập trước khi cho vào room.
3. Server chỉ phát trạng thái đến room thích hợp.
4. Khi mất quyền hoặc đăng xuất, Client rời room/đóng kết nối.

**Bản hiện tại chưa có xác thực Socket.IO và chưa có room.** Tuyệt đối không public server lab lên Internet.

## 6. Reconnect và đồng bộ lại trạng thái – thiết kế MVP

Socket.IO hỗ trợ tự kết nối lại nhưng **không mặc định lưu và phát lại toàn bộ event đã lỡ**. Không được coi một Client vừa reconnect là đã đồng bộ chính xác.

Quy trình được đề xuất:

1. Sau `connect/reconnect`, xác thực lại phiên.
2. Gọi `GET /api/simulation/snapshot` khi API này được triển khai; trong lab có thể tạm gọi `GET /api/drones` và `GET /api/missions` nhưng hai endpoint này **chưa tạo snapshot nguyên tử**.
3. Hiển thị dữ liệu từ server, lưu `version/sequence` gần nhất.
4. Bắt đầu/tiếp tục nhận event; nếu thấy gap hoặc version lùi, yêu cầu snapshot mới.
5. Cân nhắc thứ tự subscribe và đọc snapshot, xử lý buffer event trong thời gian đồng bộ để tránh bỏ sót cập nhật.

Trong bản MVP, nguồn quyết định trạng thái vẫn là server. Không tự tạo Mission hay thay đổi pin dựa trên Client local.

## 7. Tần số và đơn vị đo – mục tiêu thiết kế

| Hoạt động | Tần số mục tiêu | Ý nghĩa |
|---|---|---|
| Simulation Engine `tick()` | 100 ms thời gian mô phỏng | Cập nhật vị trí, trạng thái, pin |
| Socket.IO telemetry | Khoảng 2 Hz | Cập nhật màn hình |
| Lưu telemetry | Tần số thấp hơn hoặc theo sự kiện | Tránh phát sinh DB quá lớn |

Đây là mục tiêu dự kiến theo kiến trúc; **Server lab hiện chỉ phát telemetry khi có POST**. Dữ liệu hiện dùng `x_m, y_m, z_m` tính theo mét cục bộ, không phải GPS latitude/longitude.

## 8. Đảm bảo lệnh và tính nhất quán

- Lệnh nghiệp vụ như `START/PAUSE/RESUME/RETURN_HOME` gửi qua REST Command Service.
- Mỗi yêu cầu điều khiển trong bản MVP cần `requestId` (idempotency) và `expectedVersion`.
- Socket.IO dùng thông báo trạng thái đã được server xác nhận, không thay thế kiểm tra transaction/lock tại Database.
- Bản hiện tại chỉ có `expectedVersion`; chưa có xử lý idempotency theo `requestId`.
- Backend chỉ phát event sau khi DB transaction commit. Bản MVP sẽ cần cơ chế bền vững hơn (event log/outbox hoặc tương đương) nếu muốn bảo đảm phục hồi khi server sự cố giữa commit và emit.
- Kịch bản mất kết nối Client khác với server restart. Nếu server restart, dùng checkpoint và quy trình khôi phục Mission được nêu trong `architecture.md`.

## 9. Kiểm thử và nghiệm thu

| Mã | Bước thực hiện | Kết quả cần quan sát |
|---|---|---|
| RT-01 | Chạy Backend, `npm run listen` | `connect` + `server:hello` |
| RT-02 | Tạo Mission qua REST | Listener nhận `mission:updated` READY |
| RT-03 | POST `/api/missions/:id/start` với version đúng | `mission:updated` IN_PROGRESS, version tăng |
| RT-04 | POST `/api/demo/telemetry` | Listener nhận `drone:telemetry`, `demoOnly=true` |
| RT-05 (thiết kế) | Mất kết nối rồi reconnect | Snapshot lại trạng thái mới nhất khi endpoint được tích hợp |
| RT-06 (thiết kế) | Hai client gửi lệnh sai version | REST 409, không phát event sai |

## 10. Liên kết tài liệu

- `api-contract.md`: các REST API và mã lỗi.
- `database-design.md`: các bảng Mission/Drone/Telemetry.
- `../02-architecture/command-and-sync.md`: nguyên tắc sync và command.
- `../01-requirements/SRS.md`: FR-05, FR-07, NFR-01/NFR-02.

**Tiêu chí nghiệm thu:** đọc được payload event thực tế trong code, chạy listener, tạo Mission và phát telemetry thử; phân biệt rõ event đã có với các room, snapshot, auth và tần số mô phỏng còn nằm trong thiết kế.
