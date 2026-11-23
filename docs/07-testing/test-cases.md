# TEST CASES — GIAI ĐOẠN 1, NGÀY 9

Các TC dưới đây được đối chiếu với code lab Ngày 4, Ngày 6 và code Cesium Ngày 8. **Tất cả mặc định NOT RUN cho đến khi nhóm ghi kết quả thực tế.**

## A. PostgreSQL và ràng buộc dữ liệu

### TC-DB-01 — Đủ 12 bảng
- **Mục tiêu:** ERD trùng với cơ sở dữ liệu.
- **Tiền điều kiện:** PostgreSQL, `uav_delivery` có schema ngày 6.
- **Bước:** pgAdmin Query Tool của `uav_delivery`, chạy truy vấn số bảng trong phần hướng dẫn.
- **Expected:** Có đúng 12 bảng ứng dụng: users, stations, drone_models, drones, delivery_points, orders, missions, waypoints, telemetry, drone_events, incidents, delivery_confirmations.
- **Loại:** Manual / read-only.

### TC-DB-02 — Seed và quan hệ Drone-Model
- **Tiền điều kiện:** Seed ngày 6 đã thực thi.
- **Bước:** `SELECT d.id,d.battery_pct,d.status,dm.name FROM drones d JOIN drone_models dm ON d.model_id=dm.id ORDER BY d.id;`
- **Expected:** Có 3 UAV seed; ít nhất 1 dòng `uav-01`; không có dòng Drone thiếu Model.
- **Loại:** Manual / read-only.

### TC-DB-03 — CHECK pin âm không hợp lệ
- **Tiền điều kiện:** DB thực hành, `model-q1` và `station-01` tồn tại.
- **Bước:** `BEGIN; SAVEPOINT s; INSERT INTO drones(id,model_id,station_id,battery_pct,status) VALUES ('tc-bad-battery','model-q1','station-01',-1,'AVAILABLE');` → quan sát lỗi, sau đó `ROLLBACK;`.
- **Expected:** PostgreSQL trả lỗi check constraint `23514`, không lưu UAV có pin âm.
- **Loại:** Manual / thử thay đổi nhưng rollback. **Chỉ chạy trên DB test**.

### TC-DB-04 — Không cho hai Mission active cùng UAV
- **Tiền điều kiện:** Đã thiết kế partial unique index `uq_active_mission_drone`; có ít nhất một Mission active cùng UAV.
- **Bước:** Xem định nghĩa index trên pgAdmin; sau đó tạo thử Mission thứ hai cho cùng UAV qua API khi UAV đang RESERVED/BUSY (dùng DB thử nghiệm).
- **Expected:** Không tạo được hai Mission active cùng UAV; API trả 409 khi có xung đột trạng thái/index.
- **Loại:** Manual / Mutates DB nếu tạo Mission đầu tiên.

## B. REST API thực hành

### TC-API-01 — Health
- **Tiền điều kiện:** API và PostgreSQL chạy, URL `http://127.0.0.1:3000`.
- **Bước:** GET `/health`.
- **Expected:** HTTP 200, JSON `{ "ok": true, "database": true }`.
- **Loại:** Auto / read-only.

### TC-API-02 — Danh sách Drone
- **Bước:** GET `/api/drones`.
- **Expected:** HTTP 200; JSON Array; mỗi item có `id,status,battery_pct,max_payload_kg,cruise_speed_mps`.
- **Loại:** Auto / read-only.

### TC-API-03 — Order list
- **Bước:** GET `/api/orders`.
- **Expected:** HTTP 200 và JSON Array.
- **Loại:** Auto / read-only.

### TC-API-04 — Tạo Order weight = -1
- **Bước:** POST `/api/orders` với `{"deliveryPointId":"point-a","weightKg":-1}`.
- **Expected:** HTTP 400, `error.code=INVALID_INPUT`; không thêm Order.
- **Loại:** Auto / safe negative.

### TC-API-05 — Điểm giao không tồn tại
- **Bước:** POST `/api/orders` với `{"deliveryPointId":"point-not-exists","weightKg":0.8}`.
- **Expected:** HTTP 404, `error.code=POINT_NOT_FOUND`.
- **Loại:** Auto / safe negative.

### TC-API-06 — Thiếu thông tin Mission
- **Bước:** POST `/api/missions` với body `{}`.
- **Expected:** HTTP 400, `error.code=INVALID_INPUT`.
- **Loại:** Auto / safe negative.

