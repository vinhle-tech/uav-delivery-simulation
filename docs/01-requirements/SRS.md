# ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)

**Dự án:** Cross-platform UAV Delivery Simulation  
**Phiên bản:** 0.1 — bản nháp cần review  
**Người viết:** Le Dang Vinh  
**Ngày:** 21/11/2026

## 1. Giới thiệu

**Bài toán:** Trung tâm logistics cần điều phối UAV ảo để giao hàng chặng cuối từ một trạm đến điểm nhận cố định.

**Mục tiêu:** Mô phỏng được một nhiệm vụ giao hàng, có Flight Controller, pin, GPS, điều khiển, cơ chế an toàn, lưu trữ và đồng bộ Web/Mobile/Desktop.

## 2. Phạm vi

### MVP

- Một trạm; ba UAV ảo; nhiều đơn; nhiều điểm nhận.
- Hệ thống một nhóm nhân viên vận hành, tài khoản chung trên 3 nền tảng.
- Backend có thẩm quyền duy nhất về trạng thái; mô phỏng tiếp tục khi đóng ứng dụng.

### Danh mục màn hình MVP

1. Login
2. Dashboard
3. Drone List
4. Drone Details
5. Order List
6. Order Details
7. Create Order
8. Mission Planner
9. Live Flight Simulation
10. Flight Control Panel
11. Telemetry Dashboard
12. Incident Management (cơ bản)
13. Flight History

### Các màn hình / tính năng nâng cao

- Báo cáo phân tích chi tiết
- Settings nâng cao
- Đăng ký tài khoản công khai
- Tự động tối ưu đường bay bằng A\*
- Mô phỏng vật lý UAV phức tạp

### Nguyên tắc đa nền tảng

Web, Android và Windows phải có cùng
chức năng nghiệp vụ và dữ liệu.

Giao diện được thay đổi bố cục theo
kích thước màn hình, nhưng không tự ý
loại bỏ chức năng trên nền tảng khác.

### Ngoài phạm vi

- UAV, GPS hay động cơ thật.
- Thanh toán thật, tích hợp sàn thương mại điện tử.
- Chuyển động vật lý 6-DOF, thiết kế điều khiển khí động học đầy đủ.

## 3. Actors

**Nhân viên vận hành:** quản lý đơn hàng, UAV, nhiệm vụ, nhận cảnh báo và xác nhận giao hàng.

## 4. Functional Requirements

| ID    | Yêu cầu                                    | Ưu tiên  | Test Case                         |
| ----- | ------------------------------------------ | -------- | --------------------------------- |
| FR-01 | Đăng nhập và đăng xuất                     | MVP      | TC-AUTH-01                        |
| FR-02 | Xem danh sách và chi tiết UAV              | MVP      | TC-DRONE-01                       |
| FR-03 | Tạo và kiểm tra đơn hàng                   | MVP      | TC-ORDER-01                       |
| FR-04 | Phân công UAV, tạo Mission và waypoint     | MVP      | TC-02, TC-03, TC-05, TC-06, TC-10 |
| FR-05 | Điều khiển Start/Pause/Resume/Return/Abort | MVP      | TC-11, TC-CTRL-01                 |
| FR-06 | Mô phỏng đường bay, pin và cảm biến        | MVP      | TC-01, TC-04, TC-08, TC-14        |
| FR-07 | Cập nhật telemetry qua Socket.IO           | MVP      | TC-12, TC-14, TC-RT-01            |
| FR-08 | Xác nhận bàn giao và quay về trạm          | MVP      | TC-01, TC-09, TC-15               |
| FR-09 | Phát hiện và xử lý sự cố                   | MVP      | TC-04, TC-06, TC-07               |
| FR-10 | Lưu lịch sử nhiệm vụ và sự kiện            | MVP      | TC-01, TC-HISTORY-01              |
| FR-11 | Tìm đường tự động bằng A\*                 | Nâng cao | TC-ASTAR-01                       |

### FR-03 - Tạo và kiểm tra đơn hàng

**Mục tiêu:**
Cho phép nhân viên tạo một đơn hàng mới
để vận chuyển bằng UAV.

**Actor:** Nhân viên vận hành.

**Tiền điều kiện:**

- Người dùng đã đăng nhập.
- Người dùng có quyền tạo đơn hàng.

**Dữ liệu đầu vào:**

