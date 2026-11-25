# Ngày 4 — Biên bản kiểm thử Wokwi ESP32

**Cách dùng:** Chỉ đổi `NOT RUN` thành `PASS` sau khi thực sự chạy trên Wokwi. Ghi log và ảnh minh chứng. Đây là test firmware mô phỏng, không phải thử nghiệm drone vật lý.

| ID | Bài kiểm thử | Mong đợi | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|
| E4-01 | Wokwi compile sketch | Không báo lỗi biên dịch | — | NOT RUN |
| E4-02 | I²C MPU6050 | `MPU6050 READY` | — | NOT RUN |
| E4-03 | Vặn MPU6050 giá trị X/Y/Z | Telemetry `imu` thay đổi | — | NOT RUN |
| E4-04 | Vặn potentiometer | `batterySimPct` thay đổi trong 0–100 | — | NOT RUN |
| E4-05 | Pin <=30% | LED đỏ sáng, còi cảnh báo | — | NOT RUN |
| E4-06 | Serial `START` khi pin đủ | 4 LED motor sáng, PWM >0 | — | NOT RUN |
| E4-07 | Serial `ARRIVED` | 4 LED motor tắt, trạng thái chờ bàn giao | — | NOT RUN |
| E4-08 | Serial `UNLOCK` khi đang bay | Từ chối, servo không mở | — | NOT RUN |
| E4-09 | Serial `UNLOCK` khi ARRIVED | Servo mở 90° | — | NOT RUN |
| E4-10 | Serial `HOME` | Servo khóa, PWM=0, IDLE | — | NOT RUN |
| E4-11 | Wi-Fi/NTP/TLS/MQTT | `MQTT CONNECTED; COMMAND SUBSCRIBED` | — | NOT RUN |
| E4-12 | Node `npm run watch` | Nhận telemetry đúng topic, đúng schema | — | NOT RUN |
| E4-13 | Node gửi `LOCK` | Wokwi thay đổi servo, Node nhận ACK | — | NOT RUN |
| E4-14 | Node gửi `UNLOCK` khi IDLE | Node nhận NACK `NOT_AT_DELIVERY_POINT` | — | NOT RUN |
| E4-15 | Node gửi `UNLOCK` khi ARRIVED | Node nhận ACK, servo mở | — | NOT RUN |
| E4-16 | Ngắt MQTT/Wokwi | Không báo điều khiển thành công nếu thiếu ACK | — | NOT RUN |
| E4-17 | Giữ bí mật | Không commit mqtt_config.h/.env | — | NOT RUN |

## Evidence

- `docs/07-testing/evidence/p2-day4-circuit.png`:
- `docs/07-testing/evidence/p2-day4-telemetry.png`:
- `docs/07-testing/evidence/p2-day4-ack.png`:

## Known limitations

- Motor PWM chỉ là đèn LED giả lập đầu ra, **không phải bốn motor hoặc ESC thực**.
- Pin bằng biến trở là dữ liệu giả lập, **không có mô hình điện áp/dung lượng vật lý**.
- `START`, `ARRIVED`, `HOME` nhập Serial chỉ mô phỏng trạng thái thiết bị để test. Backend authoritative ở giai đoạn sau.
- `commandId` chỉ lưu chống trùng lệnh gần nhất trong RAM, reset sẽ mất. Cần xử lý bền vững ở Backend.
- MQTT QoS 0 có thể mất bản tin; gửi lệnh và xác nhận cần retry/timeout ở hệ thống thật.
