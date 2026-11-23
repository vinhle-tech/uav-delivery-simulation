# UAV - Ngày 4: Virtual Flight Controller (bộ thực hành)

Đây là bộ file **thử nghiệm phục vụ học tập**, không phải phần mềm điều khiển UAV thật. Không có thư viện ngoài, không cần `npm install`.

## 1. Yêu cầu

- Windows 10/11, VS Code.
- Node.js đã cài, kiểm tra `node --version`. Nếu chưa có, dùng bản LTS tại https://nodejs.org/en/download .

## 2. Sao chép vào repository đang có

1. Giải nén ZIP ra một thư mục tạm.
2. Sao chép `experiments/day4-flight-controller` vào repository `uav-delivery-simulation/experiments/`.
3. Sao chép hai file trong `docs/03-simulation` sang thư mục tương ứng trong repository; nếu file cùng tên đã tồn tại, **mở và hợp nhất**, không ghi đè tài liệu nhóm đã sửa.
4. Sao chép `docs/06-diagrams/06-uav-state-machine.mmd`; tương tự, giữ lại bản cũ để đối chiếu nếu nhóm đã chỉnh sửa.
5. Mở repo bằng VS Code.

## 3. Chạy bằng VS Code Terminal (PowerShell)

Tại thư mục gốc repository:

```powershell
cd experiments/day4-flight-controller
node 01-basic-motion.js
node demo.js
node test.js
```

Nếu không chạy được do chưa nhận lệnh `node`, kiểm tra cài Node.js và mở lại VS Code.

## 4. Kết quả mong đợi

- Basic motion: từng bước x tăng từ 0 đến 120 m, Pause trong 2 giây, sau đó in `ĐÃ ĐẾN ĐIỂM GIAO`.
- Demo: log `START`, `PAUSE`, `RESUME`, `CONFIRM_HANDOVER`, trạng thái `RETURNING`, sau đó `COMPLETED`.
- Test: `PASS` cho 9 trường hợp.

## 5. Khuyến nghị nghiên cứu

- Sơ đồ State Machine: https://mermaid.js.org/syntax/stateDiagram.html
- PX4 modes: https://docs.px4.io/main/en/flight_modes_mc/
- PX4 safety: https://docs.px4.io/main/en/config/safety
- Node.js: https://nodejs.org/en/learn

## 6. Hạn chế

- Không có mô phỏng thời gian thực bằng `setInterval`, không có CesiumJS, không có HTTP/Socket.IO.
- Không có dynamics rotor/ESC, PID hay mô hình GPS/IMU chuẩn.
- Không có lưu database/checkpoint.
- Các giá trị pin/độ cao/tốc độ/tải trọng được giả định; không dùng cho điều khiển thật.