- Mã đơn hàng hoặc mã do hệ thống sinh.
- Khối lượng kiện hàng (kg).
- Điểm giao hàng.
- Thông tin mô tả kiện hàng (nếu có).

**Quy trình xử lý:**

1. Người dùng mở màn hình Create Order.
2. Nhập thông tin đơn hàng.
3. Nhấn Create.
4. Hệ thống kiểm tra dữ liệu bắt buộc.
5. Hệ thống lưu đơn hàng.
6. Trả về thông tin đơn hàng mới.

**Dữ liệu đầu ra:**

- ID đơn hàng.
- Trạng thái PENDING.
- Thông báo tạo thành công.

**Trường hợp lỗi:**

- Thiếu trường bắt buộc.
- Khối lượng <= 0.
- Điểm giao không tồn tại.
- Mã đơn trùng, nếu mã do người dùng cung cấp.
- Người dùng chưa đăng nhập.

**Tiêu chí nghiệm thu:**

- Tạo được đơn hàng hợp lệ.
- Đơn hàng mới có trạng thái PENDING.
- Không lưu đơn có dữ liệu không hợp lệ.
- Hiển thị thông báo lỗi rõ ràng.

**Use Case:** UC-01
**Test Case:** TC-ORDER-01

### FR-04 - Phân công UAV và tạo Mission

**Mục tiêu:**
Cho phép nhân viên chọn UAV phù hợp để
thực hiện một đơn hàng.

**Actor:** Nhân viên vận hành.

**Tiền điều kiện:**

- Người dùng đã đăng nhập.
- Order hợp lệ và chưa có Mission giao đang hoạt động.
- Hệ thống có dữ liệu về đội UAV.

**Dữ liệu đầu vào:**

- orderId
- droneId
- stationId
- deliveryPointId
- Danh sách waypoint

**Quy trình xử lý:**

1. Nhân viên chọn đơn hàng.
2. Hệ thống hiển thị danh sách UAV.
3. Nhân viên chọn UAV và thiết lập tuyến bay.
4. Backend kiểm tra trạng thái UAV.
5. Backend kiểm tra tải trọng.
6. Backend ước tính năng lượng cần thiết.
7. Backend kiểm tra phạm vi và vùng cấm.
8. Nếu hợp lệ, tạo Mission trạng thái READY.
9. Trả thông tin Mission cho người dùng.

**Trường hợp lỗi:**

- UAV đang bận.
- UAV đang sạc hoặc bảo trì.
- Khối lượng vượt tải trọng.
- Pin không đủ.
- Điểm giao nằm ngoài phạm vi.
- Tuyến bay xuyên vùng cấm.
- UAV đã được thiết bị khác phân công.

**Đầu ra:**

- Mission ID.
- UAV được phân công.
- Tuyến bay.
- Trạng thái READY.

**Tiêu chí nghiệm thu:**

- Chỉ tạo Mission khi đủ điều kiện.
- Một UAV không có hai Mission đang hoạt động.
- Không tự động cất cánh sau khi tạo Mission.
- Khi thất bại, trả về lý do cụ thể.
- Không tạo Mission trùng do yêu cầu đồng thời.

**Business Rules:**
BR-01, BR-02, BR-03, BR-04, BR-05, BR-06

**Use Case:** UC-02

**Test Cases:**
TC-02, TC-03, TC-05, TC-06, TC-10

### FR-05 - Điều khiển Mission

**Actor:** Nhân viên vận hành.

**Các lệnh hỗ trợ:**

- START
- PAUSE
- RESUME
- RETURN_HOME
- ABORT

**Quy tắc:**

- START chỉ hợp lệ khi Mission READY.
- PAUSE chỉ hợp lệ ở các trạng thái cho phép.
- RESUME chỉ hợp lệ khi Mission PAUSED và
  vẫn thỏa điều kiện an toàn.
- RETURN_HOME phải được Safety Manager đánh giá.
- ABORT không đồng nghĩa tắt động cơ tức thời.

**Xử lý:**

1. Client gửi lệnh kèm Mission ID.
2. Backend xác thực người gửi.
3. Backend kiểm tra trạng thái hiện tại.
4. Lệnh hợp lệ được chuyển đến Simulation Engine.
5. Simulation Engine trả kết quả chấp nhận/từ chối.
6. Client nhận phản hồi và cập nhật giao diện.

