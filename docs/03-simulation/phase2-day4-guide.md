# Giai đoạn 2 — Ngày 4: ESP32 + MPU6050 + PWM + Servo + MQTT/TLS

Phạm vi: firmware nhúng mô phỏng, giữ nguyên nền tảng Web/Cesium và Backend. Không động tới `apps/client`, `packages/simulation-core`, hay `experiments/database-api`.

## 1. Sao lưu
- Git commit Ngày 3 nếu chưa làm.
- Trong Wokwi, clone/copy dự án Ngày 1 đã kết nối MQTT.
- Giữ bản `mqtt_config.h` chứa mật khẩu **bên ngoài Git**.

## 2. Chép file
- `experiments/embedded-wokwi/day4-uav/diagram.json` -> tab diagram.json Wokwi
- `.../libraries.txt` -> libraries.txt Wokwi
- `.../sketch.ino` -> sketch.ino Wokwi
- `mqtt_config.h` đã PASS ở Ngày 1 -> file cùng tên của project Wokwi Ngày 4.

## 3. Nguyên tắc an toàn
- Mỗi motor ảo được biểu diễn bằng LED PWM có trở hạn dòng, không phải động cơ thật.
- `ARRIVED` là lệnh Serial để mô phỏng điều kiện chờ bàn giao; không xác nhận đơn hàng ở Backend.
- `UNLOCK` chỉ cho phép khi localMode = `WAITING_FOR_HANDOVER`.
- Quản lý Mission/Order vẫn nằm trong Simulation Core và sau này ở Backend.
- Mật khẩu đã từng chia sẻ cần thay/thu hồi, không đưa vào ZIP và Git.

## 4. Test trực tiếp trên Wokwi
1. Serial báo `MPU6050 READY`; nếu không, kiểm tra GPIO21/22, địa chỉ 0x68, libraries.txt.
2. Xoay biến trở -> battery từ 0..100; <= 30 thì LED đỏ sáng và buzzer cảnh báo.
3. Nhập `STATUS`, `START`, `ARRIVED`, `UNLOCK`, `HOME`; quan sát LED/servo.
4. Khi đang ở IDLE, nhập `UNLOCK` -> bị từ chối.
5. Wokwi báo MQTT CONNECTED; Node `npm run watch` nhận telemetry JSON.
6. Node `node day4-command.mjs UNLOCK` lúc IDLE -> NACK; nhập ARRIVED trên Wokwi rồi chạy lại -> ACK.

## 5. Xác minh source không lỗi
Tại repo root, kiểm tra `Test-Path .\experiments\embedded-wokwi\day4-uav\sketch.ino` và `Test-Path .\experiments\mqtt-spike\day4-command.mjs`.
`node --check .\experiments\mqtt-spike\day4-command.mjs`.
Kiểm tra MQTT ACK thật trên Wokwi (chưa có xác nhận compile tự động trong môi trường tạo ZIP).

## 6. Mốc nghiệm thu
- 4 đầu ra PWM chứng minh bằng LED; MPU6050; ADC giả lập pin; servo; buzzer.
- MQTT/TLS telemetry từ firmware mới được Node nhận; lệnh hai chiều và ACK/NACK được kiểm thử.
- 17 case ghi PASS/FAIL/NOT RUN, không đánh dấu PASS dựa trên kỳ vọng.
- Ảnh sơ đồ, log Wokwi và Terminal Node, video ngắn, không lộ secret.

## Ghi chú
Các file source kèm trong ZIP dành cho nguyên mẫu Wokwi Web. Mình đã kiểm tra cấu trúc JSON và cú pháp JavaScript của công cụ lệnh, nhưng không thể xác nhận sketch Arduino đã biên dịch trên Wokwi trong môi trường hiện tại. Nếu Wokwi báo lỗi compile, chụp Serial/Errors để sửa đúng thư viện hoặc API.
