# THIẾT KẾ CƠ SỞ DỮ LIỆU – UAV DELIVERY SIMULATION

**Dự án:** Hệ thống điều phối, giám sát và mô phỏng UAV giao hàng chặng cuối  
**Công nghệ:** PostgreSQL  
**Phiên bản tài liệu:** 1.0 – Bước 26, Giai đoạn 1  
**Nguồn đối chiếu:** `schema.sql`, `seed.sql` trong bộ thực hành Database & API  
**Trạng thái:** Mô tả chính xác schema của bài thực hành; phần mở rộng MVP được đánh dấu riêng.

## 1. Mục tiêu và phạm vi

Database lưu tài khoản, trạm, UAV, đơn hàng, Mission, waypoint, mẫu telemetry, sự kiện, sự cố và kết quả bàn giao. Cả Web, Android và Windows truy cập các dữ liệu này **thông qua Backend**, không kết nối trực tiếp PostgreSQL. Simulation Engine chịu trách nhiệm tính toán chuyển động/trạng thái bay; database lưu thông tin bền vững chứ không thay thế Engine.

Trong bài thực hành: database có tên `uav_delivery`, ID dạng `TEXT` dễ đọc như `uav-01` và `ord-001`. PostgreSQL chạy cục bộ; **không sử dụng dữ liệu tài khoản seed để đăng nhập thật**. Các công việc migration, phân quyền và retention nằm ở bước xây dựng sản phẩm sau.

## 2. Quy ước dữ liệu

- **PK (Primary Key):** định danh duy nhất trong bảng.
- **FK (Foreign Key):** khóa tham chiếu hàng có thật ở bảng khác.
- **NOT NULL:** bắt buộc có giá trị; **UNIQUE:** không trùng; **CHECK:** giới hạn giá trị hợp lệ.
- **NUMERIC(p,s):** số thập phân chính xác trong PostgreSQL; qua thư viện `pg` của Node.js, NUMERIC thường xuất ra JSON ở dạng **chuỗi**, ví dụ `"90.00"`.
- **DOUBLE PRECISION:** số thực dấu phẩy động, dùng cho vị trí và thời gian mô phỏng.
- **TIMESTAMPTZ:** mốc thời gian có quản lý múi giờ; **JSONB:** dữ liệu JSON có cấu trúc.
- **`created_at`, `recorded_at`:** thời gian thực khi ghi bản ghi; **`sim_time_s`:** thời gian *mô phỏng*, không đồng nhất với đồng hồ ngoài đời.

## 3. Danh sách và quan hệ 12 bảng

| Bảng | Chức năng | Khóa ngoại quan trọng |
|---|---|---|
| `users` | Tài khoản nhân viên | — |
| `stations` | Trạm UAV | — |
| `drone_models` | Đặc tính mẫu UAV | — |
| `delivery_points` | Điểm nhận cố định | — |
| `drones` | Danh mục và trạng thái UAV | `model_id`, `station_id` |
| `orders` | Đơn hàng | `delivery_point_id`, `created_by` |
| `missions` | Từng lần giao bằng UAV | `order_id`, `drone_id`, `station_id` |
| `waypoints` | Tuyến bay theo thứ tự | `mission_id` |
| `telemetry` | Mẫu đo UAV theo thời gian | `drone_id`, `mission_id` (có thể NULL) |
| `drone_events` | Nhật ký sự kiện | `drone_id`, `mission_id` (có thể NULL) |
| `incidents` | Sự cố | `drone_id`, `mission_id` (có thể NULL) |
| `delivery_confirmations` | Kết quả xác nhận giao | `order_id`, `mission_id` |

### 3.1. users

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | TEXT | PK | ID nhân viên |
| `email` | TEXT | NOT NULL, UNIQUE | Email |
| `full_name` | TEXT | NOT NULL | Họ tên |
| `role` | TEXT | NOT NULL, DEFAULT `OPERATOR`, CHECK `OPERATOR/ADMIN` | Vai trò dự kiến |
| `password_hash` | TEXT | NOT NULL | Hash mật khẩu (dữ liệu seed chỉ là placeholder) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | Ngày tạo |