**Tiêu chí nghiệm thu:**

- Lệnh hợp lệ được xử lý đúng.
- Lệnh không hợp lệ không làm thay đổi trạng thái.
- Hai lệnh mâu thuẫn không tạo trạng thái sai.
- Lệnh được ghi vào nhật ký sự kiện.

**Business Rule:** BR-09
**Use Case:** UC-03
**Test Case:** TC-11, TC-CTRL-01

### FR-08 - Xác nhận giao hàng và quay về trạm

**Mục tiêu:**

Cho phép nhân viên xác nhận kết quả bàn giao kiện hàng tại điểm nhận. Sau khi quá trình bàn giao được xử lý, hệ thống điều khiển UAV quay về trạm nếu điều kiện an toàn cho phép.

Hệ thống phải quản lý độc lập trạng thái giao hàng (Order) và trạng thái nhiệm vụ bay (Mission).

**Actor:** Nhân viên vận hành UAV.

**Tiền điều kiện:**

- Người dùng đã đăng nhập.
- Mission đang được thực hiện.
- UAV đã hạ cánh tại điểm nhận hàng.
- Bộ điều khiển UAV đang ở trạng thái `WAITING_FOR_HANDOVER`.
- Đơn hàng chưa được xác nhận giao thành công.

**Dữ liệu đầu vào:**

- `missionId`: Mã nhiệm vụ bay.
- `orderId`: Mã đơn hàng.
- `confirmationStatus`: Kết quả xác nhận bàn giao.
- `confirmationTime`: Thời điểm xác nhận.
- `failureReason`: Nguyên nhân giao thất bại (nếu có).

**Quy trình xử lý:**

1. UAV hoàn thành quá trình hạ cánh tại điểm giao.
2. Simulation Engine chuyển UAV sang trạng thái `WAITING_FOR_HANDOVER`.
3. Backend thông báo đến Web, Mobile và Desktop rằng UAV đang chờ bàn giao hàng.
4. Hệ thống bắt đầu đếm thời gian chờ xác nhận (60 giây mô phỏng).
5. Nhân viên xác nhận kết quả giao hàng trên giao diện.
6. Backend kiểm tra Mission và điều kiện xác nhận.
7. Nếu giao hàng thành công, Order chuyển sang trạng thái `DELIVERED`.
8. Nếu giao hàng thất bại, Order chuyển sang trạng thái `DELIVERY_FAILED` và hệ thống ghi nhận nguyên nhân.
9. Hệ thống cập nhật trạng thái khoang chứa hàng tương ứng với kết quả bàn giao.
10. Safety Manager kiểm tra điều kiện quay về trạm.
11. Nếu có thể quay về an toàn, Simulation Engine điều khiển UAV thực hiện `RETURN_HOME` và Mission chuyển sang `RETURNING`.
12. Khi UAV hạ cánh thành công tại trạm, Mission chuyển sang `COMPLETED`.
13. Backend lưu lịch sử chuyến bay, kết quả giao hàng và các sự kiện phát sinh.
14. Hệ thống đồng bộ trạng thái mới đến Web, Mobile và Desktop.

**Dữ liệu đầu ra:**

- Kết quả giao hàng.
- Trạng thái Order mới.
- Trạng thái Mission mới.
- Trạng thái khoang chứa hàng.
- Thời gian xác nhận bàn giao.
- Kết quả quay về trạm.
- Nhật ký thực hiện nhiệm vụ.

**Phân biệt hai loại kết quả:**

1. **Kết quả giao hàng (Order):**
   - `DELIVERED`: Đã bàn giao kiện hàng thành công.
   - `DELIVERY_FAILED`: Không thể hoàn thành việc bàn giao.

2. **Trạng thái nhiệm vụ (Mission):**
   - `RETURNING`: UAV đang quay về trạm.
   - `COMPLETED`: UAV đã hoàn thành quy trình bay và trở về trạm thành công.
   - `FAILED`: Nhiệm vụ không thể kết thúc theo quy trình bay bình thường.

**Lưu ý:** Order có thể ở trạng thái `DELIVERED` trong khi Mission vẫn đang `RETURNING`. Một Mission `COMPLETED` cũng có thể có kết quả giao hàng `DELIVERY_FAILED` nếu UAV giao thất bại nhưng quay về trạm an toàn. Vì vậy, kết quả giao hàng phải được lưu riêng với trạng thái Mission.

