# DEMO & KIỂM TRA NGHIỆM THU — NGÀY 10

> Demo Giai đoạn 1 là **kiểm chứng các thành phần độc lập**. Không trình diễn như một hệ thống giao hàng end-to-end khi các service chưa tích hợp.

## A. Kịch bản thuyết trình 8–12 phút

| Thứ tự | Người phụ trách | Trình bày | Bằng chứng |
|---|---|---|---|
| 1 | TV1 | Bài toán trung tâm logistics, 1 station, 3 UAV, 1 nhân viên vận hành trên 3 nền tảng | SRS + flowchart |
| 2 | TV2 | Kiến trúc: Web/Mobile/Desktop → REST/Socket.IO → Backend → Simulation Engine → DB | Overall architecture |
| 3 | TV2 | PostgreSQL: 12 bảng, ERD, quy tắc một UAV chỉ một active Mission | pgAdmin, `schema.sql` |
| 4 | TV2 | API demo, test `/health`, `/api/drones`, Socket hello; Mission version | Terminal + log |
| 5 | TV3 | Virtual FC unit tests: preflight, battery, invalid command, Pause/Resume | `node test.js` |
| 6 | TV3 | CesiumJS Sandcastle: station, drone, waypoints, Start, Pause, Resume | Trình duyệt + ảnh |
| 7 | TV1 | Figma Desktop/Mobile và luồng nghiệp vụ | Figma; nêu phần Prototype thiếu |
| 8 | Cả nhóm | 38 TC của Ngày 9, review findings, backlog Giai đoạn 2 | Test Plan, acceptance, backlog |

## B. Chạy lệnh kiểm tra không thay đổi DB

**Ở repo root:**

```powershell
node .\experiments\architecture\phase1-audit.mjs
```

**Terminal A (Backend):**

```powershell
cd .\experiments\database-api
npm start
```

**Terminal B (vẫn ở `experiments/database-api`):**

```powershell
node --test .\tests\api-smoke.test.js
node .\tests\socket-smoke.js
powershell -ExecutionPolicy Bypass -File .\tests\mission-readonly-check.ps1
```

**Terminal C (ở `experiments/flight-controller`):**

```powershell
node test.js
```

**Không tự chạy** `mission-flow.ps1` trong buổi review nếu không cần: nó **tạo thêm Order/Mission và thay đổi DB**, có thể gây `BUSY` nếu dừng giữa chừng. Với sự kiện telemetry, `socket-smoke.js --emit-test` cũng tạo dữ liệu DB.

## C. Kiểm tra riêng TC-API-12 của Ngày 9

Terminal trước đó cho thấy năm lần chuyển trạng thái thành công nhưng assert cuối báo `AVAILABLE AVAILABLE BUSY`; đó có thể là lỗi PowerShell xử lý JSON array. Để xác minh **không tạo Mission mới**, sử dụng:

```powershell
powershell -ExecutionPolicy Bypass -File .\tests\mission-readonly-check.ps1
```

**Trường hợp UAV-01 AVAILABLE và Mission cũ COMPLETED:** ghi nhận từng transition đã quan sát, giải thích bug trong test script, và quyết định sau review có đủ bằng chứng để ghi PASS cho testcase hay cần một rerun chính thức.

**Bản vá kiểm tra cuối của `mission-flow.ps1` (nếu nhóm muốn sửa file hiện tại):**

```powershell
$allDrones = Invoke-RestMethod -Uri "$base/api/drones"
$check = @($allDrones) | Where-Object { $_.id -eq 'uav-01' } | Select-Object -First 1
if ($null -eq $check) { throw 'uav-01 not found' }
if ($check.status -ne 'AVAILABLE') { throw "Expected AVAILABLE, got $($check.status)" }
```

Cũng sửa đoạn **preflight** đọc `/api/drones` theo cùng cách để tránh bắt nhầm cả danh sách.

## D. Chụp bằng chứng tối thiểu

Đưa ảnh chụp vào `docs/07-testing/evidence/` với tên có ý nghĩa. Đề xuất:

```text
db-12-tables.png
api-health.png
api-smoke.png
socket-hello.png
vfc-test.png
cesium-station-route.png
cesium-en-route.png
cesium-paused.png
figma-desktop.png
figma-mobile.png
```

Nếu chưa có ảnh/test, **không tạo placeholder thành bằng chứng PASS**. Dẫn link ảnh/test tương ứng trong `phase1-acceptance.md` và `test-results.md`.

## E. Kết luận buổi demo

- **Đã thiết kế:** [Điền]
- **Đã thử nghiệm và xác minh PASS:** [Điền]
- **Có code lab nhưng chưa xác minh trên máy nhóm:** [Điền]
- **Chưa tích hợp:** Auth, FC ↔ Backend ↔ Cesium end-to-end, giao nhận chính thức, Mobile Prototype hoàn chỉnh (nếu còn thiếu).
- **Quyết định:** GO / CONDITIONAL GO / NO-GO.
