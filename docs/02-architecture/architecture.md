# THIẾT KẾ KIẾN TRÚC HỆ THỐNG UAV GIAO HÀNG ĐA NỀN TẢNG

**Tên dự án:** UAV Delivery Simulation System  
**Loại tài liệu:** System Architecture Design  
**Phiên bản:** 1.0 – Bản thiết kế MVP  
**Trạng thái:** Draft – Chờ nhóm review  
**Phạm vi:** Hệ thống mô phỏng UAV giao hàng; không điều khiển UAV vật lý

## 1. Mục tiêu kiến trúc

Xây dựng hệ thống cho nhân viên điều phối tại một trung tâm logistics, hỗ trợ tạo đơn hàng, phân công UAV, lập nhiệm vụ, mô phỏng chuyến bay, giám sát thông số, xác nhận giao hàng và xử lý sự cố.

Các mục tiêu kiến trúc:

1. Chạy trên **Web, Android và Windows**, có cùng tài khoản, chức năng nghiệp vụ, dữ liệu và trạng thái.
2. Chỉ có **một nguồn trạng thái mô phỏng có thẩm quyền ở server**; Client không tự quyết định vị trí hay trạng thái thực tế của UAV.
3. Simulation Engine tiếp tục chạy khi một hoặc tất cả Client đóng, miễn là server vẫn hoạt động.
4. Đồng bộ telemetry, cảnh báo và trạng thái nhiệm vụ đến các Client đang kết nối.
5. Ngăn hai thiết bị đồng thời thực hiện các lệnh mâu thuẫn trên cùng UAV/Mission.
6. Lưu dữ liệu nghiệp vụ, sự kiện và checkpoint để hỗ trợ truy vết và phục hồi có kiểm soát.
7. Phù hợp quy mô MVP: **một trạm, ba UAV ảo, nhiều đơn hàng**, nhóm ba sinh viên và ưu tiên công cụ miễn phí.

**Ngoài phạm vi MVP:** điều khiển UAV thật, mô phỏng khí động học đầy đủ, điều phối tự động bằng AI/ML và hệ thống phân tán quy mô lớn.

## 2. Các nguyên tắc thiết kế

- **Server authoritative:** Backend và Simulation Engine là nguồn trạng thái có thẩm quyền. Client chỉ gửi yêu cầu và hiển thị kết quả.
- **Một Simulation Engine dùng chung:** Web, Android và Windows không chạy ba bản mô phỏng độc lập cho cùng UAV.
- **Phân tách trách nhiệm:** giao diện, nghiệp vụ, mô phỏng, kết nối thời gian thực và lưu trữ có ranh giới rõ ràng.
- **Mô phỏng độc lập giao diện:** CesiumJS dùng để **hiển thị 3D**, không thay thế Flight Controller hay Motion Model.
- **Ưu tiên kiến trúc đơn giản:** MVP dùng một backend Node.js chứa các module được phân tách logic; chưa cần microservices.
- **Thiết kế để kiểm thử:** Simulation Engine có phương thức `tick()` có thể gọi độc lập, cho phép chạy test nhanh hơn thời gian thực.
- **An toàn mô phỏng:** không mặc định Return Home luôn khả thi; Safety Manager phải kiểm tra năng lượng và phương án phù hợp.

## 3. Công nghệ lựa chọn

| Thành phần | Công nghệ | Trách nhiệm |
|---|---|---|
| Giao diện dùng chung | React, TypeScript, Vite, Tailwind CSS | Màn hình và tương tác nhân viên |
| Web | React trên trình duyệt | Giao diện Web |
| Android | Capacitor đóng gói React | Ứng dụng Android |
| Windows | Electron đóng gói React | Ứng dụng Desktop |
| Backend | Node.js, Express | REST API, xác thực, nghiệp vụ |
| Realtime | Socket.IO | Telemetry, trạng thái, cảnh báo |
| Dữ liệu | PostgreSQL | Dữ liệu bền vững, sự kiện, checkpoint |
| Mô phỏng | JavaScript/TypeScript | Virtual Flight Controller và Simulation Engine |
| Bản đồ 3D | CesiumJS | Địa cầu, UAV 3D, waypoint, tuyến bay |
| Xử lý địa lý | Turf.js (khi cần) | Khoảng cách, vùng cấm đơn giản |