**Trường hợp lỗi:**

- **E1 – UAV chưa hạ cánh:** Từ chối xác nhận bàn giao vì UAV chưa đến trạng thái cho phép.
- **E2 – Hết thời gian chờ:** Sau 60 giây mô phỏng không có xác nhận hợp lệ, ghi nhận `DELIVERY_FAILED`.
- **E3 – Xác nhận không hợp lệ:** Từ chối yêu cầu và thông báo nguyên nhân.
- **E4 – UAV không đủ pin quay về:** Safety Manager đánh giá phương án dự phòng, không tự động Return Home.
- **E5 – Không thể hạ cánh tại trạm:** Ghi nhận sự cố và thực hiện quy trình xử lý khẩn cấp phù hợp.
- **E6 – Xác nhận trùng:** Không ghi nhận bàn giao hai lần hoặc làm thay đổi kết quả đã được chốt.

**Tiêu chí nghiệm thu:**

- Hệ thống xác nhận được kết quả giao hàng hợp lệ.
- Order chuyển đúng sang `DELIVERED` hoặc `DELIVERY_FAILED`.
- Mission không tự động hoàn thành ngay khi kiện hàng được bàn giao.
- UAV chỉ Return Home khi được đánh giá đủ điều kiện an toàn.
- Sau khi UAV về trạm thành công, Mission được cập nhật `COMPLETED`.
- Các trường hợp bàn giao thất bại đều được ghi nhận.
- Trạng thái được đồng bộ giữa ba nền tảng.
- Lịch sử chuyến bay và kết quả giao hàng được lưu đầy đủ.

**Business Rules:** BR-04, BR-07, BR-08, BR-09.

**Use Case:** UC-04 – Xác nhận giao hàng.

**Test Cases:** TC-01, TC-09, TC-15.

**Mức độ ưu tiên:** MVP.

### FR-09 - Phát hiện và xử lý sự cố UAV

**Mục tiêu:**

Hệ thống phải có khả năng phát hiện các tình huống bất thường trong quá trình UAV thực hiện nhiệm vụ, đưa ra cảnh báo và kích hoạt phương án xử lý an toàn phù hợp.

Việc phát hiện và xử lý sự cố được thực hiện bởi Safety Manager thuộc Virtual Flight Controller.

**Actor:**

- Nhân viên vận hành UAV: theo dõi cảnh báo và gửi lệnh điều khiển khi được phép.
- Simulation Engine: tự động phát hiện và xử lý các điều kiện sự cố theo quy tắc đã thiết kế.

**Tiền điều kiện:**

- Simulation Engine đang hoạt động.
- UAV đã được khởi tạo với các thông số mô phỏng hợp lệ.
- Hệ thống đang cập nhật dữ liệu UAV theo chu kỳ.
- Các chính sách an toàn đã được cấu hình.

**Dữ liệu đầu vào:**

- `droneId`: Mã UAV.
- `missionId`: Mã nhiệm vụ.
- `batteryLevel`: Mức pin hiện tại.
- `gpsStatus`: Trạng thái định vị GPS giả lập.
- `connectionStatus`: Trạng thái liên lạc UAV giả lập.
- `position`: Vị trí UAV.
- `altitude`: Độ cao UAV.
- `flightState`: Trạng thái bộ điều khiển bay.
- `route`: Đường bay hiện tại.
- `obstacleStatus`: Thông tin vật cản hoặc vùng hạn chế mô phỏng.

**Quy trình xử lý:**

1. Simulation Engine cập nhật trạng thái UAV theo chu kỳ mô phỏng.
2. Các cảm biến ảo cung cấp dữ liệu cho Virtual Flight Controller.
3. Safety Manager kiểm tra mức pin, vị trí, cảm biến, kết nối và điều kiện đường bay.
4. Nếu không phát hiện bất thường, UAV tiếp tục thực hiện nhiệm vụ.
5. Nếu phát hiện sự cố, hệ thống xác định loại sự cố và mức độ nghiêm trọng.
6. Hệ thống ghi nhận sự kiện vào nhật ký.
7. Backend phát cảnh báo đến các ứng dụng qua Socket.IO.
8. Safety Manager đánh giá những phương án xử lý khả thi.
9. Hệ thống thực hiện phương án theo chính sách an toàn đã cấu hình.
10. Simulation Engine cập nhật trạng thái UAV sau khi xử lý.
11. Nếu UAV không thể tiếp tục nhiệm vụ, hệ thống ghi nhận kết quả Mission phù hợp.
12. Dữ liệu sự cố và lịch sử xử lý được lưu phục vụ kiểm thử, thống kê.

