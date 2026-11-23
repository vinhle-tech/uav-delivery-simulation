# Thông số mô phỏng

> Đây là các giả định phục vụ **giáo dục**, không phải dữ liệu hiệu chuẩn UAV thực.

| Thông số          |                   Giá trị | Giải thích                                  |
| ----------------- | ------------------------: | ------------------------------------------- |
| `dt`              |                     0.1 s | Bước thời gian cố định trong mô phỏng       |
| `speed`           |                     6 m/s | Tốc độ ngang tối đa                         |
| `climbSpeed`      |                     3 m/s | Tốc độ lên/xuống                            |
| `cruiseAltitude`  |                      30 m | Độ cao bay ngang                            |
| `payloadLimitKg`  |                    1.5 kg | Giới hạn tải trọng                          |
| `batteryReserve`  |                       30% | Mức dự phòng mục tiêu trước bay             |
| `batteryWarning`  |                       20% | Ngưỡng cảnh báo                             |
| `batteryCritical` |                       10% | Ngưỡng khẩn cấp                             |
| `flightDrain`     |             0.08 điểm %/s | Tiêu hao giả định khi bay                   |
| `hoverDrain`      |             0.05 điểm %/s | Tiêu hao giả định khi PAUSED                |
| `groundDrain`     |            0.002 điểm %/s | Tiêu hao giả định trên mặt đất              |
| `landingBudget`   |                1.5 điểm % | Phần dự phòng trong công thức ước tính      |
| `handoverTimeout` |                      60 s | Thời gian chờ xác nhận (thời gian mô phỏng) |
| `waypoints`       | (40,0), (80,0), (120,0) m | Các điểm dẫn đường                          |
| `safeSites`       |         (70,0), (110,0) m | Điểm hạ cánh dự phòng đã khai báo           |

## Công thức

- Khoảng cách ngang: `d = sqrt((x2-x1)^2 + (y2-y1)^2)`.
- Bước di chuyển tối đa: `d_step = speed * dt`.
- Pin: `B_next = max(0, B_now - drainRate * dt)`; `drainRate` tính bằng điểm phần trăm/giây.
- Điều kiện trước bay (mô hình giản lược): `B_start >= E_estimated + B_reserve`.
- Pin cần để đến điểm hạ cánh: ước tính thời gian ngang, leo cao, hạ cánh và một khoản dự phòng. Không bảo đảm đúng trong thực tế.

**Ví dụ ước tính:** Lộ trình ra và về 240 m, vận tốc 6 m/s, 40 giây di chuyển ngang. Mô hình có 40 giây cất/hạ cánh trong 2 chặng. Tổng thời gian bay 80 giây, tiêu hao 6.4 điểm %, cộng `landingBudget=1.5` thành `E_estimated=7.9`. Do đó cần ít nhất 37.9% pin để khởi hành với dự phòng mục tiêu 30% (không tính thời gian bàn giao; phần đó có mức tiêu hao rất nhỏ trong mô hình).

**Lưu ý:** con số "55% pin yêu cầu" của bài tập Ngày 2 chỉ là tình huống giả định khác. Với bộ tham số Ngày 4, hãy áp dụng kết quả từ công thức trên, không đưa cả hai con số vào SRS như hai tiêu chuẩn cố định.

## Những giới hạn đã biết

1. Chuyển động là động học vị trí đơn giản, chưa có quán tính, khí động học, giới hạn góc nghiêng hay lực rotor.
2. `imuApproxAccelMps2` chỉ lấy biến thiên **tốc độ ngang**; không phải IMU vật lý chuẩn và không thể suy ra roll/pitch/yaw chính xác.
3. GPS giả lập có nhiễu trong tọa độ mét; chưa chuyển sang kinh/vĩ độ.
4. Hệ thống chưa kiểm tra vùng cấm, gió, vật cản 3D, độ tin cậy của GPS và không gian hạ cánh thực.
5. Mô phỏng chạy theo thời gian ảo, không phải mô phỏng ràng buộc thời gian thực.
6. Số liệu pin là giả định, không có giá trị chỉ dẫn điều khiển UAV ngoài đời.