Các công nghệ trên là lựa chọn thiết kế; chỉ Virtual Flight Controller và demo EventEmitter đã được kiểm chứng trong bước thực nghiệm hiện có. Chưa coi REST API, Socket.IO chạy mạng thật, PostgreSQL hay ba bản đóng gói là đã được triển khai.

## 4. Thành phần hệ thống và trách nhiệm

### 4.1. Client Applications

Các ứng dụng Web, Android và Windows tái sử dụng phần lớn React UI, logic giao diện, kiểu dữ liệu và cách gọi API.

**Được làm:** hiển thị Dashboard, quản lý đơn, hiển thị UAV/telemetry, tạo kế hoạch bay, gửi lệnh điều khiển và thông báo lỗi.  
**Không được làm:** tự ghi Database, tự quyết định Mission đã COMPLETED hoặc tự chạy một bộ mô phỏng có thẩm quyền cho UAV đang được server quản lý.

### 4.2. REST API / Authentication

Tiếp nhận HTTP request; xác thực người dùng, kiểm tra quyền và dữ liệu đầu vào; xử lý đọc/ghi đơn hàng, UAV, Mission và lịch sử.

Ví dụ API: `POST /api/missions/:id/start`, `GET /api/drones`, `POST /api/orders`, `GET /api/missions/:id`.

### 4.3. Mission Command Service

Tiếp nhận yêu cầu `START`, `PAUSE`, `RESUME`, `RETURN_HOME`, `ABORT`, `CONFIRM_HANDOVER`; kiểm tra trạng thái, phiên bản, mã chống gửi trùng và các ràng buộc đồng thời trước khi chuyển đến Engine. Mọi thay đổi nghiệp vụ quan trọng phải được ghi nhận nhất quán.

### 4.4. Simulation Engine

Chứa:

| Thành phần | Vai trò | Liên hệ mã thực nghiệm |
|---|---|---|
| Scheduler | Kích hoạt các bước thời gian cố định | Gọi `tick()` |
| Virtual Flight Controller | Tiếp nhận lệnh và điều khiển pha bay | `command()` |
| State Machine | Kiểm soát chuyển trạng thái hợp lệ | `change()` / `state` |
| Waypoint Navigation | Chọn đích di chuyển tiếp theo | `flyToward()` |
| Motion Model | Cập nhật vị trí, vận tốc, độ cao | Logic cập nhật trong `tick()` |
| Battery Model | Ước tính năng lượng tiêu hao | Logic pin trong `tick()` |
| Virtual Sensors | GPS/IMU/độ cao giả lập | `telemetry()` và phép đo giả lập |
| Safety Manager | Đánh giá sự cố, phương án hạ cánh/quay về | `safetyTick()` |
| Event/Telemetry Producer | Tạo sự kiện và dữ liệu giám sát | `log()` / `telemetry()` |

Bản thực nghiệm trong `experiments/flight-controller/` chưa phải là hệ thống điều khiển bay vật lý hoàn chỉnh. Khi tích hợp backend, mã này sẽ được nâng cấp và chia module phù hợp, không cần sao chép Flight Controller vào ba Client.

### 4.5. Socket.IO Gateway

Xác thực kết nối; phân phối `drone:telemetry`, `drone:state_changed`, `mission:updated`, `order:updated`, `incident:created`. Chỉ các Client có quyền mới nhận dữ liệu phù hợp. Socket.IO chủ yếu phân phối trạng thái, **không phải nguồn dữ liệu có thẩm quyền**.

### 4.6. Persistence Adapter và PostgreSQL

Persistence Adapter cô lập phần truy cập Database khỏi nghiệp vụ và mô phỏng. Database dự kiến lưu `users`, `stations`, `drones`, `orders`, `missions`, `waypoints`, `drone_events`, `incidents`, `telemetry` và `simulation_checkpoints`.

