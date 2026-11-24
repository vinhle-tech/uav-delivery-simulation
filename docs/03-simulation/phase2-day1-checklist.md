# Giai đoạn 2 — Ngày 1: Kiểm tra triển khai

Ngày thực hiện: \_**\_/\_\_**/2026 Người kiểm tra: ******\_\_******

| ID    | Test                        | Kết quả mong đợi                                  | Trạng thái | Bằng chứng |
| ----- | --------------------------- | ------------------------------------------------- | ---------- | ---------- |
| D1-01 | Kiểm tra repo, `git status` | Không đè mất phần cũ                              | NOT RUN    |            |
| D1-02 | `npm install` ứng dụng      | Không lỗi dependency                              | NOT RUN    |            |
| D1-03 | `npm run dev`               | `http://127.0.0.1:5173` mở được                   | NOT RUN    |            |
| D1-04 | CesiumJS render             | 1 station, 3 UAV, 3 WP, point A, route            | NOT RUN    |            |
| D1-05 | Đổi chọn UAV                | Camera tập trung vào UAV được chọn                | NOT RUN    |            |
| D1-06 | `npm run build`             | TypeScript + Vite build PASS                      | NOT RUN    |            |
| D1-07 | JSON Schema v1              | Cả 2 file parse JSON hợp lệ                       | NOT RUN    |            |
| D1-08 | Node MQTT TLS               | `npm run probe` báo PASS                          | NOT RUN    |            |
| D1-09 | Wokwi WiFi + MQTT TLS       | Serial báo MQTT connected                         | NOT RUN    |            |
| D1-10 | Wokwi → Node                | `npm run watch` nhận JSON telemetry thực          | NOT RUN    |            |
| D1-11 | Git safety                  | `.env`, `mqtt_config.h` không có trong git status | NOT RUN    |            |

Kết luận: GO / BLOCKED / NO-GO. Những mục NOT RUN không được đánh dấu PASS. D1-08 là cổng cơ bản, D1-09/D1-10 là mục tiêu sớm để tránh rủi ro ở Ngày 4.

## Những giới hạn có chủ đích của Ngày 1

- Bản đồ là dữ liệu tĩnh; không bấm Start/Pause được.
- Imagery OSM cần kết nối Internet; Cesium vẫn phải khởi tạo nếu mạng bị hạn chế (có thể thiếu ảnh).
- Wokwi đang chỉ gửi dữ liệu mẫu với `batterySimPct=78`, chưa đọc cảm biến thật.
- MQTT Bridge của Backend và Socket.IO Device Panel thuộc Ngày 5.
- Flight Controller server-authoritative của sản phẩm cuối sẽ tích hợp ở giai đoạn sau.
