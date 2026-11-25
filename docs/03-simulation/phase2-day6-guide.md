# Thực hành Ngày 6

## Kiến trúc
UAV-01: Simulation Engine chạy ở Backend, Web đọc snapshot qua HTTP polling (~300 ms sau mỗi request); Device Panel vẫn sử dụng Socket.IO. UAV-02 cục bộ; UAV-03 offline. Mission demo không ghi PostgreSQL. MQTT command/ack/telemetry v2 có bootId, deviceMode, imuReady. Heartbeat mỗi 2 giây thực khi Broker sẵn sàng và không FAULT; firmware watchdog 20 giây mô phỏng, PWM tắt khi mất kết nối được phát hiện hoặc pin <=30%. Không phải điều khiển bay thật. Mất kết nối làm đóng băng tiến trình, không tự resume; RESET explicit chỉ khi kết nối phục hồi, không phải tiếp tục mission đang bay. Handover timer tạm ngừng trong khi khóa mở/chờ ACK, không tự quay về với khoang mở. ADC pin được dùng để giới hạn pin ban đầu và interlock thấp; không đồng nhất liên tục với pin Core. MPU6050 lỗi lúc khởi tạo bị chặn Start. Dữ liệu và chống trùng trong RAM, không auth sản xuất, không chạy nhiều Backend trên cùng namespace.

## Cài đặt
1. Dừng Backend, Vite, Wokwi. Commit/check diff Ngày 5. Giải nén ZIP và chạy script kiểm tra trước khi --apply (xem README).
2. Trong `packages/simulation-core`: `npm run build` rồi `npm test`.
3. Trong `experiments/database-api`: `node --test tests/device-state.test.cjs tests/flight-sync.test.cjs`. 22 test (10 cũ +12 mới), dự kiến pass 22/fail 0. `npm start`.
4. Trong `apps/client`: `npm run build`, `npm run dev`. Dùng đúng port 5173.
5. Sao lưu project Wokwi Ngày 4 rồi chỉ thay `sketch.ino` từ `experiments/embedded-wokwi/synchronized-uav`. Giữ diagram đã sửa chân Dxx, libraries.txt và mqtt_config.h. Dừng project cũ, chỉ chạy một ESP32 uav-01. Nếu cần, kiểm tra broker ACL cho topic heartbeat. Không chia sẻ secret.
6. Backend log `[FLIGHT SYNC] UAV-01 server core ready` và `[MQTT BRIDGE] CONNECTED + SUBSCRIBED`. Wokwi log `MPU6050 READY` và `MQTT CONNECTED; COMMAND SUBSCRIBED`. API `http://127.0.0.1:3000/api/devices/uav-01` có `schemaVersion:2`, `bootId`, `deviceMode`, `imuReady:true`; `/api/devices/uav-01/flight` có flight, syncStatus. Đợi heartbeat đến thiết bị trước START. Pin nên 80–100%.

## Chuyến bay
- Chọn UAV-01, Start; SYNCING rồi SYNCED, PWM dương, cất cánh; thử Pause/Resume (PWM giữ vị trí 110, không phải tốc độ rotor thật).
- UNLOCK trước khi hạ cánh: backend HTTP 409, không phát lệnh; đúng PASS.
- Bay tới WAITING_FOR_HANDOVER, đợi SYNCED và PWM=0. Dùng 1x để dễ thao tác. UNLOCK từ Device Panel, đợi ACK và telemetry UNLOCKED, sau đó LOCK, đợi ACK và telemetry LOCKED + SYNCED. Nhấn ĐÃ BÀN GIAO. Chỉ khi UAV về trạm và SYNCED thì PASS. Nếu xác nhận thất bại trong khi khóa đóng, Order DELIVERY_FAILED nhưng Mission có thể COMPLETED. Không nhấn RESET khi đang bay.
- Thử pin thấp: ở IDLE giảm ADC xuống 20%, START bị từ chối. Sau đó tăng ADC 90%, start; khi đang EN_ROUTE giảm <=30%, FAULT, SAFE_STOP (LED proxy). Không phải hạ cánh vật lý.
- Thử dừng Wokwi khi đang bay. Sau ~8s không telemetry, FAULT, map đóng băng. Bật lại; bootId mới, không tự resume. Đợi SAFE_STOP đồng bộ xong, đưa ADC >30%, RESET để ESP32 về IDLE và Core về IDLE; START chuyến mới. Nếu Wokwi Wi-Fi trục trặc, stop/start hoặc tải lại trang.
- F5 Web khi đang bay: Backend giữ vị trí/mission; không bắt đầu chuyến mới. UAV-02 vẫn local và không đổi ESP32.
- Kiểm tra API Mission cũ và `mission-flow.ps1` (đã sửa bộ lọc ở Ngày 5), Core 22/22, Device State 10/10, Flight Sync 12/12.

## Lỗi
- Không thấy server core ready: build `packages/simulation-core` trước; kiểm tra dist/src/index.js.
- ONLINE nhưng v1: đang chạy firmware cũ; chỉ dùng một project.
- MOTION_INTERLOCK: đợi heartbeat, kiểm tra ACL heartbeat, pin, IMU, servo và mode. FAULT -> RESET khi online.
- TIMEOUT: không tự retry; kiểm tra Wokwi và trạng thái thiết bị, reset khi phục hồi.
- Không có SYNC: kiểm tra App.tsx, useSyncedFlight.ts và restart Vite; endpoint /flight cần trả JSON. Không sửa server.js lần nữa nếu đã có attachMqttBridge.

## Lưu kết quả
Điền file kết quả, lưu ảnh cả Web và Wokwi. Kiểm tra `git status`, `git diff`, không commit .env, mqtt_config.h, node_modules, .local-backups. Commit `feat(p2): synchronize backend flight core with ESP32 proxy`.
