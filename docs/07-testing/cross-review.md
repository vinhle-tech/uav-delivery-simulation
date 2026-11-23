# CROSS-REVIEW — NGÀY 10

**Mục đích:** Không thành viên nào tự duyệt một mình phần mình viết. Review phải tạo ra hành động sửa cụ thể và có bằng chứng.

## 1. Phân công review chéo

| Người làm | Phần chính | Người review đề xuất | Cần đối chiếu |
|---|---|---|---|
| TV1 | UI/UX, Figma, responsive | TV2 | FR/Use Case → giao diện, status, API fields |
| TV2 | Database, Backend, REST, Socket.IO | TV3 | API contract ↔ schema ↔ Flight Controller actions |
| TV3 | Simulation, State Machine, Cesium | TV1 | Luồng mô phỏng ↔ nút điều khiển UI ↔ kết quả test |
| Cả nhóm | SRS, 10 sơ đồ, Test Plan | Chọn người không tạo phần tương ứng | Yêu cầu có thể kiểm thử, phiên bản và sơ đồ khớp nhau |

## 2. Trình tự review

1. **Đọc:** Mở file chính cùng tài liệu được tham chiếu; đừng đánh dấu chỉ vì file tồn tại.
2. **Đối chiếu:** Kiểm tra tên state, event, endpoint, cột DB, tham số (đơn vị), trường hợp lỗi.
3. **Chạy thử:** Nếu có code demo, chạy test không gây thay đổi DB trước; chụp ảnh/log.
4. **Ghi nhận:** Mỗi lỗi vào bảng dưới, kèm file, dòng/nơi xảy ra, mức độ, owner.
5. **Sửa và review lại:** Người làm sửa; reviewer xác nhận resolved bằng commit/screenshot mới.

## 3. Checklist theo người review

### TV1 review mô phỏng (không phải phần UI mình làm)
- [ ] Các nhãn `TAKEOFF`, `EN_ROUTE`, `PAUSED`, `RETURNING` và `COMPLETED` có nghĩa nhất quán.
- [ ] Có bằng chứng CesiumJS tạo Station/Point-A/Waypoints và chạy Start/Pause/Resume/Reset.
- [ ] Bản demo dùng browser không được mô tả là engine độc lập với browser.
- [ ] Có kế hoạch tách Simulation Engine khỏi renderer.

### TV2 review UI/UX
- [ ] Cùng một nhân viên vận hành sử dụng Web/Android/Windows; không chia vai trò thành buyer/seller riêng.
- [ ] Tạo Order, lập Mission, điều khiển, telemetry, incident và history đều có đường tới màn hình.
- [ ] Dữ liệu mock được ghi rõ; không mô tả nút Figma là API thật.
- [ ] Prototype Mobile còn thiếu liên kết được theo dõi như việc tồn đọng.

### TV3 review Backend & Database
- [ ] Database có 12 bảng và ERD khớp PK/FK.
- [ ] Mẫu API khớp endpoint hiện có, Socket event khớp `server.js` và `socket-listener.js`.
- [ ] Mission có `version` cho optimistic concurrency và kiểm tra lệnh sai trạng thái.
- [ ] Việc complete Mission demo không được coi là đã xác nhận Order giao thành công.

## 4. Findings / Issues

| Issue ID | Thành phần/file | Mô tả thực tế | Severity | Owner | Trạng thái | Bằng chứng |
|---|---|---|---|---|---|---|
| REVIEW-001 | Ngày 9 `mission-flow.ps1` | Kiểm tra cuối trả cả mảng status; cần đọc riêng `uav-01` | P2 / Test script | TV2 | OPEN / cần kiểm tra lại | Terminal Ngày 9 |
| REVIEW-002 | Figma Mobile | Prototype chưa hoàn thiện liên kết | P2 / UX | TV1 | OPEN | Figma |
| REVIEW-003 | Cesium | Chưa xác minh kết quả chạy trên máy nhóm | Verification | TV3 | NOT VERIFIED | Chờ ảnh Run/EN_ROUTE |
| REVIEW-004 | SRS | Tìm và thay các chỗ ghi TODO còn lại trước ký nghiệm thu | Verification | TV2 | NOT VERIFIED | `phase1-audit.mjs` |

**Severity guide:** `P0` cản trở hoàn toàn/không thể tiếp tục; `P1` sai nghiệp vụ/safety; `P2` kết quả hiển thị, kiểm thử, tài liệu; `P3` hình thức. Chỉ đổi trạng thái issue khi có bằng chứng.

## 5. Log review (điền sau khi thực hiện)

| Ngày/giờ | Reviewer | Tài liệu/code | Phát hiện | Commit sửa | Xác nhận |
|---|---|---|---|---|---|
| | | | | | |
