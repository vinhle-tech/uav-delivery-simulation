# Đặc tả bộ điều khiển bay ảo

## 1. Mục tiêu

Mô phỏng một UAV giao hàng: kiểm tra trước bay, cất cánh, bay 3 waypoint, hạ cánh, xác nhận giao, quay về trạm. Cung cấp telemetry và xử lý các lỗi cơ bản trong Node.js mà không cần phần cứng/3D.

## 2. Các đối tượng trạng thái riêng

- **Flight Controller `state`**: `IDLE`, `PRE_FLIGHT_CHECK`, `TAKEOFF`, `EN_ROUTE`, `APPROACH`, `LANDING`, `WAITING_FOR_HANDOVER`, `PAUSED`, `RETURNING`, `EMERGENCY_LANDING`, `COMPLETED`, `FAILED`.
- **Mission `mission`**: `READY`, `IN_PROGRESS`, `RETURNING`, `COMPLETED`, `FAILED`.
- **Order `order`**: `ASSIGNED`, `DELIVERED`, `DELIVERY_FAILED`.
- **Drone availability `drone`**: `AVAILABLE`, `BUSY`, `MAINTENANCE`.

Chú ý: Order `DELIVERY_FAILED` có thể đi cùng Mission `COMPLETED`, nếu giao hàng thất bại nhưng UAV trở về trạm bình thường.

## 3. Lệnh (commands)

| Lệnh             | Điều kiện                                    | Kết quả                                                       |
| ---------------- | -------------------------------------------- | ------------------------------------------------------------- |
| START            | `IDLE`                                       | Chuyển `PRE_FLIGHT_CHECK`, sau đó có thể TAKEOFF              |
| PAUSE            | `EN_ROUTE`                                   | Chuyển PAUSED, không đổi x/y/z, pin vẫn giảm                  |
| RESUME           | `PAUSED`, pin không nguy cấp                 | Quay về `EN_ROUTE`, giữ waypoint                              |
| RETURN_HOME      | `EN_ROUTE`, `PAUSED`, `WAITING_FOR_HANDOVER` | Kiểm tra pin về trạm, có thể chuyển RETURNING hoặc dự phòng   |
| ABORT            | Như RETURN_HOME                              | Hủy mục tiêu giao hàng, xử lý trở về có kiểm soát             |
| CONFIRM_HANDOVER | `WAITING_FOR_HANDOVER`                       | Order DELIVERED hoặc DELIVERY_FAILED, sau đó đánh giá quay về |

## 4. Mô phỏng cố định thời gian

Mỗi lần `uav.tick()` tiến thêm `0.1 s` mô phỏng. Bài thực hành không sử dụng `setInterval`; vòng `for` thực thi nhanh hơn thời gian thật để việc kiểm thử không mất nhiều phút. Trong Backend của giai đoạn sau cần có cơ chế scheduler và bù thời gian (accumulator) nếu muốn đồng bộ thời gian thực.

## 5. Dữ liệu cảm biến giả lập

- `truePosition`: trạng thái chuẩn của mô phỏng, x/y/z.
- `gpsMeasuredX`, `gpsMeasuredY`: vị trí x/y cộng nhiễu giả lập ±1 m.
- `altimeterM`: độ cao z cộng nhiễu giả lập ±0.2 m.
- `imuApproxAccelMps2`: độ biến thiên tốc độ ngang trong một bước; chỉ nhằm minh họa, không phải mô hình IMU thực.

## 6. Safety Manager (đơn giản)

- Đánh giá tải trọng và pin trước cất cánh.
- Phát cảnh báo khi pin <=20%.
- Khi <=10%, kiểm tra có đủ năng lượng ước tính để về trạm không.
- Nếu không đủ về trạm, tìm điểm hạ cánh dự phòng khả thi trong các điểm được khai báo sẵn.
- Nếu không có phương án được mô hình đánh giá là khả thi, ghi nhận Mission FAILED. Đây là kết quả thất bại của mô phỏng, không phải cam kết hạ cánh an toàn.

## 7. Hạn chế và việc còn phải làm

- Không sử dụng cho UAV thật.
- Chưa có mô hình phi tuyến rotor/ESC, điều khiển PID, GPS mất tín hiệu hoặc geofence thực thi.
- Chưa có lưu checkpoint, Socket.IO, REST API và database.
- Kiểm tra vùng cấm, xung đột đa thiết bị và mô phỏng đội nhiều UAV ở các giai đoạn sau.
- Phải giữ nhất quán chính sách pin tại `business-rules.md` và `simulation-parameters.md`.
