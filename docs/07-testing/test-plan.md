# TEST PLAN — UAV Delivery Simulation System

- **Dự án:** Thiết kế và phát triển hệ thống điều phối, giám sát và mô phỏng UAV giao hàng chặng cuối đa nền tảng.
- **Phase:** Giai đoạn 1 — Ngày 9.
- **Phiên bản tài liệu:** 1.0 / DRAFT.
- **Ngày lập:** 2026-11-23.
- **Người phụ trách:** Nhóm 3 thành viên.
- **Mục tiêu:** xác thực các thử nghiệm riêng lẻ + tạo nền tảng kiểm thử cho MVP, không giả định toàn hệ thống đã tích hợp.

## 1. Phạm vi

| Thành phần | Có thể test hiện tại | Chưa được coi là hoàn thành |
|---|---|---|
| PostgreSQL | Tồn tại 12 bảng, FK/CHECK/unique, seed | Tối ưu hiệu năng production, migration chính thức |
| Express REST | `/health`, `/api/drones`, `/api/orders`, `/api/missions`, trạng thái Mission demo | Authentication/JWT, geofence, xác nhận giao hàng API |
| Socket.IO | `server:hello`, `mission:updated`, `drone:telemetry` mẫu | Rooms, ACK, reconnect snapshot, production streaming |
| Virtual Flight Controller ngày 4 | 9 test script có sẵn | Chạy độc lập trên Backend tích hợp đầy đủ |
| CesiumJS ngày 8 | 3D scene, waypoints, Start/Pause/Resume/Reset | Điều khiển UAV trên server, địa hình/safety thật |
| Figma/UI | Kiểm tra tính nhất quán thiết kế/Prototype | React Web/Capacitor/Electron ứng dụng chạy thực |

## 2. Kiểu kiểm thử

1. **Unit tests:** Virtual Flight Controller độc lập, Node assert.
2. **API smoke/negative tests:** đọc dữ liệu và kiểm tra phản hồi 400/404; script tự động không làm đổi DB.
3. **Database integrity:** truy vấn schema, CHECK, FK và index unique; dùng transaction + ROLLBACK khi thử dữ liệu lỗi.
4. **Integration demo:** tạo Order -> Mission -> đổi trạng thái ở backend lab; chỉ trên DB thử nghiệm.
5. **Realtime tests:** kết nối Socket.IO, `server:hello`, event telemetry và mission.
6. **UI/3D manual tests:** hình ảnh, đường bay, hành vi nút, trạng thái mô phỏng.
7. **Review:** mapping FR, BR -> TC; đánh dấu những mục chờ giai đoạn 2–7.

## 3. Môi trường thực hiện

- Windows 10/11, VS Code, Terminal PowerShell.
- Node.js >= 18 (khuyến nghị 20+), npm.
- PostgreSQL và pgAdmin 4, DB tên `uav_delivery`, schema + seed ngày 6.
- Chrome hoặc Edge, Cesium Sandcastle.
- API lab: `http://127.0.0.1:3000`. Chỉ mở trên localhost; chưa có Authentication.
- Repo với `experiments/flight-controller/`, `experiments/database-api/`, `experiments/cesium-sandcastle/`.

## 4. Dữ liệu kiểm thử

| ID | Dữ liệu | Lý do |
|---|---|---|
| UAV-01 | `uav-01`, 90%, AVAILABLE (sau seed) | Mission hợp lệ trên DB thử nghiệm |
| UAV-02 | `uav-02`, 35%, AVAILABLE | Bài lab kiểm tra `INSUFFICIENT_BATTERY` dưới mức giả định 55% |
| UAV-03 | `uav-03`, 85%, BUSY | `DRONE_BUSY` |
| ORD-001 | `ord-001`, 0.8kg, `point-a` | Có sẵn trong seed; có thể đổi trạng thái sau khi thử Mission |
| POINT-A | `point-a` | Delivery point tồn tại |
| invalid-point | `point-not-exists` | Test 404 |
| invalid-weight | `-1` hoặc `0` | Test 400 |

