# Kiến trúc hệ thống

## Quyết định cốt lõi
- React UI dùng chung Web/Mobile/Desktop.
- API server Node.js/Express quản lý nghiệp vụ và là nguồn dữ liệu có thẩm quyền.
- Simulation Engine chạy phía server và không phụ thuộc UI.
- Socket.IO truyền telemetry/state; REST thực hiện các lệnh có tác động nghiệp vụ.
- PostgreSQL lưu tài khoản, đơn, UAV, mission, sự kiện, checkpoint.

## Luồng command
Client → REST → Auth → Rule Check + Conflict Check → Simulator → ACK / Error → Event → Socket.IO clients.

## Khi hai client điều khiển xung đột
- Gửi request ID (idempotency key) cho lệnh quan trọng.
- Kiểm tra phiên bản/trạng thái mission; một lệnh hợp lệ thắng, lệnh còn lại trả conflict/already processed.
- Ghi event log để kiểm toán.

## Sau khi restart server
- [TODO] Khoảng thời gian checkpoint.
- [TODO] Chính sách pause/replay/mark interrupted, không khẳng định tất cả trạng thái được phục hồi chính xác nếu chưa triển khai.

## Việc cần làm
- [TODO] Chọn cách đóng gói monorepo và phiên bản công nghệ ở thời điểm code.
- [TODO] Vẽ deployment diagram chính xác theo môi trường demo.
