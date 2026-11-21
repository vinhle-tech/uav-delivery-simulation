# Use Case Specifications

## UC-01 - Tạo đơn hàng

**Tên:** Create Delivery Order

**Mục tiêu:**
Nhân viên tạo một đơn hàng cần vận chuyển.

**Actor:** Nhân viên vận hành.

**Trigger:**
Nhân viên nhấn nút Create Order.

**Precondition:**

- Nhân viên đã đăng nhập.
- Hệ thống có danh sách điểm giao hợp lệ.

### Main Flow

1. Nhân viên mở màn hình Order List.
2. Nhân viên nhấn Create Order.
3. Hệ thống hiển thị form nhập thông tin.
4. Nhân viên nhập khối lượng và điểm giao.
5. Nhân viên nhấn Save.
6. Hệ thống kiểm tra dữ liệu đầu vào.
7. Hệ thống lưu đơn hàng vào Database.
8. Hệ thống đặt trạng thái PENDING.
9. Hệ thống hiển thị thông báo thành công.

### Alternative Flow

A1 - Nhân viên hủy thao tác:

- Nhân viên nhấn Cancel.
- Hệ thống đóng form.
- Không tạo đơn hàng.

### Exception Flow

E1 - Khối lượng không hợp lệ:

- Khối lượng <= 0.
- Hệ thống thông báo lỗi.
- Không lưu đơn hàng.

E2 - Điểm giao không hợp lệ:

- Điểm giao không tồn tại.
- Hệ thống từ chối tạo đơn.

E3 - Người dùng chưa đăng nhập:

- Hệ thống từ chối yêu cầu.
- Yêu cầu đăng nhập hợp lệ.

### Postcondition

Thành công:

- Tạo được Order mới.
- Order có trạng thái PENDING.

Thất bại:

- Không tạo Order mới.
- Dữ liệu hiện có không bị thay đổi.

**FR liên quan:** FR-03
**Test Case:** TC-ORDER-01

## UC-02 - Phân công UAV và tạo Mission

**Tên:** Assign Drone and Create Mission

**Mục tiêu:**
Tạo nhiệm vụ giao hàng cho một UAV phù hợp.

**Actor:** Nhân viên vận hành.

**Trigger:**
Nhân viên chọn chức năng Create Mission.

**Precondition:**

- Người dùng đã đăng nhập.
- Order tồn tại và hợp lệ.
- Order chưa có Mission giao đang hoạt động.
- Có dữ liệu UAV và điểm giao.

### Dữ liệu ví dụ

- Order: ORD-001
- Khối lượng: 0.8 kg
- Drone: UAV-01
- Pin hiện tại: 90%
- Trạng thái: AVAILABLE
- Điểm giao: POINT-A
- Khoảng cách: 1.2 km
- Pin yêu cầu giả định: 55%

### Main Flow

1. Nhân viên mở danh sách Order.
2. Nhân viên chọn ORD-001.
3. Hệ thống hiển thị chi tiết Order.
4. Nhân viên chọn Create Mission.
5. Hệ thống hiển thị danh sách UAV.
6. Nhân viên chọn UAV-01.
7. Nhân viên chọn điểm giao và waypoint.
8. Nhân viên nhấn Confirm.
9. Backend kiểm tra trạng thái UAV.
10. Backend kiểm tra tải trọng.
11. Backend kiểm tra năng lượng cần thiết.
12. Backend kiểm tra phạm vi và vùng cấm.
13. Backend tạo Mission mới trong Database.
14. Hệ thống trả về MIS-001, trạng thái READY.
15. Giao diện hiển thị Mission đã sẵn sàng.

### Alternative Flow

A1 - Chọn UAV khác:

- Nhân viên đổi từ UAV-01 sang UAV-02.
- Hệ thống kiểm tra lại các điều kiện.
- Nếu không hợp lệ, hiển thị lý do.
- Nhân viên có thể chọn UAV khác.

A2 - Chỉnh sửa waypoint:

- Nhân viên thay đổi tuyến bay.
- Hệ thống tính lại khoảng cách và năng lượng.
- Sau khi hợp lệ, tiếp tục tạo Mission.

### Exception Flow

E1 - UAV quá tải:

- Khối lượng > tải trọng tối đa.
- Từ chối phân công.
- Không tạo Mission.

E2 - UAV thiếu pin:

- Năng lượng dự tính không đủ.
- Hiển thị cảnh báo.
- Không tạo Mission.

E3 - UAV đang bận:

