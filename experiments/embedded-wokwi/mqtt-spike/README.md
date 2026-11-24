# Wokwi MQTT/TLS proof of concept — Ngày 1

Đây là thử nghiệm WiFi + MQTT/TLS, **không phải mạch UAV hoàn chỉnh**. MPU6050/ADC/PWM/servo bắt đầu ở Ngày 4.

1. Tạo project ESP32 trên https://wokwi.com/projects/new/esp32.
2. Thay `diagram.json`, `sketch.ino`, `libraries.txt` bằng nội dung trong thư mục này.
3. Tạo file mới `mqtt_config.h` từ `mqtt_config.example.h`, thay host/user/pass/root CA và MQTT_NAMESPACE phải trùng `.env` ở Node.
4. **Giữ project ở chế độ riêng tư** nếu có dữ liệu bí mật trong file; KHÔNG share project chứa mật khẩu.
5. Run và kiểm tra Serial: `WiFi connected`, `MQTT connected over TLS`, `publish ... OK`.
6. Ở PowerShell chạy Node: `cd experiments/mqtt-spike; npm install; npm run watch`.
7. Xác nhận **RECEIVED** bản tin JSON `source:WOKWI_ESP32` trên Node. Chỉ khi đó mới đánh dấu Wokwi→Broker→Node PASS.

Nếu không có root CA chính xác hoặc đồng hồ TLS chưa đồng bộ, handshake sẽ thất bại. Giữ kiểm tra CA, không dùng `setInsecure()` để né lỗi. Khi lỗi, ghi log TLS/WiFi; không phát biểu PASS.
