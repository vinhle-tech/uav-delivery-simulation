# Nghiệm thu Ngày 6
Điền PASS/FAIL/NOT RUN và minh chứng thực tế; không đánh dấu trước.

| ID | Kiểm tra | Kết quả | Minh chứng |
|---|---|---|---|
| SY-01 | Build Core và 22 unit test | NOT RUN | |
| SY-02 | Device State 10 + Flight Sync 12 unit test | NOT RUN | |
| SY-03 | Build React, server core ready, MQTT connected | NOT RUN | |
| SY-04 | Wokwi v2, IMU ready, bootId, pin ADC | NOT RUN | |
| SY-05 | START, ACK + telemetry, PWM dương, UAV bay | NOT RUN | |
| SY-06 | PAUSE/RESUME và PWM | NOT RUN | |
| SY-07 | UNLOCK trước khi hạ cánh bị Backend từ chối | NOT RUN | |
| SY-08 | Tự WAITING_FOR_HANDOVER, PWM 0 | NOT RUN | |
| SY-09 | Mở khóa, chặn bàn giao khi mở, đóng khóa | NOT RUN | |
| SY-10 | DELIVERED, RETURNING rồi COMPLETED & IDLE | NOT RUN | |
| SY-11 | Giao thất bại / về sớm khi khóa đóng | NOT RUN | |
| SY-12 | Pin thấp chặn START | NOT RUN | |
| SY-13 | Pin thấp đang bay -> FAULT, PWM 0 | NOT RUN | |
| SY-14 | Stop Wokwi -> FAULT, freeze; reboot và reset | NOT RUN | |
| SY-15 | F5 / hai tab không tạo engine UAV-01 khác | NOT RUN | |
| SY-16 | UAV-02 local, UAV-03 offline | NOT RUN | |
| SY-17 | Mission Flow PostgreSQL cũ PASS | NOT RUN | |
| SY-18 | Kiểm tra lệnh timeout/ACK sai, xem unit test và log | NOT RUN | |
| SY-19 | Sơ đồ đúng chân Dxx, tài liệu và Git không secret | NOT RUN | |

Giới hạn: PWM chỉ LED, không có flight dynamics hoặc feedback servo vật lý; RAM demo, không persistence/production authentication. Wi-Fi Public Gateway có thể không ổn định. Chưa nối Mission demo với DB.
