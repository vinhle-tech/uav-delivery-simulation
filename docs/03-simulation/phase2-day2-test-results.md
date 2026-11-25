# KẾT QUẢ KIỂM THỬ NGÀY 2 – SIMULATION CORE

**Người kiểm thử:** (điền)  
**Ngày thực hiện:** (điền)  
**Phiên bản Node.js:** (lệnh `node -v`)  
**Phiên bản TypeScript:** (lệnh `npx tsc -v`)  
**Môi trường:** Windows / VS Code / Node.js

> **Chưa thực hiện trên máy người học**: Chỉ điền PASS khi đã xem log thực tế. Trong môi trường tạo bộ mã, 22/22 test đã đạt.

| Hạng mục | Expected | Actual | Status | Evidence |
|---|---|---|---|---|
| Cài dependencies | npm install thành công | Chưa điền | NOT RUN | |
| Biên dịch | npm run build thành công | Chưa điền | NOT RUN | |
| Unit Tests | 22/22 PASS | Chưa điền | NOT RUN | |
| Demo giao hàng | Đi/về + COMPLETED, DELIVERED | Chưa điền | NOT RUN | |
| Từ chối quá tải 1.8 kg | START bị từ chối | Chưa điền | NOT RUN | |
| Từ chối pin 35% | START bị từ chối | Chưa điền | NOT RUN | |
| Từ chối tuyến thiếu waypoint | START bị từ chối | Chưa điền | NOT RUN | |
| Giao thất bại, bay về thành công | Order DELIVERY_FAILED, Mission COMPLETED | Chưa điền | NOT RUN | |
| Tham số sau thử nghiệm đã khôi phục | `payloadKg=0.8`, `batteryPct=90`, 3 WP | Chưa điền | NOT RUN | |
| Git an toàn | Không commit secrets | Chưa điền | NOT RUN | |

## Nhóm TC tự động

- TC-01…03: Seed data, khoảng cách, giới hạn bước.
- TC-04…06: dt=0, dt bất hợp lệ, lệnh sai.
- TC-07…10: Preflight tải/pin/waypoint/UAV Offline.
- TC-11…13: Takeoff, waypoint, Pause/Resume.
- TC-14…19: Handover, timeout, Return Home, Completed.
- TC-20…22: Reset, snapshot isolation, dt lớn.

## Vấn đề / giới hạn

- (Ghi lỗi thực tế, hoặc “Không phát hiện lỗi trong phạm vi test”.)
- Flight State được tính trên client trong giai đoạn thử nghiệm, chưa đồng bộ server.
- Mô phỏng giáo dục, không phù hợp điều khiển UAV thật.

## Kết luận

- [ ] GO: Đạt đủ yêu cầu Ngày 2, có bằng chứng.
- [ ] CONDITIONAL GO: Có blocker đã được ghi rõ, không liên quan lõi P0.
- [ ] NO-GO: Chưa có build và unit test đạt.
