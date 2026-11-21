# Test Plan — 15 kịch bản tối thiểu

| ID | Tình huống | Kết quả kỳ vọng |
|---|---|---|
| TC-01 | Giao thành công | Giao xong, UAV về trạm, mission kết thúc |
| TC-02 | Quá tải | Không thể phân công |
| TC-03 | Pin thiếu trước nhiệm vụ | Không Start |
| TC-04 | Pin yếu đang bay | Safety Manager chọn phương án thích hợp |
| TC-05 | Giao ngoài phạm vi | Từ chối Mission |
| TC-06 | Tuyến qua vùng cấm | Không xác nhận tuyến |
| TC-07 | Mất liên lạc mô phỏng | Áp dụng failsafe |
| TC-08 | GPS có nhiễu | Trả dữ liệu cảm biến theo cấu hình |
| TC-09 | Người nhận không xác nhận | Timeout, ghi nhận kết quả thất bại |
| TC-10 | UAV đang bận nhận mission mới | Từ chối |
| TC-11 | Hai client gửi lệnh trái ngược | Không tạo trạng thái mâu thuẫn |
| TC-12 | Đóng Web khi đang bay | Server vẫn mô phỏng |
| TC-13 | Restart backend | Khôi phục/đánh dấu theo chính sách công bố |
| TC-14 | 3 UAV bay đồng thời | Không lẫn trạng thái và telemetry |
| TC-15 | Đã giao nhưng UAV chưa về | Order và Mission còn trạng thái riêng |

## Mẫu chi tiết TC-02
- **Tiền điều kiện:** UAV-01 tải tối đa 1.5 kg, sẵn sàng.
- **Input:** Đơn 2.0 kg.
- **Thao tác:** Tạo đơn -> chọn UAV-01 -> yêu cầu phân công.
- **Kỳ vọng:** Backend từ chối phân công; không tạo mission bay; hiển thị lý do rõ ràng.
- **Minh chứng:** response lỗi + trạng thái dữ liệu không bị thay đổi.

## Mẫu điền cho các ca còn lại
- **Dữ liệu đầu vào:** [TODO]
- **Tiền điều kiện:** [TODO]
- **Bước thực hiện:** [TODO]
- **Kết quả mong đợi:** [TODO]
- **Cách kiểm chứng:** [TODO]