- Trạng thái không AVAILABLE.
- Từ chối phân công.

E4 - Tuyến bay không hợp lệ:

- Waypoint ngoài vùng hoạt động.
- Hoặc tuyến cắt vùng cấm.
- Yêu cầu điều chỉnh kế hoạch.

E5 - Yêu cầu đồng thời:

- Hai thiết bị cùng phân công một UAV.
- Backend chỉ chấp nhận phân công hợp lệ.
- Yêu cầu xung đột bị từ chối.
- Không tạo hai Mission hoạt động cùng UAV.

### Postcondition

Thành công:

- Mission mới ở trạng thái READY.
- UAV được giữ cho Mission vừa tạo.
- UAV chưa cất cánh.

Thất bại:

- Không tạo Mission hoạt động mới.
- Hiển thị nguyên nhân.
- Không làm sai trạng thái các Mission khác.

**FR liên quan:** FR-04

**BR liên quan:**
BR-01, BR-02, BR-03, BR-04, BR-05, BR-06

**Test Cases:**
TC-02, TC-03, TC-05, TC-06, TC-10

- **Actor:** Nhân viên vận hành.
- **Tiền điều kiện:** Có Order PENDING; có UAV sẵn sàng.
- **Luồng chính:** Chọn đơn → chọn UAV → lập waypoint → kiểm tra pin/tải/vùng cấm → tạo mission READY.
- **Luồng lỗi:** Quá tải, không đủ pin, UAV đang bận, waypoint sai, hai yêu cầu đồng thời.
- **Hậu điều kiện:** Mission READY nhưng chưa bay.

## UC-03 - Bắt đầu Mission

**Tên:** Start Delivery Mission

**Actor:** Nhân viên vận hành.

**Trigger:**
Nhân viên nhấn nút Start Mission.

**Precondition:**

- Người dùng đã đăng nhập.
- Mission tồn tại và có trạng thái READY.
- UAV được phân công hợp lệ.
- Simulation Engine đang hoạt động.

### Main Flow

1. Nhân viên mở Mission MIS-001.
2. Hệ thống hiển thị thông tin Mission.
3. Nhân viên nhấn Start Mission.
4. Client gửi lệnh đến Backend.
5. Backend xác thực và kiểm tra trạng thái.
6. Backend chuyển lệnh hợp lệ đến bộ mô phỏng.
7. Simulation Engine chấp nhận lệnh.
8. Bộ điều khiển chuyển sang PRE_FLIGHT.
9. Hệ thống chạy kiểm tra trước cất cánh.
10. Nếu đạt, UAV chuyển sang TAKEOFF.
11. Server phát dữ liệu trạng thái mới.
12. Client cập nhật màn hình giám sát.

### Alternative Flow

A1 - Nhân viên không xác nhận Start:

- Nhân viên hủy thao tác.
- Mission vẫn READY.
- UAV không cất cánh.

### Exception Flow

E1 - Mission không READY:

- Backend từ chối START.
- Trạng thái không thay đổi.

E2 - Không đủ điều kiện bay:

- Pre-flight Check thất bại.
- Không chuyển sang TAKEOFF.
- Hệ thống ghi nhận nguyên nhân.

E3 - Lệnh trùng:

- Backend xử lý theo chính sách chống trùng.
- Không bắt đầu hai lần cùng một Mission.

E4 - Người dùng thiếu quyền:

- Backend từ chối lệnh.

### Postcondition

Thành công:

- Lệnh Start được chấp nhận.
- UAV bắt đầu quy trình kiểm tra trước bay.
- UAV cất cánh khi kiểm tra thành công.

Thất bại:

- Không cất cánh.
- Ghi nhận lý do thất bại.

**FR liên quan:** FR-05, FR-06
**BR liên quan:** BR-04, BR-09
**Test Case:** TC-CTRL-01

- **Luồng chính:** Gửi Start → server xác thực và kiểm tra trạng thái → simulation chuyển sang PRE_FLIGHT → gửi ACK → phát telemetry.
- **Luồng lỗi:** Không quyền; mission không READY; lệnh trùng; server bận.

## UC-04 - Xác nhận giao hàng

**Tên:** Confirm Delivery

**Actor:** Nhân viên vận hành.

**Trigger:**
UAV hạ cánh tại điểm giao và hệ thống
chuyển sang trạng thái chờ bàn giao.

**Precondition:**

- Mission đang thực hiện.
- UAV đã hạ cánh tại điểm nhận.
- Hệ thống đang WAITING_FOR_HANDOVER.