### TC-API-07 — Không có Order khi lập Mission
- **Bước:** POST `/api/missions` body `{ "orderId":"ord-not-exists", "droneId":"uav-01" }`.
- **Expected:** HTTP 404, `ORDER_NOT_FOUND`.
- **Loại:** Auto / safe negative.

### TC-API-08 — Không có Mission khi xem chi tiết
- **Bước:** GET `/api/missions/mis-not-exists`.
- **Expected:** HTTP 404, `MISSION_NOT_FOUND`.
- **Loại:** Auto / read-only.

### TC-API-09 — Sai expectedVersion
- **Bước:** POST `/api/missions/mis-not-exists/start` với `{ "expectedVersion": -1 }`.
- **Expected:** HTTP 400, `INVALID_VERSION`.
- **Loại:** Auto / safe negative.

### TC-API-10 — Không cho tạo Mission quá tải
- **Tiền điều kiện:** DB test có Order **PENDING** mới với weight 1.8 kg; UAV-01 AVAILABLE, max payload 1.5 kg.
- **Bước:** POST `/api/missions` với ID Order mới và `droneId=uav-01`.
- **Expected:** HTTP 422, `OVERWEIGHT`; Drone không RESERVED và Order vẫn PENDING.
- **Loại:** Manual / creates test Order.

### TC-API-11 — Pin thấp
- **Tiền điều kiện:** DB test có Order PENDING mới weight 0.8 kg; UAV-02 35%, AVAILABLE.
- **Bước:** POST `/api/missions` cho UAV-02.
- **Expected:** HTTP 422, `INSUFFICIENT_BATTERY` (giả định >= 55% cho bài lab).
- **Loại:** Manual / creates test Order; không khẳng định đây là quy tắc năng lượng thực.

### TC-API-12 — Luồng Mission và version
- **Tiền điều kiện:** **Chỉ DB test riêng**. UAV-01 AVAILABLE, Order PENDING; nên dùng Order mới.
- **Bước:** Create Order (201) → Create Mission (201, READY v0) → Start (IN_PROGRESS v1) → Pause (PAUSED v2) → Resume (IN_PROGRESS v3) → Return Home (RETURNING v4) → Complete (COMPLETED v5). Thử gửi lại `expectedVersion=0` sau Start.
- **Expected:** Từng lần đúng HTTP; Version tăng 1; gửi version cũ trả 409 `VERSION_CONFLICT`; `uav-01` trở lại AVAILABLE sau Complete.
- **Loại:** Manual/script PowerShell / **MUTATES DB**. API demo chỉ đổi trạng thái DB, không điều khiển Cesium; Order không tự chuyển DELIVERED.

## C. Realtime Socket.IO

### TC-RT-01 — server:hello
- **Tiền điều kiện:** API đã chạy, `npm install` trong `experiments/database-api`.
- **Bước:** `node tests/socket-smoke.js`.
- **Expected:** Client nhận `server:hello`, `demoOnly: true`; kết thúc code 0.
- **Loại:** Auto / read-only.

### TC-RT-02 — mission:updated
- **Tiền điều kiện:** Một Socket.IO listener đang kết nối; DB test và tạo Mission mới.
- **Bước:** Terminal A `npm run listen`; Terminal B dùng `mission-flow.ps1` hoặc POST `/api/missions`.
- **Expected:** Listener log `mission:updated` với `id`, `status`, `version` đúng.
- **Loại:** Manual / MUTATES DB.

### TC-RT-03 — drone:telemetry
- **Bước:** `node tests/socket-smoke.js --emit-test`.
- **Expected:** API trả HTTP 201 và listener nhận `drone:telemetry` với `drone_id=uav-01`, `demoOnly:true`.
- **Loại:** Auto / **MUTATES DB**: thêm 1 telemetry record mẫu.

## D. Virtual Flight Controller độc lập — nguồn `test.js` Ngày 4

### TC-FC-01 — Chuyến bay bình thường, Order khác Mission
- **Bước:** `node test.js` tại `experiments/flight-controller` (test số 1).
- **Expected:** Order DELIVERED sau CONFIRM_HANDOVER, Mission vẫn RETURNING, cuối cùng COMPLETED và Drone AVAILABLE.

### TC-FC-02 — RESUME khi chưa PAUSE
- **Bước:** Test số 2.
- **Expected:** Lệnh RESUME trả `ok: false`.