### 3.2. stations

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | TEXT | PK | Mã trạm |
| `name` | TEXT | NOT NULL | Tên trạm |
| `latitude` | DOUBLE PRECISION | NOT NULL, -90 đến 90 | Vĩ độ |
| `longitude` | DOUBLE PRECISION | NOT NULL, -180 đến 180 | Kinh độ |

### 3.3. drone_models

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | TEXT | PK | Mã model |
| `name` | TEXT | NOT NULL | Tên model |
| `max_payload_kg` | NUMERIC(7,2) | NOT NULL, > 0 | Tải tối đa, kg |
| `cruise_speed_mps` | NUMERIC(7,2) | NOT NULL, > 0 | Tốc độ hành trình, m/s |

### 3.4. delivery_points

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | TEXT | PK | Mã điểm nhận |
| `name` | TEXT | NOT NULL | Tên điểm nhận |
| `latitude` | DOUBLE PRECISION | NOT NULL, -90 đến 90 | Vĩ độ |
| `longitude` | DOUBLE PRECISION | NOT NULL, -180 đến 180 | Kinh độ |

### 3.5. drones

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | TEXT | PK | ID UAV |
| `model_id` | TEXT | NOT NULL, FK → `drone_models.id` | Mẫu UAV |
| `station_id` | TEXT | NOT NULL, FK → `stations.id` | Trạm gốc |
| `battery_pct` | NUMERIC(5,2) | NOT NULL, CHECK 0–100 | Phần trăm pin |
| `status` | TEXT | NOT NULL, DEFAULT `AVAILABLE`, CHECK enum | Trạng thái tài nguyên UAV |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | Cập nhật gần nhất |

Các giá trị `status` đang được DB cho phép: `AVAILABLE`, `RESERVED`, `BUSY`, `CHARGING`, `MAINTENANCE`, `EMERGENCY`.

### 3.6. orders

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | TEXT | PK | ID đơn hàng |
| `delivery_point_id` | TEXT | NOT NULL, FK → `delivery_points.id` | Điểm nhận |
| `created_by` | TEXT | FK → `users.id`, nullable | Người tạo |
| `weight_kg` | NUMERIC(7,2) | NOT NULL, > 0 | Khối lượng hàng |
| `status` | TEXT | NOT NULL, DEFAULT `PENDING`, CHECK enum | Trạng thái đơn |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | Ngày tạo |

Các giá trị `status` đang được DB cho phép: `PENDING`, `ASSIGNED`, `IN_DELIVERY`, `DELIVERED`, `DELIVERY_FAILED`.

### 3.7. missions

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | TEXT | PK | ID lần giao |
| `order_id` | TEXT | NOT NULL, FK → `orders.id` | Đơn hàng |
| `drone_id` | TEXT | NOT NULL, FK → `drones.id` | UAV thực hiện |
| `station_id` | TEXT | NOT NULL, FK → `stations.id` | Trạm xuất phát |
| `status` | TEXT | NOT NULL, DEFAULT `READY`, CHECK enum | Trạng thái nhiệm vụ |
| `version` | INTEGER | NOT NULL, DEFAULT 0, >= 0 | Phiên bản điều khiển |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | Ngày tạo |
| `started_at` | TIMESTAMPTZ | Có thể NULL | Bắt đầu |
| `finished_at` | TIMESTAMPTZ | Có thể NULL | Kết thúc |

Các giá trị `status`: `READY`, `IN_PROGRESS`, `PAUSED`, `RETURNING`, `COMPLETED`, `FAILED`, `INTERRUPTED`.

### 3.8. waypoints

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | TEXT | PK | ID waypoint |
| `mission_id` | TEXT | NOT NULL, FK → `missions.id`, ON DELETE CASCADE | Mission sở hữu |
| `sequence_no` | INTEGER | NOT NULL, >= 0 | Thứ tự waypoint |
| `x_m` | DOUBLE PRECISION | NOT NULL | Tọa độ cục bộ X (m) |
| `y_m` | DOUBLE PRECISION | NOT NULL | Tọa độ cục bộ Y (m) |
| `altitude_m` | DOUBLE PRECISION | NOT NULL, >= 0 | Độ cao (m) |