Không cần ghi vào Database mỗi lần vẽ một khung hình; chọn tần suất lưu telemetry và checkpoint phù hợp để tránh tải không cần thiết.

## 5. Luồng xử lý nghiệp vụ quan trọng

### 5.1. Tạo và bắt đầu một Mission

1. Nhân viên tạo Order và chọn UAV/waypoint trên Client.
2. Client gọi REST API; Backend kiểm tra xác thực, quyền và dữ liệu.
3. Command Service kiểm tra UAV sẵn sàng, tải trọng, pin, phạm vi và trạng thái Mission.
4. Backend lưu Mission trạng thái `READY` và giữ quyền sử dụng UAV theo cách nhất quán.
5. Khi người dùng bấm Start, Client gửi yêu cầu `POST /api/missions/:id/start`.
6. Backend kiểm tra phiên bản, trạng thái và lệnh trùng; chuyển yêu cầu hợp lệ cho Engine.
7. Engine trả kết quả **chấp nhận lệnh**; kết quả này **không đồng nghĩa đã TAKEOFF**.
8. Engine chạy `PRE_FLIGHT_CHECK`, sau đó `TAKEOFF` nếu đủ điều kiện.
9. Thay đổi trạng thái và telemetry được phát đến Client qua Socket.IO.

### 5.2. Bay, giao hàng và quay về

- Trong `EN_ROUTE`, Engine cập nhật vị trí, waypoint, độ cao, vận tốc, pin và cảm biến theo từng bước mô phỏng.
- UAV hạ cánh tại điểm nhận và vào `WAITING_FOR_HANDOVER`; **UAV tới nơi không có nghĩa Order đã giao thành công**.
- Kết quả bàn giao thuộc **Order**: `DELIVERED` hoặc `DELIVERY_FAILED`.
- Trạng thái bay thuộc **Mission/Flight Controller**: có thể còn `RETURNING`, sau đó `COMPLETED` hoặc `FAILED` tùy kết quả bay.
- Mission `COMPLETED` có thể đi cùng Order `DELIVERY_FAILED` nếu giao không thành công nhưng UAV quay về trạm an toàn.

### 5.3. Điều khiển Pause/Resume

- Pause chỉ được chấp nhận ở các trạng thái được định nghĩa, trước mắt là `EN_ROUTE`.
- Trong `PAUSED`, mô hình giữ vị trí/độ cao và vẫn tiêu hao pin; Safety Manager tiếp tục giám sát.
- Resume chỉ được xét khi đang `PAUSED` và các điều kiện an toàn còn hợp lệ.
- Client không được tự chuyển `flightState` trước khi nhận xác nhận và trạng thái mới từ server.

## 6. REST API, Command và Realtime

### 6.1. Hợp đồng lệnh mẫu

**Request:** `POST /api/missions/MIS-001/start`

```json
{
  "requestId": "req-001",
  "expectedVersion": 3
}
```

**Phản hồi chấp nhận lệnh (ví dụ):** `202 Accepted`

```json
{
  "accepted": true,
  "missionId": "MIS-001",
  "commandId": "cmd-001",
  "version": 4
}
```

Các lỗi thiết kế tham khảo: `401` chưa xác thực, `403` thiếu quyền, `404` không tìm thấy, `409` xung đột trạng thái/phiên bản, `422` vi phạm điều kiện nghiệp vụ.

### 6.2. Phát telemetry

- Scheduler mục tiêu: bước thời gian mô phỏng `0.1 s` (100 ms **thời gian mô phỏng**).
- Tần suất phát telemetry mục tiêu: `2 Hz` (mỗi 0.5 s thời gian mô phỏng ở chế độ chạy tốc độ 1×).
- Mỗi telemetry có `droneId`, `missionId`, thời gian mô phỏng, vị trí, vận tốc, độ cao, pin, trạng thái bay và thông tin thứ tự cập nhật nếu cần.
- Sự kiện chuyển trạng thái quan trọng cần được lưu bền vững; không dựa riêng vào việc Client nhận được Socket.IO event.

**Telemetry mẫu:**

