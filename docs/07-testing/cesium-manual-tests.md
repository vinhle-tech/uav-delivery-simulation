# Kiểm thử thủ công — Cesium Sandcastle (Ngày 8)

**Ngày thực hiện:** ____ / ____ / 2026  
**Người kiểm thử:** ________________________  
**Trình duyệt:** Chrome / Edge, phiên bản: __________  
**Liên kết Sandcastle:** https://sandcastle.cesium.com/?src=Hello%20World.html

> Đây là các test case đã soạn; chưa có kết quả PASS/FAIL vì chưa chạy trên máy của nhóm.

| ID | Cách thực hiện | Kỳ vọng | Kết quả thực tế | PASS/FAIL |
|---|---|---|---|---|
| T01 | Dán 2 file và nhấn Run | Xuất hiện Cesium 3D map, panel HUD | | |
| T02 | Kiểm tra nhãn trạm | Có STATION-01 | | |
| T03 | Kiểm tra điểm nhận | Có POINT-A | | |
| T04 | Kiểm tra waypoint | Có WP-01, WP-02, WP-03 và polyline | | |
| T05 | Kiểm tra đội UAV | Có UAV-01 (mô hình), UAV-02, UAV-03 (marker) | | |
| T06 | Bấm Start | IDLE → TAKEOFF → EN_ROUTE | | |
| T07 | Chờ UAV bay | Marker UAV-01 thay đổi vị trí, Distance tăng | | |
| T08 | Bấm Pause khi đang bay | HUD PAUSED, UAV dừng di chuyển | | |
| T09 | Bấm Resume | UAV tiếp tục từ vị trí dừng | | |
| T10 | Bấm Reset | UAV về trạm, trạng thái IDLE, tiến độ 0% | | |
| T11 | Bấm Focus UAV / Overview | Camera chuyển đến UAV / tổng quan | | |
| T12 | Chờ kết thúc | EN_ROUTE → LANDING → WAITING_FOR_HANDOVER | | |
| T13 | Kiểm tra Console | Không có lỗi JavaScript do source bài thực hành | | |
| T14 | Reload tab Sandcastle | Scene khởi tạo lại, trạng thái IDLE | | |

## Lỗi phát sinh

| ID | Thời điểm | Thông báo lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|---|---|
| BUG-01 | | | | |

## Minh chứng

- Ảnh màn hình 01: ______________________
- Ảnh màn hình 02: ______________________
- Ảnh màn hình 03: ______________________
- Ảnh màn hình 04: ______________________

## Kết luận nghiệm thu

- [ ] Tất cả T01–T14 đã được thực hiện.
- [ ] Không còn lỗi blocking.
- [ ] Source được commit vào `experiments/cesium-sandcastle/`.
- [ ] Nhật ký kiểm thử được lưu trong `docs/07-testing/`.
- [ ] Kết luận tech spike được ghi ở `docs/03-simulation/cesium-tech-spike.md`.
