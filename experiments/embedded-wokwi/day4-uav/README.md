# UAV Day 4 — Wokwi embedded circuit

Đây là MÔ HÌNH NHÚNG GIẢ LẬP cho quadcopter, **không mô phỏng lực nâng và không điều khiển drone thật**.

## Files
- `sketch.ino`: firmware C++ đọc MPU6050, ADC, PWM bốn LED, servo, buzzer, MQTT/TLS.
- `diagram.json`: dây kết nối điện tử (giữ GPIO tương ứng code).
- `libraries.txt`: thư viện Wokwi (cần cài đầy đủ).
- `mqtt_config.example.h`: mẫu không chứa thông tin thật; sao chép thành `mqtt_config.h` trong Wokwi và giữ kín.
- `.gitignore`: bỏ qua `mqtt_config.h` nếu có file này trong repo.

## GPIO
| Thành phần | GPIO |
|---|---|
| MPU6050 SDA, SCL | 21, 22 |
| Potentiometer SIG | 34 (ADC1) |
| Motor LED M1–M4 | 25, 26, 27, 14 (mỗi LED qua 220 Ω) |
| Servo cargo lock | 18 |
| Buzzer | 23 |
| Alarm red LED | 5 |
| MQTT online green LED | 19 |

## Steps
1. **Tạo BẢN SAO** project MQTT Ngày 1 của bạn trong Wokwi. Không sửa project cũ đã PASS.
2. Dán `diagram.json`, `libraries.txt`, `sketch.ino` vào các tab tương ứng.
3. Giữ `mqtt_config.h` đang dùng thành công ở Ngày 1 (hoặc tạo từ example và điền thông tin của bạn). Không share project public có mật khẩu.
4. Run. Trông đợi MPU6050 READY, WiFi CONNECTED, NTP SYNCED, MQTT CONNECTED; nếu fails xem Serial Monitor và sửa *đúng* lớp lỗi.
5. Click MPU6050 để đổi trục X/Y/Z; click/rotate potentiometer để giả lập pin.
6. Trong Serial Monitor gõ `STATUS`, `START`, `ARRIVED`, `UNLOCK`, `HOME`, `LOCK` lần lượt; mỗi lệnh Enter.
7. Để Wokwi chạy, ở VS Code chạy `npm run watch` trong `experiments/mqtt-spike`.
8. Node gửi command: `node day4-command.mjs LOCK` / `node day4-command.mjs UNLOCK`. **UNLOCK khi IDLE phải NACK**, cần gõ ARRIVED ở Serial trước khi thử UNLOCK thành công.
9. Đánh dấu test case trong `docs/03-simulation/phase2-day4-test-results.md`.

## MQTT topics
- Telemetry: `uav-delivery/uav-solo-lab/dev/uav-01/telemetry`
- Command: `uav-delivery/uav-solo-lab/dev/uav-01/command`
- Ack: `uav-delivery/uav-solo-lab/dev/uav-01/ack`

`MQTT_NAMESPACE` trong file cấu hình phải khớp `MQTT_NAMESPACE` của `.env` trong Node. **Không sửa `contracts/device-command.schema.json` và `contracts/device-telemetry.schema.json` Ngày 1.** Source này dùng lại đúng cấu trúc JSON v1 và chỉ thêm `contracts/device-ack.schema.json`.
