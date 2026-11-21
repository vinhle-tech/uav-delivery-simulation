# Business Rules — quy tắc nghiệp vụ

| Mã    | Quy tắc                                                                | Kết quả khi không thỏa    |
| ----- | ---------------------------------------------------------------------- | ------------------------- |
| BR-01 | Khối lượng kiện hàng <= sức tải tối đa của drone                       | Từ chối phân công         |
| BR-02 | UAV phải sẵn sàng, không đang sạc/bảo trì/bay                          | Từ chối phân công         |
| BR-03 | Một UAV có tối đa một mission đang hoạt động                           | HTTP 409 Conflict         |
| BR-04 | Pin dự tính đủ cho cả đi, về, cất/hạ cánh, thời gian chờ và dự phòng   | Không cho Start           |
| BR-05 | Tọa độ giao nằm trong bán kính được cấu hình                           | Từ chối mission           |
| BR-06 | Tuyến waypoint không đi xuyên vùng cấm mô phỏng                        | Yêu cầu điều chỉnh tuyến  |
| BR-07 | UAV đến nơi != đơn hàng đã được bàn giao                               | Chờ xác nhận hoặc timeout |
| BR-08 | Giao hàng thành công != UAV đã về trạm                                 | Hai trạng thái riêng      |
| BR-09 | Lệnh Start/Pause/Resume/Return/Abort phải kiểm tra trạng thái hiện tại | Từ chối lệnh không hợp lệ |
| BR-10 | Client đóng không làm dừng simulation trên server                      | Simulation vẫn chạy       |

## Việc nhóm phải tự chốt

## Các giả định nghiệp vụ được chốt cho MVP

### 1. Chính sách pin

- Pin dự phòng mục tiêu khi hoàn thành: 30%.
- Ngưỡng cảnh báo pin yếu: 20%.
- Ngưỡng pin nguy cấp: 10%.
- Mức pin cần thiết để cất cánh phải được tính
  dựa trên toàn bộ Mission và pin dự phòng.
- Khi pin yếu trong khi bay, Safety Manager
  phải đánh giá phương án phù hợp.

Các giá trị trên là giả định mô phỏng, có thể
được điều chỉnh sau khi kiểm thử mô hình năng lượng.

### 2. Điểm hạ cánh không an toàn

Nếu không thể hạ cánh tại điểm giao:

- Không tự động xác nhận giao hàng.
- Đánh giá khả năng chờ, quay về hoặc hạ cánh dự phòng.
- Chỉ thực hiện phương án có đủ điều kiện an toàn.
- Ghi nhận sự cố và kết quả nhiệm vụ.

### 3. Return Home, Abort và Emergency

Return Home:
Yêu cầu UAV trở về trạm khi đường về khả thi.

Abort:
Hủy mục tiêu giao hàng hiện tại và chuyển sang
quy trình kết thúc nhiệm vụ có kiểm soát.

Emergency:
Kích hoạt xử lý tình huống nguy cấp, có thể là
hạ cánh an toàn hoặc kết thúc khẩn cấp trong mô phỏng.

Không đồng nhất Emergency với tắt động cơ ngay trên không.

### 4. Thời gian chờ giao hàng

- Thời gian chờ xác nhận: 60 giây mô phỏng.
- Nếu nhận được xác nhận hợp lệ:
  Order chuyển sang DELIVERED.
- Nếu hết thời gian mà không có xác nhận:
  Order chuyển sang DELIVERY_FAILED.
- UAV được yêu cầu quay về nếu điều kiện an toàn cho phép.

Thời gian 60 giây phục vụ demo và kiểm thử,
không đại diện cho quy trình ngoài thực tế.