```json
{
  "event": "drone:telemetry",
  "droneId": "UAV-01",
  "missionId": "MIS-001",
  "simTimeSec": 12.5,
  "flightState": "EN_ROUTE",
  "missionStatus": "IN_PROGRESS",
  "orderStatus": "ASSIGNED",
  "position": { "x": 30, "y": 0, "z": 30 },
  "batteryPct": 88.2
}
```

## 7. Ngăn lệnh trùng và xung đột giữa các Client

**Vấn đề:** Web và Mobile có thể gửi yêu cầu mâu thuẫn khi đang xem cùng một phiên bản Mission.

**Giải pháp đề xuất:**

1. Mỗi lệnh quan trọng có `requestId` duy nhất; lệnh gửi lại cùng `requestId` phải trả lại kết quả xử lý cũ (khi đã ghi nhận), không gây tác động hai lần.
2. Client gửi `expectedVersion` của Mission mà mình biết.
3. Backend kiểm tra và thay đổi phiên bản **một cách nguyên tử** bằng transaction/khóa/ràng buộc thích hợp.
4. Lệnh không còn phù hợp phiên bản hoặc trạng thái nhận `409 Conflict` và snapshot mới.
5. Chỉ khi lệnh được chấp nhận, server mới ghi nhận sự kiện rồi phân phối trạng thái mới.

**Ví dụ:** Mission ở version 4, `EN_ROUTE`. Web Pause thành công → version 5, `PAUSED`. Mobile Resume dựa trên version 4 → `409`. Mobile tải version 5 rồi gửi Resume → được xét lại theo trạng thái mới.

Demo `experiments/architecture/architecture-smoke-test.js` mô phỏng quy tắc này bằng một đối tượng `DemoServer` trong bộ nhớ; **chưa phải transaction hoặc cơ chế bền vững thực tế**.

## 8. Đồng bộ trạng thái và mất kết nối Client

- Client nhận telemetry/state event qua Socket.IO khi kết nối hoạt động.
- Khi kết nối lại, Client phải lấy **snapshot có thẩm quyền** từ Backend trước hoặc theo cơ chế đồng bộ có thứ tự được thiết kế, sau đó tiếp tục xử lý sự kiện mới.
- Trạng thái Mission sử dụng `version` tăng dần để phát hiện dữ liệu cũ. Telemetry có thể dùng số thứ tự/timestamp riêng khi cần.
- Client không được suy ra Mission đã hoàn thành chỉ vì không còn nhận telemetry.
- Mất một vài mẫu telemetry có thể chấp nhận được; mất một chuyển trạng thái quan trọng phải được xử lý bằng đồng bộ lại từ server.
- Đóng Web/Android/Windows **không tắt Engine** nếu server đang hoạt động.

## 9. Chính sách checkpoint và phục hồi sau restart

### 9.1. Phân biệt các tình huống

| Tình huống | Hành vi mong đợi |
|---|---|
| Đóng một Client | Engine trên server tiếp tục `tick()` |
| Client mất mạng | Engine tiếp tục; Client đồng bộ lại khi kết nối |
| Backend/Engine ngừng | Mô phỏng gián đoạn; không khẳng định UAV vẫn bay trong lúc server tắt |
| Database không truy cập được | Hạn chế thao tác cần lưu bền vững; ghi nhận lỗi và xử lý nhất quán |

### 9.2. Nội dung checkpoint

Tối thiểu gồm: `droneId`, `missionId`, thời gian mô phỏng, `flightState`, vị trí, vận tốc, pin, waypoint hiện tại và các biến nội bộ cần để tiếp tục mô phỏng. Khi cần khả năng tái lập chính xác hơn, phải lưu thêm thông tin như cấu hình, seed ngẫu nhiên và trạng thái xử lý sự cố.

### 9.3. Chính sách MVP được chọn

