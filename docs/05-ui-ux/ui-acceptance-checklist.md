# UI/UX acceptance checklist – UAV Delivery System

## Trạng thái

- [x] Tạo file Figma Design.
- [x] Tạo 3 Page: Design System, Desktop, Mobile.
- [x] Tạo 9 component tái sử dụng.
- [x] Dựng 17 màn hình Desktop.
- [x] Dựng 18 màn hình Mobile.
- [x] Tạo một số liên kết Prototype Desktop.
- [ ] **Ưu tiên 1:** Nối đầy đủ luồng Prototype Mobile.
- [ ] **Ưu tiên 1:** Chạy Present trên Desktop và sửa mọi nút dẫn sai màn hình.
- [ ] **Ưu tiên 1:** Kiểm tra đường xác nhận bàn giao `Order=DELIVERED`, `Mission=RETURNING`.
- [ ] **Ưu tiên 1:** Tạo/kiểm tra nhánh báo lỗi pin thấp ở Mission Planner.
- [ ] **Ưu tiên 2:** Rà soát bố cục trên 390×844 và 1440×900 (tràn chữ, chồng layer, nút khó bấm).
- [ ] **Ưu tiên 2:** Rà soát nhãn trạng thái: `Drone.status`, `FlightController.state`, `Mission.status`, `Order.status`.
- [ ] **Ưu tiên 2:** Thêm/truy cập được Loading, Empty, Connection Error từ UI chính.
- [ ] **Ưu tiên 2:** Rà soát khóa/nút không hợp lệ Start, Pause, Resume, Return/Abort.
- [ ] **Ưu tiên 3:** Kiểm tra typography, component overrides, màu và khoảng cách nhất quán.
- [ ] **Ưu tiên 3:** Nhóm review và lưu link Figma trong GitHub.

## Review nhanh bằng 6 bài thử

| ID | Tình huống | Kết quả mong đợi |
|---|---|---|
| UI-01 | Desktop Login → Create Order → Create Mission | Tới Mission READY, chưa tự bay |
| UI-02 | Desktop EN_ROUTE → Pause → Resume | Chuyển giữa D08 và D08A chính xác |
| UI-03 | Desktop Confirm Delivery | Order DELIVERED, Mission RETURNING |
| UI-04 | Mobile Login → Create Order → Create Mission | Tương đương nghiệp vụ Desktop |
| UI-05 | Mission Planner chọn UAV thiếu pin | Có cảnh báo, không tạo Mission |
| UI-06 | Mất kết nối Client | Có trạng thái offline, không báo lệnh thành công giả |

## Những việc không phải tiêu chí Ngày 7

- Không bắt buộc API/Database thật hoạt động trong Figma.
- Không bắt buộc ảnh CesiumJS thật trong Figma.
- Không bắt buộc React/Capacitor/Electron hoạt động từ Prototype.

## Ghi chú

Đã gặp giới hạn Figma MCP của tài khoản Starter trước khi hoàn tất Prototype Mobile. Không đánh dấu các mục còn lại đã hoàn thành cho đến khi có kết quả thao tác/kiểm tra thực tế trong Figma.
