# Giai đoạn 2 — MQTT Bridge & Device Panel

- Backend hiện hữu: experiments/database-api, PostgreSQL phải chạy. PORT=3000, Vite=5173, localhost only.
- Bridge đọc đúng experiments/mqtt-spike/.env (không chép secret sang UI). Dùng TLS kiểm chứng chứng chỉ, reconnect 5s; subscribe telemetry và ack. Topic namespace cũ, device uav-01 duy nhất.
- Cài `npm install mqtt@^5` ở database-api; `npm install socket.io-client@^4.8` ở apps/client.
- `node --test tests/device-state.test.cjs` trong database-api. `npm start` trong database-api. `npm run build` và `npm run dev` trong client.
- API GET /api/devices/uav-01 trả snapshot. POST /api/devices/uav-01/commands nhận đúng {commandId,value}; value LOCK hoặc UNLOCK. 202 là nhận yêu cầu, không phải ACK. 200 cùng commandId/value là replay kết quả, không publish lại. 409 xung đột ID hoặc đang chờ. 503 offline. Một lệnh đang chờ tại một thời điểm. Socket.IO device:telemetry, device:status, device:ack đều mang snapshot đầy đủ với revision; khi kết nối mới nhận snapshot.
- Stale: không có telemetry hợp lệ trong 8 giây. Offline khi broker disconnect/chưa có bản tin. Timeout 15s, ACK đến trễ bỏ qua. UNKNOWN khi mất broker hoặc publish lỗi; không tự gửi lại. Timeout không chứng minh servo chưa thực hiện; kiểm tra telemetry và Wokwi.
- V1 không có bootId hay thời điểm phát tuyệt đối. Chỉ bỏ retained, lọc seq/uptime, dùng thời điểm nhận và heuristic reboot sau stale. Không bảo đảm phát hiện mọi replay hoặc restart. Dedupe command lưu trong RAM tối đa 2000 ID mỗi phiên Backend; không bền qua restart. Firmware kiểm tra trạng thái local, không phải server-authoritative. ACK không xác nhận giao hàng. MQTT QoS 0, không retry command tự động.
- Ngày 5 thử HOME, UNLOCK NACK; START, ARRIVED, UNLOCK ACK; LOCK ACK; HOME. Không chạy hai firmware cùng deviceId. Ngày 6 nối điều kiện UI demo với flight state; chưa có xác thực người dùng, không deploy.
