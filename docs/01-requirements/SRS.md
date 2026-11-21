# ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)

**Dự án:** Cross-platform UAV Delivery Simulation  
**Phiên bản:** 0.1 — bản nháp cần review  
**Người viết:** [TODO]  
**Ngày:** [TODO]

## 1. Giới thiệu
**Bài toán:** Trung tâm logistics cần điều phối UAV ảo để giao hàng chặng cuối từ một trạm đến điểm nhận cố định.

**Mục tiêu:** Mô phỏng được một nhiệm vụ giao hàng, có Flight Controller, pin, GPS, điều khiển, cơ chế an toàn, lưu trữ và đồng bộ Web/Mobile/Desktop.

## 2. Phạm vi
### MVP
- Một trạm; ba UAV ảo; nhiều đơn; nhiều điểm nhận.
- Hệ thống một nhóm nhân viên vận hành, tài khoản chung trên 3 nền tảng.
- Backend có thẩm quyền duy nhất về trạng thái; mô phỏng tiếp tục khi đóng ứng dụng.
- [TODO] Chốt danh mục màn hình MVP.

### Ngoài phạm vi
- UAV, GPS hay động cơ thật.
- Thanh toán thật, tích hợp sàn thương mại điện tử.
- Chuyển động vật lý 6-DOF, thiết kế điều khiển khí động học đầy đủ.

## 3. Actors
**Nhân viên vận hành:** quản lý đơn hàng, UAV, nhiệm vụ, nhận cảnh báo và xác nhận giao hàng.

## 4. Functional Requirements
| ID | Yêu cầu | Ưu tiên | Test |
|---|---|---|---|
| FR-01 | Đăng nhập | MVP | TC-AUTH-01 |
| FR-02 | Xem danh sách/chi tiết UAV | MVP | [TODO] |
| FR-03 | Tạo đơn và kiểm tra khối lượng/địa điểm | MVP | TC-02 |
| FR-04 | Lập nhiệm vụ, chọn UAV, waypoint | MVP | TC-01 |
| FR-05 | Start/Pause/Resume/Return/Abort theo trạng thái hợp lệ | MVP | TC-10, TC-11 |
| FR-06 | Server mô phỏng đường bay, pin, sensor | MVP | TC-01, TC-04 |
| FR-07 | Socket.IO cập nhật telemetry cho cả 3 client | MVP | TC-12 |
| FR-08 | Xác nhận giao hàng, UAV về trạm | MVP | TC-01, TC-15 |
| FR-09 | Quản lý các tình huống an toàn | MVP | TC-03, TC-04, TC-06 |
| FR-10 | Lưu lịch sử bay/sự kiện | MVP | [TODO] |
| FR-11 | Tự tìm đường A* | Nâng cao | [TODO] |

## 5. Non-functional Requirements
| ID | Yêu cầu | Phương pháp kiểm tra |
|---|---|---|
| NFR-01 | Web/Android/Windows cùng một bộ chức năng và dữ liệu | Thử cùng một tài khoản trên 3 nền tảng |
| NFR-02 | Khi đóng browser, máy chủ vẫn mô phỏng | Đóng UI rồi mở lại, kiểm tra trạng thái |
| NFR-03 | Không tạo hai mission chạy cùng lúc cho một UAV | Gửi yêu cầu cạnh tranh |
| NFR-04 | Chu kỳ mô phỏng mục tiêu 100 ms (giả định) | Log thời gian xử lý |
| NFR-05 | Dữ liệu nhạy cảm và lệnh được kiểm tra quyền | Gọi API không token / thiếu quyền |
| NFR-06 | [TODO] Giới hạn độ trễ cập nhật telemetry | [TODO] |

## 6. Business Rules
Xem `business-rules.md`. Phải ghi rõ cách tính pin đủ cho đi + về + thời gian chờ.

## 7. Luồng nghiệp vụ
Tiếp nhận đơn → Kiểm tra hợp lệ → Phân công UAV → Lập Mission → Preflight → Cất cánh → Bay → Hạ cánh → Xác nhận → Quay về → Kết thúc.

## 8. Dữ liệu và sơ đồ
- `docs/06-diagrams/04-activity.mmd`
- `docs/06-diagrams/05-sequence.mmd`
- `docs/06-diagrams/07-erd.mmd`

## 9. Tiêu chí nghiệm thu
- [TODO] Mỗi yêu cầu FR có 1+ test case.
- [TODO] Mỗi nhóm ký xác nhận thay đổi phạm vi.
