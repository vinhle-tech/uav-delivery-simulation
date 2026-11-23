# DATABASE DESIGN - PostgreSQL cho UAV Delivery Simulation

## 1. Mục tiêu
Thiết kế dữ liệu dùng chung cho Web/Android/Windows. Database lưu **nghiệp vụ, trạng thái nhiệm vụ, sự kiện và mẫu telemetry**, không thay thế Simulation Engine. `schema.sql` và `seed.sql` là bản thực nghiệm cho PostgreSQL; không chạy trên database chứa dữ liệu có giá trị.

## 2. Khái niệm
- Table: bảng; row: một bản ghi; column: thuộc tính của bảng.
- Primary Key (PK): nhận diện duy nhất một bản ghi.
- Foreign Key (FK): bảo đảm bản ghi tham chiếu tồn tại.
- `NOT NULL`: không bỏ trống; `UNIQUE`: không trùng; `CHECK`: quy tắc giá trị hợp lệ.
- Index: giúp một số truy vấn tìm nhanh hơn nhưng có chi phí ghi và lưu trữ.
- Transaction: nhóm lệnh SQL thành một đơn vị; COMMIT khi thành công, ROLLBACK khi lỗi.
- `NUMERIC`: số thập phân chính xác thích hợp pin/tải trọng; `TIMESTAMPTZ`: mốc thời gian có múi giờ.

## 3. Các bảng
| Bảng | Vai trò | PK | FK chính |
|---|---|---|---|
| users | Nhân viên vận hành | id | — |
| stations | Trạm UAV | id | — |
| drone_models | Thông số loại UAV | id | — |
| delivery_points | Điểm giao cố định | id | — |
| drones | UAV và pin/trạng thái hiện tại | id | model_id, station_id |
| orders | Đơn hàng | id | delivery_point_id, created_by |
| missions | Một lần giao hàng/đường bay | id | order_id, drone_id, station_id |
| waypoints | Các điểm đường bay theo thứ tự | id | mission_id |
| telemetry | Mẫu vị trí, độ cao, pin theo thời gian | id | drone_id, mission_id (nullable) |
| drone_events | Log sự kiện | id | drone_id, mission_id (nullable) |
| incidents | Sự cố | id | drone_id, mission_id (nullable) |
| delivery_confirmations | Xác nhận bàn giao | id | order_id, mission_id |

## 4. Các mối quan hệ quan trọng
- 1 `drone_model` -> N `drones`; 1 `station` -> N `drones`.
- 1 `order` -> N `missions` theo **thời gian** (giao thất bại rồi giao lại). Không được có 2 mission giao đang hoạt động cùng lúc.
- 1 `drone` -> N `missions` theo **thời gian**. Index partial `uq_active_mission_drone` ngăn 2 nhiệm vụ hoạt động đồng thời.
- 1 `mission` -> N `waypoints` theo `sequence_no`.
- 1 `mission` -> 0 hoặc 1 xác nhận bàn giao (`UNIQUE(mission_id)`).

## 5. Tách trạng thái
- `orders.status`: PENDING / ASSIGNED / IN_DELIVERY / DELIVERED / DELIVERY_FAILED.
- `missions.status`: READY / IN_PROGRESS / PAUSED / RETURNING / COMPLETED / FAILED / INTERRUPTED.
- `drones.status`: AVAILABLE / RESERVED / BUSY / CHARGING / MAINTENANCE / EMERGENCY.
- Chi tiết `FlightController.state` (TAKEOFF, EN_ROUTE, LANDING...) **không đồng nghĩa** với `missions.status` và sẽ có mapping rõ khi tích hợp.
- Một `mission` COMPLETED không có nghĩa đơn đã DELIVERED; nó chỉ ghi nhận nhiệm vụ bay kết thúc theo chính sách.

## 6. Tính đồng thời
Trong demo Express, `POST /api/missions` dùng `BEGIN`, `SELECT ... FOR UPDATE`, kiểm tra tải trọng/pin rồi tạo mission và giữ UAV trong cùng giao dịch. Hai partial UNIQUE INDEX bảo vệ ở mức DB.

## 7. Giới hạn bản thử
- Dùng `TEXT` ID để nhìn dễ (`uav-01`, `ord-001`). Khi sản phẩm hoàn chỉnh, có thể cân nhắc UUID và mã hiển thị riêng.
- Kiểm tra pin `>=55%` chỉ là ví dụ bài học, **không phải ước lượng năng lượng tuyến thật**.
- Demo chưa có auth, quyền truy cập, geofence, đánh giá waypoint và tích hợp FC Ngày 4; không mở server ra Internet.
- `telemetry` demo ghi một mẫu khi bạn gọi `/api/demo/telemetry`; không ghi tự động từ UAV thật.
- Chưa có hệ thống migration/partitioning/retention; cần thiết kế nếu tiếp tục phát triển.
