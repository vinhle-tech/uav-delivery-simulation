# REST API Contract (bản thiết kế)

**Base URL:** `/api` (localhost/server URL sẽ được cấu hình sau)

| Method | Path | Ý nghĩa |
|---|---|---|
| POST | /auth/login | Login |
| GET | /drones | Danh sách drone |
| GET | /drones/:id | Drone detail |
| POST | /orders | Tạo đơn |
| GET | /orders | Danh sách đơn |
| POST | /missions | Tạo nhiệm vụ |
| GET | /missions/:id | Mission detail |
| POST | /missions/:id/start | Start |
| POST | /missions/:id/pause | Pause |
| POST | /missions/:id/resume | Resume |
| POST | /missions/:id/return-home | Return Home |
| POST | /missions/:id/abort | Abort |
| POST | /missions/:id/confirm-delivery | Xác nhận giao |

## Ví dụ request tạo đơn
```json
{"weightKg": 0.7, "deliveryPointId": "point-001"}
```

## Ví dụ response
```json
{"id": "order-001", "status": "PENDING", "weightKg": 0.7}
```

## Khi xảy ra lỗi
- 400: đầu vào không hợp lệ
- 401: chưa đăng nhập
- 403: không có quyền
- 404: không tìm thấy
- 409: xung đột trạng thái (UAV bận, mission đã chạy...)

**[TODO]** Thiết kế body/response chi tiết cho từng API, mã idempotency cho lệnh, kiểm tra quyền và cấu trúc error chung.
