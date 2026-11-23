# TEST TRACEABILITY MATRIX — GIAI ĐOẠN 1

| Requirement / Business Rule | Test case | Mức độ kiểm chứng Ngày 9 |
|---|---|---|
| FR-01 Auth | TC-UI-01 (UI) | Chỉ Mock UI, Auth backend chưa implement |
| FR-02 Drone Listing | TC-API-02, TC-DB-02, TC-UI-01 | API thử nghiệm |
| FR-03 Create Order | TC-API-03…05, TC-UI-01 | API thử nghiệm |
| FR-04 Assign UAV / Create Mission | TC-API-06,07,10,11,12; TC-DB-04 | Backend business demo |
| FR-05 Flight Commands | TC-API-09,12, TC-FC-02,05, TC-3D-03 | Các thành phần chưa tích hợp |
| FR-06 Simulation | TC-FC-01…09, TC-3D-01…06 | Prototype simulation độc lập |
| FR-07 Telemetry | TC-RT-03, TC-3D-02 | Socket demo, không phải telemetry FC thực |
| FR-08 Confirm Delivery / Return | TC-FC-01,06, TC-UI-04 | VFC lab, chưa có API handover |
| FR-09 Incident / Safety | TC-FC-07,08, TC-UI-03 | VFC lab + UI mock |
| FR-10 History | TC-UI-04, TC-API-12 | Thiết kế / state demo, chưa có production history service |
| FR-11 A* | Chưa có test | Tính năng nâng cao, planned |
| BR-01 Payload max | TC-API-10, TC-FC-03 | Lab backend + unit FC |
| BR-02 Available drone | TC-API-12, TC-DB-02 | API business demo |
| BR-03 One active Mission per UAV | TC-DB-04 | DB partial unique index + lock |
| BR-04 Battery reserve | TC-API-11, TC-FC-04,07,08 | API demo dùng ngưỡng 55%, chưa mô hình route energy |
| BR-05 Delivery radius | Chưa có test | Chưa tích hợp route validation |
| BR-06 No-fly zones | Chưa có test | Cesium chỉ vẽ polygon minh họa |
| BR-07 Landed != handed over | TC-FC-01, TC-3D-05 | Unit + tech spike |
| BR-08 Delivery != Mission complete | TC-FC-01,06, TC-UI-04 | Unit + UI mapping |
| BR-09 State command checks | TC-API-09,12, TC-FC-02,05 | Backend demo + VFC lab |
| BR-10 Close client != stop simulation | TC-FC-09, TC-3D-06 | Chưa đạt ở Cesium browser; cần Simulation Engine server |

## Ý nghĩa
`Traced` không đồng nghĩa với `PASSED`. Một requirement có thể có test case nhưng vẫn chưa được lập trình hoặc chưa được chạy.
