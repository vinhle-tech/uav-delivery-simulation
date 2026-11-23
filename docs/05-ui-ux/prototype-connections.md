# Prototype connections – UAV Delivery System

**Figma:** https://www.figma.com/design/uDFQY235eDuJh5jc1r0fHw

## 1. Việc quan trọng nhất: nối Prototype Mobile

**Tình trạng:** Mobile có đủ Frame cơ bản nhưng chưa nối được đầy đủ do Figma MCP Starter giới hạn lượt thao tác. Các kết nối dưới đây là **công việc cần thực hiện**, không được ghi nhận như đã hoàn thành.

### Luồng Mobile cần nối (ưu tiên cao)

| # | Frame nguồn | Chọn layer/nút | Destination Frame | Hành vi |
|---:|---|---|---|---|
| 1 | `M00 - Login` | `Sign In` | `M01 - Dashboard` | Navigate to |
| 2 | `M01 - Dashboard` | `Orders` ở Bottom Nav | `M04 - Order List` | Navigate to |
| 3 | `M04 - Order List` | `Create Order` | `M05 - Create Order` | Navigate to |
| 4 | `M05 - Create Order` | `Create Order` | `M06 - Order Details` | Navigate to |
| 5 | `M06 - Order Details` | `Create Mission` | `M07 - Mission Planner` | Navigate to |
| 6 | `M07 - Mission Planner` | `Create Mission` | `M13 - Mission Ready` | Navigate to |
| 7 | `M13 - Mission Ready` | `View Simulation` | `M08 - Live Simulation` | Navigate to |
| 8 | `M08 - Live Simulation` | `Pause` | `M08A - Simulation Paused` | Navigate to |
| 9 | `M08A - Simulation Paused` | `Resume` | `M08 - Live Simulation` | Navigate to |
| 10 | `M08 - Live Simulation` | `Handover demo` | `M08B - Waiting for Handover` | Navigate to |
| 11 | `M08B - Waiting for Handover` | `Confirm Delivery` | `M14 - Delivery Confirmed` | Navigate to |
| 12 | `M14 - Delivery Confirmed` | `View Mission` | `M12 - Mission Details` | Navigate to |
| 13 | `M11 - Flight History` | `View Mission` | `M12 - Mission Details` | Navigate to |
| 14 | `M15 - Order / Validation Error` | `Choose Another Drone` | `M07 - Mission Planner` | Navigate to |

**Cần bổ sung hoặc xác minh:** Đường dẫn đi từ Mission Planner sang màn hình lỗi `M15` khi chọn UAV không đủ pin. Hiện UI tạo sẵn có `M15` nhưng chưa có nút nguồn rõ ràng trong `M07`.

### Bottom Navigation (nối cho mọi màn hình thích hợp)

| Nhãn menu | Đích |
|---|---|
| Home | `M01 - Dashboard` |
| Drones | `M02 - Drone List` |
| Orders | `M04 - Order List` |
| Mission | `M07 - Mission Planner` |
| More | `M10 - Incidents` (tạm, sau này dùng Menu chức năng) |

**Để không thiếu chức năng trên Mobile:** từ phần More/Menu cần có đường đến `M09 - Telemetry`, `M10 - Incidents`, `M11 - Flight History`. Có thể thêm một màn hình More riêng nếu cần; hiện Page Mobile chưa có More menu chuyên dụng.

### Các liên kết bổ sung để không bị màn hình cụt

- `M02 - Drone List` → chọn UAV-01 → `M03 - Drone Details`.
- `M04 - Order List` → chọn ORD-001 → `M06 - Order Details`.
- `M11 - Flight History` → chọn MIS-001 → `M12 - Mission Details`.
- `M07 - Mission Planner` → lỗi không đủ pin → `M15`; sau đó quay về `M07`.

## 2. Desktop – kiểm tra lại các liên kết đã tạo

Một phần liên kết Desktop đã được tạo tự động, nhưng cần **Present để xác minh** chứ không tự coi là tất cả hoạt động chính xác.

