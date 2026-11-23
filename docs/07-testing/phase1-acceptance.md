# BIÊN BẢN NGHIỆM THU GIAI ĐOẠN 1 — UAV DELIVERY SYSTEM

- **Ngày nghiệm thu thực tế:** [ĐIỀN]
- **Repository/branch/commit:** [ĐIỀN]
- **Figma:** https://www.figma.com/design/uDFQY235eDuJh5jc1r0fHw
- **Thành viên 1 (UI):** [ĐIỀN]
- **Thành viên 2 (Backend/DB):** [ĐIỀN]
- **Thành viên 3 (Simulation):** [ĐIỀN]
- **Người review chéo:** [ĐIỀN]

> **Cách chấm:** `PASS` chỉ khi reviewer đã kiểm tra **nội dung** và bằng chứng; `PARTIAL` nếu còn thiếu nhỏ được chấp nhận; `FAIL` nếu không đáp ứng; `NOT REVIEWED` nếu chưa kiểm tra. **Trạng thái mặc định: NOT REVIEWED.** File tồn tại chưa phải PASS.

## A. Checklist nghiệm thu gốc — 15 tiêu chí

| ID | Hạng mục | Bằng chứng cần đối chiếu | Trạng thái | Reviewer/Ghi chú |
|---|---|---|---|---|
| AC-01 | Repository, vai trò, cách cộng tác | GitHub, README, phân quyền nhóm | NOT REVIEWED | |
| AC-02 | Logistics, phạm vi MVP thống nhất | `docs/01-requirements/business-rules.md`, activity | NOT REVIEWED | |
| AC-03 | SRS có FR và NFR rõ, đo được | `docs/01-requirements/SRS.md` | NOT REVIEWED | |
| AC-04 | Use Cases có luồng chính/phụ/lỗi | `docs/01-requirements/use-cases.md`, `docs/06-diagrams/03-use-cases.mmd` | NOT REVIEWED | |
| AC-05 | Business Rules có mã và khả năng test | `docs/01-requirements/business-rules.md` | NOT REVIEWED | |
| AC-06 | State Machine UAV, lệnh sai trạng thái | `docs/03-simulation/simulation-spec.md`, `docs/06-diagrams/06-uav-state-machine.mmd` | NOT REVIEWED | |
| AC-07 | Tham số mô phỏng pin/chuyển động có đơn vị | `docs/03-simulation/simulation-parameters.md` và test VFC | NOT REVIEWED | |
| AC-08 | Kiến trúc, ranh giới module, quyền trạng thái | `docs/02-architecture/architecture.md`, `docs/06-diagrams/02-overall-architecture.mmd` | NOT REVIEWED | |
| AC-09 | ERD khớp 12 bảng DB, constraint | `docs/04-database-api/schema.sql`, `docs/06-diagrams/07-erd.mmd`, pgAdmin | NOT REVIEWED | |
| AC-10 | REST API và Socket event đúng code lab | `docs/04-database-api/api-contract.md`, `socket-events.md`, `src/server.js` | NOT REVIEWED | |
| AC-11 | Ít nhất 15 màn hình được liệt kê; wireframe MVP | `docs/05-ui-ux/screens.md`, Figma Desktop/Mobile | NOT REVIEWED | |
| AC-12 | Bộ 10 sơ đồ có nội dung và chỉnh sửa được | `docs/06-diagrams/01-…10-*.mmd`, Mermaid preview | NOT REVIEWED | |
| AC-13 | Cesium Sandcastle: station, delivery, route, UAV | `experiments/cesium-sandcastle/`, screenshot thực tế | NOT REVIEWED | |
| AC-14 | Ít nhất 15 TC gồm precondition/steps/expected | `docs/07-testing/test-cases.md` (đã thiết kế 38 TC ở Ngày 9) | NOT REVIEWED | |
| AC-15 | Review chéo và backlog Giai đoạn 2 được chốt | `cross-review.md`, `docs/03-simulation/phase2-backlog.md` | NOT REVIEWED | |

## B. Kết quả kiểm thử bắt buộc phải đối chiếu

| Mục | Quan sát từ các bước trước | Cần làm trước khi xác nhận |
|---|---|---|
| API Mission Flow | Ngày 9 đã chạy `start, pause, resume, return-home, complete` đến `COMPLETED` và version 5; assert cuối in ba trạng thái `AVAILABLE AVAILABLE BUSY` | Chạy **read-only** `mission-readonly-check.ps1` và sửa `mission-flow.ps1` theo kết quả; không chạy tạo Mission mới nếu chưa cần |
| Socket.IO `server:hello` | Ảnh Terminal ghi `TC-RT-01 PASS` | Ghi đúng ngày/ảnh vào `test-results.md` |
| Unit FC | Bộ 9 test tham chiếu đã chạy trong môi trường soạn bộ Ngày 9; **kết quả của máy nhóm phải xác minh riêng** | Ghi stdout thực tế khi chạy `node test.js` |
| CesiumJS | Có source JS + HTML/CSS Ngày 8 | Chụp ảnh Run, EN_ROUTE, PAUSED hoặc đánh NOT RUN |
| Figma Mobile | Frame đã dựng, prototype link chưa hoàn chỉnh | Ghi PARTIAL/OPEN nếu chưa nối, không ghi hoàn thiện |

## C. Nghiệp vụ phải đồng nhất trong mọi tài liệu

1. **Một đối tượng sử dụng chính:** nhân viên vận hành tại trung tâm logistics; Web/Android/Windows dùng chung nghiệp vụ và dữ liệu.
2. Một trạm, 3 UAV ảo; payload tối đa 1,5 kg/UAV mẫu; phạm vi giao 1–2 km theo kế hoạch hiện tại.
3. **Order status ≠ Mission status ≠ Flight Controller state**.
4. Order chỉ được xác nhận `DELIVERED` sau bàn giao, **không** khi vừa hạ cánh; Mission chỉ `COMPLETED` khi UAV đã về trạm và hoàn thành vòng đời.
5. Backend/Simulation Engine tương lai là nguồn trạng thái có thẩm quyền; web/mobile/desktop gửi lệnh và nhận cập nhật.
6. Không phân công hai Mission đang hoạt động cho cùng UAV; kiểm tra pin đủ đi-về-dự phòng, quá tải, geofence và trạng thái lệnh.
7. API demo Ngày 6 chuyển trạng thái DB, **không** thực thi chuyến bay/hand-over end-to-end. Đây là giới hạn lab, không phải mâu thuẫn với MVP được thiết kế.

## D. Quyết định nghiệm thu

- [ ] **GO** — 15 mục đã review; không còn Blocker ảnh hưởng thiết kế/chuyển giai đoạn; hạn chế có kế hoạch rõ.
- [ ] **CONDITIONAL GO** — có mục PARTIAL/NOT VERIFIED nhưng không cản trở Giai đoạn 2; có owner, deadline.
- [ ] **NO-GO** — thiếu yêu cầu cốt lõi hoặc mâu thuẫn nghiệp vụ/nguyên tắc an toàn chưa xử lý.

**Blocker chưa xử lý:** [ĐIỀN]  
**Việc phải hoàn tất trước khi bắt đầu Giai đoạn 2:** [ĐIỀN]  
**Việc có thể hoãn sang Giai đoạn 3–7:** [ĐIỀN]  
**Lý do quyết định:** [ĐIỀN]

| Thành viên | Vai trò | Đã review hạng mục | Xác nhận/ngày |
|---|---|---|---|
| TV1 | UI/UX | | |
| TV2 | Backend/DB | | |
| TV3 | Simulator | | |
