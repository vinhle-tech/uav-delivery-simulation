# GIAI ĐOẠN 2 — NGÀY 2: THỰC HÀNH SIMULATION CORE

**Phạm vi:** Simulation Core độc lập CesiumJS/React/EMQX; mục tiêu chạy thử bằng Terminal và Unit Test.

## Bước 1 — Xác nhận đã ở thư mục gốc

```powershell
cd "D:\bai tap nhung\uav-delivery-simulation-main\uav-delivery-simulation-main"
Get-Location
git status
Test-Path .\packages\simulation-core\package.json
```

`False` nghĩa module chưa tồn tại. Nếu `True`, phải xem file trước khi chép đè.

## Bước 2 — Giải nén và chép source

- Giải nén `UAV_GiaiDoan2_Ngay2_SimulationCore.zip`.
- Chép nguyên thư mục `packages/simulation-core` vào `packages` ở repository.
- Chép các file `docs/03-simulation/phase2-day2-*.md` vào thư mục tài liệu tương ứng.
- Không ghi đè `apps/client` và không đổi `experiments/database-api`, `flight-controller`, `mqtt-spike`, `embedded-wokwi`.

## Bước 3 — Cài dependencies

```powershell
cd .\packages\simulation-core
npm install
```

Chỉ cần TypeScript và @types/node. Kết nối Internet khi cài gói lần đầu. Không cần `npm install` lại trong `apps/client`.

## Bước 4 — Hiểu thuật toán

- `types.ts`: tách biệt trạng thái đơn hàng, nhiệm vụ, UAV và giai đoạn bay.
- `navigation.ts`: Haversine dựa trên GPS WGS84; `moveToward` dịch chuyển không quá `speedMps * dt`.
- `params.ts`: tham số vận tốc ngang 6 m/s, leo cao 3 m/s, pin dự phòng 30%, tải tối đa 1.5 kg.
- `battery.ts`: ước tính pin dựa trên quãng đường đi và về, thời gian leo/hạ cánh, cộng dự phòng.
- `engine.ts`: `command('START')` để bắt đầu; `tick(0.1)` để tiến 0.1 giây mô phỏng; `snapshot()` để lấy trạng thái. 

Không có vòng lặp `setInterval` trong Core; ở Ngày 3 giao diện sẽ cung cấp đồng hồ. Tách `tick` khỏi thời gian thực giúp test nhanh không phải chờ vài phút.

## Bước 5 — Chạy Unit Test

```powershell
npm test
```

Bạn cần thấy `# tests 22`, `# pass 22`, `# fail 0`. Nếu `Cannot find module typescript`, chạy lại `npm install`. Nếu `tsc` lỗi, chụp thông báo đầy đủ.

## Bước 6 — Chạy nhiệm vụ hoàn chỉnh

```powershell
npm run demo
```

Kết quả cần có lần lượt `TAKEOFF`, `EN_ROUTE`, `LANDING`, `WAITING_FOR_HANDOVER`, `RETURNING`, `COMPLETED`. `FINAL SNAPSHOT` phải có `flightState=COMPLETED`, `missionStatus=COMPLETED`, `orderStatus=DELIVERED`, `droneStatus=AVAILABLE`.

Lưu ý: số giây, phần trăm pin có thể thay đổi khi bạn thay tham số. Không coi giá trị minh họa là đặc tính drone thật.

## Bước 7 — Làm bài thực hành biến đổi dữ liệu

**Bài A – Quá tải:** Trong `src/demo-data.ts`, đổi `payloadKg: 0.8` thành `payloadKg: 1.8`; chạy `npm run demo`. Expected: `START: {ok: false, reason: ...}`, flightState vẫn IDLE. Sau đó trả về `0.8`.

**Bài B – Pin thấp:** Đổi `batteryPct: 90` thành `batteryPct: 35`, chạy `npm run demo`; expected: từ chối START vì không đủ pin đi-về và dự phòng. Khôi phục `90`.

**Bài C – Sai Waypoint:** Đổi `waypoints` thành `[]`, chạy `npm run demo`; expected: từ chối START vì thiếu waypoint. Khôi phục nguyên danh sách 3 waypoint.

**Bài D – Giao hàng thất bại:** Trong `scripts/demo.ts`, đổi `success: true` thành `success: false`; chạy `npm run demo`. Expected: `orderStatus=DELIVERY_FAILED`, `missionStatus=COMPLETED` khi đã về trạm. Khôi phục `true`.

**Bài E – Pause/Resume:** Đọc code test `TC-13` trong `tests/engine.test.ts`, giải thích vì sao `position` không đổi, `batteryPct` vẫn giảm, và sau Resume `distanceTravelledM` tiếp tục tăng.

Sau khi khôi phục mọi dữ liệu:

```powershell
npm test
npm run build
```

## Bước 8 — Ghi kết quả kiểm thử

Mở `docs/03-simulation/phase2-day2-test-results.md`, ghi Actual / PASS-FAIL / ngày kiểm thử của máy bạn. Ảnh cần lưu:

- `test-22-pass.png`: Terminal `npm test`.
- `mission-completed.png`: Terminal demo có `FINAL SNAPSHOT`.
- `reject-overweight.png`: Kết quả thử tải 1.8 kg.
- `reject-low-battery.png`: Kết quả pin thấp.

## Bước 9 — Commit

Tại thư mục gốc, kiểm tra:

```powershell
cd ..\..
git status
git diff --stat
```

Lưu ý: file mới untracked không hiện trong `git diff --stat`, vẫn phải xem `git status`.

GitHub Desktop: Commit Summary `feat(p2): implement isolated UAV simulation core and tests` rồi Push.

## Nghiệm thu

- TypeScript build PASS.
- 22 tests PASS trên máy bạn.
- Demo có cất cánh → đi qua waypoint → bàn giao → quay về.
- Order/Mission/FlightState độc lập; không bị nhầm DELIVERY_FAILED với FAILED Mission.
- Từ chối tải >1.5 kg, pin thiếu, waypoint sai và lệnh không hợp lệ.
- Các thay đổi thử nghiệm đã khôi phục, Git sạch secret.

## Lưu ý của mô hình

- Hình học tuyến ngắn với Haversine + nội suy tuyến tính kinh/vĩ độ, không dùng để dẫn đường thật.
- Không mô phỏng gió, lực đẩy, cảm biến vật lý, địa hình/vùng cấm, tránh vật cản hay failsafe thật.
- Không tích hợp Wokwi MQTT hôm nay; việc Wokwi đã PASS là độc lập.
- Simulation Core local của Ngày 2 sẽ được dùng ở Ngày 3. Việc chuyển sang nguồn trạng thái server authoritative còn trong lộ trình sau.