### TC-FC-03 — Quá tải 1.8 kg
- **Bước:** Test số 3.
- **Expected:** FAILED trước khi cất cánh, độ cao 0.

### TC-FC-04 — Thiếu pin khi khởi hành
- **Bước:** Test số 4 với battery 35.
- **Expected:** FAILED sau pre-flight check.

### TC-FC-05 — Pause dừng vị trí nhưng pin vẫn giảm
- **Bước:** Test số 5.
- **Expected:** Position không đổi, battery giảm, Resume về EN_ROUTE.

### TC-FC-06 — Quá hạn 60 giây chờ bàn giao
- **Bước:** Test số 6.
- **Expected:** Order DELIVERY_FAILED, Mission RETURNING rồi COMPLETED.

### TC-FC-07 — Pin nguy cấp, đủ quay về trạm
- **Bước:** Test số 7.
- **Expected:** RETURNING, Order DELIVERY_FAILED.

### TC-FC-08 — Pin không đủ quay về, hạ cánh khẩn cấp
- **Bước:** Test số 8.
- **Expected:** EMERGENCY_LANDING, tiếp theo FAILED, Drone MAINTENANCE.

### TC-FC-09 — Client đóng không làm dừng engine độc lập
- **Bước:** Test số 9.
- **Expected:** Engine tick tiếp tục, vị trí tăng. **Chỉ đúng với class VFC độc lập**, chưa chứng minh backend production tồn tại sau khi đóng browser.

## E. CesiumJS Sandcastle — kế thừa Ngày 8

### TC-3D-01 — Scene và các đối tượng
- **Bước:** Dán `main.js` + `sandcastle.html` vào Sandcastle và nhấn Run.
- **Expected:** Hiện Cesium Viewer, STATION-01, POINT-A, WP-01…03, UAV-01…03.

### TC-3D-02 — Tuyến bay, vị trí, camera
- **Bước:** Start, quan sát tuyến và nhấn Focus UAV / Overview.
- **Expected:** UAV-01 đi theo polyline và camera chuyển đổi đúng.

### TC-3D-03 — Pause/Resume
- **Bước:** Khi đang EN_ROUTE, Pause, quan sát vị trí; rồi Resume.
- **Expected:** UAV ngừng đổi vị trí khi Pause và tiếp tục sau Resume.

### TC-3D-04 — Reset
- **Bước:** Nhấn Reset lúc đang bay.
- **Expected:** State IDLE, UAV về trạm, progress 0%.

### TC-3D-05 — Điểm giao
- **Bước:** Cho đến khi tuyến demo kết thúc.
- **Expected:** UAV sang WAITING_FOR_HANDOVER, không tự coi Mission COMPLETED.

### TC-3D-06 — Reload Browser
- **Bước:** Reload tab Sandcastle.
- **Expected:** Scene dựng lại từ đầu và trạng thái IDLE; **đóng browser làm dừng engine demo là giới hạn đã biết**, không phải PASS của BR-10 trong MVP.

## F. UI/UX và yêu cầu nghiệp vụ

### TC-UI-01 — Prototype Desktop
- **Bước:** Mở Figma Desktop Flow, thử Login → Dashboard → Orders → Mission Planner → Simulation.
- **Expected:** Các nút chính chuyển đúng Frame; kiểm tra thủ công vì Figma chưa nghiệm thu.

### TC-UI-02 — Prototype Mobile
- **Bước:** Mở Mobile Flow, thử tương tự Desktop.
- **Expected:** Các chức năng chính có đường điều hướng; **nếu link chưa nối, ghi NOT IMPLEMENTED**, không báo PASS.

### TC-UI-03 — Kiểm soát trạng thái và lỗi
- **Bước:** Xem thiết kế lỗi pin yếu / drone busy / paused.
- **Expected:** Có thông báo dễ hiểu; nút không hợp lệ ở trạng thái disabled và backend vẫn kiểm tra bảo vệ.

### TC-UI-04 — Phân biệt trạng thái
- **Bước:** Kiểm tra Order DELIVERED nhưng Mission RETURNING trong thiết kế/SRS và test VFC.
- **Expected:** Giao diện/tài liệu không hiển thị Mission COMPLETED chỉ vì Order DELIVERED.

## G. Trạng thái mặc định

Mặc định mọi test là **NOT RUN**. Hãy ghi kết quả chạy thật vào `test-results.md`; khi kiểm thử phần chưa triển khai, ghi `NOT IMPLEMENTED` và lý do rõ ràng.
