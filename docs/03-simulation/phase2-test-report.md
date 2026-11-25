# Báo cáo nghiệm thu Giai đoạn 2

Ngày 1–6: người thực hiện xác nhận hoàn thành; kết quả Ngày 7 cần minh chứng thực tế.

- Commit/hash: ...
- Node/npm/PostgreSQL/Browser: ...
- Người thực hiện: ...
- Ngày kiểm thử: ...
- Kết luận: CHƯA NGHIỆM THU

PASS = đã chạy, đạt mong đợi; FAIL = đã chạy, không đạt; BLOCKED = không thể chạy; NOT RUN = chưa chạy. Gắn log/ảnh/link thật. Không tự động đánh PASS từ việc file tồn tại.

## 1. Ma trận kiểm thử

| ID | Nội dung | Kết quả | Minh chứng / lỗi |
|---|---|---|---|
| QA-01 | Audit static và live | NOT RUN | |
| QA-02 | Core build, 22 unit tests, demo | NOT RUN | |
| QA-03 | Device State 10 + Flight Sync 12 | NOT RUN | |
| QA-04 | API smoke 12 | NOT RUN | |
| QA-05 | Socket hello smoke | NOT RUN | |
| QA-06 | Mission Flow PostgreSQL | NOT RUN | |
| QA-07 | Client production build | NOT RUN | |
| QA-08 | START tự bật PWM / PAUSE 110 / RESUME 145 | NOT RUN | |
| QA-09 | Đến điểm giao tự PWM 0 | NOT RUN | |
| QA-10 | UNLOCK đang bay bị chặn | NOT RUN | |
| QA-11 | UNLOCK tại điểm giao; chặn bàn giao khi mở; LOCK | NOT RUN | |
| QA-12 | DELIVERED, RETURNING, COMPLETED, ESP32 IDLE | NOT RUN | |
| QA-13 | Giao thất bại vẫn về; Order DELIVERY_FAILED | NOT RUN | |
| QA-14 | Pin thấp trước bay; đang bay FAULT | NOT RUN | |
| QA-15 | Mất Wokwi → STALE/FAULT, bootId mới, RESET | NOT RUN | |
| QA-16 | Backend mất heartbeat → SAFE_STOP | NOT RUN | |
| QA-17 | F5 + hai tab UAV-01 | NOT RUN | |
| QA-18 | UAV-02 độc lập, UAV-03 offline | NOT RUN | |
| QA-19 | Timeout, ACK sai và duplicate (unit + log thực nếu khả thi) | NOT RUN | |
| QA-20 | Camera Follow/Overview, loading/error/scroll | NOT RUN | |
| QA-21 | Đối chiếu telemetry Wokwi/API/Web hoặc MQTTX subscribe | NOT RUN | |
| QA-22 | TLS/Origin/secret review (không phải auth) | NOT RUN | |
| QA-23 | Clone sạch và tái lập README | NOT RUN | |
| QA-24 | Lưu ảnh sơ đồ và 2 video/link, tài liệu | NOT RUN | |

## 2. Đối chiếu backlog

| ID | Hạng mục | Kết quả | QA / minh chứng |
|---|---|---|---|
| P2-01 | Vite/Cesium build | NOT RUN | |
| P2-02 | Dữ liệu và types dùng chung | NOT RUN | |
| P2-03 | Motion/tick/waypoint | NOT RUN | |
| P2-04 | State machine | NOT RUN | |
| P2-05 | Renderer đọc snapshot | NOT RUN | |
| P2-06 | Controls START/PAUSE/RESUME/RESET | NOT RUN | |
| P2-07 | Telemetry bay và thiết bị riêng | NOT RUN | |
| P2-08 | Ba UAV độc lập | NOT RUN | |
| P2-09 | Follow/Overview | NOT RUN | |
| P2-10 | Validation và lỗi | NOT RUN | |
| P2-11 | Tài liệu và demo | NOT RUN | |
| P2-12 | Loading/error/responsive sơ bộ | NOT RUN | |
| E2-01 | Wokwi sơ đồ đúng chân | NOT RUN | |
| E2-02 | IMU/ADC/PWM/servo/cảnh báo | NOT RUN | |
| E2-03 | MQTT Cloud/TLS | NOT RUN | |
| E2-04 | Bridge REST/Socket.IO | NOT RUN | |
| E2-05 | E2E command và ACK | NOT RUN | |
| E2-06 | Quadcopter hình học/sơ đồ khối | NOT RUN | |
| E2-07 | Test và handoff | NOT RUN | |

## 3. Lỗi và xử lý

| ID | Hiện tượng | Nguyên nhân | Cách sửa | Retest |
|---|---|---|---|---|
| | | | | |

Các lỗi đã gặp theo lịch sử: thiếu file Day 3; tên chân Dxx Wokwi; thiếu điểm nối App/server Day 5; PowerShell execution policy và lọc mảng; STALE Day 6. Xác minh lại trên commit nghiệm thu, không coi là lỗi mở nếu đã retest PASS.

## 4. Quyết định

- GO: tất cả P0 đạt, không có lỗi nghiêm trọng, minh chứng và clone sạch đầy đủ.
- CONDITIONAL GO: chỉ còn hạn chế không trọng yếu có mô tả và kế hoạch xử lý; không dùng để bỏ qua P0.
- NO-GO: còn lỗi nghiêm trọng hoặc P0 chưa xác minh/BLOCKED.
- P0 đề xuất: build, chuyến giao hàng đồng bộ, ACK/NACK, bảo vệ khóa, pin thấp, mất kết nối, không lộ secret và regression DB.
- Giới hạn chấp nhận của nguyên mẫu: RAM, chưa tích hợp Mission demo/DB, chưa auth production, LED thay động cơ thật, Wokwi gateway không ổn định, chưa Mobile/Desktop.

Kết luận thực tế: ...
