# Thông số mô phỏng — GIẢ ĐỊNH, không phải UAV thực đã kiểm chứng

| Thông số | Giá trị ban đầu | Đơn vị | Cần kiểm chứng |
|---|---:|---|---|
| Số UAV | 3 | chiếc | Có |
| Tải tối đa | 1.5 | kg | Có |
| Vận tốc hành trình | 7.5 | m/s | Có |
| Thời gian bay danh định | 25 | phút | Có |
| Bán kính giao | 2.0 | km | Có |
| Pin dự phòng | 30 | % | Có |
| Độ cao hành trình | 40 | m | Có |
| Fixed timestep | 100 | ms | Có |
| Telemetry frequency | 2 | Hz | Có |

**Bài toán kiểm thử:** Với quãng đường đi 1,5 km, về 1,5 km và vận tốc 7,5 m/s, thời gian hành trình cơ bản = 3000 / 7,5 = 400 giây ≈ 6 phút 40 giây (chưa tính cất/hạ cánh/chờ, gió và pin).

**[TODO]:** Định nghĩa mô hình năng lượng đủ cụ thể để kiểm tra giới hạn bay và ngưỡng pin.
