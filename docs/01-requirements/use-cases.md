# Use Case Specifications

## UC-01: Tạo đơn hàng
- **Actor:** Nhân viên vận hành.
- **Tiền điều kiện:** Đã đăng nhập.
- **Đầu vào:** Mã đơn, khối lượng, tọa độ giao.
- **Luồng chính:** Nhấn Create Order → nhập thông tin → kiểm tra → lưu.
- **Luồng lỗi:** Thiếu thông tin; khối lượng <= 0; tọa độ sai.
- **Hậu điều kiện:** Order trạng thái PENDING.

## UC-02: Phân công UAV và tạo nhiệm vụ
- **Actor:** Nhân viên vận hành.
- **Tiền điều kiện:** Có Order PENDING; có UAV sẵn sàng.
- **Luồng chính:** Chọn đơn → chọn UAV → lập waypoint → kiểm tra pin/tải/vùng cấm → tạo mission READY.
- **Luồng lỗi:** Quá tải, không đủ pin, UAV đang bận, waypoint sai, hai yêu cầu đồng thời.
- **Hậu điều kiện:** Mission READY nhưng chưa bay.

## UC-03: Bắt đầu nhiệm vụ
- **Luồng chính:** Gửi Start → server xác thực và kiểm tra trạng thái → simulation chuyển sang PRE_FLIGHT → gửi ACK → phát telemetry.
- **Luồng lỗi:** Không quyền; mission không READY; lệnh trùng; server bận.

## UC-04: Xác nhận giao hàng
- **Luồng chính:** UAV hạ cánh ở điểm giao → chờ xác nhận bàn giao → ghi nhận kết quả → cho phép Return Home.
- **Luồng lỗi:** OTP sai; timeout; hàng không được nhận → đánh dấu giao thất bại.

## Mẫu tự điền
### UC-[TODO]: [Tên Use Case]
- Actor: [TODO]
- Tiền điều kiện: [TODO]
- Trigger: [TODO]
- Luồng chính: 1. ... 2. ... 3. ...
- Luồng thay thế: [TODO]
- Luồng lỗi: [TODO]
- Hậu điều kiện: [TODO]
- FR/BR liên quan: [TODO]
- Test case: [TODO]
