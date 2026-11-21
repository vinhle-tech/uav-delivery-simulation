# Simulation Engine Specification (bản nháp)

## 1. Mục tiêu
Mô phỏng vị trí, vận tốc, hướng, độ cao, pin, tín hiệu GPS và tình trạng của 3 UAV ảo. Hoạt động phía server ngay cả khi không mở UI.

## 2. Thành phần
- Virtual Flight Controller: thực thi State Machine và lệnh điều khiển.
- Navigation: điểm đến, waypoint, sai số đến điểm.
- Motion Model: mô hình động học có giới hạn vận tốc/gia tốc.
- Battery Model: tiêu hao theo thời gian, tải, tốc độ; có năng lượng dự phòng.
- Sensors: GPS, IMU đơn giản, altimeter, trạng thái motor/ESC.
- Safety Manager: pin yếu, vượt phạm vi, geofence, mất kết nối, hạ cánh không an toàn.
- Event Log: ghi thay đổi trạng thái/điều khiển.

## 3. State Machine — sơ bộ
IDLE → PRE_FLIGHT → TAKEOFF → EN_ROUTE → APPROACH → LANDING → HANDOVER → RETURN_HOME → COMPLETED.
PAUSED, EMERGENCY, FAILED là nhánh ngoại lệ. LOW_BATTERY là cảnh báo/safety condition, không đơn giản coi là trạng thái bay duy nhất.

## 4. Chu kỳ mô phỏng
- Δt mục tiêu 0.1 s (100 ms), cần đo sai lệch thực tế.
- Telemetry gửi UI mục tiêu 2 lần/giây.
- [TODO] Chọn cách quản lý thời gian mô phỏng khi máy bận.

## 5. Motion model đơn giản
- Bay theo vector đến waypoint.
- Giới hạn v và a, không nhảy tức thời.
- Bảo đảm khi đến waypoint thì chọn waypoint kế tiếp.
- [TODO] Mô tả công thức cập nhật vị trí trong hệ tọa độ local ENU.

## 6. Battery model
- Không chỉ dùng khoảng cách đi: tính cả về, cất/hạ cánh, chờ, dự phòng.
- [TODO] Chọn công thức mẫu P = P_base + k_payload * kg + k_speed * v^2, kiểm thử tính nhất quán.

## 7. Safety
- Khi không đủ pin trước bay: từ chối Start.
- Khi pin yếu giữa bay: đánh giá Return Home vs điểm hạ cánh an toàn khác.
- Emergency Stop phải có nghĩa kỹ thuật rõ ràng (không mặc định cắt motor giữa không trung).

## 8. Vấn đề cần nhóm quyết định
- [TODO] Các state cuối cùng và các transition ngoại lệ.
- [TODO] Khi không nhận hàng, hàng được giữ lại và UAV quay về?
- [TODO] Dữ liệu snapshot/restore tối thiểu.
