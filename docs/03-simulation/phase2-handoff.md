# Handoff — UAV Delivery Simulation, Giai đoạn 2

## Phạm vi
UAV-01: Simulation Core có thẩm quyền trong RAM Backend, Web render snapshot, ESP32 Wokwi đồng bộ qua MQTT v2/TLS. UAV-02 local core; UAV-03 offline. Mission mô phỏng không phải Mission PostgreSQL. ACK servo không phải xác nhận giao hàng. PWM LED chỉ là proxy, không có lực đẩy/servo feedback thật. Mất thiết bị khi đang thực hiện chuyến bay đồng bộ làm tiến trình đóng băng/FAULT; SAFE_STOP chỉ là hành vi nguyên mẫu. Không có auth production, không có persistence chuyến bay qua restart Backend. Không triển khai Internet công khai.

## Cài đặt từ clone sạch
1. Cài Git, Node.js 24 (như môi trường thực hành), PostgreSQL, Chrome; kiểm tra `node -v`, `npm -v`, `git --version`. Dùng commit đã nghiệm thu, ghi hash. Clone vào thư mục khác để không làm hỏng repo chính.
2. Tạo database thử nghiệm riêng theo `docs/04-database-api/database-design-reference.md` và `.env.example`. Chỉ chạy `schema.sql`/`seed.sql` lên database mới; xem nội dung SQL trước khi chạy. Không ghi đè DB đang sử dụng.
3. Tạo `experiments/database-api/.env` và `experiments/mqtt-spike/.env` từ `.env.example`, điền credential hợp lệ cục bộ. Không ghi log nội dung, không commit. Broker TLS 8883, namespace đồng nhất; dùng deployment/namespace riêng nếu chạy hai bản cùng lúc.
4. `npm ci` tại `packages/simulation-core`, `experiments/database-api`, `apps/client` nếu có lockfile đồng bộ. Nếu chưa có lockfile, `npm install`, review và commit lockfile trước nghiệm thu tái lập. Không dùng `npm audit fix --force` tự động.
5. Trong `packages/simulation-core`: `npm run build`, `npm test`, `npm run demo`.
6. Trong `experiments/database-api`: `node --test tests/device-state.test.cjs tests/flight-sync.test.cjs`; sau đó `npm start`. PostgreSQL phải hoạt động. GET `/health`, `/api/drones`, `/api/devices/uav-01/flight` trên http://127.0.0.1:3000.
7. Trong `apps/client`: `npm run build`, `npm run dev`; mở URL http://127.0.0.1:5173. Không chạy cùng cổng với repo cũ.
8. Wokwi: dùng `experiments/embedded-wokwi/synchronized-uav/{sketch.ino,diagram.json,libraries.txt}`; tạo `mqtt_config.h` từ mẫu và cấu hình hợp lệ riêng tư. Dxx trong sơ đồ, GPIO số trong code. Chỉ một ESP32 cho namespace/deviceId này. Chờ ONLINE và schemaVersion 2, IMU READY, seq tăng.
9. Tại Backend (terminal khác): `node --test tests/api-smoke.test.js` (12 test, negative POST và GET); `node tests/socket-smoke.js` (không thêm --emit-test); `powershell -NoProfile -ExecutionPolicy Bypass -File .\tests\mission-flow.ps1` (chỉ script tin cậy; tạo dữ liệu thử nghiệm trong DB). Kiểm tra uav-01 AVAILABLE trước khi chạy. Không ép status trực tiếp trong SQL.
10. Từ root: `node .\experiments\architecture\phase2-audit.mjs --live`. Kiểm tra thủ công bằng checklist báo cáo. Ghi phiên bản thực tế, không ghi secret.

## Demo
Pin Wokwi 90–100%, IDLE, LOCKED, ONLINE, IMU READY. Web chọn UAV-01, START → PAUSE → RESUME → WAITING_FOR_HANDOVER; đổi 1× trước bàn giao. UNLOCK, thử chặn bàn giao khi mở, LOCK và chờ xác nhận, ĐÃ BÀN GIAO, RETURNING → COMPLETED và ESP32 IDLE/PWM 0. Sau đó thử pin thấp và mất Wokwi trong chuyến mới, khôi phục và RESET. Không nhập lệnh Serial điều khiển. Có thể quay thành hai video: chuyến đi-về và realtime/sự cố. Không để lộ mqtt_config.h/.env.

## Review hai lượt
A. Kiến trúc/code: kiểm tra state machine, ACK/telemetry, bootId, timeout, heartbeat, quyền mở khóa, TLS, giới hạn RAM/DB, ranh giới local/server, GPIO, source + lockfile, secrets và CORS (không phải auth).
B. Người dùng mới: clone sạch, cấu hình riêng, cài dependency, build, chạy theo đúng README, kiểm tra 3 thành phần và test. Ghi lại các bước thiếu. Nếu chưa có clone sạch, ghi BLOCKED chứ không PASS.

## Hướng tiếp theo
Giai đoạn 3: hoàn thiện nghiệp vụ, liên kết Mission/Order/Drone thực trong PostgreSQL với engine, persistence, xác thực/phân quyền, quản lý command audit; ứng dụng Web/Mobile/Desktop dùng chung Backend, nâng cấp UI và QA. Không tuyên bố đã hoàn thành Android/Windows hay UAV vật lý.
