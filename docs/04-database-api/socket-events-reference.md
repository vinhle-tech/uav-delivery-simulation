# SOCKET.IO EVENT CONTRACT

## Các event chạy được trong bài thử
| Event | Hướng | Dữ liệu | Khi nào phát |
|---|---|---|---|
| server:hello | Server -> Client vừa nối | `{ message, demoOnly }` | Client connect |
| mission:updated | Server -> tất cả Client đang kết nối | Mission mới nhất `{id,status,version,...}` | Tạo mission hoặc đổi trạng thái |
| drone:telemetry | Server -> tất cả Client đang kết nối | Telemetry `{drone_id, battery_pct, x_m, y_m, z_m, sim_time_s, demoOnly}` | Gọi endpoint thử telemetry |

## Dự kiến bổ sung vào sản phẩm
- `drone:state_changed`, `order:updated`, `incident:created`, `simulation:snapshot`.
- Sau reconnect: GET snapshot hoặc yêu cầu snapshot được xác thực; không dựa vào các event cũ đã có thể mất.
- Phát theo room dành cho các Client có quyền xem mission/drone, không `io.emit` cho toàn bộ tài khoản ngoài môi trường lab.
- Có `sequence`/`version`, timestamp, đơn vị đo; tách `simTime` và wall-clock time.
- Nguồn telemetry phải từ Simulation Engine server, không tin dữ liệu vị trí từ trình duyệt.
- Socket.IO không tự bảo đảm exactly-once; yêu cầu lệnh quan trọng qua REST có requestId/idempotency và trạng thái có thẩm quyền.
