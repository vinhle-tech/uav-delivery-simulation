# REQUIREMENT TRACEABILITY MATRIX

| FR                         | Use Case                     | Business Rule              | Test Case         |
| -------------------------- | ---------------------------- | -------------------------- | ----------------- |
| FR-01                      | Đăng nhập                    | Xác thực người dùng        | TC-AUTH-01        |
| FR-02                      | Xem UAV                      | Quyền truy cập dữ liệu     | TC-DRONE-01       |
| FR-03                      | UC-01                        | Kiểm tra dữ liệu đầu vào   | TC-ORDER-01       |
| FR-04                      | UC-02                        | BR-01 đến BR-06            | TC-02,03,05,06,10 |
| FR-05                      | UC-03                        | BR-09                      | TC-11, TC-CTRL-01 |
| FR-06                      | Mô phỏng UAV                 | Quy tắc mô phỏng           | TC-01,04,08,14    |
| FR-07                      | Giám sát realtime            | NFR-01,02,06               | TC-12,14,RT-01    |
| FR-08                      | UC-04                        | BR-07, BR-08               | TC-01,09,15       |
| FR-09                      | Xử lý sự cố                  | BR-04,BR-06                | TC-04,06,07       |
| FR-10                      | Xem lịch sử                  | Quy tắc lưu trữ            | TC-HISTORY-01     |
| FR-11                      | Tìm đường A\*                | Quy tắc vùng cấm           | TC-ASTAR-01       |
| FR-05, FR-06, FR-07, FR-09 | UC-05 – Pause/Resume Mission | BR-03, BR-04, BR-09, BR-10 | TC-P01 đến TC-P09 |