**Các tình huống sự cố cần hỗ trợ:**

| Mã     | Sự cố                           | Phương án xử lý                                               |
| ------ | ------------------------------- | ------------------------------------------------------------- |
| INC-01 | Pin yếu                         | Cảnh báo và đánh giá năng lượng còn lại                       |
| INC-02 | Pin nguy cấp                    | Ưu tiên phương án hạ cánh an toàn khả thi                     |
| INC-03 | GPS không ổn định               | Cảnh báo, hạn chế hoặc dừng dẫn đường tự động theo chính sách |
| INC-04 | Mất liên lạc giả lập với UAV    | Thực hiện quy trình failsafe đã cấu hình                      |
| INC-05 | Phát hiện vật cản               | Tạm dừng hoặc điều chỉnh đường bay nếu khả thi                |
| INC-06 | Đi vào vùng cấm                 | Ngăn tuyến không hợp lệ hoặc kích hoạt xử lý an toàn          |
| INC-07 | Không thể hạ cánh               | Đánh giá điểm hạ cánh thay thế hoặc quay về                   |
| INC-08 | Không đủ năng lượng Return Home | Đánh giá phương án hạ cánh dự phòng                           |
| INC-09 | Không thể hoàn thành nhiệm vụ   | Ghi nhận sự cố và kết thúc theo trạng thái phù hợp            |

**Chính sách xử lý pin:**

Các ngưỡng mô phỏng được tham chiếu từ `business-rules.md`:

- Pin dự phòng mục tiêu: 30%.
- Ngưỡng cảnh báo pin yếu: 20%.
- Ngưỡng pin nguy cấp: 10%.

Hệ thống phải ước tính năng lượng cần thiết để hoàn thành đường bay hoặc di chuyển đến điểm hạ cánh an toàn.

Không được quyết định Return Home chỉ dựa vào tỷ lệ pin hiện tại. Safety Manager phải đánh giá quãng đường, thời gian, năng lượng cần thiết và điều kiện hạ cánh.

**Chính sách Emergency:**

Khi xảy ra sự cố nghiêm trọng:

1. Hệ thống phát hiện và ghi nhận sự cố.
2. Safety Manager xác định các phương án còn khả thi.
3. Nếu đủ điều kiện, UAV có thể được yêu cầu quay về trạm.
4. Nếu không thể quay về, hệ thống đánh giá điểm hạ cánh dự phòng.
5. Nếu không tồn tại phương án an toàn theo mô hình giả lập, hệ thống ghi nhận trạng thái khẩn cấp và kết quả thất bại.
6. Toàn bộ quyết định được lưu trong nhật ký.

Lệnh `EMERGENCY` không mặc định đồng nghĩa với việc tắt động cơ ngay khi UAV đang bay.

**Dữ liệu đầu ra:**

- Loại sự cố.
- Mức độ nghiêm trọng.
- Thời điểm phát hiện.
- UAV và Mission liên quan.
- Phương án xử lý được chọn.
- Trạng thái UAV sau khi xử lý.
- Kết quả xử lý.
- Nhật ký sự kiện và cảnh báo.

**Trường hợp lỗi:**

- **E1 – Không đủ pin Return Home:** Không phát lệnh quay về khi mô hình xác định UAV không có đủ năng lượng.
- **E2 – GPS không khả dụng:** Không tiếp tục dẫn đường bằng dữ liệu GPS không đáng tin cậy nếu chính sách yêu cầu định vị hợp lệ.
- **E3 – Mất liên lạc giả lập:** Kích hoạt chính sách failsafe đã cấu hình, không phụ thuộc vào việc giao diện người dùng đang mở.
- **E4 – Không có điểm hạ cánh an toàn:** Ghi nhận sự cố nguy cấp và kết quả mô phỏng tương ứng.
- **E5 – Nhân viên gửi lệnh không an toàn:** Từ chối lệnh nếu vi phạm điều kiện trạng thái hoặc chính sách an toàn.
- **E6 – Sự cố xuất hiện đồng thời:** Áp dụng mức ưu tiên xử lý đã thiết kế, tránh các lệnh điều khiển mâu thuẫn.