1. Lưu checkpoint **mỗi 5 giây thời gian mô phỏng** và khi có chuyển trạng thái quan trọng.
2. Ghi event log riêng cho Start, Pause, Resume, Return Home, Abort, xác nhận giao hàng và sự cố.
3. Khi server khởi động lại, đọc checkpoint hợp lệ gần nhất và đánh dấu Mission đang bay trước đó là **`INTERRUPTED`** ở mức quản lý phục hồi.
4. Không tự ý tiếp tục di chuyển UAV nếu chưa xác minh trạng thái, dữ liệu và điều kiện an toàn.
5. Nếu không có checkpoint hợp lệ, ghi nhận sự cố và yêu cầu xử lý thủ công hoặc kết thúc Mission theo chính sách MVP.
6. Bổ sung test mất Client và restart server trong kế hoạch kiểm thử.

**Giới hạn:** đây là chính sách thiết kế; bộ thực nghiệm hiện tại chưa có Database hoặc phục hồi bền vững sau restart. `INTERRUPTED` là trạng thái quản lý gián đoạn được đề xuất, cần thống nhất với enum Mission/State Machine khi triển khai.

## 10. An toàn và bảo mật

- REST: xác thực, phân quyền theo người dùng, kiểm tra dữ liệu đầu vào và giới hạn hành động theo trạng thái.
- Socket.IO: xác thực kết nối và kiểm soát quyền vào room; không phát dữ liệu nhạy cảm cho Client không có quyền.
- Lệnh nguy hiểm: Safety Manager đánh giá trước khi Engine thực hiện; Emergency không mặc định là cắt động cơ giữa không trung.
- Bí mật: không commit mật khẩu DB, token API hay secret vào Git; cấu hình bằng biến môi trường.
- Electron: hạn chế quyền Renderer, ưu tiên context isolation và preload bridge nếu cần truy cập hệ điều hành.
- Nhật ký: lưu ai gửi lệnh, lúc nào, Mission nào, kết quả và nguyên nhân từ chối.
- Dữ liệu mô phỏng phải được ghi rõ là giả định, không coi kết quả an toàn mô phỏng là bảo đảm cho UAV thật.

## 11. Triển khai demo (Deployment)

**Phương án ban đầu:** một laptop chạy Node.js Backend, Simulation Engine, Socket.IO và PostgreSQL. Web chạy trong trình duyệt; Android đóng gói bằng Capacitor; Windows Desktop đóng gói bằng Electron. Các Client truy cập Backend qua HTTP/Socket.IO, có thể trong cùng LAN khi cấu hình mạng cho phép.

**Phân biệt địa chỉ:** `localhost` trên Android là chính điện thoại, không phải laptop chạy Backend; khi thử nghiệm LAN cần dùng địa chỉ IP của máy chủ và thiết lập network/firewall phù hợp.

**Dữ liệu bản đồ:** CesiumJS chạy ở giao diện. Dịch vụ dữ liệu bản đồ ngoài mạng có thể cần Internet và token riêng; mất bản đồ không được làm thay đổi trạng thái UAV trên server.

**Ranh giới triển khai:** giai đoạn này mới thiết kế, chưa triển khai máy chủ thật hay đóng gói ứng dụng.

## 12. Cấu trúc Monorepo dự kiến

```text
uav-delivery-simulation/
├── apps/
│   ├── client/                 # React UI chia sẻ
│   │   └── src/
│   │       ├── pages/
│   │       ├── components/
│   │       ├── features/
│   │       └── map/           # CesiumJS chỉ hiển thị
│   ├── mobile/                 # Capacitor wrapper
│   ├── desktop/                # Electron wrapper
│   └── server/
│       └── src/
│           ├── api/
│           ├── auth/
│           ├── modules/        # Orders, Drones, Missions
│           ├── simulation/
│           │   ├── controller/
│           │   ├── navigation/
│           │   ├── battery/
│           │   ├── sensors/
│           │   └── safety/
│           ├── realtime/
│           └── persistence/
├── packages/
│   ├── shared-types/
│   ├── api-client/
│   └── shared-utils/
├── experiments/
│   ├── flight-controller/
│   └── architecture/
├── docs/
│   ├── 01-requirements/
│   ├── 02-architecture/
│   ├── 03-simulation/
│   ├── 04-database-api/
│   ├── 05-ui-ux/
│   ├── 06-diagrams/
│   └── 07-testing/
└── README.md
```