| Bước | Từ Frame | Nút | Đến Frame |
|---:|---|---|---|
| 1 | `D00 - Login` | Sign In | `D01 - Dashboard` |
| 2 | `D01 - Dashboard` | Orders (Sidebar) | `D04 - Order List` |
| 3 | `D04 - Order List` | Create Order | `D05 - Create Order` |
| 4 | `D05 - Create Order` | Create Order | `D06 - Order Details` |
| 5 | `D06 - Order Details` | Create Mission | `D07 - Mission Planner` |
| 6 | `D07 - Mission Planner` | Create Mission | `D13 - Mission Ready` |
| 7 | `D13 - Mission Ready` | View Simulation | `D08 - Live Simulation` |
| 8 | `D08 - Live Simulation` | Pause | `D08A - Simulation Paused` |
| 9 | `D08A - Simulation Paused` | Resume | `D08 - Live Simulation` |
| 10 | `D08 - Live Simulation` | Handover demo | `D08B - Waiting for Handover` |
| 11 | `D08B - Waiting for Handover` | Confirm Delivery | `D14 - Delivery Confirmed` |
| 12 | `D14 - Delivery Confirmed` | View Mission | `D12 - Mission Details` |

Kiểm tra Sidebar để có đường đến Dashboard, Drones, Orders, Missions, Simulation, Telemetry, Incidents, Flight History. Nút đang ở chính màn hình hiện tại có thể không cần Navigate.

## 3. Cách nối một nút trong Figma, từng thao tác

1. Mở file Figma từ URL trên.
2. Trong Pages, chọn **02 - Mobile** (hoặc **01 - Desktop**).
3. Zoom bằng `Shift + 2` sau khi chọn Frame nguồn trong Layers.
4. Trong danh sách Layers, tìm nút bằng tên `NAV:M05:Create Order` hoặc chọn trực tiếp đối tượng nút trên canvas.
5. Bên phải chuyển sang tab **Prototype**.
6. Chọn nút/instance đúng (không chọn toàn Frame); kéo **nút tròn màu xanh** hiện bên cạnh tới Frame đích.
7. Ở phần Interaction, chọn **On click → Navigate to**; Animation `Instant` hoặc `Dissolve`.
8. Lặp lại theo bảng ở phần 1 và 2.
9. Chọn Frame Login, dùng **Present** để chạy thử toàn bộ chuỗi.
10. Nếu không chọn được nút vì layer bị che, mở Layers và chọn đúng instance có tên bắt đầu bằng `NAV:`.

**Không dùng** `After delay` cho Start, Pause, Resume: trong bản Prototype, các bước điều khiển cần thể hiện thao tác người dùng rõ ràng. Có thể dùng luồng demo để đến trạng thái bàn giao, nhưng luôn gắn nhãn là mock.

## 4. Khi xuất hiện lỗi điều hướng

- **Bấm không phản hồi:** Chọn layer và kiểm tra mục Interactions; kiểm tra đối tượng nào đang bắt sự kiện.
- **Đi sai màn hình:** Trong Prototype, thay `Destination` bằng Frame đúng bảng.
- **Thấy bản đồ tĩnh:** Đây là mock Figma, không phải CesiumJS.
- **Màn hình PAUSED nhưng vẫn là nút Pause sáng:** Dùng đúng Frame `M08A`/`D08A`, thể hiện Resume là hành động phù hợp.
- **Khi giao hàng tự chuyển COMPLETED:** Sửa nội dung cho đúng `Order=DELIVERED, Mission=RETURNING`, tránh nhầm với đã về trạm.

## 5. Tiêu chí nghiệm thu Prototype

- Hoàn thành luồng 12 bước từ Login đến Mission Details trên Desktop **và** Mobile.
- Đã thử nhánh Pause/Resume.
- Đã thử nhánh lỗi battery và quay lại Mission Planner.
- Nút điều hướng tới phần UAV, Orders, Incidents, History hoạt động.
- Không có màn hình cụt trong luồng demo chính.
- Dữ liệu giả lập được ghi nhãn là `Mock Data` hoặc `Prototype`.