**Quy tắc an toàn dữ liệu:** Không chạy test positive nhiều lần trên DB có dữ liệu quan trọng. Các test có tạo/sửa bản ghi phải đánh dấu `MUTATES DB`. Nếu chạy đã làm thay đổi trạng thái seed, không coi seed có giá trị ban đầu nữa; cần DB test riêng hoặc phục hồi từ bản sao.

## 5. Entry Criteria (trước khi test)

- [ ] Node.js chạy `node -v`.
- [ ] PostgreSQL hoạt động, DB `uav_delivery` và 12 bảng tồn tại.
- [ ] Seed ít nhất có `uav-01`, `uav-02`, `uav-03`, `point-a`.
- [ ] `npm install` đã thực hiện tại `experiments/database-api`.
- [ ] `.env` có DB đúng và không Commit mật khẩu.
- [ ] Mở được Sandcastle, dán đúng hai file JavaScript + HTML/CSS.
- [ ] Với UI tests, ghi rõ trạng thái Figma còn thiếu liên kết Mobile.

## 6. Exit Criteria (Ngày 9)

- [ ] Có tối thiểu 15 TC với Preconditions/Steps/Expected.
- [ ] Chạy ít nhất unit tests ngày 4, smoke API và 1 lượt manual Cesium (nếu môi trường sẵn sàng).
- [ ] Có Test Results thực tế cùng ngày, người chạy, môi trường.
- [ ] Lỗi Blocker/Critical đã được ghi và có người phụ trách; không cần sửa mọi lỗi trong ngày 9 nếu tài liệu theo dõi rõ ràng.
- [ ] Ghi rõ chức năng chưa được implement, không đánh dấu PASS giả.
- [ ] Có bảng mapping TC ↔ FR/BR và nhánh/commit lưu tài liệu.

## 7. Mức độ ưu tiên

- **P0 Blocker:** Không khởi động API/DB, VFC bay xuyên qua quy tắc an toàn nghiêm trọng.
- **P1 High:** Tạo trùng Mission, xử lý sai pin/trọng lượng, State Machine bất hợp lệ.
- **P2 Medium:** Sai telemetry, sai trạng thái Figma, waypoint hiển thị lệch.
- **P3 Low:** Căn chỉnh, màu sắc, cách diễn đạt không nhất quán.

## 8. Định nghĩa trạng thái kết quả

- `PASS`: Đã chạy và kết quả bằng Expected.
- `FAIL`: Đã chạy và không đạt Expected.
- `NOT RUN`: Chưa chạy (mặc định).
- `BLOCKED`: Không thể chạy vì lỗi môi trường hoặc phụ thuộc.
- `NOT IMPLEMENTED`: Chức năng chưa có trong prototype hiện hành.

## 9. Phân công

- **TV1 (UI):** Prototype Figma/Web-Mobile, Cesium visual, ảnh minh chứng.
- **TV2 (Backend/DB):** DB, REST, Socket.IO, status/version.
- **TV3 (Simulator):** Virtual Flight Controller, safety, Cesium movement.
- **Cả nhóm:** Review chéo tối thiểu 5 TC do bạn khác thực hiện và chốt kết quả.

## 10. Rủi ro và giới hạn

1. Ngày 6 API demo không có Authentication, chỉ localhost, không dùng để triển khai public.
2. `POST /api/missions/:id/start` chỉ đổi trạng thái DB; chưa khiến UAV trên Cesium cất cánh.
3. Ngày 8 chuyển động chạy trong tab trình duyệt nên đóng tab là dừng; đây là giới hạn tech spike, không được coi là đạt BR-10 cho MVP.
4. Sim pin tuyến tính minh họa, không đánh giá điều kiện bay ngoài thực tế.
5. Prototype Figma có thể có các liên kết chưa chạy được, đặc biệt Mobile.
6. Ngày 9 không đo benchmark hiệu năng sản phẩm vì hệ thống chưa tích hợp.

## 11. Bằng chứng cần lưu

`docs/07-testing/evidence/` (tự tạo):
- `vfc-test-output.png`
- `api-smoke-output.png`
- `socket-hello-output.png`
- `cesium-en-route.png`, `cesium-paused.png`
- `bug-xxx.png` khi có lỗi.

**Lưu ý:** Đây là tên tệp đề xuất. Tài liệu không chứa ảnh minh chứng chưa được người dùng chụp.
