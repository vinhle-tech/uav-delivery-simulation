# TEST EXECUTION REPORT — NGÀY 9

> **Chưa chạy trên máy của nhóm.** Điền sau mỗi lần thực thi. Không đổi PASS`thành`PASS` nếu chưa thực tế kiểm tra.

- Ngày test: \_**\_ / \_\_** / 2026
- Người test: ****\_\_****
- Máy/OS: ****\_\_****
- Node version: ****\_\_****
- PostgreSQL version: ****\_\_****
- Browser version: ****\_\_****
- Commit Git: ****\_\_****
- Test DB: `uav_delivery` / DB thử nghiệm khác: ****\_\_****

## 1. Test Summary

| Nhóm       | Tổng TC |  PASS |  FAIL | NOT RUN | BLOCKED | NOT IMPLEMENTED |
| ---------- | ------: | ----: | ----: | ------: | ------: | --------------: |
| DB         |       4 |     0 |     0 |       4 |       0 |               0 |
| REST API   |      12 |     0 |     0 |      12 |       0 |               0 |
| Socket.IO  |       3 |     0 |     0 |       3 |       0 |               0 |
| Virtual FC |       9 |     0 |     0 |       9 |       0 |               0 |
| CesiumJS   |       6 |     0 |     0 |       6 |       0 |               0 |
| UI/UX      |       4 |     0 |     0 |       4 |       0 |               0 |
| **Tổng**   |  **38** | **0** | **0** |  **38** |   **0** |           **0** |

## 2. Lượt chạy thực tế

| Run ID  | Giờ chạy | TC ID        | Kết quả | Actual Result | Bằng chứng | Người chạy |
| ------- | -------- | ------------ | ------- | ------------- | ---------- | ---------- |
| RUN-001 |          | TC-FC-01…09  | PASS    |               |            |            |
| RUN-002 |          | TC-API-01…09 | PASS    |               |            |            |
| RUN-003 |          | TC-RT-01…03  | PASS    |               |            |            |
| RUN-004 |          | TC-3D-01…06  | PASS    |               |            |            |
| RUN-005 |          | TC-UI-01…04  | PASS    |               |            |            |

**Gợi ý:** với script báo kết quả có nhiều test nhỏ, ghi nhóm hoặc từng TC theo độ chi tiết yêu cầu của giảng viên.

## 3. Ví dụ cách ghi (đừng đánh PASS theo ví dụ)

| TC ID     | Expected                 | Actual (người kiểm thử tự điền)    | Status |
| --------- | ------------------------ | ---------------------------------- | ------ |
| TC-API-04 | 400 INVALID_INPUT        | HTTP **_, error.code = _**         | PASS   |
| TC-FC-05  | Pause đứng yên, pin giảm | x1=**_, x2=_**, pin1=**_, pin2=_** | PASS   |
| TC-3D-03  | Pause → Resume đúng      | Tọa độ trước/sau pause: \_\_\_     | PASS   |

## 4. Bug Log

| Bug ID  | TC ID | Severity | Actual | Expected | Status | Owner |
| ------- | ----- | -------- | ------ | -------- | ------ | ----- |
| BUG-001 |       |          |        |          | OPEN   |       |

## 5. Minh chứng cần lưu

```text
docs/07-testing/evidence/
  vfc-test-output.png
  api-smoke-output.png
  socket-hello-output.png
  cesium-en-route.png
  cesium-paused.png
```

## 6. Nhận xét & quyết định

- Chức năng hoạt động: _điền sau kiểm thử_
- Các vấn đề/risks: _điền sau kiểm thử_
- Chưa triển khai: Auth, Backend↔Flight Controller, API giao hàng chính thức, Mobile Prototype link (nếu vẫn thiếu).
- Quyết định: [ ] Chấp nhận tiếp tục Ngày 10 [ ] Cần sửa Blocker trước.
- Người review chéo: ********\_\_\_\_********
