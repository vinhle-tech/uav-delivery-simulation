# PHÂN TÍCH QUY TRÌNH NGHIỆP VỤ UAV GIAO HÀNG

## 1. Tổng quan

Hệ thống mô phỏng hoạt động giao hàng chặng cuối
bằng UAV cho một trung tâm logistics.

UAV vận chuyển hàng từ trạm đến điểm nhận cố định,
xác nhận bàn giao và quay trở về trạm.

## 2. Đối tượng sử dụng

Nhân viên điều phối và vận hành UAV.

Nhân viên có thể sử dụng cùng một tài khoản trên:

- Web Application
- Mobile Application
- Desktop Application

Ba nền tảng sử dụng chung dữ liệu và chức năng.

## 3. Phạm vi nghiệp vụ

### Trong phạm vi

- Tiếp nhận và quản lý đơn hàng.
- Quản lý đội UAV.
- Phân công UAV.
- Lập kế hoạch bay.
- Điều khiển nhiệm vụ mô phỏng.
- Theo dõi trạng thái và telemetry.
- Xác nhận giao hàng.
- Xử lý sự cố.
- Lưu lịch sử chuyến bay.

### Ngoài phạm vi

- Xử lý thanh toán thật.
- Quản lý vận chuyển liên tỉnh.
- Tích hợp trực tiếp sàn thương mại điện tử.
- Điều khiển UAV vật lý.

## 4. Quy trình giao hàng

### Bước 1 - Tiếp nhận đơn

Nhân viên tạo hoặc tiếp nhận đơn hàng mẫu.

### Bước 2 - Kiểm tra đơn

Kiểm tra khối lượng, điểm giao, dữ liệu hợp lệ.

### Bước 3 - Chọn UAV

Lựa chọn UAV có khả năng vận chuyển đơn hàng.

### Bước 4 - Lập nhiệm vụ

Xác định trạm, điểm giao, đường bay và UAV.

### Bước 5 - Kiểm tra trước bay

Kiểm tra pin, tải trọng, trạng thái và điều kiện an toàn.

### Bước 6 - Thực hiện chuyến bay

UAV cất cánh và bay theo waypoint.

### Bước 7 - Giao hàng

UAV hạ cánh tại điểm nhận và chờ xác nhận bàn giao.

### Bước 8 - Quay về

UAV trở về trạm theo đường bay hợp lệ.

### Bước 9 - Kết thúc

Hệ thống ghi nhận kết quả nhiệm vụ và lịch sử.

## 5. Các trường hợp ngoại lệ

- Đơn hàng không hợp lệ.
- UAV đang bận.
- Hàng vượt tải trọng.
- Không đủ pin.
- Đường bay đi qua vùng cấm.
- Không thể hạ cánh an toàn.
- Người nhận không xác nhận.
- UAV gặp sự cố trong khi bay.

## 6. Dữ liệu ví dụ

Order: ORD-001
Drone: UAV-01
Mission: MIS-001
Station: STATION-01
Delivery Point: POINT-A
Khối lượng hàng: 0.8 kg
Khoảng cách đến điểm giao: 1.2 km

## 7. Liên kết tài liệu

- business-rules.md
- ../06-diagrams/04-activity.mmd

## 8. Những nội dung cần chốt thêm

- Chính sách pin an toàn.
- Thời gian chờ bàn giao.
- Quy tắc hạ cánh dự phòng.
- Trạng thái đơn hàng và nhiệm vụ chi tiết.
