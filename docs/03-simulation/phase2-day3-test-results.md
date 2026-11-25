# Giai đoạn 2 – Ngày 3 – Kết quả kiểm thử trên máy cá nhân

> Điền kết quả **thật** sau khi chạy. Không coi nguồn ZIP đã là PASS.

- Người thực hiện: _____________________
- Ngày chạy: _____________________
- Môi trường: Windows, Chrome/Edge, Node.js ______, CesiumJS ______
- Source Ngày 2: `packages/simulation-core`
- Ảnh minh chứng lưu tại: `docs/03-simulation/evidence/` (tự tạo nếu cần)

| ID | Thao tác | Expected | Actual | Status |
|---|---|---|---|---|
| D3-01 | `npm run build` tại `apps/client` | Không lỗi TypeScript, Vite tạo `dist` | | NOT RUN |
| D3-02 | `npm run dev` và mở localhost | Có bản đồ, trạm, 3 UAV, route | | NOT RUN |
| D3-03 | Chọn UAV-01 rồi START | `PRE_FLIGHT_CHECK` → `TAKEOFF` → `EN_ROUTE` | | NOT RUN |
| D3-04 | Quan sát UAV-01 khi EN_ROUTE | Marker di chuyển; GPS, Distance, Time thay đổi | | NOT RUN |
| D3-05 | Nhấn PAUSE khi EN_ROUTE | Tọa độ đứng yên, pin tiếp tục giảm | | NOT RUN |
| D3-06 | Nhấn RESUME | Tiếp tục từ vị trí đang dừng | | NOT RUN |
| D3-07 | Đến WAITING_FOR_HANDOVER | Order chưa DELIVERED khi chưa xác nhận | | NOT RUN |
| D3-08 | Bấm ĐÃ BÀN GIAO | Order DELIVERED, Mission RETURNING | | NOT RUN |
| D3-09 | Chờ UAV quay về | Mission/Flight COMPLETED, Drone AVAILABLE | | NOT RUN |
| D3-10 | RESET sau khi hoàn thành | UAV trở lại trạm, IDLE, khoảng cách 0 | | NOT RUN |
| D3-11 | Chọn UAV-02 và START | UAV-02 bay độc lập, UAV-01 không đổi vì lệnh U2 | | NOT RUN |
| D3-12 | Chọn UAV-03 | OFFLINE; START bị khóa / Core từ chối | | NOT RUN |
| D3-13 | Bàn giao thất bại | Order DELIVERY_FAILED, UAV vẫn RETURNING → COMPLETED | | NOT RUN |
| D3-14 | Thử RETURN HOME khi EN_ROUTE | Mission RETURNING; Order DELIVERY_FAILED | | NOT RUN |
| D3-15 | Nút Theo dõi / Tổng quan | Camera theo UAV hoặc trả về trạm | | NOT RUN |
| D3-16 | Đổi tốc độ 1×, 4×, 8× | Thời gian mô phỏng tăng theo hệ số | | NOT RUN |
| D3-17 | Đóng tab đang bay | Mô phỏng cục bộ dừng; không tác động Backend | | NOT RUN |
| D3-18 | Chạy lại `npm test` trong core | Các test cũ vẫn PASS | | NOT RUN |

## Hạn chế kỹ thuật Giai đoạn 2

- UAV 3D hiện là hình học tượng trưng gồm thân, bốn tay và bốn rotor, chưa có model `.glb` chân thực hoặc chuyển động quay cánh.
- Scheduler và Simulation Core đang chạy **trong browser**. Đóng tab = dừng mô phỏng; về sau chuyển Core lên server.
- Chưa đồng bộ Mission/Order với PostgreSQL và Socket.IO Backend; không gửi lệnh thiết bị qua MQTT ở Ngày 3.
- Đường bay mang tính minh họa, không phải đường bay được phép khai thác ngoài thực tế.
- Cao độ chỉ theo mốc giả lập, không tham chiếu địa hình thực.

## Bug log

| Bug ID | Mô tả | Cách tái hiện | Mức độ | Trạng thái |
|---|---|---|---|---|
| | | | | |
