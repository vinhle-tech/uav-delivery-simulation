# Giai đoạn 3 — Backend baseline

## Ngày 1

- Backend chính: `apps/server`, Node.js/Express, PostgreSQL, Socket.IO, MQTT v2. Cổng 3000, bind loopback. `experiments/database-api` được giữ nguyên làm mốc GĐ2, không chạy hai server cùng lúc trên cùng namespace MQTT.
- Routes -> Controller -> Service -> Repository -> PostgreSQL. `mqtt-bridge`, `device-state`, `flight-sync` vẫn tại `src/` để giữ nguyên import và unit test. Không refactor thuật toán Flight Sync trong ngày này.
- `database/migrations/001_baseline.sql` và `database/seeds/001_demo.sql` lấy từ baseline GĐ1. `schema_migrations` lưu checksum, có transaction và advisory lock. Chỉ dùng DB mới `uav_delivery_phase3_test`; không áp dụng lên DB cũ. 12 bảng nghiệp vụ + 1 ledger.
- CORS local chỉ là kiểm soát origin, không thay thế authentication. API legacy `/api/demo/telemetry` và `/api/missions/:id/complete` vẫn phục vụ regression. Giai đoạn 3 ngày 2 bổ sung auth; ngày 3 tích hợp Mission/Order/Drone thực với engine. Seed user có hash giả, chưa đăng nhập được. Không mở Internet/LAN.
- `MQTT_ENABLED=false` mặc định. Khi bật, đọc lại `.env` tại `experiments/mqtt-spike` (không copy secret). Simulation Core vẫn ở `packages/simulation-core/dist/src/index.js`.
- PostgreSQL demo mission vẫn độc lập với flight demo RAM; order ASSIGNED sau mission-flow là hành vi legacy, không phải delivery confirmation. Không sửa DB bằng tay để ép PASS.

## Nhật ký nghiệm thu (điền kết quả thực tế)

| Hạng mục                         | Kết quả | Minh chứng |
| -------------------------------- | ------- | ---------- |
| Git baseline + installer dry run | NOT RUN |            |
| Installer apply                  | NOT RUN |            |
| Migration first run + rerun      | NOT RUN |            |
| DB constraints                   | NOT RUN |            |
| Core 22 test                     | NOT RUN |            |
| Device + flight 22 test          | NOT RUN |            |
| API smoke 12 test                | NOT RUN |            |
| Socket smoke                     | NOT RUN |            |
| Mission flow legacy              | NOT RUN |            |
| Web build                        | NOT RUN |            |
| MQTT online v2                   | NOT RUN |            |
| Flight demo + SAFE_STOP          | NOT RUN |            |
| No secret in Git + commit        | NOT RUN |            |
