# Danh sách màn hình, hướng dẫn thiết kế Figma

## Màn hình cần thiết kế
1. Login/Register
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
12. Incident Management
13. Flight History
14. Reports
15. Settings

## Bố cục Dashboard (desktop)
- Sidebar trái: Dashboard / Drones / Orders / Missions / Reports.
- Header: kết nối realtime, tài khoản.
- KPI cards: UAV sẵn sàng, đang bay, pin thấp, đơn đang giao.
- Khu vực chính: danh sách nhiệm vụ gần đây và cảnh báo.

## Live Simulation
- Web/Desktop: map chiếm phần trung tâm; panel drones + telemetry; control panel.
- Mobile: map toàn chiều ngang, panel thu gọn hoặc tab; chức năng nghiệp vụ y hệt.
- Có trạng thái Loading/Error/Empty/Success và mất kết nối.

## Bài tập với Figma
- [TODO] Tạo project và file Figma.
- [TODO] Tạo frame desktop (ví dụ 1440x900) và mobile (ví dụ 390x844).
- [TODO] Thiết kế Login, Dashboard, Mission Planner, Live Simulation.
- [TODO] Đặt tên component tái sử dụng: Sidebar, DroneCard, StatusBadge, TelemetryCard.
- [TODO] Nối prototype Login -> Dashboard -> Orders -> Mission -> Simulation.
- [TODO] Chụp/export 2 màn hình và dán link vào README.