`UNIQUE(mission_id, sequence_no)` bảo đảm mỗi Mission không có hai waypoint cùng thứ tự. Dữ liệu waypoint hiện là hệ mét cục bộ, **chưa phải** `latitude/longitude` cho CesiumJS.

### 3.9. telemetry

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | BIGINT GENERATED ALWAYS AS IDENTITY | PK | Khóa tăng tự động |
| `drone_id` | TEXT | NOT NULL, FK → `drones.id` | UAV |
| `mission_id` | TEXT | FK → `missions.id`, nullable | Mission tương ứng |
| `sim_time_s` | DOUBLE PRECISION | >= 0, nullable | Giây mô phỏng |
| `x_m`, `y_m`, `z_m` | DOUBLE PRECISION | NOT NULL | Vị trí cục bộ (m) |
| `battery_pct` | NUMERIC(5,2) | NOT NULL, CHECK 0–100 | Pin đo |
| `recorded_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | Thời gian ghi |

### 3.10. drone_events

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | BIGINT GENERATED ALWAYS AS IDENTITY | PK | ID sự kiện |
| `drone_id` | TEXT | NOT NULL, FK → `drones.id` | UAV |
| `mission_id` | TEXT | FK → `missions.id`, nullable | Mission nếu có |
| `event_type` | TEXT | NOT NULL | Loại sự kiện |
| `details` | JSONB | NOT NULL, DEFAULT `{}` | Chi tiết |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | Thời gian |

### 3.11. incidents

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | TEXT | PK | ID sự cố |
| `drone_id` | TEXT | NOT NULL, FK → `drones.id` | UAV |
| `mission_id` | TEXT | FK → `missions.id`, nullable | Mission nếu có |
| `incident_type` | TEXT | NOT NULL | Loại sự cố |
| `severity` | TEXT | NOT NULL, CHECK `INFO/WARNING/CRITICAL` | Mức nghiêm trọng |
| `status` | TEXT | NOT NULL, DEFAULT `OPEN`, CHECK `OPEN/RESOLVED` | Tình trạng |
| `details` | JSONB | NOT NULL, DEFAULT `{}` | Chi tiết |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | Thời gian |

### 3.12. delivery_confirmations

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | TEXT | PK | ID xác nhận |
| `order_id` | TEXT | NOT NULL, FK → `orders.id` | Đơn liên quan |
| `mission_id` | TEXT | NOT NULL, UNIQUE, FK → `missions.id` | Mission bàn giao |
| `successful` | BOOLEAN | NOT NULL | Thành công hay thất bại |
| `method` | TEXT | NOT NULL, DEFAULT `MANUAL` | Cách xác nhận |
| `failure_reason` | TEXT | Có thể NULL | Lý do thất bại |
| `confirmed_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | Thời gian |

`CHECK ((successful AND failure_reason IS NULL) OR NOT successful)` bảo đảm xác nhận thành công không đi kèm lý do thất bại. Với xác nhận thất bại, DB hiện chưa bắt buộc phải có `failure_reason`.

## 4. Quan hệ nghiệp vụ và ý nghĩa trạng thái

- `drone_models` 1–N `drones`, `stations` 1–N `drones`, `delivery_points` 1–N `orders`.
- `orders` 1–N `missions` **qua nhiều lần thử giao**, không phải giao song song.
- `drones` 1–N `missions` **qua thời gian**, không phải chạy song song.
- `missions` 1–N `waypoints`, 1–N `telemetry`, 1–N `drone_events`, 1–N `incidents`.
- `missions` 1–0..1 `delivery_confirmations` do `UNIQUE(mission_id)`.

**Tuyệt đối không trộn ba loại trạng thái:**

| Đối tượng | Ví dụ | Ý nghĩa |
|---|---|---|
| `orders.status` | `DELIVERED` | Hàng đã được bàn giao |
| `missions.status` | `RETURNING` | Nhiệm vụ vẫn đang thực hiện chặng về |
| `drones.status` | `BUSY` | UAV chưa được giao nhiệm vụ khác |

