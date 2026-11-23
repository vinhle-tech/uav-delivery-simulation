# COMMAND & SYNC CONTRACT (BẢN THIẾT KẾ NGÀY 5)

## Phân biệt
- REST Request: người dùng gửi yêu cầu hoặc đọc dữ liệu, server kiểm tra quyền và xác nhận.
- Event (Socket.IO): server chủ động phát trạng thái mới.
- Telemetry: dữ liệu thường xuyên như vị trí, pin, độ cao; có thể mất một số mẫu mà Client vẫn hoạt động, miễn là có cơ chế đồng bộ lại.
- State transition: thay đổi quan trọng phải ghi event log bền vững trong hệ thống hoàn chỉnh.

## API ví dụ (thiết kế, chưa có server)
`POST /api/missions/MIS-001/start`

Body:
```json
{
  "requestId": "req-001",
  "expectedVersion": 3
}
```

Phản hồi nhận lệnh (không có nghĩa đã cất cánh):
```json
{
  "accepted": true,
  "missionId": "MIS-001",
  "commandId": "cmd-001",
  "version": 4
}
```

Lỗi tham khảo: `401` không có xác thực, `403` không có quyền, `404` không tìm thấy Mission, `409` xung đột phiên bản/trạng thái, `422` vi phạm quy tắc như thiếu pin.

## Event ví dụ
```json
{
  "event": "drone:telemetry",
  "droneId": "UAV-01",
  "missionId": "MIS-001",
  "version": 4,
  "simTimeSec": 12.5,
  "flightState": "EN_ROUTE",
  "missionStatus": "IN_PROGRESS",
  "orderStatus": "ASSIGNED",
  "position": { "x": 30, "y": 0, "z": 30 },
  "batteryPct": 88.2
}
```

## Tình huống quan trọng
1. Web gửi Pause với expectedVersion=4 → accepted, tăng version=5.
2. Mobile gửi Resume vẫn nghĩ version=4 → 409 Conflict, chưa chạy lệnh.
3. Mobile tải snapshot/version=5 rồi gửi Resume với expectedVersion=5 → được xét theo state mới.
4. Web đóng → Simulator vẫn tick trên server.
5. Reconnect → Client lấy snapshot rồi bắt đầu theo dõi telemetry mới.