### Main Flow

1. UAV hạ cánh tại POINT-A.
2. Hệ thống chuyển sang trạng thái chờ.
3. Giao diện hiển thị yêu cầu xác nhận.
4. Nhân viên xác nhận đã bàn giao hàng.
5. Backend kiểm tra điều kiện xác nhận.
6. Hệ thống ghi nhận kết quả bàn giao.
7. Order chuyển sang DELIVERED.
8. Mission tiếp tục thực hiện chặng về.
9. UAV Return Home nếu điều kiện cho phép.
10. Khi hoàn thành chặng về,
    Mission được cập nhật kết quả cuối cùng.

### Alternative Flow

A1 - Nhân viên xác nhận giao thất bại:

- Hệ thống ghi nhận nguyên nhân.
- Order chuyển DELIVERY_FAILED.
- UAV giữ kiện hàng để quay về.

### Exception Flow

E1 - Chưa hạ cánh:

- Hệ thống từ chối xác nhận bàn giao.

E2 - Hết thời gian chờ:

- Quá 60 giây mô phỏng chưa xác nhận.
- Ghi nhận DELIVERY_FAILED.
- Đánh giá phương án quay về.

E3 - Không thể quay về:

- Safety Manager đánh giá phương án dự phòng.
- Ghi nhận sự cố.
- Không tự động chuyển Mission thành COMPLETED.

### Postcondition

Giao thành công:

- Order = DELIVERED.
- Mission tiếp tục cho đến khi kết thúc bay.

Giao thất bại:

- Order = DELIVERY_FAILED.
- Mission có thể tiếp tục RETURNING.

**FR liên quan:** FR-08
**BR liên quan:** BR-07, BR-08
**Test Cases:** TC-01, TC-09, TC-15

## UC-05 – Tạm dừng và tiếp tục nhiệm vụ bay

**Tên tiếng Anh:** Pause and Resume Delivery Mission

**Mục tiêu:**

Cho phép nhân viên vận hành tạm dừng và tiếp tục nhiệm vụ bay của UAV trong môi trường mô phỏng, bảo đảm UAV duy trì trạng thái an toàn và có thể tiếp tục hành trình khi điều kiện cho phép.

**Actor chính:** Nhân viên vận hành UAV.

**Thành phần tham gia:**
- Backend: Xác thực và kiểm tra tính hợp lệ của lệnh.
- Virtual Flight Controller: Thực hiện thay đổi trạng thái bay.
- Safety Manager: Kiểm tra điều kiện an toàn.
- Simulation Engine: Cập nhật chuyển động, pin và cảm biến.
- Socket.IO: Đồng bộ trạng thái đến Web, Mobile và Desktop.

**Trigger (Sự kiện kích hoạt):**

Nhân viên nhấn nút `Pause` hoặc `Resume` tại màn hình Flight Control Panel.

### 1. Precondition – Điều kiện tiên quyết

- Nhân viên đã đăng nhập và có quyền điều khiển UAV.
- UAV đang thực hiện một Mission hợp lệ.
- Simulation Engine đang hoạt động.
- Mission chưa kết thúc (`COMPLETED` hoặc `FAILED`).
- Lệnh Pause chỉ được thực hiện ở trạng thái bay cho phép tạm dừng, ví dụ `EN_ROUTE`.
- Lệnh Resume chỉ được thực hiện khi bộ điều khiển đang ở trạng thái `PAUSED`.

### 2. Main Flow – Luồng xử lý chính

**A. Tạm dừng nhiệm vụ (Pause)**

1. Nhân viên mở màn hình Live Flight Simulation.
2. Hệ thống hiển thị thông tin UAV và Mission đang thực hiện.
3. Nhân viên chọn UAV-01 đang ở trạng thái `EN_ROUTE`.
4. Nhân viên nhấn nút `Pause`.
5. Client gửi yêu cầu tạm dừng đến Backend kèm `missionId`.
6. Backend xác thực người dùng và kiểm tra trạng thái hiện tại của Mission.
7. Backend chuyển lệnh hợp lệ đến Virtual Flight Controller.
8. Safety Manager kiểm tra điều kiện duy trì vị trí và độ cao an toàn.
9. Nếu điều kiện phù hợp, Flight Controller chuyển từ `EN_ROUTE` sang `PAUSED`.
10. UAV giảm tốc về 0 theo giới hạn gia tốc của mô hình và duy trì vị trí, độ cao mô phỏng.
11. Hệ thống lưu waypoint hiện tại và tiến độ nhiệm vụ.
12. Trong thời gian tạm dừng, Simulation Engine vẫn cập nhật cảm biến và tiêu hao pin do duy trì bay.
13. Backend phát trạng thái `PAUSED` cùng telemetry mới qua Socket.IO.
14. Web, Mobile và Desktop cập nhật giao diện, hiển thị Mission đang tạm dừng.

