# UAV Delivery System – UI/UX Design

**Trạng thái:** Đã tạo màn hình trong Figma; còn kiểm tra hình ảnh và hoàn thiện Prototype Mobile.  
**Đối tượng sử dụng:** Nhân viên vận hành UAV của trung tâm logistics.  
**Nền tảng:** Web (React), Android (Capacitor), Windows (Electron) – chung nghiệp vụ và dữ liệu.  
**Figma:** https://www.figma.com/design/uDFQY235eDuJh5jc1r0fHw

## 1. Phạm vi và nguyên tắc

- Hai hệ bố cục chính: **Desktop 1440 × 900** dùng cho Web/Windows, **Mobile 390 × 844** dùng cho Android.
- **Figma là Mock UI/Prototype**, không kết nối PostgreSQL, REST API hay Simulation Engine.
- Backend/Simulation Engine là nguồn trạng thái có thẩm quyền; Client không tự kết luận chuyến bay đã thành công chỉ nhờ thao tác nút.
- `Order.status`, `Mission.status`, `Drone.status` và `FlightController.state` là những khái niệm độc lập. Ví dụ: `Order=DELIVERED` khi `Mission=RETURNING`.
- Không đưa thao tác ngoài SRS vào phạm vi MVP mà chưa thảo luận với nhóm.

## 2. Cấu trúc Figma đã tạo

Do tài khoản Figma Starter giới hạn 3 Page, file có:

1. `00 - Design System`: màu, typography, semantic variables, các component.
2. `01 - Desktop`: 17 màn hình / trạng thái.
3. `02 - Mobile`: 18 màn hình / trạng thái.

### Design tokens

| Token | Giá trị |
|---|---|
| Primary | `#0F766E` |
| Primary Hover | `#115E59` |
| Background | `#F8FAFC` |
| Surface | `#FFFFFF` |
| Text Primary | `#0F172A` |
| Text Secondary | `#64748B` |
| Border | `#E2E8F0` |
| Success | `#15803D` |
| Warning | `#B45309` |
| Danger | `#B91C1C` |
| Sidebar | `#1E293B` |
| Font | Inter |

### Components đã tạo

- `Button / Primary`, `Button / Secondary`, `Button / Danger`
- `Badge / Status`
- `Card / KPI`, `Card / Drone`
- `Field / Input`
- `Table / Four Columns`
- `Nav / Item`

## 3. Danh sách màn hình

| Desktop | Mobile | Vai trò |
|---|---|---|
| `D00 - Login` | `M00 - Login` | Đăng nhập (mock) |
| `D01 - Dashboard` | `M01 - Dashboard` | Tổng quan đội UAV |
| `D02 - Drone List` | `M02 - Drone List` | Danh sách UAV |
| `D03 - Drone Details` | `M03 - Drone Details` | Thông tin UAV |
| `D04 - Order List` | `M04 - Order List` | Danh sách đơn |
| `D05 - Create Order` | `M05 - Create Order` | Tạo đơn |
| `D06 - Order Details` | `M06 - Order Details` | Xem đơn |
| `D07 - Mission Planner` | `M07 - Mission Planner` | Phân công UAV, tuyến bay |
| `D08 - Live Simulation` | `M08 - Live Simulation` | Giám sát bay |
| `D08A - Simulation Paused` | `M08A - Simulation Paused` | Trạng thái tạm dừng |
| `D08B - Waiting for Handover` | `M08B - Waiting for Handover` | Chờ xác nhận bàn giao |
| `D09 - Telemetry Dashboard` | `M09 - Telemetry` | Cảm biến mô phỏng |
| `D10 - Incident Management` | `M10 - Incidents` | Cảnh báo và sự cố |
| `D11 - Flight History` | `M11 - Flight History` | Lịch sử bay |
| `D12 - Mission Details` | `M12 - Mission Details` | Chi tiết Mission |
| `D13 - Mission Ready` | `M13 - Mission Ready` | Mission READY |
| `D14 - Delivery Confirmed` | `M14 - Delivery Confirmed` | Order DELIVERED, Mission RETURNING |
| — | `M15 - Order / Validation Error` | Lỗi thiếu pin / phân công |

> Danh sách phản ánh tên Frame đã được tạo. `M15` là trạng thái lỗi bổ sung trên Mobile; Desktop có thể thể hiện cảnh báo ngay trong Mission Planner mà không cần một màn hình tách riêng.

## 4. Luồng nghiệp vụ mẫu cần trình diễn

**Đơn hàng:** `ORD-001`, khối lượng 0.8 kg, điểm giao `POINT-A`.  
**UAV:** `UAV-01`, pin mẫu 90%.  
**Mission:** `MIS-001`.

`Login → Dashboard → Orders → Create Order → Order Details → Mission Planner → Mission READY → Live Simulation → PAUSED → Live Simulation → Waiting for Handover → Delivery Confirmed → Mission Details`.

Ở màn hình Mission READY cần phân biệt rõ `Create Mission` không có nghĩa UAV đã cất cánh. Ở màn hình Delivery Confirmed cần phân biệt `Order=DELIVERED` và `Mission=RETURNING`.

## 5. Trạng thái thiết kế, không phải tính năng Backend hoàn chỉnh

| Tính năng UI | Tình trạng thiết kế | Hệ thống tích hợp |
|---|---|---|
| Create Order | Đã dựng UI | Bài thử API ở GĐ1, chưa hoàn chỉnh auth |
| Mission Planner | Đã dựng UI | Kiểm tra pin/tuyến nâng cao chưa triển khai |
| Live Simulation | Đã dựng bản đồ mô phỏng dạng vector | CesiumJS để làm trong giai đoạn mô phỏng |
| Pause/Resume | Có hai Frame | Engine server có prototype Ngày 4, chưa nối UI |
| Delivery Confirmation | Có luồng demo | Logic xác nhận thật chưa tích hợp |
| Telemetry & Incident | Đã dựng UI mock | Socket.IO thử nghiệm Ngày 6, chưa nối UI |
| Authentication | Form đăng nhập mock | Chưa triển khai |

## 6. Điều kiện nghiệm thu

Chi tiết kiểm tra trong `ui-acceptance-checklist.md` và ánh xạ nút trong `prototype-connections.md`.

**Tiêu chí chấp nhận:** Các luồng chính trên Desktop và Mobile hoạt động trong Present mode, không có điều hướng sai hoặc màn hình cụt; cảnh báo kết nối, trạng thái không hợp lệ, và dữ liệu Mock được gắn nhãn; thiết kế được ít nhất một thành viên khác review.