Trong bước thiết kế hiện tại **không bắt buộc tạo toàn bộ `apps/` và `packages/`**. Chúng chỉ là cấu trúc dự kiến khi bắt đầu phát triển tích hợp. Tên thư mục thực nghiệm theo chức năng, thống nhất với dự án hiện có.

## 13. Sơ đồ tham chiếu

| Sơ đồ | File | Nội dung |
|---|---|---|
| System Context | `../06-diagrams/01-system-context.mmd` | Actor và ranh giới hệ thống |
| Overall Architecture | `../06-diagrams/02-overall-architecture.mmd` | Client, Backend, Engine, Socket.IO, DB |
| Simulator Components | `../06-diagrams/09-simulator-components.mmd` | Thành phần bên trong Engine |
| Deployment | `../06-diagrams/10-deployment.mmd` | Các ứng dụng chạy trên thiết bị/server nào |
| State Machine | `../06-diagrams/06-uav-state-machine.mmd` | Trạng thái và điều kiện chuyển trạng thái |

Tài liệu liên quan: `command-and-sync.md`, `monorepo-structure.md`, `../01-requirements/SRS.md`, `../01-requirements/business-rules.md`, `../03-simulation/simulation-spec.md`.

## 14. Phân công trách nhiệm

| Vai trò | Phụ trách | Hạng mục chính |
|---|---|---|
| TV1 | Frontend | Shared UI, Web, Android/Windows packaging, bản đồ hiển thị |
| TV2 | Backend | API, Auth, DB, Socket.IO, Command Service, kiểm soát xung đột |
| TV3 | Simulation | Scheduler, Flight Controller, Navigation, Battery, Sensors, Safety |

Các thay đổi về kiểu dữ liệu chung, State Machine, API contract và chính sách pin cần được review chéo trước khi triển khai.

## 15. Truy vết yêu cầu và tiêu chí nghiệm thu kiến trúc

| Yêu cầu | Thiết kế đáp ứng | Kiểm chứng dự kiến |
|---|---|---|
| NFR-01 – Ba nền tảng cùng nghiệp vụ/dữ liệu | Shared React UI + API + Backend | Chạy cùng một Mission từ các Client |
| NFR-02 – Đóng Client không dừng Engine | Engine chạy tại server | Hủy listener Web, server vẫn tick |
| NFR-03 – Không hai Mission hoạt động cho một UAV | Command Service + ràng buộc DB | Gửi hai yêu cầu cạnh tranh |
| NFR-04 – Chu kỳ mô phỏng | Fixed-step Scheduler 100 ms | Kiểm thử `tick()` và log |
| NFR-05 – Xác thực API | Auth middleware / policy | Test thiếu token, thiếu quyền |
| NFR-06 – Telemetry realtime | Socket.IO 2 Hz mục tiêu | Đo độ trễ và đồng bộ lại |
| FR-08 – Order khác Mission | Order status và flight/mission status độc lập | Giao xong nhưng Mission vẫn RETURNING |
| FR-09 – Xử lý an toàn | Safety Manager + Event Log | Pin nguy cấp, lỗi GPS, sự cố hạ cánh |

### Checklist hoàn thành tài liệu

- [ ] Chốt thành phần và trách nhiệm từng module.
- [ ] Vẽ và review 4 sơ đồ: Context, Overall, Components, Deployment.
- [ ] Mô tả được luồng Start, Pause/Resume, telemetry và giao hàng.
- [ ] Chốt chính sách xung đột lệnh, reconnect và restart.
- [ ] Thống nhất cấu trúc thư mục với repository thực tế.
- [ ] Kiểm chứng demo EventEmitter không tạo nhiều Engine độc lập.
- [ ] TV1, TV2, TV3 review và chấp thuận bản thiết kế.

**Trạng thái thực hiện:** tài liệu thiết kế đã có thể dùng làm bản tham chiếu cho Backend/Database. Các mục API, Socket.IO thật, checkpoint và triển khai ba nền tảng vẫn phải được lập trình và kiểm thử ở các giai đoạn tiếp theo.