**B. Tiếp tục nhiệm vụ (Resume)**

15. Nhân viên nhấn nút `Resume`.
16. Client gửi yêu cầu tiếp tục Mission đến Backend.
17. Backend xác thực người dùng và kiểm tra Mission đang `PAUSED`.
18. Safety Manager đánh giá lại mức pin, GPS, tuyến bay và điều kiện an toàn.
19. Nếu đủ điều kiện, Virtual Flight Controller chuyển từ `PAUSED` sang `EN_ROUTE`.
20. UAV tiếp tục di chuyển đến waypoint còn dang dở.
21. Simulation Engine tiếp tục cập nhật vị trí, vận tốc, độ cao và mức pin.
22. Backend phát trạng thái và telemetry mới đến các Client.
23. Hệ thống ghi nhận thời điểm Resume vào nhật ký nhiệm vụ.

### 3. Alternative Flow – Luồng thay thế

**A1 – Nhân viên giữ UAV ở trạng thái PAUSED**

- Nhân viên chưa gửi lệnh Resume.
- UAV tiếp tục duy trì vị trí và độ cao theo mô hình.
- Simulation Engine vẫn cập nhật dữ liệu cảm biến, mức pin và điều kiện an toàn.
- Mission chưa được đánh dấu hoàn thành.

**A2 – Nhân viên yêu cầu Return Home khi đang PAUSED**

- Nhân viên nhấn Return Home.
- Backend tiếp nhận và xác thực lệnh.
- Safety Manager đánh giá năng lượng và khả năng quay về.
- Nếu đủ điều kiện, UAV thoát trạng thái PAUSED và thực hiện quy trình Return Home.
- Nếu không đủ điều kiện, hệ thống chuyển sang phương án xử lý an toàn phù hợp.

### 4. Exception Flow – Luồng ngoại lệ

**E1 – Pause ở trạng thái không hợp lệ**

- Nhân viên gửi Pause khi UAV đang `IDLE`, `TAKEOFF`, `LANDING` hoặc Mission đã kết thúc.
- Backend từ chối lệnh.
- Hệ thống hiển thị: "Không thể tạm dừng UAV trong trạng thái hiện tại".
- Trạng thái UAV không thay đổi.

**E2 – Resume khi Mission không PAUSED**

- Nhân viên gửi Resume khi UAV đang `EN_ROUTE`, `IDLE` hoặc trạng thái khác không phù hợp.
- Backend từ chối yêu cầu.
- Không thay đổi trạng thái bay.

**E3 – Pin yếu khi đang PAUSED**

- UAV tiếp tục tiêu hao năng lượng trong quá trình giữ vị trí.
- Khi mức pin chạm ngưỡng cảnh báo, Safety Manager đánh giá điều kiện an toàn.
- Nếu việc tiếp tục tạm dừng không còn an toàn, hệ thống có thể chủ động thoát PAUSED để thực hiện phương án dự phòng.
- Không mặc định Return Home khi không đủ năng lượng quay về.

**E4 – GPS không ổn định**

- Cảm biến GPS mô phỏng trả dữ liệu không đáng tin cậy.
- Safety Manager kiểm tra khả năng giữ vị trí.
- Nếu không bảo đảm điều kiện an toàn, hệ thống từ chối Resume hoặc kích hoạt quy trình xử lý sự cố.
- Hệ thống ghi nhận cảnh báo GPS.

**E5 – Hai thiết bị gửi lệnh mâu thuẫn**

- Web gửi Pause trong khi Mobile gửi Resume hoặc Return Home gần như đồng thời.
- Backend kiểm tra thứ tự và trạng thái hiện tại khi xử lý lệnh.
- Chỉ lệnh phù hợp với trạng thái và chính sách an toàn mới được chấp nhận.
- Những lệnh không hợp lệ bị từ chối với thông báo rõ ràng.
- UAV không được chuyển sang trạng thái mâu thuẫn.

**E6 – Mất kết nối Client**