**Tiêu chí nghiệm thu:**

- Phát hiện được các sự cố mô phỏng đã định nghĩa.
- Cảnh báo được gửi đến các Client đang kết nối.
- Sự cố được ghi nhận vào lịch sử.
- Pin yếu và pin nguy cấp được xử lý theo chính sách cấu hình.
- Không mặc định Return Home là phương án an toàn trong mọi trường hợp.
- Không thực hiện lệnh điều khiển trái với điều kiện an toàn.
- Khi xảy ra sự cố, hệ thống chuyển trạng thái đúng theo State Machine.
- Có thể tái lập tình huống sự cố để kiểm thử.
- Hệ thống ghi nhận kết quả xử lý ngay cả khi Mission thất bại.

**Business Rules:** BR-04, BR-06, BR-09 và phần chính sách an toàn trong `business-rules.md`.

**Use Case liên quan:** UC-03 – Bắt đầu Mission; UC-04 – Xác nhận giao hàng. Use Case xử lý sự cố chuyên biệt sẽ được bổ sung sau.

**Test Cases:** TC-04, TC-06, TC-07, TC-08 và các Test Case sự cố bổ sung.

**Mức độ ưu tiên:** MVP đối với xử lý pin yếu, kết nối, vùng cấm và lỗi nhiệm vụ cơ bản. Các mô hình cảm biến, vật cản và khẩn cấp phức tạp thuộc phần nâng cao.

## 5. Non-functional Requirements

| ID     | Yêu cầu                                                                                                                    | Cách kiểm chứng                                     |
| ------ | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| NFR-01 | Web, Android, Windows có cùng chức năng nghiệp vụ, tài khoản và dữ liệu                                                    | Thử các luồng MVP trên ba nền tảng                  |
| NFR-02 | Đóng Client không dừng Simulation Engine trên server                                                                       | Đóng Web khi UAV bay, mở lại và so sánh trạng thái  |
| NFR-03 | Không có hai Mission đang hoạt động trên cùng UAV                                                                          | Gửi hai yêu cầu phân công cạnh tranh                |
| NFR-04 | Mô phỏng sử dụng bước thời gian cố định 100 ms                                                                             | Kiểm tra log chu kỳ và sai lệch thời gian           |
| NFR-05 | API yêu cầu xác thực, phân quyền và kiểm tra đầu vào                                                                       | Test không token, token sai và dữ liệu không hợp lệ |
| NFR-06 | Telemetry phát tối thiểu 2 lần/giây; mục tiêu thời gian nhận trên Client không quá 2 giây trong môi trường kiểm thử nội bộ | Ghi thời gian gửi và nhận, đo độ trễ                |

## 6. Business Rules

Xem `business-rules.md`. Phải ghi rõ cách tính pin đủ cho đi + về + thời gian chờ. Tất cả FR phải tuân thủ các BR liên quan.

## 7. Luồng nghiệp vụ

Tiếp nhận đơn → Kiểm tra hợp lệ → Phân công UAV → Lập Mission → Preflight → Cất cánh → Bay → Hạ cánh → Xác nhận → Quay về → Kết thúc.

## 8. Dữ liệu và sơ đồ

- `docs/06-diagrams/04-activity.mmd`
- `docs/06-diagrams/05-sequence.mmd`
- `docs/06-diagrams/07-erd.mmd`

## 9. Tiêu chí nghiệm thu SRS

- [x] Tất cả yêu cầu chức năng có ID duy nhất.
- [x] Mỗi yêu cầu FR có mô tả và mức ưu tiên.
- [x] Các FR quan trọng có đầu vào, đầu ra,
      luồng xử lý và trường hợp lỗi.
- [x] Mỗi FR có ít nhất một Test Case được
      định nghĩa hoặc lên kế hoạch tạo.
- [x] Các NFR có phương pháp kiểm chứng.
- [x] Các Use Case liên kết tới FR tương ứng.
- [x] Không mâu thuẫn với Business Rules Ngày 2.
- [ ] Phạm vi MVP được cả nhóm chấp thuận.
- [ ] Tài liệu được review bởi thành viên khác.
