# Giai đoạn 2 – Ngày 3: React + CesiumJS + Simulation Core

## Mục tiêu

- React/CesiumJS hiển thị vị trí **động** của UAV-01/UAV-02 từ `SimulationEngine.snapshot()`.
- Điều khiển Start/Pause/Resume/Return Home/Confirm Handover/Reset.
- Hiển thị Flight State, Mission Status, Order Status riêng biệt; pin, tốc độ, quãng đường, GPS, thời gian mô phỏng.
- Camera Focus/Follow/Overview và bộ chọn tốc độ x1/x4/x8.
- UAV-03 hiển thị OFFLINE để kiểm tra trạng thái từ chối START. UAV được thể hiện bằng thân, bốn tay và bốn rotor 3D mang tính minh họa.
- Không sửa lõi Simulation Core; không kết nối Backend, MQTT hay PostgreSQL ở Ngày 3.

## Điều kiện đầu vào

- Ngày 1: `apps/client`, `npm run dev`, `npm run build` đã PASS.
- Ngày 2: `packages/simulation-core`, 22/22 test, demo và typecheck đã PASS.
- Repository có các file do hai ngày trước tạo đúng cấu trúc.

## Bước 1 – Backup và cài mã Ngày 3

1. Giải nén ZIP Ngày 3 ở nơi bất kỳ (ví dụ `Downloads`).
2. **Nếu bạn đã tự chỉnh `App.tsx` hay `CesiumMap.tsx`, xem diff trước**; script cài sẽ sao lưu và thay thế những file chỉ định.
3. Mở Terminal PowerShell **trong thư mục đã giải nén**, chạy:

```powershell
powershell -ExecutionPolicy Bypass -File .\install-day3.ps1 -RepoRoot "D:\bai tap nhung\uav-delivery-simulation-main\uav-delivery-simulation-main"
```

4. Script tạo thư mục backup cạnh repository, không làm gì với `experiments/database-api`, Wokwi hay `packages/simulation-core`.
5. Không cần cài lại Cesium nếu Ngày 1 đã `npm install` thành công.

## Bước 2 – Build

```powershell
cd "D:\bai tap nhung\uav-delivery-simulation-main\uav-delivery-simulation-main\apps\client"
npm run build
```

Expected: `tsc -b && vite build` không có lỗi và tạo `dist`.
Nếu lỗi `Cannot find module '@uav/simulation-core'`, xác nhận file `../../packages/simulation-core/src/index.ts` tồn tại từ `apps/client` và đã copy cả `tsconfig.json`, `vite.config.ts` mới.

## Bước 3 – Chạy giao diện

```powershell
npm run dev
```

Mở `http://127.0.0.1:5173/`; nếu `Port 5173 is already in use`, kiểm tra tab đang chạy từ Ngày 1 rồi dùng server có sẵn hoặc dừng server cũ bằng Ctrl+C.

## Bước 4 – Điều khiển nhiệm vụ

1. Chọn UAV-01 → START.
2. Sau TAKEOFF, khi EN_ROUTE, quan sát GPS/Distance/Time cập nhật và marker trên map di chuyển.
3. PAUSE khi EN_ROUTE: GPS đứng yên, pin vẫn tiêu hao.
4. RESUME → bay tiếp.
5. Khi WAITING_FOR_HANDOVER, **bấm ĐÃ BÀN GIAO trong 60 giây mô phỏng**; ở x4 chỉ có khoảng 15 giây thực, ở x8 khoảng 7,5 giây thực. Có thể đổi x1 trước khi tới nơi để thao tác dễ hơn.
6. Sau xác nhận, Order DELIVERED nhưng Flight RETURNING; chờ UAV về trạm mới COMPLETED.
7. RESET khởi tạo lại phiên chạy cục bộ.
8. UAV-02 có thể START riêng; UAV-03 OFFLINE, không START được.
9. Bấm Theo dõi UAV để camera đi theo; Tổng quan để thoát theo dõi và nhìn cả tuyến.

## Bước 5 – Kiểm tra tình huống biên

- Chọn UAV-02 và START khi UAV-01 đang bay: có hai trạng thái độc lập.
- Chọn UAV-03: START bị vô hiệu vì OFFLINE.
- Khi WAITING_FOR_HANDOVER, thử `GIAO THẤT BẠI`: Order DELIVERY_FAILED nhưng UAV vẫn RETURNING và sau đó Mission COMPLETED nếu về trạm an toàn.
- Trong EN_ROUTE bấm RETURN HOME: không tự đánh dấu DELIVERED.
- Khi PAUSED: pin tiếp tục giảm, tọa độ đứng yên.

## Bước 6 – Kiểm tra regression Ngày 2

```powershell
cd "D:\bai tap nhung\uav-delivery-simulation-main\uav-delivery-simulation-main\packages\simulation-core"
npm test
npm run demo
```

Kết quả mong đợi: 22/22 unit test PASS và demo đi-về bình thường.

## Bước 7 – Lưu minh chứng và commit

- Chụp ảnh `EN_ROUTE`, `PAUSED`, `WAITING_FOR_HANDOVER`, `RETURNING`, `COMPLETED`.
- Điền file `docs/03-simulation/phase2-day3-test-results.md`.
- Kiểm tra `git status` và **không commit** `.env` hay `mqtt_config.h` có mật khẩu.
- Commit: `feat(p2): connect simulation core to Cesium 3D controls`.

## Kiến trúc kỹ thuật

`React Controls → SimulationEngine.command()`; một interval phía Client gọi `engine.tick(dt)`; `snapshot()` cập nhật React state; `Cesium.CallbackPositionProperty` đọc snapshot mới nhất và render Entity. Map không khởi tạo lại mỗi lần cập nhật telemetry. Renderer chỉ đọc dữ liệu, không quyết định State Machine.

Vite alias `@uav/simulation-core` trỏ tới `packages/simulation-core/src/index.ts` để chỉ có một bản source Core. `vite.config.ts` cho phép đọc source nằm ngoài `apps/client`.

**Giới hạn:** chưa triển khai mô phỏng ở server. Không nên dùng bản demo này để vận hành UAV vật lý.