- Web hoặc Mobile bị mất kết nối khi Mission đang PAUSED.
- Simulation Engine tiếp tục hoạt động ở phía server.
- UAV tiếp tục thực hiện chính sách giữ vị trí và giám sát an toàn.
- Khi Client kết nối lại, hệ thống đồng bộ trạng thái hiện tại của UAV và Mission.

### 5. Postcondition – Điều kiện sau xử lý

**Khi Pause thành công:**
- Bộ điều khiển UAV chuyển sang `PAUSED`.
- Mission vẫn đang hoạt động, chưa kết thúc.
- UAV duy trì vị trí và độ cao theo mô hình.
- Pin tiếp tục tiêu hao.
- Waypoint và tiến độ nhiệm vụ được giữ lại.

**Khi Resume thành công:**
- Bộ điều khiển chuyển từ `PAUSED` sang `EN_ROUTE`.
- UAV tiếp tục tuyến bay từ vị trí hiện tại đến waypoint mục tiêu.
- Không tạo Mission mới.
- Không khởi động lại hành trình từ đầu.

**Khi xảy ra lỗi:**
- Lệnh bị từ chối hoặc Safety Manager kích hoạt phương án an toàn.
- Hệ thống ghi nhận nguyên nhân và trạng thái sau xử lý.
- Không làm mất dữ liệu Mission đã lưu.

### 6. Business Rules liên quan

- **BR-03:** Một UAV không được thực hiện hai Mission đồng thời.
- **BR-04:** UAV phải đáp ứng chính sách năng lượng.
- **BR-09:** Lệnh điều khiển phải phù hợp trạng thái và điều kiện an toàn.
- **BR-10:** Đóng ứng dụng không được làm dừng mô phỏng trên server.

### 7. Functional Requirements liên quan

- **FR-05:** Điều khiển nhiệm vụ bay.
- **FR-06:** Mô phỏng chuyển động, pin và cảm biến.
- **FR-07:** Đồng bộ telemetry.
- **FR-09:** Phát hiện và xử lý sự cố.

### 8. Test Cases đề xuất

| ID | Tình huống | Kết quả mong đợi |
|---|---|---|
| TC-P01 | Pause khi UAV đang EN_ROUTE | Chuyển sang PAUSED và ổn định vị trí |
| TC-P02 | Resume khi UAV đang PAUSED | Tiếp tục waypoint còn dang dở |
| TC-P03 | Pause khi UAV đang IDLE | Từ chối lệnh |
| TC-P04 | Resume khi UAV chưa PAUSED | Từ chối lệnh |
| TC-P05 | UAV pin yếu trong khi PAUSED | Kích hoạt chính sách an toàn |
| TC-P06 | GPS không ổn định khi Resume | Không tiếp tục bay nếu không đủ điều kiện |
| TC-P07 | Hai Client gửi lệnh mâu thuẫn | Không tạo chuyển trạng thái không hợp lệ |
| TC-P08 | Đóng Web khi Mission PAUSED | Simulation Engine vẫn hoạt động |
| TC-P09 | Resume sau thời gian tạm dừng | Tiếp tục tuyến, không tạo Mission mới |

### 9. Acceptance Criteria – Tiêu chí nghiệm thu

- Nhân viên có thể Pause khi UAV đang ở trạng thái cho phép.
- UAV có thể giảm tốc và giữ vị trí, độ cao theo mô hình.
- Trong trạng thái PAUSED, pin và cảm biến vẫn được cập nhật.
- Resume chỉ được thực hiện sau khi kiểm tra điều kiện an toàn.
- UAV tiếp tục hành trình từ waypoint đang thực hiện.
- Những lệnh Pause/Resume không hợp lệ bị từ chối.
- Hai thiết bị không thể gây ra trạng thái điều khiển mâu thuẫn.
- Trạng thái được đồng bộ giữa Web, Mobile và Desktop.
- Các sự kiện Pause/Resume được ghi nhận vào lịch sử.
- Hệ thống vẫn mô phỏng khi người dùng đóng ứng dụng.

**Mức độ ưu tiên:** MVP.

## Mẫu tự điền

### UC-[TODO]: [Tên Use Case]

- Actor: [TODO]
- Tiền điều kiện: [TODO]
- Trigger: [TODO]
- Luồng chính: 1. ... 2. ... 3. ...
- Luồng thay thế: [TODO]
- Luồng lỗi: [TODO]
- Hậu điều kiện: [TODO]
- FR/BR liên quan: [TODO]
- Test case: [TODO]