Bộ điều khiển ảo còn có các trạng thái chi tiết như `TAKEOFF`, `EN_ROUTE`, `LANDING`, `WAITING_FOR_HANDOVER`. Các trạng thái đó **chưa có cột riêng** trong bảng `missions` và cần mapping/telemetry/checkpoint khi tích hợp.

## 5. Index, ràng buộc và đồng thời

`schema.sql` có các index/ràng buộc quan trọng sau:

| Tên | Vị trí | Mục đích |
|---|---|---|
| `uq_active_mission_drone` | `missions(drone_id)` với trạng thái active | Chặn hai Mission đang hoạt động của một UAV |
| `uq_active_mission_order` | `missions(order_id)` với trạng thái active | Chặn hai Mission đang hoạt động của một đơn |
| `idx_missions_status` | `missions(status)` | Truy vấn theo trạng thái |
| `UNIQUE(mission_id, sequence_no)` | `waypoints` | Waypoint không trùng thứ tự |
| `idx_telemetry_drone_time` | `telemetry(drone_id, recorded_at DESC)` | Truy vấn lịch sử UAV theo thời gian |
| `UNIQUE(mission_id)` | `delivery_confirmations` | Một xác nhận cho mỗi Mission |

Các trạng thái được coi là *active* trong hai partial unique index: `READY`, `IN_PROGRESS`, `PAUSED`, `RETURNING`, `INTERRUPTED`.

Trong `POST /api/missions`, backend dùng transaction (`BEGIN` → `SELECT ... FOR UPDATE` → INSERT/UPDATE → `COMMIT` hoặc `ROLLBACK`). Khóa các hàng của Order rồi Drone theo thứ tự để giảm rủi ro cạnh tranh; unique index cung cấp lớp bảo vệ cuối cùng ở DB. `expectedVersion` trên API điều khiển phát hiện Client dùng trạng thái cũ.

## 6. Kiểm chứng thực hành trong pgAdmin

Chọn database `uav_delivery` → **Tools → Query Tool**, chạy lần lượt:

```sql
-- Kiểm tra đủ 12 bảng
SELECT COUNT(*) AS table_count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Kiểm tra ba UAV mẫu
SELECT id, battery_pct, status FROM drones ORDER BY id;

-- Kiểm tra Mission liên kết đơn hàng/UAV
SELECT m.id, m.status, m.version, o.id AS order_id, d.id AS drone_id
FROM missions m
JOIN orders o ON o.id = m.order_id
JOIN drones d ON d.id = m.drone_id
ORDER BY m.created_at DESC;

-- Kiểm tra index bảo vệ Mission active
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'missions'
ORDER BY indexname;
```

**Không chạy lại seed rồi xóa bảng tùy tiện** khi đang giữ dữ liệu thực hành của nhóm.

## 7. Chưa triển khai và hướng mở rộng MVP

- Authentication/Authorization thật, hash mật khẩu an toàn, roles và kiểm soát quyền truy cập.
- Migration có version, chính sách sao lưu/phục hồi, retention/partitioning telemetry theo dung lượng.
- Snapshot/checkpoint đủ dữ liệu nội bộ của Flight Controller và event log bền vững.
- Waypoint có tọa độ địa lý hoặc phép đổi hệ tọa độ sang Cesium, tính khoảng cách và geofence.
- Ràng buộc nghiệp vụ đồng bộ giữa `delivery_confirmations`, `orders.status`, `missions.status`.
- Pin theo **năng lượng ước tính tuyến bay**, không dùng ngưỡng `>=55%` của bài lab như công thức chung.
- Phục hồi `INTERRUPTED` sau khi server restart theo quy trình xác minh an toàn.

## 8. Liên kết tài liệu

- SQL thực tế: `schema.sql`, `seed.sql`.
- Sơ đồ: `../06-diagrams/07-erd.mmd`.
- Hợp đồng REST: `api-contract.md`.
- Hợp đồng realtime: `socket-events.md`.
- Quy tắc nghiệp vụ: `../01-requirements/business-rules.md`.

**Tiêu chí nghiệm thu:** chạy `schema.sql`/`seed.sql` trong `uav_delivery`, thấy đủ 12 bảng và đọc giải thích được mỗi PK/FK, trạng thái, index và cơ chế chống Mission trùng.
