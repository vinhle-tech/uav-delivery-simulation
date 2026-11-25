# UAV Simulation Core – Giai đoạn 2, Ngày 2

Độc lập React, Cesium, Wokwi và Backend. Không điều khiển UAV thật.

```powershell
cd packages/simulation-core
npm install
npm test
npm run demo
npm run build
```

- `src/types.ts`: định nghĩa dữ liệu.
- `src/navigation.ts`: tính quãng đường, nội suy và di chuyển từng bước.
- `src/params.ts`: tham số mô phỏng, 25 phút danh định là giả định mô hình.
- `src/battery.ts`: ước tính pin và preflight.
- `src/engine.ts`: `command()` / `tick()` / `snapshot()` và State Machine.
- `src/demo-data.ts`: dữ liệu cùng tọa độ với Ngày 1.
- `tests/engine.test.ts`: kiểm thử bằng `node:test` sau khi tsc biên dịch.
- `scripts/demo.ts`: chạy một nhiệm vụ hoàn chỉnh trong Terminal.

Không thay đổi `apps/client` hay code cũ Giai đoạn 1. Ngày 3 mới nối snapshot với Cesium.

## Lưu ý kỹ thuật

- Độ cao `altitudeM` trong dữ liệu demo được hiểu là một cao độ quy ước; không dựa trên địa hình 3D hay mực nước biển hiệu chuẩn.
- Haversine tính khoảng cách mặt đất, nội suy kinh/vĩ độ tuyến ngắn <= 2km.
- Mô hình pin giả định, không dự đoán độ an toàn của drone thật. Giá trị `100/1500` điểm %/s dùng để phù hợp **giả định** thời lượng danh định 25 phút, khác bài thử Ngày 4 (0.08 điểm %/s). Phải phân biệt phiên bản tham số khi viết báo cáo.
- Simulation Engine ngày 2 chạy local; khi triển khai đa nền tảng, server phải là nguồn flight state có thẩm quyền. Không để browser và server cùng điều khiển một nhiệm vụ.
- Khi pin không đủ về trạm, Engine đánh dấu FAILED, **không** tự khẳng định hạ cánh an toàn. Hạ cánh khẩn cấp và tránh vùng cấm là các bài toán giai đoạn tiếp theo.
