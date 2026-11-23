# KIẾN TRÚC TỔNG THỂ — TÀI LIỆU THAM KHẢO NGÀY 5

Trạng thái: **Draft để so sánh và hợp nhất vào architecture.md**. Không tự động thay thế bản mà nhóm đã chỉnh sửa.

## 1. Mục tiêu
Một nhân viên điều phối có thể dùng Web, Android và Windows với cùng tài khoản, chức năng và dữ liệu. Simulation Engine chạy tại server, không phụ thuộc Client.

## 2. Thành phần
- `Shared UI + API Client`: các màn hình và logic giao diện tái sử dụng. CesiumJS chỉ làm nhiệm vụ thể hiện trực quan.
- `REST API`: xác thực, phân quyền, kiểm tra dữ liệu, CRUD đơn hàng/UAV/Mission.
- `Mission Command Service`: kiểm tra phiên bản/trạng thái, chống lệnh trùng, quyết định lệnh nào được phép đưa vào Engine.
- `Simulation Engine`: Scheduler tick 100 ms mô phỏng, State Machine, Navigation, Battery, Sensors, Safety, Event stream.
- `Socket.IO Gateway`: phát telemetry và các thay đổi trạng thái cho các Client được phép nhận.
- `PostgreSQL`: dữ liệu lâu dài như Users, Drones, Orders, Missions, Waypoints, Events, Incidents và Checkpoints.

## 3. Nguồn dữ liệu có thẩm quyền
Server lưu và thay đổi trạng thái Mission/UAV. Client không được quyết định trạng thái máy bay. CesiumJS nhận vị trí rồi hiển thị, không tự điều khiển UAV.

## 4. Luồng lệnh
1. Client gửi `POST /api/missions/:id/start` với `requestId` và `expectedVersion`.
2. Backend xác thực và kiểm tra quyền.
3. Command Service kiểm tra trạng thái hiện tại, phiên bản, khóa/transaction, chống lệnh trùng.
4. Simulation Engine nhận lệnh đã hợp lệ; kết quả chấp nhận lệnh không đồng nghĩa UAV đã TAKEOFF.
5. Backend trả `202 Accepted` hoặc thông báo lỗi.
6. Simulation Engine liên tục tick, phát telemetry và các sự kiện thay đổi trạng thái.

## 5. Đồng bộ và reconnect
- Client kết nối Socket.IO để nhận telemetry, nhưng khi kết nối lại phải lấy `snapshot` trạng thái có thẩm quyền và sau đó tiếp tục theo dõi events.
- Dữ liệu quan trọng như trạng thái Mission cần số phiên bản tăng dần, client bỏ qua bản cập nhật cũ.
- Không giả định Socket.IO đảm bảo mọi sự kiện được phát/nhận đúng một lần.

## 6. Chính sách restart demo (đề xuất, chưa triển khai)
- Snapshot/checkpoint định kỳ **5 giây thời gian mô phỏng** và khi có thay đổi trạng thái đáng kể; ghi event log riêng.
- Khi server restart: tải snapshot, đánh dấu Mission trước đó đang bay là `INTERRUPTED`, không tự mô phỏng tiếp cho tới khi đã xác minh điều kiện và phục hồi có kiểm soát.
- Nếu không có checkpoint hợp lệ: ghi sự cố và yêu cầu xử lý thủ công trong MVP.
- Khác biệt: đóng **Client** không làm dừng mô phỏng; tắt **Server** làm gián đoạn mô phỏng.

## 7. Bảo mật
- REST cần xác thực + phân quyền + validate input.
- Socket.IO handshake và quyền vào room cần được kiểm tra tương ứng.
- Không đặt token API bí mật hoặc khóa Cesium ion bí mật trong Git.
- Electron: không bật Node integration tùy tiện trong renderer; ưu tiên context isolation và preload bridge có quyền tối thiểu.

## 8. Ngoài phạm vi Ngày 5
- Chưa viết server REST, Socket.IO chạy thực, database hoặc build Android/Windows.
